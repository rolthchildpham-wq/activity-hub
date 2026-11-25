const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const entry = path.join(root, 'index.html');
const html = fs.readFileSync(entry, 'utf8');
const ids = new Set([...html.matchAll(/\\bid=["']([^"']+)["']/g)].map(([, id]) => id));
const failures = [];
const checked = [];

function localTarget(raw, kind) {
  const value = raw.trim();
  if (!value || value === '#' || /^(?:https?:|\\/\\/|data:|blob:|javascript:|mailto:|tel:)/i.test(value)) return;
  if (value.startsWith('#')) {
    const id = decodeURIComponent(value.slice(1));
    if (kind === 'href' && !ids.has(id)) failures.push(`Missing in-page target #${id}`);
    return;
  }
  const url = new URL(value, 'https://topkey.invalid/index.html');
  const pathname = decodeURIComponent(url.pathname);
  const target = path.resolve(root, '.' + pathname);
  if (!target.startsWith(root + path.sep) && target !== entry) {
    failures.push(`Path escapes Hub root: ${value}`);
    return;
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    failures.push(`Missing local ${kind}: ${value} -> ${path.relative(root, target)}`);
    return;
  }
  checked.push({ kind, value });
}

for (const [, kind, value] of html.matchAll(/\\b(href|src)=["']([^"']+)["']/gi)) {
  localTarget(value, kind.toLowerCase());
}

const catalog = [...html.matchAll(/<a class="sport" href="([^"]+)"[\\s\\S]*?<h3>([^<]+)<\\/h3>/g)]
  .map(([, href, name]) => ({ href: href.replaceAll('&amp;', '&'), name }));
assert.ok(catalog.length >= 8, `Expected 7 core sports plus Vlog, found ${catalog.length}`);
for (const name of ['Bóng đá', 'Cầu lông', 'Bóng chuyền', 'Chạy bộ', 'DIY / Handmade', 'Đá cầu', 'Nấu ăn']) {
  assert.ok(catalog.some(item => item.name === name), `Missing catalog entry: ${name}`);
}
assert.ok(catalog.some(item => item.name === 'Cầu lông' && item.href.includes('/sports/vnext/badminton.html')),
  'Badminton must enter through the shared sport launcher');
assert.ok(ids.has('topkey-home') && ids.has('topkey-sports') && ids.has('executive-dashboard') && ids.has('system-admin-launch'),
  'Primary Hub navigation targets must exist');

if (failures.length) {
  console.error(failures.join('\\n'));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: 'PASS',
    localReferencesChecked: checked.length,
    catalogEntries: catalog.length,
    inPageTargets: ['topkey-home', 'topkey-sports', 'executive-dashboard', 'system-admin-launch']
  }, null, 2));
}
