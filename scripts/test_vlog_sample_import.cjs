/* Run: node scripts/test_vlog_sample_import.cjs
   Static, sandboxed verification: no Firebase calls or TikTok requests. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const base=path.join(__dirname,'..','topkey','sports','diy-vlog');
const fixture=JSON.parse(fs.readFileSync(path.join(base,'sample-data','tiktok-public-1000.json'),'utf8'));
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const from=html.indexOf('function parseRealVideoLinks(');
const until=html.indexOf("sampleLoadBtn.addEventListener('click'",from);
assert(from>=0 && until>from,'TEST LAB importer not found');
assert.equal(fixture.schemaVersion,1);
assert.equal(fixture.items.length,1000);
assert.equal(new Set(fixture.items.map(x=>x.id)).size,1000);
const writes=[];
let saved;
const ctx={
  Map,Set,String,Date,
  isRootAdmin:true,auth:{currentUser:{uid:'test_admin'}},testRoot:'topkey_vlog2026_test',
  db:{ref:(root)=>({
    async set(payload){writes.push(root);saved=payload},
    async once(){return {numChildren:()=>Object.keys(saved.entries).length}},
    on(){},off(){}
  })},
  sampleLoadBtn:{disabled:false},sampleDeleteBtn:{disabled:false},sampleImportFile:{disabled:false},
  confirm:()=>true,sampleStatusText(){},showTestMode(){},window:{},testRef:null,testListener:null
};
vm.createContext(ctx);
vm.runInContext(html.slice(from,until),ctx);
const normalized=ctx.parseRealVideoLinks(fixture.items);
assert.equal(normalized.length,1000);
assert.equal(ctx.parseRealVideoLinks([
 normalized[0],normalized[0],
 'http://www.tiktok.com/@foo/video/7420109434153717024',
 'https://untrusted.example/video/7420109434153717024'
]).length,1);
(async()=>{
  await ctx.importRealVideos(fixture.items,'public source regression');
  assert.deepEqual(writes,['topkey_vlog2026_test']);
  assert.equal(Object.keys(saved.entries).length,1000);
  assert.equal(saved.meta.loaded,1000);
  assert.equal(saved.meta.region,'Chưa xác minh');
  assert.equal(ctx.window.__TOPKEY_VLOG_TEST_MODE,true);
  ctx.isRootAdmin=false;
  await assert.rejects(()=>ctx.importRealVideos(fixture.items,'no admin'),/ADMIN/);
  assert.equal(writes.length,1);
  console.log('PASS - 1000 unique URLs, input filtering, ADMIN gating, atomic TEST-root-only write');
})().catch(err=>{console.error(err);process.exitCode=1});
