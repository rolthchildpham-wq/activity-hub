const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const hub = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const vnext = fs.readFileSync(path.join(root, 'sports/vnext/index.html'), 'utf8');
const badmintonEntry = fs.readFileSync(path.join(root, 'sports/badminton/index.html'), 'utf8');
const badmintonAdapter = fs.readFileSync(path.join(root, 'sports/vnext/badminton.html'), 'utf8');
const shellAsset = '../topkey-sports-shell.css?v=ecc-sports-shell-20261125';

const catalog = [...hub.matchAll(/<a class="sport" href="([^"]+)"[\s\S]*?<h3>([^<]+)<\/h3>/g)]
  .map(([, href, name]) => ({ href: href.replaceAll('&amp;', '&'), name }));

const requiredSports = [
  ['Bóng đá', 'sport=football'],
  ['Cầu lông', '/sports/vnext/badminton.html'],
  ['Bóng chuyền', 'sport=volleyball'],
  ['Chạy bộ', 'sport=running'],
  ['DIY / Handmade', 'sport=handmade'],
  ['Đá cầu', 'sport=shuttle'],
  ['Nấu ăn', 'sport=cooking'],
  ['Cuộc thi Vlog 2026', '/sports/diy-vlog/index.html']
];

for (const [name, route] of requiredSports) {
  const item = catalog.find(entry => entry.name === name);
  assert.ok(item, 'Sports Hub catalog is missing ' + name);
  assert.ok(item.href.includes(route), name + ' must keep its canonical entry route');
}
assert.equal(catalog.length, 8, 'Hub catalog must contain seven sports plus Vlog');

assert.ok(vnext.includes(shellAsset), 'VNext workspace must load the shared ECC sport shell stylesheet');
assert.ok(badmintonEntry.includes(shellAsset), 'Badminton workspace must load the same shared ECC sport shell stylesheet');

assert.match(badmintonAdapter, /query\.set\('sport',\s*'badminton'\)/,
  'Badminton entry must select the badminton sport inside the shared VNext workspace');
assert.match(badmintonAdapter, /new URL\('\.\/index\.html',\s*location\.href\)/,
  'Badminton entry must stay within the VNext workspace route');
assert.doesNotMatch(badmintonAdapter, /location\.replace\([^)]*\.\.\/badminton\/index\.html/,
  'Badminton entry must not redirect to the standalone legacy screen');
assert.match(badmintonAdapter, /target\.hash\s*=\s*location\.hash/,
  'Badminton entry must preserve public route hashes');

const config = fs.readFileSync(path.join(root, 'sports/vnext/src/config.js'), 'utf8');
assert.match(config, /badminton:\{[\s\S]*?root:'topkey_badminton_vnext_2026'/,
  'Badminton must use its existing Firebase VNext root');
assert.match(config, /legacyEngineRoot:'topkey_badminton_vnext_2026'/,
  'Legacy badminton data root must remain unchanged');
assert.match(config, /preserveExistingEngine:true/,

  'The retained badminton domain engine must be declared as preserved');
for (const format of ['BEST_OF_3_21_SWITCH_10','SETS_21_21_15_SWITCH_7','BEST_OF_3_15_SWITCH_7']) {
  assert.ok(config.includes(format), 'Missing badminton format profile ' + format);
}

const appSource = fs.readFileSync(path.join(root, 'sports/vnext/src/app.js'), 'utf8');
assert.match(appSource, /select\.name='badmintonFormatProfile'/);
const bundleSource = fs.readFileSync(path.join(root, 'sports/vnext/h97-vnext.bundle.js'), 'utf8');
assert.match(bundleSource, /select\.name='badmintonFormatProfile'/);
assert.match(bundleSource, /rules\.setPoints=\[\.\.\.selectedProfile\.points\]/);
assert.match(appSource, /rules\.setPoints=\[\.\.\.selectedProfile\.points\]/);
assert.match(appSource, /rules\.changeEndsAt=\[\.\.\.selectedProfile\.changeEndsAt\]/);
assert.match(appSource, /set\.endsChanged=true/);

console.log(JSON.stringify({
  status: 'PASS',
  catalogEntries: catalog.length,
  sportEntries: requiredSports.length - 1,
  sharedShellStylesheet: shellAsset,
  badmintonEngine: 'legacy engine source retained; shared VNext entry enabled',
  queryAndHashForwarding: 'verified'
}, null, 2));
