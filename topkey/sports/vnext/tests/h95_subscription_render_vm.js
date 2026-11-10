const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.resolve(__dirname, '../src/core/performance-runtime.js'), 'utf8');
const handlers = new Map();
const active = new Map();
const frames = [];
const renders = {};
const windowListeners = {};

function listen(branch, callback) {
  handlers.set(branch, callback);
  active.set(branch, (active.get(branch) || 0) + 1);
  let attached = true;
  return () => {
    if (!attached) return;
    attached = false;
    active.set(branch, (active.get(branch) || 0) - 1);
  };
}

const App = {
  state: {},
  offs: [],
  currentTab: 'overview',
  renderBranch(branch) { renders[branch] = (renders[branch] || 0) + 1; },
  renderUsers() { renders.users = (renders.users || 0) + 1; },
  renderCourts() { renders.courts = (renders.courts || 0) + 1; },
  renderAll() { renders.all = (renders.all || 0) + 1; },
  showTab(tab) { this.currentTab = tab; return tab; }
};
const Data = {
  ready: true,
  listen,
  listenAuthUsers(callback) { return listen('users', callback); }
};
const Topkey = {App, Data, Auth: {role: () => 'ADMIN'}};
const sandbox = {
  window: {Topkey},
  document: {hidden: false, addEventListener() {}},
  requestAnimationFrame(callback) { frames.push(callback); return frames.length; },
  setTimeout,
  clearTimeout,
  console
};
sandbox.window.window = sandbox.window;
sandbox.window.addEventListener = (event, handler) => { windowListeners[event] = handler; };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, {filename: 'performance-runtime.js'});

App.subscribe();
for (const branch of ['config', 'teams', 'matches', 'courts', 'activeMatches', 'announcements', 'finance']) {
  assert.strictEqual(active.get(branch), 1, `${branch} must have one core listener`);
}
for (const branch of ['registrations', 'audit', 'commentary', 'users']) {
  assert.strictEqual(active.get(branch) || 0, 0, `${branch} must be lazy before its tab opens`);
}

handlers.get('teams')({t1: {id: 't1'}});
handlers.get('teams')({t1: {id: 't1'}, t2: {id: 't2'}});
handlers.get('matches')({m1: {id: 'm1'}});
assert.strictEqual(renders.teams || 0, 0, 'Firebase callbacks must defer DOM work to a frame');
assert.strictEqual(frames.length, 1, 'a callback burst must schedule one frame');
frames.shift()();
assert.strictEqual(renders.teams, 1, 'one dirty branch must render once per frame');
assert.strictEqual(renders.matches, 1, 'each dirty branch must render once per frame');

App.showTab('finance');
assert.strictEqual(active.get('finance'), 1, 'finance report state must keep one core listener');
const matchesBeforeHiddenUpdate = renders.matches;
handlers.get('matches')({m1: {id: 'm1'}, m2: {id: 'm2'}});
assert.strictEqual(frames.length, 1, 'hidden branch update may schedule only one shared frame');
frames.shift()();
assert.strictEqual(renders.matches, matchesBeforeHiddenUpdate, 'inactive schedule DOM must not render on finance tab');
App.showTab('audit');
assert.strictEqual(active.get('finance'), 1, 'finance listener must remain available for cross-tab reports');
assert.strictEqual(active.get('audit'), 1, 'audit listener must attach on audit tab');
App.showTab('audit');
assert.strictEqual(active.get('audit'), 1, 'reopening the same tab must not duplicate listeners');
App.showTab('settings');
assert.strictEqual(active.get('audit'), 0, 'previous heavy listener must be removed');
assert.strictEqual(active.get('users'), 1, 'ADMIN users listener must attach only in settings');
App.showTab('control');
assert.strictEqual(active.get('users'), 1, 'ADMIN users listener must remain available for court assignments');
App.showTab('settings');
assert.strictEqual(active.get('users'), 1, 'switching user-dependent tabs must not duplicate listeners');
windowListeners.pagehide();
assert.strictEqual(active.get('users'), 0, 'pagehide must release the active heavy listener');
for (const branch of ['config', 'teams', 'matches', 'courts', 'activeMatches', 'announcements', 'finance']) {
  assert.strictEqual(active.get(branch), 0, `pagehide must release ${branch}`);
}
windowListeners.pageshow();
assert.strictEqual(active.get('users'), 1, 'pageshow must restore the active tab listener');
for (const branch of ['config', 'teams', 'matches', 'courts', 'activeMatches', 'announcements', 'finance']) {
  assert.strictEqual(active.get(branch), 1, `pageshow must restore ${branch}`);
}

console.log('PASS H95 tab-scoped subscription and render VM');
