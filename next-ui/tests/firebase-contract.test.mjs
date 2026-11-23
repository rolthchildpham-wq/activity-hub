import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/lib/firebase.ts',import.meta.url),'utf8');
const domain=readFileSync(new URL('../src/lib/domain.ts',import.meta.url),'utf8');

test('RTDB subscriptions target permitted child branches, not parent',()=>{
 assert.match(source,/const BRANCHES=\['config','teams','matches','activeMatches'\]/);
 assert.match(source,/ROOTS\[sport\]\+'\/tournaments\/'\+tid\+'\/'\+branch/);
 assert.doesNotMatch(source,/onValue\(ref\(db,ROOTS\[sport\]\+'\/tournaments\/'\+tid\)/);
});
test('show KPI only after all initial snapshots are received',()=>{
 assert.match(source,/received\.size!==BRANCHES\.length/);
 assert.match(source,/onData\(\{\.\.\.next\}\)/);
});
test('timeout and errors do not silently turn missing data into zeros',()=>{
 assert.match(source,/INITIAL_LOAD_TIMEOUT_MS=10_000/);
 assert.match(source,/fail\(new Error\('Quá thời gian đồng bộ:/);
});
test('listeners are disposed after branch switch or permission failure',()=>{
 assert.match(source,/off\.forEach\(unsubscribe=>unsubscribe\(\)\)/);
 assert.match(source,/const fail=\(error:Error\)=>/);
});
test('operational links leave /next without inventing routes',()=>{
 assert.match(domain,/return '\.\.\/'\+sport\.legacy/);
});
test('all seven RTDB sport roots retain their schema paths',()=>{
 for(const sport of ['badminton','football','volleyball','running','handmade','shuttle','cooking'])
  assert.ok(source.includes(sport+":'topkey_"),sport);
});
