/* 1-click full TikTok TEST LAB scan, nonfatal failures, red report and safe auth exit. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','topkey/sports/diy-vlog/tiktok-automation.js'),'utf8');
const start=source.indexOf('async function runEdgeOneBatch(){'),end=source.indexOf('bulk.addEventListener(',start);
assert(start>=0&&end>start,'scan function should exist');
const snippet=source.slice(source.indexOf('function vlogFailureReason('),source.indexOf('function errMessage('))+source.slice(start,end);
const N=1000;
const makeEntries=n=>Object.fromEntries(Array.from({length:n},(_,i)=>[
 'tt_'+String(i).padStart(4,'0'),
 {id:'tt_'+String(i).padStart(4,'0'),name:'Video '+i,url:'https://www.tiktok.com/@sample/video/'+String(7500000000000000000n+BigInt(i)),views:0,likes:0,shares:0}
]));
async function simulate({n=N,errors=[],authError=-1,concurrency=25,offset=0}={}){
 const all=makeEntries(n),ids=Object.keys(all),failed=new Set(errors),store=new Map();
 const key='topkey_vlog2026_scan:topkey_vlog2026_test/entries';
 const fp=n+':'+ids[0]+':'+ids.at(-1)+':';
 if(offset)store.set(key,JSON.stringify({fingerprint:fp,offset}));
 let calls=0,writes=0,active=0,peak=0,reads=0,last='';
 const doc={createElement:tag=>({tagName:tag,children:[],attrs:{},textContent:'',append(...x){this.children.push(...x)},appendChild(x){this.children.push(x)},replaceChildren(...x){this.children=x},setAttribute(k,v){this.attrs[k]=v}})};
 const report={hidden:true,children:[],replaceChildren(...x){this.children=x}};
 const firebase={auth:()=>({currentUser:{uid:'admin'}}),database:()=>({ref:loc=>{
  if(loc==='topkey_vlog2026_test/entries')return {once:async()=>{reads++;return{val:()=>all}}};
  return {transaction:async mutate=>{writes++;const id=loc.split('/').at(-1);const next=mutate(all[id]);assert(next&&next.statsFetchedAt);all[id]=next;return{committed:true}}};
 }})};
 const window={firebase,__TOPKEY_VLOG_TEST_MODE:true};
 const context={firebase,window,document:doc,$:id=>id==='tiktok-scan-errors'?report:id==='tiktok-scan-concurrency'?{value:String(concurrency)}:null,
   Number,JSON,Object,String,Set,Map,Date,Promise,
   validTikTokVideo:()=>true,info:t=>{last=t},
   localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},setTimeout:fn=>{fn();return 1},
   readEdgeOneMetadata:async url=>{
    const i=ids.findIndex(id=>all[id].url===url);
    calls++;active++;peak=Math.max(peak,active);await Promise.resolve();active--;
    if(i===authError){const e=new Error('Invalid Firebase ID token');e.status=401;throw e}
    if(failed.has(i)){const e=new Error('TikTok/TikWM 502 or expired/private link');e.status=502;throw e}
    return{source:'tikwm-unofficial',stats:{views:200,likes:5,shares:1}};
   }
 };
 vm.createContext(context);vm.runInContext(snippet,context);await context.runEdgeOneBatch();
 const progress=JSON.parse(store.get(key));
 return{calls,writes,reads,peak,last,errors:window.__TOPKEY_VLOG_SCAN_ERRORS,progress,report,all};
}
(async()=>{
 const a=await simulate({errors:[2,14,49,70,199,999]});
 assert.equal(a.calls,1000);assert.equal(a.writes,994);assert.equal(a.reads,1);
 assert(a.peak>=1&&a.peak<=5);assert.equal(a.progress.offset,0);
 assert.equal(a.errors.length,6);assert.equal(a.report.hidden,false);
 assert.match(a.last,/HOÀN TẤT 1000\/1000/);
 assert.match(a.report.children[0].textContent,/6 video cần kiểm tra/);
 const b=await simulate({authError:4});
 assert.match(b.last,/TẠM DỪNG/);
 assert.equal(b.progress.offset,4);
 const c=await simulate({offset:75});assert.equal(c.calls,925);assert.equal(c.writes,925);
 const d=await simulate({n:25,concurrency:10});assert(d.peak>=1&&d.peak<=5);
 const e=await simulate({n:25,concurrency:3});assert(e.peak>=1&&e.peak<=3);
 const html=fs.readFileSync(path.join(__dirname,'..','topkey/sports/diy-vlog/index.html'),'utf8');
 assert(html.includes('id="tiktok-scan-errors"')&&html.includes('.vlog-failed-row{'));
 assert(html.includes('const failedMap=new Map(testMode?'));
 assert(html.includes('vlog-error-label'));
 assert(html.includes('tiktok-automation.js?v=vlog-sync-errors-20261116-093b3b3'));
 console.log('PASS: 1000/1000 5-worker paced, 6 video errors continue, end red report, auth 401 stops, resume 75, 10/3-way, role-guard and compact header CSS');
})().catch(e=>{console.error(e);process.exitCode=1});
