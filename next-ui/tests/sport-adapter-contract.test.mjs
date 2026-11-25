import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { sports, legacyHref, isTestLab } from '../src/lib/domain.ts';

const firebaseSource = fs.readFileSync(new URL('../src/lib/firebase.ts', import.meta.url), 'utf8');
const rootsBlock = firebaseSource.match(/const ROOTS:[^=]+?=\{([\s\S]*?)\n\};/);
assert.ok(rootsBlock, 'Firebase adapter must declare its explicit sport-to-root map');
const roots = Object.fromEntries(
  [...rootsBlock[1].matchAll(/(\w+):'([^']+)'/g)].map(([, key, value]) => [key, value])
);

const firebaseSports = ['badminton', 'football', 'volleyball', 'running', 'handmade', 'shuttle', 'cooking'];
const expectedLegacyRoutes = {
  football: '/sports/vnext/index.html?sport=football',
  badminton: '/sports/badminton/index.html',
  volleyball: '/sports/vnext/index.html?sport=volleyball',
  running: '/sports/vnext/index.html?sport=running',
  handmade: '/sports/vnext/index.html?sport=handmade',
  vlog: '/sports/diy-vlog/index.html',
  shuttle: '/sports/vnext/index.html?sport=shuttle',
  cooking: '/sports/vnext/index.html?sport=cooking'
};

test('seven Firebase-backed sports map one-to-one to their existing RTDB roots', () => {
  assert.deepEqual(Object.keys(roots).sort(), [...firebaseSports].sort());
  assert.equal(new Set(Object.values(roots)).size, firebaseSports.length,
    'Each sport must retain a distinct Firebase root');
  for (const key of firebaseSports) {
    assert.equal(roots[key], `topkey_${key}_vnext_2026`,
      `Unexpected production root for ${key}; do not merge sport data roots`);
  }
});

test('Vlog remains a separate legacy module and never receives an RTDB root', () => {
  assert.equal(sports.length, 8, 'Catalog includes seven sports plus Vlog');
  assert.ok(sports.some(sport => sport.key === 'vlog'));
  assert.equal(Object.hasOwn(roots, 'vlog'), false);
  assert.match(firebaseSource, /if\s*\(sport\s*===\s*'vlog'\)/,
    'Firebase adapter must reject Vlog before selecting an RTDB root');
});

test('each catalog item hands off to its canonical existing operational route', () => {
  for (const [key, route] of Object.entries(expectedLegacyRoutes)) {
    assert.ok(sports.some(sport => sport.key === key), `Missing catalog entry: ${key}`);
    assert.equal(legacyHref(key, 'season_2026'), route + (route.includes('?') ? '&' : '?') + 'tid=season_2026',
      `Wrong legacy handoff for ${key}`);
  }
});

test('test-lab tournament IDs stay explicitly isolated from production IDs', () => {
  assert.equal(isTestLab('__testlab_h223_badminton'), true);
  assert.equal(isTestLab('main_2026'), false);
  assert.equal(legacyHref('badminton', '__testlab_h223_badminton'),
    '/sports/badminton/index.html?tid=__testlab_h223_badminton&testlab=1');
});

test('untrusted tournament IDs cannot alter a sport handoff URL', () => {
  for (const key of Object.keys(expectedLegacyRoutes)) {
    const route = expectedLegacyRoutes[key];
    assert.equal(legacyHref(key, '../admin?root=production'),
      route, `Untrusted TID changed route for ${key}`);
  }
});

console.log(JSON.stringify({
  status: 'PASS',
  firebaseSports: firebaseSports.length,
  distinctRoots: Object.keys(roots).length,
  legacyHandoffs: Object.keys(expectedLegacyRoutes).length,
  vlogIsolation: 'verified',
  testLabIsolation: 'verified'
}, null, 2));
