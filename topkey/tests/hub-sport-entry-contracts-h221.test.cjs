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

assert.match(badmintonAdapter, /new URL\('\.\.\/badminton\/index\.html',\s*location\.href\)/,
  'Badminton adapter must forward to the retained production badminton engine');
assert.match(badmintonAdapter, /query\.delete\('sport'\)/,
  'Badminton adapter must remove only the routing selector before forwarding');
assert.match(badmintonAdapter, /target\.search\s*=\s*query\.toString\(\)/,
  'Badminton adapter must preserve remaining query parameters');
assert.match(badmintonAdapter, /target\.hash\s*=\s*location\.hash/,
  'Badminton adapter must preserve public route hashes');

console.log(JSON.stringify({
  status: 'PASS',
  catalogEntries: catalog.length,
  sportEntries: requiredSports.length - 1,
  sharedShellStylesheet: shellAsset,
  badmintonEngine: 'retained behind explicit route adapter',
  queryAndHashForwarding: 'verified'
}, null, 2));
