(() => {
  'use strict';
  const T = window.Topkey;

  // The standalone badminton engine already owns this database at version 3.
  // VNext must open the same database at the same version so queued offline
  // writes, receipts and cached records remain available after the shared-shell
  // route is used. Never delete/recreate the database to recover from a
  // VersionError: that would discard pending production writes.
  const DB_VERSION = 3;
  const STORE_DEFINITIONS = {
    queue: {keyPath: 'id'},
    receipts: {keyPath: 'id'},
    cache: {keyPath: 'key'}
  };

  class IDBStore {
    constructor() { this.dbp = null; }

    open() {
      if (this.dbp) return this.dbp;
      this.dbp = new Promise((resolve, reject) => {
        let settled = false;
        let timer = null;
        const fail = error => {
          if (settled) return;
          settled = true;
          if (timer) clearTimeout(timer);
          this.dbp = null;
          reject(error instanceof Error ? error : new Error(String(error || 'IndexedDB unavailable')));
        };

        timer = setTimeout(() => fail(new Error('IndexedDB open timeout')), 3500);
        let request;
        try {
          request = indexedDB.open('topkey_' + T.SPORT.key + '_vnext', DB_VERSION);
        } catch (error) {
          fail(error);
          return;
        }

        request.onupgradeneeded = () => {
          const db = request.result;
          Object.entries(STORE_DEFINITIONS).forEach(([name, options]) => {
            if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, options);
          });
        };
        request.onsuccess = () => {
          if (settled) {
            try { request.result.close(); } catch {}
            return;
          }
          settled = true;
          if (timer) clearTimeout(timer);
          resolve(request.result);
        };
        request.onerror = () => fail(request.error || new Error('IndexedDB open failed'));
        request.onblocked = () => console.warn('IndexedDB upgrade blocked; waiting for existing tabs to close');
      });
      return this.dbp;
    }

    async put(store, value) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(value);
        tx.oncomplete = () => resolve(value);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
      });
    }

    async get(store, key) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const request = db.transaction(store).objectStore(store).get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    async all(store) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const request = db.transaction(store).objectStore(store).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    }

    async del(store, key) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
      });
    }
  }

  T.idb = new IDBStore();
})();
