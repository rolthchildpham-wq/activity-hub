import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const rules=JSON.parse(readFileSync(new URL('../../topkey/firebase.database.rules.json',import.meta.url),'utf8')).rules;
const sports=['badminton','football','volleyball','running','handmade','shuttle','cooking'];

test('Firebase root denies anonymous/global reads and writes by default',()=>{
 assert.equal(rules['.read'],false);
 assert.equal(rules['.write'],false);
});
test('each existing sport separates finance reads and writes',()=>{
 for(const sport of sports){
  const branch=rules['topkey_'+sport+'_vnext_2026']?.tournaments?.$tid?.finance;
  assert.ok(branch,sport+' finance branch missing');
  assert.equal(typeof branch['.read'],'string',sport+' read');
  assert.equal(typeof branch['.write'],'string',sport+' write');
  assert.match(branch['.read'],/permissions\/modules\/finance/,sport+' read scope');
  assert.match(branch['.write'],/auth/,sport+' write access');
 }
});
test('rules contain schema validation but must not be mistaken for complete field parity',()=>{
 const text=JSON.stringify(rules);
 assert.ok(text.includes('".validate"'));
 assert.ok(text.includes('sportScope'));
});
