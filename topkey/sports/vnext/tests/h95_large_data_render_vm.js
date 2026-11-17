const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class Element {
  constructor() {
    this.children = [];
    this.classList = {add() {}, remove() {}, toggle() {}, contains() { return false; }};
    this.style = {};
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
  }
  appendChild(child) { if (child.isFragment) this.children.push(...child.children); else this.children.push(child); return child; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = [...children]; }
  querySelectorAll() { return []; }
}

const elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, new Element());
  return elements.get(id);
};
const document = {
  hidden: false,
  createElement() { return new Element(); },
  createDocumentFragment() { const node = new Element(); node.isFragment = true; return node; },
  getElementById: element,
  querySelectorAll() { return []; },
  addEventListener() {}
};
const Topkey = {
  U: {setText() {}, money: String, dateTime: String},
  SPORT: {key: 'football', title: 'Football', rules: {}, mode: 'score'},
  DEFAULT_RULES: {},
  MATCH_STATUSES: ['SCHEDULED', 'FINISHED'],
  Data: {ready: true, listen() { return () => {}; }, listenAuthUsers() { return () => {}; }},
  Auth: {role: () => 'ADMIN'}
};
const window = {Topkey, addEventListener() {}};
window.window = window;
const sandbox = {
  window,
  document,
  navigator: {onLine: true},
  location: {hash: '', protocol: 'https:', search: ''},
  requestAnimationFrame: callback => { callback(); return 1; },
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  console,
  Blob,
  URL,
  Date,
  Math
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../src/app.js'), 'utf8'), sandbox, {filename: 'app.js'});
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../src/core/performance-runtime.js'), 'utf8'), sandbox, {filename: 'performance-runtime.js'});

const App = Topkey.App;
App.state.teams = Object.fromEntries(Array.from({length: 10000}, (_, index) => {
  const id = `t${index}`;
  return [id, {id, code: `T${String(index).padStart(5, '0')}`, name: `Team ${index}`, p1: 'A', p2: 'B', category: 'OPEN'}];
}));
App.state.matches = Object.fromEntries(Array.from({length: 10000}, (_, index) => {
  const id = `m${index}`;
  return [id, {id, code: `M${index}`, teamAId: `t${index}`, teamBId: `t${(index + 1) % 10000}`, status: 'SCHEDULED', date: '2026-11-08', time: '08:00'}];
}));
App.matchLabel = match => `${match.teamAId}-${match.teamBId}`;
App.resultLabel = () => '—';

App.renderTeams();
App.renderMatches();

assert.strictEqual(Object.keys(App.state.teams).length, 10000, 'full team state must remain available');
assert.strictEqual(Object.keys(App.state.matches).length, 10000, 'full match state must remain available');
assert(element('teams-list').children.length <= 300, 'team DOM must be bounded to 300 rows');
assert(element('matches-list').children.length <= 300, 'schedule DOM must be bounded to 300 rows');
assert.strictEqual(App.__h95VisibleCounts.teams.total, 10000, 'UI runtime must retain the full team count');
assert.strictEqual(App.__h95VisibleCounts.matches.total, 10000, 'UI runtime must retain the full match count');

console.log('PASS H95 10k-data bounded render VM');
