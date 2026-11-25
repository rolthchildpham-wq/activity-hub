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
