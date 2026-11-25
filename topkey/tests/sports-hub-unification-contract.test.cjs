const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const hub = read('index.html');
const vnext = read('sports/vnext/src/config.js');
const badminton = read('sports/badminton/src/config.js');
const launcher = read('sports/vnext/badminton.html');
const vnextPage = read('sports/vnext/index.html');
const badmintonPage = read('sports/badminton/index.html');
const sharedShell = read('sports/topkey-sports-shell.js');
const shellCss = read('sports/topkey-sports-shell.css');

const sportLinks = [...hub.matchAll(/<a class="sport" href="([^"]+)"[\\s\\S]*?<h3>([^<]+)<\\/h3>/g)]
  .map(([, href, name]) => ({ href: href.replaceAll('&amp;', '&'), name }));

for (const name of ['Cầu lông', 'Bóng đá', 'Bóng chuyền', 'Chạy bộ', 'DIY / Handmade', 'Đá cầu', 'Nấu ăn']) {
  assert.ok(sportLinks.some(item => item.name === name), 'Hub catalog is missing ' + name);
}
const badmintonCard = sportLinks.find(item => item.name === 'Cầu lông');
assert.match(badmintonCard.href, /^\\.\\/sports\\/vnext\\//, 'Badminton must launch through the common sports route');
assert.match(launcher, /sports\\/badminton\\/index\\.html/, 'Badminton adapter must preserve the original engine');

assert.equal(badminton.match(/T\\.ROOT = '([^']+)'/)?.[1], 'topkey_badminton_vnext_2026');
assert.match(badminton, /T\\.SCHEMA_VERSION = 3/);
assert.match(vnext, /T\\.SCHEMA_VERSION = 2/);
assert.match(badminton, /T\\.LEGACY_ROOT = 'topkey_badminton_app_ai'/);
assert.match(vnext, /football:\\{[\\s\\S]*?root:'topkey_football_vnext_2026'/);
assert.match(vnext, /volleyball:\\{[\\s\\S]*?root:'topkey_volleyball_vnext_2026'/);

assert.ok(vnextPage.includes('../topkey-sports-shell.css'), 'VNext must load shared sports shell styles');
assert.ok(badmintonPage.includes('../topkey-sports-shell.css'), 'Badminton must load shared sports shell styles');
assert.ok(vnextPage.includes('../topkey-sports-shell.js'), 'VNext must load shared sports shell');
assert.ok(badmintonPage.includes('../topkey-sports-shell.js'), 'Badminton must load shared sports shell');
for (const key of ['football', 'badminton', 'volleyball', 'running', 'handmade', 'shuttle', 'cooking']) {
  assert.ok(sharedShell.includes("key: '" + key + "'"), 'Shared shell missing ' + key);
}
assert.ok(sharedShell.includes("setAttribute('aria-label', 'Điều hướng các bộ môn TOPKEY')"));
assert.ok(sharedShell.includes("setAttribute('aria-label', 'Chuyển bộ môn')"));
assert.ok(sharedShell.includes("location.hash.startsWith('#spectator')"));
assert.ok(sharedShell.includes("location.hash.startsWith('#register')"));
assert.ok(shellCss.includes('@media (max-width: 640px)'));
assert.ok(hub.includes('id="topkey-sports"'));

console.log(JSON.stringify({
  status: 'PASS',
  catalogEntries: sportLinks.length,
  badmintonLaunch: badmintonCard.href,
  protectedContracts: ['badminton Firebase root', 'badminton schema v3', 'legacy badminton root', 'VNext schema v2'],
  sharedShellSports: 7
}, null, 2));
