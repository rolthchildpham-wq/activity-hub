import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';

const root=resolve(import.meta.dirname,'../..');
const staged=mkdtempSync(join(tmpdir(),'topkey-edgeone-stage-'));
const configFile=join(staged,'edgeone.json');
test.after(()=>rmSync(staged,{recursive:true,force:true}));

// Recreate the artifact from this checkout/build instead of trusting a stale
// dist-edgeone directory left by another workflow step or local cache.
execFileSync(process.execPath,[join(root,'scripts/stage-edgeone-next.mjs'),staged],{cwd:root,stdio:'pipe'});

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
 for(const item of expected)assert.ok(config.rewrites.some(r=>r.source===item.source&&r.destination===item.destination),`Missing rewrite ${item.source} -> ${item.destination}; found ${JSON.stringify(config.rewrites)}`);
 assert.ok(!config.rewrites.some(r=>r.source==='/*'),`Broad catch-all rewrite would hijack legacy routes: ${JSON.stringify(config.rewrites)}`);
 const legacy=readFileSync(join(staged,'sports/badminton/index.html'),'utf8');
 // The legacy badminton entry is intentionally a lightweight redirect shell
 // into the shared VNext workspace, not the retired standalone app markup.
 assert.match(legacy,/<title>TOPKEY Sports · Cầu lông<\/title>/);
 assert.match(legacy,/query\.set\(['"]sport['"],\s*['"]badminton['"]\)/);
 assert.match(legacy,/\.\.\/vnext\/index\.html/);
 assert.match(legacy,/location\.replace\(target\.href\)/);
});
test('stage keeps existing EdgeOne headers unchanged',()=>{
 const original=JSON.parse(readFileSync(join(root,'topkey/edgeone.json'),'utf8'));
 const staged=JSON.parse(readFileSync(configFile,'utf8'));
 assert.deepEqual(staged.headers,original.headers);
});
test('no runtime write permissions or Firebase rule content changes',()=>{
 const a=readFileSync(join(root,'topkey/firebase.database.rules.json'),'utf8');
 const b=readFileSync(join(staged,'firebase.database.rules.json'),'utf8');
 assert.equal(b,a);
});
