import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const h201=fs.readFileSync(new URL('../sport-dashboard-h201.js',import.meta.url),'utf8');
const h202=fs.readFileSync(new URL('../sports/vnext/src/dashboard-truth-h202.js',import.meta.url),'utf8');

test('placeholder and missing KPI values must not become zero',()=>{
  assert.match(h201,/\^\\d\+\$/);
  assert.match(h201,/values\.some\(value=>value===null\)/);
  assert.match(h201,/Đang tải dữ liệu giải đấu/);
});
test('already loaded tournament state prevents false loading',()=>{
  assert.match(h202,/loaded\.has\('teams'\)\|\|teams\.length>0/);
  assert.match(h202,/loaded\.has\('matches'\)\|\|matches\.length>0/);
});
test('live sessions without match ID do not create phantom match',()=>{
  assert.match(h202,/\.map\(m=>m\.id\)\.filter\(Boolean\)/);
  assert.match(h202,/x\.started&&!x\.finished&&x\.matchId/);
});
test('enhancements cannot change tournament data or Firebase writes',()=>{
  for (const src of [h201,h202]) {
    assert.doesNotMatch(src,/firebase\.database\(\)\.ref\(/);
    assert.doesNotMatch(src,/queueMulti\(/);
  }
});
