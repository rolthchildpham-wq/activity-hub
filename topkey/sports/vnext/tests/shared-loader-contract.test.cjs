'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('badminton enters the shared VNext workspace and shared runtime loader', () => {
  const html = read('topkey/sports/vnext/index.html');
  assert.match(html, /\.\/production-loader\.js\?v=h218-sports-redesign-20261124/);
  assert.doesNotMatch(html, /\.\.\/badminton\/production-loader\.js/);
  assert.match(html, /tài khoản và phân quyền Firebase của TOPKEY Sports Hub/);
  assert.doesNotMatch(html, /Topkey Badminton VNext/);
  const legacyRoute = read('topkey/sports/badminton/index.html');
  assert.match(legacyRoute, /\.\.\/vnext\/index\.html/);
  assert.match(legacyRoute, /query\.set\('sport', 'badminton'\)/);
});

test('shared loader isolates legacy compatibility modules behind explicit feature groups', () => {
  const loader = read('topkey/sports/vnext/production-loader.js');
  assert.match(loader, /scope: 'shared-vnext'/);
  assert.match(loader, /SHARED_RUNTIME_FALLBACK = \['\.\.\/\.\.\/h114-runtime-fixes\.js'\]/);
  assert.match(loader, /const FEATURES = \{/);
  assert.match(loader, /reports: \[/);
  assert.match(loader, /badmintonPerformance: \[/);
  assert.match(loader, /params\.get\('sport'\) === 'badminton'[\s\S]*?FEATURES\.badmintonPerformance/);
  assert.match(loader, /params\.get\('testlab'\) === '1'[\s\S]*?loadFeature\('reports'\)/);
  assert.doesNotMatch(loader, /BADMINTON_RUNTIME/);
  const html = read('topkey/sports/vnext/index.html');
  assert.doesNotMatch(html, /upgrade122-hotfix|testlab122|upgrade121/);
  assert.doesNotMatch(html, /\.\.\/badminton\/production-loader\.js/);
});

test('legacy loader is a compatibility bridge, not a second runtime', () => {
  const loader = read('topkey/sports/badminton/production-loader.js');
  assert.match(loader, /\.\.\/vnext\/production-loader\.js/);
  assert.doesNotMatch(loader, /upgrade122-hotfix/);
});

test('release version is shared while badminton data schema remains version 3', () => {
  const contract = read('topkey/sports/vnext/runtime-contract.js');
  const config = read('topkey/sports/vnext/src/config.js');
  const release = JSON.parse(read('topkey/release.json'));
  assert.match(contract, /dataSchemaVersion/);
  assert.equal(release.releaseId, 'H218');
  assert.equal(release.badminton, release.vnext);
  assert.match(config, /badminton:\{\.\.\.common,key:'badminton',schemaVersion:3/);
  assert.match(config, /kind:'shared-vnext-domain',entry:'\.\/index\.html\?sport=badminton',workspace:'shared-vnext'/);
  assert.doesNotMatch(config, /legacy-badminton-domain|preserveExistingEngine|\.\.\/badminton\/index\.html/);
  const bundle = read('topkey/sports/vnext/h97-vnext.bundle.js');
  assert.match(bundle, /kind:'shared-vnext-domain'/);
  assert.doesNotMatch(bundle, /legacy-badminton-domain|preserveExistingEngine/);
});
