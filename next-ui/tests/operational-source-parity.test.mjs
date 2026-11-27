import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = readFileSync(new URL('../../topkey/sports/vnext/src/config.js', import.meta.url), 'utf8');
const auth = readFileSync(new URL('../../topkey/sports/vnext/src/auth.js', import.meta.url), 'utf8');
const firebase = readFileSync(new URL('../../topkey/sports/vnext/src/firebase.js', import.meta.url), 'utf8');
const entry = readFileSync(new URL('../../topkey/sports/vnext/index.html', import.meta.url), 'utf8');
const domain = readFileSync(new URL('../src/lib/domain.ts', import.meta.url), 'utf8');

const sports = ['football', 'volleyball', 'running', 'handmade', 'shuttle', 'cooking', 'badminton'];

test('new UI sport catalog and RTDB adapter remain aligned with operational source of truth', () => {
  for (const key of sports) {
    assert.match(config, new RegExp(key + ':\\{[^}]*root:\\x27topkey_' + key + '_vnext_2026\\x27'));
    assert.match(domain, new RegExp("key:'" + key + "'"));
    assert.match(firebase, new RegExp(key + ":'topkey_" + key + "_vnext_2026'"));
  }
});

test('sport rule modes and badminton match profiles stay in the operational config', () => {
  for (const mode of ["mode:'score'", "mode:'sets'", "mode:'time'", "mode:'judged'"]) {
    assert.ok(config.includes(mode), 'Missing sport engine mode ' + mode);
  }
  for (const profile of ['BEST_OF_3_21_SWITCH_10', 'SETS_21_21_15_SWITCH_7', 'BEST_OF_3_15_SWITCH_7']) {
    assert.ok(config.includes(profile), 'Missing badminton format profile ' + profile);
  }
  assert.match(config, /engineAdapter:\\{kind:'legacy-badminton-domain'/);
});

test('authentication remains delegated to shared TOPKEY auth and platform role policy', () => {
  assert.match(auth, /TopkeySharedAuth\\?\\.create/);
  assert.match(config, /T\\.ROLES=window\\.TopkeyPlatform\\.policy\\.roles/);
  assert.match(entry, /topkey-platform-core\\.js/);
  assert.match(entry, /topkey-shared-auth\\.js/);
});

test('operational runtime keeps its existing Firebase paths, offline queue and audit boundary', () => {
  assert.match(firebase, /path\\(path = ''\\) \\{ return \`\\$\\{T\\.ROOT\\}\\/tournaments\\/\\$\\{this\\.tid\\}/);
  assert.match(firebase, /queueMulti\\(updates/);
  assert.match(firebase, /flushQueue\\(/);
  assert.match(firebase, /async audit\\(/);
  assert.match(firebase, /listenAuthUsers\\(/);
});
