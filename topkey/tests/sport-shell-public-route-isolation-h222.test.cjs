const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '../sports/topkey-sports-shell.js'), 'utf8');

function run({ hash = '', pathname = '/sports/vnext/index.html', search = '?sport=football', existing = false } = {}) {
  const state = { prepended: [], options: [], listeners: {}, assigned: null };
  const makeElement = tag => ({
    tagName: tag.toUpperCase(), children: [], attributes: {}, className: '', id: '',
    textContent: '', href: '', value: '',
    setAttribute(name, value) { this.attributes[name] = value; },
    append(...items) { this.children.push(...items); },
    addEventListener(name, callback) { this.listeners ||= {}; this.listeners[name] = callback; }
  });
  const document = {
    body: { prepend(node) { state.prepended.push(node); } },
    getElementById(id) { return existing && id === 'topkey-sports-shell' ? {} : null; },
    createElement: makeElement
  };
  const location = {
    hash, pathname, search,
    assign(url) { state.assigned = url; }
  };
  vm.runInNewContext(source, { location, document, URLSearchParams });
  return { state, location };
}

for (const hash of ['#spectator', '#spectator/live', '#register', '#register/team', '#judge', '#judge/match-1']) {
  const { state } = run({ hash });
  assert.equal(state.prepended.length, 0, 'Public route must not receive the admin sport shell: ' + hash);
}

const football = run();
assert.equal(football.state.prepended.length, 1, 'Private workspace must receive exactly one shared shell');
const shell = football.state.prepended[0];
assert.equal(shell.id, 'topkey-sports-shell');
assert.equal(shell.children[2].children.length, 7, 'Sport switcher must expose all seven sports');

const badminton = run({ pathname: '/sports/badminton/index.html', search: '' });
assert.equal(badminton.state.prepended[0].children[2].children.find(option => option.selected)?.textContent, '🏸 Cầu lông',
  'Retained badminton engine must identify badminton as the active sport');

const existing = run({ existing: true });
assert.equal(existing.state.prepended.length, 0, 'Do not duplicate an existing shell');

console.log(JSON.stringify({
  status: 'PASS',
  publicRoutes: ['spectator', 'register', 'judge'],
  privateShell: 'one instance',
  sportOptions: 7,
  badmintonIdentity: 'verified',
  duplicateProtection: 'verified'
}, null, 2));
