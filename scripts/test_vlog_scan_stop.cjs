/* TOPKEY Vlog: prevent repeat API failures from consuming the full 1000-URL scan. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const base=path.join(__dirname,'..','topkey','sports','diy-vlog');
const js=fs.readFileSync(path.join(base,'tiktok-automation.js'),'utf8');
const start=js.indexOf('async function runEdgeOneBatch()');
const end=js.indexOf('bulk.addEventListener(',start);
assert(start>=0&&end>start);
const entries=Object.fromEntries(Array.from({length:1000},(_,i)=>[
 'tt_'+String(i).padStart(6,'0'),{url:'https://www.tiktok.com/@test/video/'+String(7400000000000000000n+BigInt(i))}
]));
let calls=0,writes=0,last='';
const store=new Map();
const ctx={
 window:{firebase:{},__TOPKEY_VLOG_TEST_MODE:true},
 firebase:{auth:()=>({currentUser:{uid:'admin'}}),database:()=>({ref:()=>({once:async()=>({val:()=>entries}),transaction:async()=>{writes++;return {committed:true}}})})},
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
 Object,Date,Number,JSON,String,
 validTikTokVideo:()=>true,
 readEdgeOneMetadata:async()=>{calls++;const err=Error('Invalid Firebase ID token');err.status=401;throw err},
 info:x=>{last=x}
};
vm.createContext(ctx);vm.runInContext(js.slice(start,end),ctx);
(async()=>{
 await ctx.runEdgeOneBatch();
 assert.equal(calls,1,'Must stop immediately on auth failure');
 assert.equal(writes,0,'Cannot write failed metadata');
 assert(last.includes('TẠM DỪNG')&&last.includes('0/1000'),last);
 const state=JSON.parse(store.get('topkey_vlog2026_scan:topkey_vlog2026_test/entries'));
 assert.equal(state.offset,0,'Preserve cursor for retry');
 console.log('PASS - HTTP 401 stops after first request, makes zero Firebase writes, preserves retry cursor');
})().catch(e=>{console.error(e);process.exitCode=1});
