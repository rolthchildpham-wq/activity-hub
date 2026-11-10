const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.resolve(__dirname, '../runtime-lifecycle.js'), 'utf8');
const listeners = new Map();
const timers = new Map();
let nextTimer = 1;
let calls = 0;
const document = {
  hidden: false,
  addEventListener(event, handler) { listeners.set(`document:${event}`, handler); },
  removeEventListener(event, handler) {
    if (listeners.get(`document:${event}`) === handler) listeners.delete(`document:${event}`);
  }
};
const window = {
  addEventListener(event, handler) { listeners.set(`window:${event}`, handler); },
  removeEventListener(event, handler) {
    if (listeners.get(`window:${event}`) === handler) listeners.delete(`window:${event}`);
  }
};
window.window = window;
const sandbox = {
  window,
  document,
  setTimeout(handler) { const id = nextTimer++; timers.set(id, handler); return id; },
  clearTimeout(id) { timers.delete(id); },
  setInterval() { throw new Error('TopkeyLifecycle must not create perpetual intervals'); },
  clearInterval() {},
  console
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, {filename: 'runtime-lifecycle.js'});

function drain(limit = 20) {
  let count = 0;
  while (timers.size && count++ < limit) {
    const batch = [...timers.values()];
    timers.clear();
    batch.forEach(handler => handler());
  }
  assert(count < limit, 'lifecycle scheduler must settle in finite time');
}

const cleanup = window.TopkeyLifecycle.bind(() => { calls += 1; }, {
  events: ['topkey:tab-change', 'focus'],
  settleTicks: 3,
  settleEvery: 1,
  debounceMs: 1
});
drain();
assert.strictEqual(calls, 3, 'bounded startup settle must run exactly three times');

listeners.get('window:topkey:tab-change')();
listeners.get('window:topkey:tab-change')();
listeners.get('window:focus')();
drain();
assert.strictEqual(calls, 4, 'event burst must coalesce to one maintenance run');

document.hidden = true;
listeners.get('window:focus')();
drain();
assert.strictEqual(calls, 4, 'hidden documents must skip maintenance work');

cleanup();
document.hidden = false;
assert.strictEqual(listeners.has('window:focus'), false, 'cleanup must remove lifecycle listeners');
assert.strictEqual(timers.size, 0, 'cleanup must leave no scheduled work');

console.log('PASS H95 finite lifecycle scheduler');
