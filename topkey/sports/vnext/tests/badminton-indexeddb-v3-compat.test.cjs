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
  console.log('PASS badminton IndexedDB v3 compatibility; existing stores preserved');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
