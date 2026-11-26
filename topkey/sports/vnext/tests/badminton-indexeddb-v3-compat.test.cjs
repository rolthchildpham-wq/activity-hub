const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const vnextSource = fs.readFileSync(path.join(__dirname, '../src/idb.js'), 'utf8');
const legacySource = fs.readFileSync(path.join(__dirname, '../../badminton/src/idb.js'), 'utf8');

let requestedName = '';
let requestedVersion = 0;
let opened = false;
const existingStores = new Set(['queue', 'receipts', 'cache']);
const database = {
  objectStoreNames: { contains: name => existingStores.has(name) },
  createObjectStore(name) { existingStores.add(name); },
  close() {},
  transaction() { throw new Error('No transaction expected in open compatibility test'); }
};

const indexedDB = {
  open(name, version) {
    requestedName = name;
    requestedVersion = version;
    const request = {result: database, error: null};
    queueMicrotask(() => {
      // Model a browser with the legacy database already at version 3.
      if (version < 3) {
        request.error = new DOMException(
          'The requested version (' + version + ') is less than the existing version (3).',
          'VersionError'
        );
        request.onerror?.();
        return;
      }
      opened = true;
      request.onsuccess?.();
    });
    return request;
  }
};

const context = {
  window: {Topkey: {SPORT: {key: 'badminton'}}},
  indexedDB,
  setTimeout,
  clearTimeout,
  console,
  DOMException,
  Promise
};
context.window.window = context.window;
vm.runInNewContext(vnextSource, context, {filename: 'vnext-idb.js'});

(async () => {
  await context.window.Topkey.idb.open();
  assert.equal(requestedName, 'topkey_badminton_vnext');
  assert.equal(requestedVersion, 3, 'VNext must request the existing legacy database version 3');
  assert.equal(opened, true, 'existing version-3 database must open without VersionError');
  assert.deepEqual([...existingStores].sort(), ['cache', 'queue', 'receipts']);
  assert.match(legacySource, /indexedDB\.open\('topkey_badminton_vnext',\s*3\)/);

const firebaseSource = fs.readFileSync(path.join(__dirname, '../src/firebase.js'), 'utf8');
const values = new Map([
  // Simulate a stale default written by the new shell while the real
  // production tournament ID remains in the standalone engine's keys.
  ['topkey_badminton_tid', 'main_2026'],
  ['topkey_badminton_tid_prod', 'main_2026'],
  ['topkey_vnext_tid', 'production_event_2025'],
  ['topkey_vnext_prod_tid', 'production_event_2025']
]);
const writes = [];
const storage = {
  getItem(key) { return values.get(key) || null; },
  setItem(key, value) { values.set(key, String(value)); writes.push([key, String(value)]); },
  removeItem(key) { values.delete(key); }
};
const firebaseContext = {
  window: {Topkey: {U: {id: () => 'id'}, SPORT: {key: 'badminton'}, ROOT: 'topkey_badminton_vnext_2026'}},
  navigator: {onLine: true},
  location: {search: ''},
  localStorage: storage,
  URLSearchParams,
  addEventListener() {},
  console,
  setTimeout,
  clearTimeout
};
firebaseContext.window.window = firebaseContext.window;
vm.runInNewContext(firebaseSource, firebaseContext, {filename: 'vnext-firebase.js'});
assert.equal(firebaseContext.window.Topkey.Data.tid, 'production_event_2025',
  'shared badminton workspace must restore the legacy production tournament ID');
assert.equal(values.get('topkey_badminton_tid'), 'production_event_2025',
  'legacy production tournament ID must be mirrored to the shared-shell key');
assert.equal(values.get('topkey_vnext_tid'), 'production_event_2025',
  'legacy tournament key must remain intact for rollback compatibility');

  console.log('PASS badminton IndexedDB v3 + legacy production tournament ID compatibility; stores preserved');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
