/* H138: Volleyball schedule deletion. Keep protected matches and RTDB as source of truth. */
(() => {
  'use strict';
  if (window.__TOPKEY_PUBLIC_ROUTE) return;
  const protectedStatuses = new Set(['LIVE','FINISHED','WALKOVER','RETIRED','DISQUALIFIED','SUSPENDED']);
  const byId = id => window.Topkey?.App?.state?.matches?.[id];
  const isAdmin = () => String(window.Topkey?.Auth?.role?.() || '').toUpperCase() === 'ADMIN';
  const hasResult = (app, m) => {
    const result = app.resultLabel?.(m);
    return !!m.startedAt || protectedStatuses.has(m.status) ||
      (result != null && result !== '' && result !== '—') ||
      !!(m.sets || []).length || Object.values(app.state.activeMatches || {}).some(x => x?.matchId === m.id);
  };
  const jsonBackup = (T, matches, scope) => {
    const data = {
      type: 'TOPKEY_MATCH_DELETE_BACKUP', version: T.VERSION,
      sport: T.SPORT.key, tid: T.Data.tid,
      exportedAt: new Date().toISOString(), scope, matches
    };
    T.U.download('Topkey_volleyball_matches_' + Date.now() + '.json',
      new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));
  };
  async function persistDelete(T, matches, action) {
    if (!isAdmin()) throw new Error('Chỉ ADMIN được xóa trận.');
    if (!T.Data?.db || !T.Data.connected || !T.Data.auth?.currentUser)
      throw new Error('Firebase chưa kết nối. Không ghi lệnh xóa offline.');
    if (!matches.length || matches.length > 200) throw new Error('Mỗi lần chỉ được xóa 1–200 trận.');
    await T.Data.flushQueue();
    const targetPaths = new Set(matches.map(m => T.Data.path('matches/' + m.id)));
    const queue = await T.idb.all('queue');
    if (queue.some(item => Object.keys(item.updates || {}).some(path =>
      [...targetPaths].some(target => path === target || path.startsWith(target + '/') || target.startsWith(path + '/')))))
      throw new Error('Vẫn có thao tác tạo/sửa trận chưa đồng bộ. Đồng bộ dữ liệu rồi thử xóa.');
    // Re-read every target immediately before deletion. Never delete an updated or active match.
    const snapshots = await Promise.all(matches.map(m => T.Data.ref('matches/' + m.id).once('value')));
    const current = snapshots.map(s => s.val());
    if (current.some((m,i) => !m || JSON.stringify(m) !== JSON.stringify(matches[i])))
      throw new Error('Một trận đã được thay đổi từ thiết bị khác. Tải lại trước khi xóa.');
    if (!isAdmin()) throw new Error('Quyền ADMIN đã thay đổi.');
    const updates = {};
    for (const m of matches) updates[T.Data.path('matches/' + m.id)] = null;
    const auditId = T.U.id('audit');
    updates[T.Data.path('audit/' + auditId)] = {
      id: auditId, action, entityType: 'schedule', entityId: matches.length === 1 ? matches[0].id : 'bulk',
      uid: T.Auth.user?.uid || T.Data.auth.currentUser.uid,
      actor: T.Auth.profile?.displayName || 'ADMIN', sport: T.SPORT.key,
      before: {count:matches.length, ids:matches.map(m => m.id)}, after: null, clientAt: Date.now()
    };
    await T.Data.db.ref().update(updates);
    const checks = await Promise.all(matches.map(m => T.Data.ref('matches/' + m.id).once('value')));
    if (checks.some(s => s.exists())) throw new Error('Firebase vẫn còn trận sau khi xóa. Tải lại và kiểm tra.');
    T.U.toast('Đã xóa ' + matches.length + ' trận trên Firebase.', 'ok');
    return true;
  }
  function install() {
    const T = window.Topkey, app = T?.App;
    if (!app || !T.Data || !T.SPORT) return false;
    if (T.SPORT.key !== 'volleyball' || app.__tk138Delete) return true;
    app.__tk138Delete = true;
    const render = app.renderMatches.bind(app);
    app.renderMatches = function(...args) {
      const result = render(...args);
      if (!isAdmin()) return result;
      document.querySelectorAll('#matches-list tr.tk12-match-row').forEach(row => {
        if (row.querySelector('.tk138-delete-match')) return;
        const id = row.dataset.matchId || Object.values(this.state.matches || {})
          .find(m => String(m.code) === String(row.cells?.[0]?.textContent || '').trim())?.id;
        const m = byId(id);
        if (!m) return;
        const cell = row.cells[row.cells.length - 1];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn mini danger tk138-delete-match';
        button.textContent = '🗑 Xóa';
        button.setAttribute('aria-label', 'Xóa trận ' + (m.code || id));
        button.disabled = hasResult(this, m);
        if (button.disabled) button.title = 'Trận có kết quả/đang diễn ra được bảo vệ';
        button.onclick = () => this.deleteMatch(id);
        cell?.appendChild(button);
      });
      return result;
    };
    app.deleteMatch = async function(id) {
      const m = byId(id);
      if (!m || !isAdmin()) return T.U.toast('Không có quyền hoặc trận không còn tồn tại.', 'err');
      if (hasResult(this, m)) return T.U.toast('Trận đã bắt đầu/có kết quả được bảo vệ.', 'err');
      if (!T.Data.connected) return T.U.toast('Mất kết nối Firebase: không xóa offline.', 'err');
      jsonBackup(T, [m], 'single');
      const ok = await T.U.confirmDanger('Xóa trận ' + (m.code || ''),
        this.matchLabel(m) + '. Bản sao lưu JSON đã được yêu cầu tải. Xóa vĩnh viễn khỏi lịch?', 'XÓA TRẬN');
      if (!ok) return;
      try {
        await persistDelete(T, [m], 'DELETE_MATCH');
      } catch (error) {
        T.U.toast('Không xóa được: ' + (error.message || error), 'err');
      }
    };
    const basePlan = app.deletePlan.bind(app);
    app.deletePlan = function() {
      const scope = document.querySelector('input[name="delete-scope"]:checked')?.value;
      if (scope !== 'undated') return basePlan();
      const category = document.getElementById('delete-category').value;
      const stage = document.getElementById('delete-stage').value;
      const allow = document.getElementById('delete-protected').checked;
      const candidates = Object.values(this.state.matches || {}).filter(m =>
        !m.date && (category === 'ALL' || m.category === category) &&
        (stage === 'ALL' || m.stage === stage));
      const protectedMatches = candidates.filter(m => hasResult(this, m));
      return {scope, category, stage, allow, candidates, protectedMatches,
        deletable: candidates.filter(m => allow || !hasResult(this, m)),
        skipped: allow ? [] : protectedMatches};
    };
    const baseOpen = app.openDelete.bind(app);
    app.openDelete = function() {
      baseOpen();
      const undated = Object.values(this.state.matches || {}).some(m => !m.date);
      if (undated) {
        const radio = document.querySelector('input[name="delete-scope"][value="undated"]');
        if (radio) radio.checked = true;
        this.previewDelete(false);
      }
    };
    app.executeDelete = async function() {
      if (!isAdmin()) return T.U.toast('Chỉ ADMIN được xóa lịch.', 'err');
      let plan;
      try { plan = this.previewDelete(false); } catch (e) { return T.U.toast(e.message, 'err'); }
      if (!plan?.deletable?.length) return T.U.toast('Không có trận trong phạm vi đã chọn. Chọn “Chưa xếp ngày” để xóa các trận chưa có ngày.', 'info');
      if (!T.Data.connected) return T.U.toast('Firebase offline: không thể xác nhận xóa.', 'err');
      jsonBackup(T, plan.deletable, plan.scope);
      const phrase = plan.allow && plan.protectedMatches.length ? 'XÓA CẢ KẾT QUẢ' : 'XÓA LỊCH';
      const ok = await T.U.confirmDanger('Xóa lịch trên Firebase',
        'Xóa ' + plan.deletable.length + ' trận; giữ ' + plan.skipped.length +
        ' trận được bảo vệ. Đã yêu cầu tải bản sao JSON.', phrase);
      if (!ok) return;
      if (plan.deletable.some(m => hasResult(this,m)))
        return T.U.toast('Trận đang chạy/có kết quả không thể xóa bằng chức năng này.', 'err');
      try {
        await persistDelete(T, plan.deletable, 'DELETE_SCHEDULE');
        document.getElementById('schedule-delete-modal').classList.add('hidden');
      } catch (e) { T.U.toast('Xóa lịch thất bại: ' + (e.message || e), 'err'); }
    };
    return true;
  }
  if (!install()) {
    window.addEventListener('topkey:admin-ready', install, {once:true});
    window.__TOPKEY_VNEXT_BOOT?.then(install).catch(() => {});
  }
})();
