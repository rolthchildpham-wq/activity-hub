import test from 'node:test';
import assert from 'node:assert/strict';
import {uiRepositories,uiRepositoryGroups} from '../src/lib/features/ui-settings/catalog.ts';

test('UI repository catalog has unique IDs and valid GitHub links',()=>{
 assert.equal(new Set(uiRepositories.map(item=>item.id)).size,uiRepositories.length);
 for(const item of uiRepositories){
  assert.match(item.url,/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
  assert.ok(item.repo.includes('/'));
  assert.ok(['components','motion','visual'].includes(item.group));
  assert.ok(['svelte','react','framework','optional'].includes(item.fit));
 }
});

test('repository catalog groups cover every listed repository',()=>{
 const groups=new Set(uiRepositoryGroups.map(group=>group.id));
 assert.deepEqual([...new Set(uiRepositories.map(item=>item.group))].sort(),[...groups].sort());
});

test('React-only packages are not enabled by default in the Svelte workspace',()=>{
 for(const item of uiRepositories.filter(item=>item.fit==='react'))assert.equal(item.enabledByDefault,false,item.id);
});

test('repository catalog includes requested design systems, motion and visual sources',()=>{
 const ids=new Set(uiRepositories.map(item=>item.id));
 for(const id of ['shadcn-ui','tailwindcss','daisyui','headlessui','radix','motion','gsap','auto-animate','lucide','lucide-react','threejs'])assert.ok(ids.has(id),id);
});

import {readFileSync} from 'node:fs';
const settingsPage=readFileSync(new URL('../src/routes/settings/+page.svelte',import.meta.url),'utf8');
const firebaseRules=JSON.parse(readFileSync(new URL('../../topkey/firebase.database.rules.json',import.meta.url),'utf8')).rules;

test('admin UI preferences are shared through the existing protected TOPKEY system settings branch',()=>{
 assert.ok(settingsPage.includes("topkey_badminton_vnext_2026/uiSettings/uiux"));
 assert.ok(settingsPage.includes("await set(ref(client().db"));
 assert.ok(settingsPage.includes("modules.systemAdmin==='edit'"));
 assert.ok(settingsPage.includes("details['systemAdmin:access']==='edit'"));
 const settings=firebaseRules.topkey_badminton_vnext_2026.uiSettings;
 assert.match(settings['.read'],/permissions\/modules\/systemAdmin/);
 assert.match(settings['.write'],/permissions\/modules\/systemAdmin/);
 assert.match(settings['.write'],/role/);
 assert.ok(settings.uiux['.validate'].includes('updatedBy'));
 assert.ok(settings.uiux['.validate'].includes('updatedAt'));
});

test('UI preferences use only the protected system settings branch and read the existing admin profile',()=>{
 assert.ok(!settingsPage.includes("topkey_multisport_app/uiSettings"));
 assert.ok(settingsPage.includes("topkey_badminton_vnext_2026/users/"));
});
