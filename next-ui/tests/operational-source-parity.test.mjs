import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = readFileSync(new URL('../../topkey/sports/vnext/src/config.js', import.meta.url), 'utf8');
const auth = readFileSync(new URL('../../topkey/sports/vnext/src/auth.js', import.meta.url), 'utf8');
const legacyFirebase = readFileSync(new URL('../../topkey/sports/vnext/src/firebase.js', import.meta.url), 'utf8');
const firebaseAdapter = readFileSync(new URL('../src/lib/firebase.ts', import.meta.url), 'utf8');
const entry = readFileSync(new URL('../../topkey/sports/vnext/index.html', import.meta.url), 'utf8');
const domain = readFileSync(new URL('../src/lib/domain.ts', import.meta.url), 'utf8');

const sports = ['football', 'volleyball', 'running', 'handmade', 'shuttle', 'cooking', 'badminton'];

test('new UI sport catalog and RTDB adapter remain aligned with operational source of truth', () => {
  for (const key of sports) {
    assert.ok(config.includes(key + ":{...common,key:'" + key + "'"), 'Missing operational config for ' + key);
    assert.ok(config.includes("root:'topkey_" + key + "_vnext_2026'"), 'Missing operational root for ' + key);
    assert.ok(domain.includes("key:'" + key + "'"), 'Missing UI catalog entry for ' + key);
    assert.ok(firebaseAdapter.includes(key + ":'topkey_" + key + "_vnext_2026'"), 'Missing UI RTDB adapter root for ' + key);
  }
});

test('sport rule modes and badminton match profiles stay in the operational config', () => {
  for (const mode of ["mode:'score'", "mode:'sets'", "mode:'time'", "mode:'judged'"]) {
    assert.ok(config.includes(mode), 'Missing sport engine mode ' + mode);
  }
  for (const profile of ['BEST_OF_3_21_SWITCH_10', 'SETS_21_21_15_SWITCH_7', 'BEST_OF_3_15_SWITCH_7']) {
    assert.ok(config.includes(profile), 'Missing badminton format profile ' + profile);
  }
  assert.ok(config.includes("engineAdapter:{kind:'legacy-badminton-domain'"));
});

test('authentication remains delegated to shared TOPKEY auth and platform role policy', () => {
  assert.ok(auth.includes('TopkeySharedAuth.create(T)'));
  assert.ok(config.includes('T.ROLES=window.TopkeyPlatform.policy.roles'));
  assert.ok(entry.includes('topkey-platform-core.js'));
  assert.ok(entry.includes('topkey-shared-auth.js'));
});

test('operational runtime keeps its existing Firebase paths, offline queue and audit boundary', () => {
  assert.ok(legacyFirebase.includes("return `${T.ROOT}/tournaments/${this.tid}${path ? '/' + path.replace(/^\\//, '') : ''}`"));
  assert.ok(legacyFirebase.includes('queueMulti(updates'));
  assert.ok(legacyFirebase.includes('flushQueue('));
  assert.ok(legacyFirebase.includes('async audit('));
  assert.ok(legacyFirebase.includes('listenAuthUsers('));
});
