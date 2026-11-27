const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const nav = html.match(/<nav class="tk210-nav"[\s\S]*?<\/nav>/)?.[0] || '';
assert.ok(nav, 'Primary navigation must exist');
const links = [...nav.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
  .map(([, href, body]) => ({ href, label: body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() }));
for (const [href, label] of [['#topkey-home','Trang chủ'],['#topkey-sports','Giải đấu'],['#executive-dashboard','Thống kê'],['#system-admin-launch','Quản trị']]) {
  assert.ok(links.some(link => link.href === href && link.label.includes(label)), 'Wrong nav item: ' + label);
}
assert.ok(!links.some(link => link.label.includes('Thông báo')), 'Admin destination must not be labeled notifications');
console.log(JSON.stringify({status:'PASS',navigationItems:links}, null, 2));

const navRuntime=fs.readFileSync(path.resolve(__dirname,'../hub-workspace-nav-h231.js'),'utf8');
const navCss=fs.readFileSync(path.resolve(__dirname,'../hub-workspace-nav-h231.css'),'utf8');
for(const token of ['topkey-home','topkey-sports','executive-dashboard','system-admin-launch','aria-hidden','aria-current','hub-workspace-hidden','history.pushState','hashchange','popstate'])assert.ok(navRuntime.includes(token),'Missing single-view navigation: '+token);
assert.ok(navCss.includes('display:none!important'),'Inactive Hub views must be hidden');
assert.ok(navRuntime.includes("if(visible)el.classList.remove('hidden')"),'Dashboard must be revealed only when selected');
console.log('Hub single-view navigation contract passed.');
