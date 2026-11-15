/* One-click TOPKEY TikTok scan (all 1000 links, 25 parallel per wave). */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const text=fs.readFileSync(path.join(__dirname,'..','topkey','sports','diy-vlog','tiktok-automation.js'),'utf8');
const begin=text.indexOf('async function runEdgeOneBatch()'),end=text.indexOf('bulk.addEventListener(',begin);
assert(begin>=0&&end>begin,'batch function missing');
const snippet=text.slice(begin,end);
const total=1000;
function entries(n=total){return Object.fromEntries(Array.from({length:n},(_,i)=>[
 'tt_'+String(i).padStart(4,'0'),
 {url:'https://www.tiktok.com/@sample/video/'+String(7500000000000000000n+BigInt(i)),views:0,likes:0,shares:0}
]));}
async function testRun({n=1000,concurrency=25,failIndex=-1,fatal=false,start=0,changeAuthAt=-1}={}){
 const data=entries(n),ids=Object.keys(data),store=new Map();
 const key='topkey_vlog2026_scan:topkey_vlog2026_test/entries';
 const fp=n+':'+ids[0]+':'+ids[n-1]+':';
 if(start)store.set(key,JSON.stringify({fingerprint:fp,offset:start}));
 let active=0,maxActive=0,calls=0,writes=0,last='',rootReads=0,authUid='admin';
 const auth=()=>({currentUser:authUid?{uid:authUid}:null});
 const db={ref:p=>p==='topkey_vlog2026_test/entries'?{once:async()=>{
  rootReads++;return {val:()=>data};
 }}:{transaction:async transform=>{
  writes++;
  const id=p.split('/').pop();const after=transform(data[id]);
  assert(after!==undefined,'must update existing URL');
  data[id]=after;
  return {committed:true};
 }}};
 const fakeFirebase={database:()=>db,auth};
 const context={window:{firebase:fakeFirebase,__TOPKEY_VLOG_TEST_MODE:true},
  firebase:fakeFirebase,$:()=>({value:String(concurrency)}),JSON,Set,Map,Promise,Object,Number,Date,String,
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
  validTikTokVideo:()=>true,info:s=>{last=s},
  setTimeout:cb=>{cb();return 1},
  readEdgeOneMetadata:async url=>{
   const i=Number(url.split('/').pop())-7500000000000000000;
   // Number() of 19-digit IDs loses precision; look up matching URL instead.
   const idx=ids.findIndex(id=>data[id].url===url);
   calls++;active++;maxActive=Math.max(maxActive,active);
   await Promise.resolve();active--;
   if(changeAuthAt>=0&&calls>=changeAuthAt)authUid=null;
   if(idx===failIndex){
    if(fatal){const e=new Error('Invalid Firebase ID token');e.status=401;throw e;}
    throw Error('TikTok video unavailable');
   }
   return {ok:true,source:'tikwm-unofficial',stats:{views:123,likes:12,shares:3}};
  }
 };
 vm.createContext(context);
 vm.runInContext(snippet,context);
 await context.runEdgeOneBatch();
 return {calls,maxActive,writes,last,offset:JSON.parse(store.get(key)).offset,rootReads,data};
}
(async()=>{
 let x=await testRun();
 assert.equal(x.calls,1000);assert.equal(x.writes,1000);assert.equal(x.rootReads,1);
 assert.equal(x.maxActive,25);assert.equal(x.offset,0);
 assert.match(x.last,/HOÀN TẤT 1000\/1000/);
 x=await testRun({failIndex:2});
 assert.equal(x.calls,1000);assert.equal(x.writes,999);assert.equal(x.offset,0);
 assert.match(x.last,/lỗi 1/);
 x=await testRun({failIndex:4,fatal:true});
 assert.equal(x.writes,4);
 assert.equal(x.offset,4);assert.match(x.last,/TẠM DỪNG/);
 x=await testRun({start:75});
 assert.equal(x.calls,925);assert.equal(x.writes,925);assert.equal(x.offset,0);
 x=await testRun({n:25,concurrency:10});
 assert.equal(x.maxActive,10);assert.equal(x.calls,25);
 x=await testRun({n:25,concurrency:3});
 assert.equal(x.maxActive,3);assert.equal(x.calls,25);
 x=await testRun({n:25,concurrency:25,changeAuthAt:1});
 assert.equal(x.writes,0);assert.equal(x.offset,0);
 console.log('PASS one-click: 1000/1000, 25 concurrent, 1 RTDB read, resume 75, per-video 502, 401 pause, role switch prevents writes, 3/10 concurrent');
})().catch(e=>{console.error(e);process.exitCode=1});
