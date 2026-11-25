import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const rules=JSON.parse(readFileSync(new URL('../../topkey/firebase.database.rules.json',import.meta.url),'utf8')).rules;
const settings=rules.topkey_badminton_vnext_2026.uiSettings;
test('shared UI preferences have a dedicated protected Firebase branch',()=>{
 assert.ok(settings);
 assert.match(settings['.read'],/permissions\/modules\/systemAdmin/);
 assert.match(settings['.write'],/permissions\/modules\/systemAdmin/);
 assert.match(settings['.write'],/role/);
 assert.ok(settings.uiux['.validate'].includes('updatedBy'));
 assert.ok(settings.uiux['.validate'].includes('updatedAt'));
});
test('shared UI settings are not anonymously writable',()=>{
 assert.match(settings['.write'],/^auth != null/);
 assert.doesNotMatch(settings['.write'],/auth == null/);
});
