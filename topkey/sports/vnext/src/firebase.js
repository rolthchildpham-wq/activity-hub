(() => {
  'use strict';
  const T = window.Topkey;
  const U = T.U;
  const cleanFirebase = value => {
    if (value === undefined) return undefined;
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (Array.isArray(value)) return value.map(item => {
      const clean = cleanFirebase(item);
      return clean === undefined ? null : clean;
    });
    if (typeof value === 'object') {
      const output = {};
      for (const [key, item] of Object.entries(value)) {
        const clean = cleanFirebase(item);
        if (clean !== undefined) output[key] = clean;
      }
      return output;
    }
    return String(value);
  };

  class DataService {
    constructor() {
      this.ready = false;
      this.online = navigator.onLine;
      this.connected = false;
      this.db = null;
      this.auth = null;
      this.storage = null;
      const urlTid = new URLSearchParams(location.search).get('tid');
      const isTestTid = value => String(value || '').startsWith('__testlab_');
      const storageKey = 'topkey_' + T.SPORT.key + '_tid';
      const backupKey = storageKey + '_prod';
      // The standalone badminton engine used these keys before it was routed
      // into the shared VNext workspace. Prefer them for badminton so the
      // production tournament ID is carried forward instead of silently
      // falling back to main_2026.
      const legacyTidKeys = T.SPORT.key === 'badminton'
        ? ['topkey_vnext_tid', 'topkey_vnext_prod_tid']
        : [];
      const readFirst = keys => keys.map(key => localStorage.getItem(key) || '').find(Boolean) || '';
      let savedTid = readFirst([...legacyTidKeys.slice(0, 1), storageKey]);
      let prodBackup = readFirst([...legacyTidKeys.slice(1), backupKey]);
      if (isTestTid(savedTid)) {
        [storageKey, ...legacyTidKeys.slice(0, 1)].forEach(key => localStorage.removeItem(key));
        savedTid = '';
      }
      if (isTestTid(prodBackup)) {
        [backupKey, ...legacyTidKeys.slice(1)].forEach(key => localStorage.removeItem(key));
        prodBackup = '';
      }
      this.tid = urlTid || savedTid || prodBackup || 'main_2026';
      if (!isTestTid(this.tid)) {
        // Keep both key families synchronized after resolving the canonical ID.
        // This also repairs a missing primary key when only the legacy backup exists.
        [storageKey, backupKey, ...legacyTidKeys].forEach(key => localStorage.setItem(key, this.tid));
      }
      this.listeners = [];
      this.pending = 0;
      this._initPromise = null;
      this._networkBound = false;
      this._connectionBound = false;
      this._flushPromise = null;
      this._flushAgain = false;
    }

    path(path = '') { return `${T.ROOT}/tournaments/${this.tid}${path ? '/' + path.replace(/^\//, '') : ''}`; }

    async init() {
      if (this._initPromise) return this._initPromise;
      this._initPromise = (async () => {
        try {
          if (!firebase.apps.length) firebase.initializeApp(T.FIREBASE_CONFIG);
          this.db = firebase.database();
          this.auth = typeof firebase.auth === 'function' ? firebase.auth() : null;
          this.storage = typeof firebase.storage === 'function' ? firebase.storage() : null;
          this.ready = true;
          if (!this._connectionBound) {
            this._connectionBound = true;
            this.db.ref('.info/connected').on('value', snapshot => {
              this.connected = !!snapshot.val();
              this.online = this.connected;
              T.App?.renderHealth();
              if (this.connected) this.flushQueue().catch(error => console.warn('Queue flush connection', error));
            });
          }
        } catch (error) { console.warn('Firebase unavailable', error); }
        if (!this._networkBound) {
          this._networkBound = true;
          addEventListener('online', () => {
            this.online = true;
            this.flushQueue().catch(error => console.warn('Queue flush online', error));
            T.App?.renderHealth();
          });
          addEventListener('offline', () => { this.online = false; T.App?.renderHealth(); });
        }
        try { await this.refreshQueueStats(); }
        catch (error) { console.warn('Offline queue unavailable during boot; login continues', error); this.pending = 0; }
        if (this.auth?.currentUser) this.flushQueue().catch(error => console.warn('Initial queue flush deferred', error));
        return this;
      })();
      try { return await this._initPromise; } finally { if (!this.ready || !this.auth) this._initPromise = null; }
    }

    ref(path = '') { return this.db?.ref(this.path(path)); }
    async read(path = '') { if (!this.ready) return null; const snapshot = await this.ref(path).once('value'); return snapshot.val(); }
    // H99: bounded, cursor-based RTDB reads. Never loads an entire branch.
    async readPage(path, {orderBy = 'key', size = 100, cursor = null} = {}) {
      if (!this.ready) return {items: [], nextCursor: null, hasMore: false};
      if (!['key','createdAt','updatedAt','date','status','category','clientAt'].includes(orderBy)) throw new Error('Unsupported pagination index');
      const count = Math.min(200, Math.max(1, Math.floor(Number(size) || 100)));
      const base = this.ref(path);
      if (!base) return {items: [], nextCursor: null, hasMore: false};
      let query = orderBy === 'key' ? base.orderByKey() : base.orderByChild(orderBy);
      if (cursor) {
        if (typeof cursor.key !== 'string') throw new Error('Invalid cursor');
        query = orderBy === 'key' ? query.endAt(cursor.key) : query.endAt(cursor.value, cursor.key);
      }
      const snapshot = await query.limitToLast(count + 2).once('value');
      let entries = [];
      snapshot.forEach(child => { entries.push({key: child.key, value: child.val()}); });
      if (cursor) entries = entries.filter(item => item.key !== cursor.key);
      const hasMore = entries.length > count;
      if (hasMore) entries = entries.slice(-count);
      const first = entries[0];
      return {items: entries.reverse(), hasMore, nextCursor: hasMore && first ? {key: first.key, value: orderBy === 'key' ? first.key : first.value?.[orderBy] ?? null} : null};
    }
    listen(path, callback, event = 'value') {
      if (!this.ready) return () => {};
      const ref = this.ref(path), handler = snapshot => callback(snapshot.val(), snapshot.key);
      ref.on(event, handler);
      const off = () => {ref.off(event, handler);const i=this.listeners.indexOf(off);if(i>=0)this.listeners.splice(i,1)};
      this.listeners.push(off);
      return off;
    }
    listenAuthUsers(callback) {
      if (!this.ready) return () => {};
      const ref = this.db.ref(`${T.AUTH_ROOT}/users`), handler = snapshot => callback(snapshot.val() || {});
      ref.on('value', handler);
      const off = () => {ref.off('value', handler);const i=this.listeners.indexOf(off);if(i>=0)this.listeners.splice(i,1)};
      this.listeners.push(off);
      return off;
    }

    async refreshQueueStats() {
      const items = await T.idb.all('queue');
      this.pending = items.length;
      T.App?.renderHealth();
      return this.pending;
    }
    async queueMulti(updates, meta = {}) {
      const normalizedMeta = cleanFirebase(meta) || {};
      const id = normalizedMeta.eventId || U.id('q');
      const item = {id, updates: cleanFirebase(updates) || {}, meta: normalizedMeta, createdAt: Date.now(), attempts: 0, status: 'PENDING'};
      await T.idb.put('queue', item);
      await this.refreshQueueStats();
      if (this.connected) {
        await this.flushQueue();
        const pending = await T.idb.get('queue', id);
        if (pending?.status === 'ERROR') throw new Error(pending.lastError || 'Firebase không ghi được dữ liệu');
      }
      return item;
    }
    async queueSet(path, value, meta = {}) { return this.queueMulti({[this.path(path)]: value}, meta); }

    flushQueue() {
      if (!this.ready || !this.connected) return Promise.resolve();
      if (this._flushPromise) { this._flushAgain = true; return this._flushPromise; }
      this._flushPromise = (async () => {
        do { this._flushAgain = false; await this._flushPass(); }
        while (this._flushAgain);
      })().finally(() => { this._flushPromise = null; });
      return this._flushPromise;
    }
    async _flushPass() {
      const items = (await T.idb.all('queue')).sort((a, b) => a.createdAt - b.createdAt);
      this.pending = items.length;
      for (const item of items) {
        if (!this.auth?.currentUser && item?.meta?.type !== 'PUBLIC_REGISTRATION') continue;
        try {
          await this.db.ref().update(cleanFirebase(item.updates || {}) || {});
          await T.idb.del('queue', item.id);
          this.pending -= 1;
        } catch (error) {
          item.attempts = (item.attempts || 0) + 1;
          item.lastError = error?.message || String(error);
          item.status = 'ERROR';
          await T.idb.put('queue', item);
          console.error('Firebase queue write failed', item.meta || {}, error);
        }
      }
      await this.refreshQueueStats();
    }

    async audit(action, entityType, entityId, before = null, after = null) {
      const id = U.id('audit');
      const row = {id, action, entityType, entityId, uid: T.Auth?.user?.uid || 'local', actor: T.Auth?.profile?.displayName || 'local', before, after, clientAt: Date.now(), sport: T.SPORT.key};
      return this.queueSet(`audit/${id}`, row, {type: 'AUDIT'});
    }
    async uploadReceipt(file, id) {
      if (!this.storage || !file) return null;
      const extension = (file.name.split('.').pop() || 'bin').toLowerCase();
      const uid = T.Auth?.user?.uid || 'unknown';
      const storagePath = `${T.ROOT}/${this.tid}/receipts/${uid}/${id}.${extension}`;
      const snapshot = await this.storage.ref(storagePath).put(file);
      return snapshot.ref.getDownloadURL();
    }
  }
  const shell=T.Data,data=new DataService();
  if(shell?.__platformShell){data.app=shell.app;data.db=shell.db;data.auth=shell.auth;data.ready=!!(data.db&&data.auth);data.tid=shell.tid||data.tid;}
  T.Data = data;
})();
