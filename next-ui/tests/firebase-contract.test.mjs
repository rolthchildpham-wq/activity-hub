import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../src/lib/firebase.ts',import.meta.url),'utf8');
const domain=readFileSync(new URL('../src/lib/domain.ts',import.meta.url),'utf8');

test('RTDB reads scoped branches, not inaccessible tournament parent',()=>{
 assert.match(source,/const branches=\['config','teams','matches','activeMatches'\]/);
 assert.match(source,/root\+'\/tournaments\/'\+tid\+'\/'\+branch/);
 assert.doesNotMatch(source,/onValue\(ref\(db,root\+'\/tournaments\/'\+tid\)/);
});
test('wait for four initial snapshots before showing loaded KPI',()=>{
 assert.match(source,/arrived\.size===branches\.length/);
});
test('unsubscribe all Firebase listeners when changing sport or TID',()=>{
 assert.match(source,/subscriptions\.forEach\(off=>off\(\)\)/);
});
test('new sports links leave the /next application base',()=>{
 assert.match(domain,/return '\.\.\/'\+sports\.find/);
});
test('legacy data roots stay explicitly mapped for each sport',()=>{
 for(const sport of ['badminton','football','volleyball','running','handmade','shuttle','cooking'])
  assert.ok(source.includes(sport+":'topkey_"),sport);
});
