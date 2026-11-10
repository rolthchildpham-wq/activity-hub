const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');

const root = path.resolve(__dirname, '..');
const CACHE = 'u122h96-20261108';
const VERSION = '2026.11.08-vnext-upgrade122-hotfix96-header-reference-layout';
const run = file => {
  const result = spawnSync(process.execPath, [file], {cwd: root, encoding: 'utf8'});
  if (result.status !== 0) throw new Error(`${file}\n${result.stdout}${result.stderr}`);
};

[
  'sports/vnext/tests/h95_queue_singleflight_vm.js',
  'sports/vnext/tests/h95_subscription_render_vm.js',
  'sports/vnext/tests/h95_large_data_render_vm.js',
  'tests/h95_runtime_lifecycle.js'
].forEach(run);

for (const file of ['build.json', 'release.json', 'sports/badminton/build.json', 'sports/vnext/build.json']) {
  const data = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  assert.strictEqual(data.cacheTag, CACHE, `${file} cache tag`);
  assert.strictEqual(data.version, VERSION, `${file} version`);
}

const vnextIndex = fs.readFileSync(path.join(root, 'sports/vnext/index.html'), 'utf8');
const badmintonIndex = fs.readFileSync(path.join(root, 'sports/badminton/index.html'), 'utf8');
assert(vnextIndex.includes('../../runtime-lifecycle.js?v=' + CACHE), 'VNext lifecycle runtime missing');
assert(vnextIndex.includes('./src/core/performance-runtime.js?v=' + CACHE), 'VNext performance runtime missing');
assert(badmintonIndex.includes('../../runtime-lifecycle.js?v=' + CACHE), 'Badminton lifecycle runtime missing');

const activeShared = [60, 64, 65, 66, 80];
for (const hotfix of activeShared) {
  const vnext = fs.readFileSync(path.join(root, `sports/vnext/src/upgrade122-hotfix${hotfix}.js`));
  const badminton = fs.readFileSync(path.join(root, `sports/badminton/upgrade122-hotfix${hotfix}.js`));
  assert.strictEqual(crypto.createHash('sha256').update(vnext).digest('hex'), crypto.createHash('sha256').update(badminton).digest('hex'), `Hotfix${hotfix} parity`);
  assert(!vnext.toString().includes('setInterval('), `Hotfix${hotfix} must not use perpetual polling`);
}
assert(!fs.readFileSync(path.join(root, 'sports/vnext/src/upgrade122-hotfix58.js'), 'utf8').includes('setInterval('), 'Hotfix58 must not use perpetual polling');

console.log('H95_PERFORMANCE_ACCEPTANCE_OK');
