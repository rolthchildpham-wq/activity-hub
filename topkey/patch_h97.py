from pathlib import Path
p=Path('/mnt/data/h97work/sports/vnext/src/firebase.js');s=p.read_text();needle="    listen(path, callback, event = 'value') {"
addition='''    // H97: bounded Firebase query. Cursor is {value,key}; null means first page.
    async readPage(path, {orderBy = 'key', size = 100, cursor = null} = {}) {
      if (!this.ready) return {items: [], nextCursor: null, hasMore: false};
      const count = Math.min(200, Math.max(1, Math.floor(Number(size) || 100)));
      const base = this.ref(path);
      if (!base) return {items: [], nextCursor: null, hasMore: false};
      let query = orderBy === 'key' ? base.orderByKey() : base.orderByChild(orderBy);
      if (cursor && typeof cursor.key === 'string') {
        query = orderBy === 'key' ? query.endAt(cursor.key) : query.endAt(cursor.value, cursor.key);
      }
      const snapshot = await query.limitToLast(count + (cursor ? 2 : 1)).once('value');
      let entries = [];
      snapshot.forEach(child => { entries.push({key: child.key, value: child.val()}); });
      if (cursor) entries = entries.filter(item => item.key !== cursor.key || (orderBy !== 'key' && item.value?.[orderBy] !== cursor.value));
      const hasMore = entries.length > count;
      if (hasMore) entries = entries.slice(entries.length - count);
      const first = entries[0];
      return {items: entries.reverse(), hasMore, nextCursor: hasMore && first ? {key: first.key, value: orderBy === 'key' ? first.key : first.value?.[orderBy] ?? null} : null};
    }
'''
assert needle in s;s=s.replace(needle,addition+needle);p.write_text(s)
# Audit paginated UI: no full-tree subscription.
p=Path('/mnt/data/h97work/sports/vnext/src/core/performance-runtime.js');s=p.read_text().replace("    audit: 'audit',","    // audit is loaded with bounded Firebase queries, not a full-tree listener.")
needle='  App.showTab = function showTab(tab) {'
addition='''  App.loadAuditPage = async function loadAuditPage(reset = false) {
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

'''
assert needle in s;s=s.replace(needle,addition+needle)
s=s.replace('    this.syncTabSubscriptions();\n    (TAB_DEPENDENCIES',"    this.syncTabSubscriptions();\n    if (this.currentTab === 'audit' && !this.__h97AuditRows) this.loadAuditPage(true);\n    (TAB_DEPENDENCIES")
p.write_text(s)
