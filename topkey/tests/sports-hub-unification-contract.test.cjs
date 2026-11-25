# TOPKEY Sports Hub — ECC implementation contract

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const hub = read('index.html');
const vnext = read('sports/vnext/src/config.js');
const badminton = read('sports/badminton/src/config.js');
const launcher = read('sports/vnext/badminton.html');

const sportLinks = [...hub.matchAll(/<a class="sport" href="([^"]+)"[\s\S]*?<h3>([^<]+)<\/h3>/g)]
  .map(([, href, name]) => ({ href: href.replaceAll('&amp;', '&'), name }));

assert.ok(sportLinks.some(item => item.name === 'Cầu lông'), 'Badminton must be present in the single Hub catalog');
assert.ok(sportLinks.some(item => item.name === 'Bóng đá'), 'Football must remain in the catalog');
assert.ok(sportLinks.some(item => item.name === 'Bóng chuyền'), 'Volleyball must remain in the catalog');
assert.ok(sportLinks.some(item => item.name === 'Chạy bộ'), 'Running must remain in the catalog');

const badmintonCard = sportLinks.find(item => item.name === 'Cầu lông');
assert.match(badmintonCard.href, /^\.\/sports\/vnext\//, 'Badminton must be launched through the common VNext route namespace');
assert.match(launcher, /sports\/badminton\/index\.html/, 'The common route adapter must preserve the existing badminton runtime');

const roots = {
  vnext: vnext.match(/root:'([^']+)'/g) || [],
  badminton: badminton.match(/T\.ROOT = '([^']+)'/)?.[1]
};
assert.equal(roots.badminton, 'topkey_badminton_vnext_2026', 'Badminton Firebase root is a protected data contract');
assert.match(badminton, /T\.SCHEMA_VERSION = 3/, 'Badminton schema v3 must not be silently downgraded');
assert.match(vnext, /T\.SCHEMA_VERSION = 2/, 'Other VNext sports schema v2 must remain unchanged');
assert.match(badminton, /T\.LEGACY_ROOT = 'topkey_badminton_app_ai'/, 'Legacy badminton data root must remain available');

assert.ok(hub.includes('hub-dashboard-reference-h219.css'), 'Current dashboard visual reference stylesheet must remain available during migration');
assert.ok(hub.includes('id="topkey-sports"'), 'The unified sports catalog mount must remain present');

console.log(JSON.stringify({
  status: 'PASS',
  catalogEntries: sportLinks.length,
  badminton: badmintonCard,
  protectedContracts: ['badminton Firebase root', 'badminton schema v3', 'VNext schema v2', 'legacy badminton root'],
  note: 'This is a migration guard, not proof that the full shared runtime has been completed.'
}, null, 2));
