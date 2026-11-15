'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','topkey/sports/diy-vlog/tiktok-automation.js'),'utf8');
const helpers=src.slice(src.indexOf('function vlogFailureReason('),src.indexOf('function errMessage('));
assert(helpers.includes('async function runFailedVlogLinksOnce()'));
const makeElement=tag=>({tagName:tag,textContent:'',children:[],hidden:false,
 append(...n){this.children.push(...n)},appendChild(n){this.children.push(n)},
 replaceChildren(...n){this.children=n},addEventListener(type,handler){this['on'+type]=handler;}});
async function scenario({failedIndices=[0,1,2],stillBad=[2],tokenError=-1}={}){
 const data={};
 for(let i=0;i<15;i++)data['tt_'+i]={name:'Video '+i,url:'https://www.tiktok.com/@sample/video/'+(7500000000000000000n+BigInt(i)),views:15,likes:1,shares:0};
 const ids=Object.keys(data),fp=ids.length+':'+ids[0]+':'+ids.at(-1)+':';
 const key='topkey_vlog2026_scan:topkey_vlog2026_test/entries';
 const history=failedIndices.map(i=>({id:'tt_'+i,name:'Video '+i,url:data['tt_'+i].url,reason:'Old 502',retryCount:0}));
 const store=new Map([[key,JSON.stringify({fingerprint:fp,offset:0,failures:history})]]);
 let reads=0,writes=0,calls=[],last='';
 const report=makeElement('section'),button={disabled:false},auth={currentUser:{uid:'admin'}};
 const db={ref:p=>{
  assert(p.startsWith('topkey_vlog2026_test/entries'),'Never access production RTDB path');
  if(p==='topkey_vlog2026_test/entries')return {once:async()=>{reads++;return{val:()=>data}}};
  return {transaction:async fn=>{writes++;const id=p.slice(p.lastIndexOf('/')+1);const update=fn(data[id]);assert(update);data[id]=update;return{committed:true}}};
 }};
 const win={firebase:{database:()=>db,auth:()=>auth},__TOPKEY_VLOG_TEST_MODE:true};
 let changed=[];
 win.TopkeyVlogSyncErrorsChanged=f=>{changed=f};
 const context={window:win,firebase:win.firebase,
 document:{createElement:makeElement},$:id=>id==='tiktok-scan-errors'?report:null,
 info:t=>last=t,bulk:button,run:async(_b,fn)=>fn(),
 validTikTokVideo:u=>/^https:\/\/www\.tiktok\.com\/@sample\/video\/\d{19}$/.test(String(u)),
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
 readEdgeOneMetadata:async u=>{
  calls.push(u);const index=ids.findIndex(i=>data[i].url===u);
  if(index===tokenError){const e=Error('Firebase ID token invalid');e.status=401;throw e}
  if(stillBad.includes(index)){const e=Error('TikWM gateway 502');e.status=502;throw e}
  return{stats:{views:99,likes:11,shares:2},source:'tikwm-unofficial'};
 },Promise,Object,Number,String,Map,Date,Set,JSON,setTimeout:fn=>{fn();return 1}};
 vm.createContext(context);
 vm.runInContext(helpers,context);
 await context.runFailedVlogLinksOnce();
 return{calls,writes,last,changed,progress:JSON.parse(store.get(key)),report,data,button};
}
(async()=>{
 const x=await scenario({});
 assert.equal(x.calls.length,3,'Only 3 failed URLs retried once, not all 15');
 assert.equal(x.writes,2,'Only recovered links updated');
 assert.equal(x.progress.failures.length,1,'Recovered links removed');
 assert.equal(x.progress.failures[0].id,'tt_2');
 assert.equal(x.progress.failures[0].retryCount,1);
 assert.match(x.progress.failures[0].reason,/502/);
 assert.match(x.last,/HOÀN TẤT kiểm tra lại 3 link lỗi/);
 assert.equal(x.data.tt_0.views,99);
 assert.equal(x.data.tt_2.views,15,'Do not zero-out failed metrics');
 assert.equal(x.button.disabled,false);
 assert.equal(x.report.hidden,false);
 const button=x.report.children.find(c=>c.tagName==='button');
 assert(button&&typeof button.onclick==='function','Retry button must be wired');
 const auth=await scenario({tokenError:1,stillBad:[]});
 assert.match(auth.last,/TẠM DỪNG/);
 assert.equal(auth.progress.failures.find(f=>f.id==='tt_1').code,401);
 assert(auth.writes<=1,'Once auth fails stop further writes');
 console.log('PASS: one-click failed-only retry, recovered rows removed, latest error+count, 401 safe stop, original stats/production unchanged');
})().catch(e=>{console.error(e);process.exitCode=1});
