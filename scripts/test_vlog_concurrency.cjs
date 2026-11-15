'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const base=path.join(__dirname,'..','topkey','sports','diy-vlog');
const code=fs.readFileSync(path.join(base,'tiktok-automation.js'),'utf8');
const a=code.indexOf('async function runEdgeOneBatch()'),b=code.indexOf('bulk.addEventListener(',a);
assert(a>=0&&b>a);
async function scenario(n,rejectAuth=false){
 const entries=Object.fromEntries(Array.from({length:25},(_,i)=>['tt_'+i,{url:'https://www.tiktok.com/@user/video/'+String(7400000000000000000n+BigInt(i)),views:0,likes:0,shares:0}]));
 let calls=0,active=0,maxActive=0,writes=0,last='';
 const store=new Map();
 const db={ref:p=>p==='topkey_vlog2026_test/entries'?{once:async()=>({val:()=>entries})}:{transaction:async transform=>{
  assert(p.startsWith('topkey_vlog2026_test/entries/'));
  writes++;const id=p.split('/').pop();entries[id]=transform(entries[id]);return {committed:true};
 }}};
 const firebase={database:()=>db,auth:()=>({currentUser:{uid:'test_admin'}})};
 const ctx={window:{firebase,__TOPKEY_VLOG_TEST_MODE:true},firebase,$:()=>({value:String(n)}),
   Map,Set,JSON,Number,Date,Object,String,Promise,setTimeout:fn=>{fn();return 1},
   localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
   validTikTokVideo:()=>true,info:t=>last=t,
   readEdgeOneMetadata:async()=>{
    calls++;active++;maxActive=Math.max(maxActive,active);
    await new Promise(resolve=>setTimeout(resolve,5));active--;
    if(rejectAuth){const e=Error('Firebase token invalid');e.status=401;throw e}
    return {ok:true,stats:{views:100,likes:10,shares:2}};
   }};
 vm.createContext(ctx);vm.runInContext(code.slice(a,b),ctx);
 await ctx.runEdgeOneBatch();
 const saved=JSON.parse(store.get('topkey_vlog2026_scan:topkey_vlog2026_test/entries'));
 return {calls,maxActive,writes,last,offset:saved.offset};
}
(async()=>{
 for(const n of [10,25]){
  const result=await scenario(n);
  assert.equal(result.calls,25);assert(result.maxActive>=1&&result.maxActive<=5);assert.equal(result.writes,25);
  assert(result.last.includes('25/25'),result.last);assert.equal(result.offset,0);
 }
 const error=await scenario(10,true);
 assert(error.calls<=5&&error.calls>=1);assert.equal(error.writes,0);assert.equal(error.offset,0);
 assert(error.last.includes('TẠM DỪNG'),error.last);
 console.log('PASS - legacy 10 and 25 presets safely cap at 5 actual in-flight tasks, 401 stop, no unauthorized writes');
})().catch(e=>{console.error(e);process.exitCode=1});