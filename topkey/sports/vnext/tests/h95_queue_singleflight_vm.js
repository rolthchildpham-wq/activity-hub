const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.resolve(__dirname, '../src/firebase.js'), 'utf8');
const queue = new Map([
  ['q1', {id: 'q1', updates: {'root/q1': 1}, meta: {}, createdAt: 1, status: 'PENDING'}]
]);
const deleted = [];
let activeUpdates = 0;
let maxConcurrentUpdates = 0;
let firstUpdateStarted;
let releaseFirstUpdate;
const firstStarted = new Promise(resolve => { firstUpdateStarted = resolve; });
const firstGate = new Promise(resolve => { releaseFirstUpdate = resolve; });

const idb = {
  async all() { return [...queue.values()].map(item => ({...item})); },
  async get(_store, id) { return queue.get(id) || null; },
  async put(_store, item) { queue.set(item.id, {...item}); },
  async del(_store, id) { queue.delete(id); deleted.push(id); }
};

let updateCalls = 0;
const rootRef = {
  async update() {
    updateCalls += 1;
    activeUpdates += 1;
    maxConcurrentUpdates = Math.max(maxConcurrentUpdates, activeUpdates);
    if (updateCalls === 1) {
      firstUpdateStarted();
      await firstGate;
    }
    activeUpdates -= 1;
  }
};

const database = {ref: () => rootRef};
const auth = {currentUser: {uid: 'u1'}};
const firebase = {
  apps: [{}],
  initializeApp() {},
  database: () => database,
  auth: () => auth
};
firebase.database.ServerValue = {};

const Topkey = {
  ROOT: 'root',
  SPORT: {key: 'football'},
  FIREBASE_CONFIG: {},
  U: {id: () => 'generated'},
  idb,
  App: {renderHealth() {}}
};
const sandbox = {
  window: {Topkey}, Topkey, firebase,
  navigator: {onLine: true},
  location: {search: ''},
  localStorage: {getItem() { return null; }, setItem() {}, removeItem() {}},
  URLSearchParams,
  addEventListener() {},
  console,
  setTimeout,
  clearTimeout
};
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(source, sandbox, {filename: 'firebase.js'});

(async () => {
  const data = Topkey.Data;
  data.ready = true;
  data.connected = true;
  data.db = database;
  data.auth = auth;

  const first = data.flushQueue();
  await firstStarted;
  queue.set('q2', {id: 'q2', updates: {'root/q2': 2}, meta: {}, createdAt: 2, status: 'PENDING'});
  const second = data.flushQueue();
  await new Promise(resolve => setTimeout(resolve, 10));
  releaseFirstUpdate();
  await Promise.all([first, second]);

  assert.strictEqual(maxConcurrentUpdates, 1, 'flushQueue must have only one Firebase writer');
  assert.deepStrictEqual([...new Set(deleted)].sort(), ['q1', 'q2'], 'coalesced rerun must flush the late item');
  assert.strictEqual(queue.size, 0, 'no queued item may be stranded');
  console.log('PASS H95 single-flight queue VM');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
