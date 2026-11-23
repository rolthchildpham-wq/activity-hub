import test from 'node:test';import assert from 'node:assert/strict';
// Source-level domain contract tests: online Firebase/browser checks are separate.
const fs=await import('node:fs');
const src=fs.readFileSync(new URL('../src/lib/domain.ts',import.meta.url),'utf8');
test('all eight sport routes are retained',()=>{for(const key of ['football','badminton','volleyball','running','handmade','vlog','shuttle','cooking'])assert.match(src,new RegExp("key:'"+key+"'"))});
test('score completion does not count scheduled matches',()=>{assert.match(src,/completed\.has\(m\.status\|\|''\)/);assert.match(src,/a\.started&&!a\.finished/)});
test('testlab is distinguishable',()=>assert.match(src,/tid\.startsWith\('__testlab_'\)/));
