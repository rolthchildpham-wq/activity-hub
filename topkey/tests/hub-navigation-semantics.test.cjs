const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const nav = html.match(/<nav class="tk210-nav"[\s\S]*?<\/nav>/)?.[0] || '';
assert.ok(nav, 'Primary navigation must exist');
const links = [...nav.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
  .map(([, href, body]) => ({ href, label: body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() }));
const expected = [
  ['#topkey-home', 'Trang chủ'],
  ['#topkey-sports', 'Giải đấu'],
  ['#executive-dashboard', 'Thống kê'],
  ['#system-admin-launch', 'Quản trị']
];
for (const [href, label] of expected) {
  assert.ok(links.some(link => link.href === href && link.label.includes(label)),
    'Expected navigation item "' + label + '" to target ' + href);
}
assert.ok(!links.some(link => link.label.includes('Thông báo')),
  'Do not label the administration panel as notifications');
console.log(JSON.stringify({status:'PASS', navigationItems:links}, null, 2));
