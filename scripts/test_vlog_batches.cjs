/* Run: node scripts/test_vlog_batches.cjs
   1000-item mocked scan; does not contact TikTok/Firebase. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const base=path.join(__dirname,'..','topkey','sports','diy-vlog');
const js=fs.readFileSync(path.join(base,'tiktok-automation.js'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(base,'sample-data','tiktok-public-1000.json'),'utf8'));
const from=js.indexOf('async function runEdgeOneBatch()');
const end=js.indexOf('bulk.addEventListener(',from);
assert(from>=0&&end>from,'Vlog yt-dlp batch function missing');
const entries=Object.fromEntries(data.items.map(x=>['tt_'+x.id,{url:x.url,views:0,likes:0,shares:0}]));
const storage=new Map(),writes=[],statuses=[];
const db={ref:root=>{
 if(root==='topkey_vlog2026_test/entries')return {once:async()=>({val:()=>entries})};
 return {transaction:async mutator=>{
   assert(root.startsWith('topkey_vlog2026_test/entries/'),'Attempted non-test write '+root);
   const id=root.split('/').pop();
   const updated=mutator(entries[id]);
   if(updated){entries[id]=updated;writes.push(id);return {committed:true}}
   return {committed:false};
 }};
}};
const firebase={auth:()=>({currentUser:{uid:'test_admin'}}),database:()=>db};
const ctx={$:()=>({value:'10'}),window:{firebase,__TOPKEY_VLOG_TEST_MODE:true},firebase,Map,Set,String,Date,Number,Object,JSON,
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  validTikTokVideo:url=>/^https:\/\/www\.tiktok\.com\/@[^/]+\/video\/\d{15,22}$/.test(url),
  readEdgeOneMetadata:async()=>({ok:true,stats:{views:55,likes:6,shares:2}}),
  info:text=>statuses.push(text)};
vm.createContext(ctx);vm.runInContext(js.slice(from,end),ctx);
(async()=>{
  for(let i=0;i<40;i++)await ctx.runEdgeOneBatch();
  assert.equal(writes.length,1000,'Expected exactly 1000 unique writes');
  assert.equal(new Set(writes).size,1000,'Repeated previously processed links');
  assert.equal(Object.values(entries).filter(x=>x.views===55&&x.likes===6&&x.shares===2).length,1000);
  assert(/1000\/1000/.test(statuses.at(-1)),'Final progress missing');
  const marker=JSON.parse(storage.get('topkey_vlog2026_scan:topkey_vlog2026_test/entries'));
  assert.equal(marker.offset,0,'Batch cursor should restart after full scan');
  console.log('PASS - all 1000 test URLs processed exactly once in 40 batches of 25; Firebase production untouched');
})().catch(e=>{console.error(e);process.exitCode=1});
