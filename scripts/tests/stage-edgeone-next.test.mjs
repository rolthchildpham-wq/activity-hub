import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..');
const staged=join(root,'dist-edgeone');
const configFile=join(staged,'edgeone.json');

test('legacy production entries are preserved by staging',()=>{
 for(const file of [
  'index.html','sports/badminton/index.html','sports/vnext/index.html',
  'topkey-shared-auth.js','firebase.database.rules.json'
 ])assert.ok(existsSync(join(staged,file)),file);
});
test('/next has a real SvelteKit page, fallback and JS assets',()=>{
 for(const file of ['next/index.html','next/200.html','next/_app']){
  assert.ok(existsSync(join(staged,file)),file);
 }
 const entry=readFileSync(join(staged,'next/index.html'),'utf8');
 assert.match(entry,/\/next\//);
});
test('deep links rewrite only next workspace paths; old sports routes unaffected',()=>{
 const config=JSON.parse(readFileSync(configFile,'utf8'));
 const expected=[
  {source:'/next/sports',destination:'/next/index.html'},
  {source:'/next/sports/*',destination:'/next/index.html'}
 ];
 for(const item of expected)assert.ok(config.rewrites.some(r=>r.source===item.source&&r.destination===item.destination));
 assert.ok(!config.rewrites.some(r=>r.source==='/*'));
 const legacy=readFileSync(join(staged,'sports/badminton/index.html'),'utf8');
 assert.ok(legacy.includes('TOPKEY BADMINTON'));
});
test('no runtime write permissions or Firebase rule content changes',()=>{
 const a=readFileSync(join(root,'topkey/firebase.database.rules.json'),'utf8');
 const b=readFileSync(join(staged,'firebase.database.rules.json'),'utf8');
 assert.equal(b,a);
});
