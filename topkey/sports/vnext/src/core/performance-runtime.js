(() => {
  'use strict';
  const T = window.Topkey;
  const App = T?.App;
  if (!App || App.__h95PerformanceRuntime) return;

  const CORE_BRANCHES = ['config', 'teams', 'matches', 'courts', 'activeMatches', 'announcements', 'finance'];
  const TAB_BRANCH = {
    teams: 'registrations',
    // audit is loaded with bounded Firebase queries, not a full-tree listener.
    live: 'commentary'
  };
  const TAB_DEPENDENCIES = {
    overview: ['config', 'teams', 'matches', 'courts', 'activeMatches', 'announcements'],
    teams: ['teams', 'registrations'],
    schedule: ['config', 'teams', 'matches', 'courts', 'activeMatches'],
    control: ['teams', 'matches', 'courts', 'activeMatches'],
    umpire: ['teams', 'matches', 'courts', 'activeMatches'],
    live: ['matches', 'courts', 'activeMatches', 'commentary'],
    finance: ['finance'],
    announcements: ['announcements'],
    audit: ['audit'],
    settings: ['config', 'users'],
    health: []
  };
  const baseRenderBranch = App.renderBranch.bind(App);
  const baseShowTab = App.showTab.bind(App);
  const dirtyBranches = new Set();
  let renderFrame = 0;

  App.__h95VisibleCounts = {};
  App.visibleRows = function visibleRows(rows, viewKey, limit = 300) {
    const list = Array.isArray(rows) ? rows : [];
    const size = Math.max(1, Number(limit) || 300);
    this.__h95VisibleCounts[viewKey] = {total: list.length, visible: Math.min(list.length, size)};
    return list.length > size ? list.slice(0, size) : list;
  };

  function refreshOffRegistry() {
    App.offs = [...(App.__h95CoreOffs || []), ...(App.__h95TabOffs || [])];
  }

  function flushRenders() {
    renderFrame = 0;
    if (document.hidden) return;
    const branches = [...dirtyBranches];
    dirtyBranches.clear();
    for (const branch of branches) {
      if (!(TAB_DEPENDENCIES[App.currentTab] || []).includes(branch)) continue;
      if (branch === 'users') {
        App.renderUsers?.();
        App.renderCourts?.();
      } else {
        baseRenderBranch(branch);
      }
    }
  }

  App.scheduleBranchRender = function scheduleBranchRender(branch) {
    dirtyBranches.add(branch);
    if (!renderFrame && !document.hidden) renderFrame = requestAnimationFrame(flushRenders);
  };

  function attachBranch(branch) {
    return T.Data.listen(branch, value => {
      App.state[branch] = value || {};
      App.scheduleBranchRender(branch);
    });
  }

  App.syncTabSubscriptions = function syncTabSubscriptions(force = false) {
    if (!T.Data?.ready) return;
    const role = T.Auth?.role?.() || '';
    const key = `${this.currentTab}|${role}`;
    if (!force && this.__h95TabKey === key) return;
    (this.__h95TabOffs || []).forEach(off => off());
    this.__h95TabOffs = [];
    this.__h95TabKey = key;

    const branch = TAB_BRANCH[this.currentTab];
    if (branch) this.__h95TabOffs.push(attachBranch(branch));
    if (['settings', 'control'].includes(this.currentTab) && role === 'ADMIN') {
      this.__h95TabOffs.push(T.Data.listenAuthUsers(value => {
        this.state.users = value || {};
        this.scheduleBranchRender('users');
      }));
    }
    refreshOffRegistry();
  };

  App.subscribe = function subscribe() {
    (this.__h95CoreOffs || []).forEach(off => off());
    (this.__h95TabOffs || []).forEach(off => off());
    this.__h95CoreOffs = CORE_BRANCHES.map(attachBranch);
    this.__h95TabOffs = [];
    this.__h95TabKey = '';
    this.syncTabSubscriptions(true);
    refreshOffRegistry();
  };

  App.loadAuditPage = async function loadAuditPage(reset = false) {
    if (this.__h97AuditLoading || !T.Data?.ready) return;
    this.__h97AuditLoading = true;
    try {
      if (reset) { this.__h97AuditCursor = null; this.__h97AuditRows = []; }
      const page = await T.Data.readPage('audit', {orderBy: 'clientAt', size: 100, cursor: this.__h97AuditCursor});
      this.__h97AuditRows = [...(this.__h97AuditRows || []), ...page.items.map(item => item.value)];
      this.__h97AuditCursor = page.nextCursor;
      this.state.audit = Object.fromEntries(this.__h97AuditRows.map((row, i) => [row.id || `row_${i}`, row]));
      this.renderAudit();
      const container = document.getElementById('audit-list');
      if (container && page.hasMore) {
        const button = document.createElement('button');
        button.className = 'btn'; button.textContent = 'Tải thêm 100 nhật ký';
        button.onclick = () => this.loadAuditPage(false);
        container.appendChild(button);
      }
    } catch (error) { console.warn('H97 audit pagination unavailable', error); }
    finally { this.__h97AuditLoading = false; }
  };

  App.showTab = function showTab(tab) {
    const result = baseShowTab(tab);
    this.syncTabSubscriptions();
    if (this.currentTab === 'audit' && !this.__h97AuditRows) this.loadAuditPage(true);
    (TAB_DEPENDENCIES[this.currentTab] || []).forEach(branch => this.scheduleBranchRender(branch));
    try { window.dispatchEvent(new CustomEvent('topkey:tab-change', {detail: {tab: this.currentTab}})); }
    catch (_) {}
    return result;
  };

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && dirtyBranches.size && !renderFrame) renderFrame = requestAnimationFrame(flushRenders);
  });
  window.addEventListener('pagehide', () => {
    (App.__h95CoreOffs || []).forEach(off => off());
    (App.__h95TabOffs || []).forEach(off => off());
    App.__h95CoreOffs = [];
    App.__h95TabOffs = [];
    App.__h95TabKey = '';
    refreshOffRegistry();
  });
  window.addEventListener('pageshow', () => {
    App.subscribe();
    (TAB_DEPENDENCIES[App.currentTab] || []).forEach(branch => App.scheduleBranchRender(branch));
  });

  App.__h95PerformanceRuntime = {
    coreBranches: CORE_BRANCHES.slice(),
    tabBranch: {...TAB_BRANCH},
    tabDependencies: Object.fromEntries(Object.entries(TAB_DEPENDENCIES).map(([tab, branches]) => [tab, branches.slice()])),
    flushRenders
  };
})();
