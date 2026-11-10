'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {spawnSync} = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(ROOT, 'topkey-platform-core.js'), 'utf8');
const context = {
  window: null, document: {}, console, Promise, Date, URL,
  setTimeout, clearTimeout, dispatchEvent() {}
};
context.window = context;
vm.createContext(context);
vm.runInContext(source, context);
const policy = context.TopkeyPlatform.policy;
const sports = ['badminton', 'football', 'volleyball', 'running', 'handmade', 'shuttle', 'cooking'];

let checks = 0;
const check = (value, message) => { assert(value, message); checks++; };

for (const sport of sports) {
  check(policy.sports.includes(sport), `policy includes ${sport}`);
  check(policy.canAccess({role: 'ADMIN', active: true}, sport), `ADMIN accesses ${sport}`);
  check(policy.canAccess({role: 'BTC', active: true, sportScope: sport}, sport), `scoped BTC accesses ${sport}`);
  check(!policy.canAccess({role: 'BTC', active: true}, sport), `unscoped BTC denied ${sport}`);
  check(!policy.canAccess({role: 'BTC', active: true, sportScope: sport === 'badminton' ? 'football' : 'badminton'}, sport), `wrong-sport BTC denied ${sport}`);
  check(policy.canAccess({role: 'VIEWER', active: true}, sport), `unscoped VIEWER accesses ${sport}`);
  check(!policy.canAccess({role: 'VIEWER', active: true, sportScope: sport === 'badminton' ? 'football' : 'badminton'}, sport), `wrong-sport VIEWER denied ${sport}`);
}

check(policy.normalizeSport('Cầu lông') === 'badminton', 'Vietnamese Badminton alias normalizes');
check(policy.normalizeSport('Bóng chuyền') === 'volleyball', 'Vietnamese Volleyball alias normalizes');
check(policy.normalizeSport('DIY / Handmade') === 'handmade', 'Handmade alias normalizes');
check(!policy.canAccess({role: 'ADMIN', status: 'SUSPENDED'}, 'badminton'), 'suspended ADMIN denied');
check(!policy.canAccess({role: 'ADMIN', disabled: true}, 'football'), 'disabled ADMIN denied');
check(policy.normalizeRole('unknown') === 'VIEWER', 'unknown roles are least-privilege VIEWER');
check(policy.canTab('UMPIRE', 'umpire') && !policy.canTab('VIEWER', 'finance'), 'role tab policy is centralized');

for (const relative of ['sports/badminton/src/config.js', 'sports/vnext/src/config.js']) {
  const config = fs.readFileSync(path.join(ROOT, relative), 'utf8');
  check(!/T\.ROLES\s*=\s*\{/.test(config), `${relative} has no private role table`);
  check(/TopkeyPlatform\.policy\.roles/.test(config), `${relative} consumes platform roles`);
}

const canonicalPath = path.join(ROOT, 'firebase.database.rules.json');
const mirrorPath = path.join(ROOT, 'sports/badminton/firebase.database.rules.json');
const canonicalText = fs.readFileSync(canonicalPath, 'utf8');
check(canonicalText === fs.readFileSync(mirrorPath, 'utf8'), 'canonical and deployment mirror rules are byte-identical');
const rules = JSON.parse(canonicalText).rules;
for (const sport of sports) check(Object.hasOwn(rules, `topkey_${sport}_vnext_2026`), `rules include ${sport} namespace`);

const gate = spawnSync('python', ['tools/build_release.py', '--validate-rules-only'], {cwd: ROOT, encoding: 'utf8'});
check(gate.status === 0, `release rules gate passes: ${gate.stderr || gate.stdout}`);

console.log(`H119_POLICY_RULES_PARITY ${checks}/${checks} PASS`);
