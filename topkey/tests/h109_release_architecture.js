'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=(f)=>fs.readFileSync(path.join(root,f),'utf8');
const rel=JSON.parse(read('release.json'));
const manifests=['build.json','sports/badminton/build.json','sports/vnext/build.json'].map(f=>JSON.parse(read(f)));
let checks=0;const ok=(name,condition)=>{assert(condition,name);checks++;};
for(const m of manifests){ok('cacheTag matches release',m.cacheTag===rel.cacheTag);ok('version matches release',m.version===rel.version);ok('build matches release',m.build===rel.build)}
ok('new architecture has source generator',read('tools/build_release.py').includes("root/'release.json'"));
const runtime=read('release-runtime.js');
ok('runtime contains releaseId',runtime.includes(rel.releaseId));
function vmEnv(extra={},loadRuntime=true){const c={window:null,console,Date,Promise,Math,JSON,URL,URLSearchParams,String,Number,Object,encodeURIComponent,...extra};c.window=c;vm.createContext(c);if(loadRuntime)vm.runInContext(runtime,c);return c;}
const context=vmEnv();ok('runtime cachetag matches',context.TopkeyRelease.cacheTag===rel.cacheTag);ok('runtime build immutable',Object.isFrozen(context.TopkeyRelease));
for(const f of ['index.html','sports/badminton/index.html','sports/vnext/index.html']){
 const html=read(f),runtimeAt=html.indexOf('release-runtime.js'),guardAt=html.indexOf('hub-entry-guard.js');ok(f+' loads runtime',runtimeAt>=0);if(guardAt>=0)ok(f+' loads runtime before guard',runtimeAt<guardAt);
 ok(f+' has H109 cache buster',html.includes(rel.cacheTag));
}
const session=()=>{const db={};return {getItem:k=>db[k]||null,setItem:(k,v)=>{db[k]=String(v)},removeItem:k=>{delete db[k]},dump:()=>db}};
function guard(sport,mode='valid',runtimeLoaded=true){const bad=sport==='badminton';const ss=session(),nonce='ticket-123',now=Date.now();ss.setItem('topkey_hub_session_v86',JSON.stringify({sport,nonce,createdAt:now,touchedAt:now,phase:'SELECTED'}));const route=mode==='mismatch'?'?sport='+sport+'&entry=hub&hubTicket='+nonce+'&v=old-h105':'?sport='+sport+'&entry=hub&hubTicket='+nonce+'&v='+rel.cacheTag;const location={pathname:'/sports/'+(bad?'badminton':'vnext')+'/index.html',search:route,hash:'',replace(url){this.redirect=url},href:'https://example.invalid/sports/'+(bad?'badminton':'vnext')+'/index.html'+route};const ctx=vmEnv({location,sessionStorage:ss},runtimeLoaded);vm.runInContext(read('sports/'+(bad?'badminton':'vnext')+'/hub-entry-guard.js'),ctx);return {ctx,location,ss}}
for(const s of ['badminton','football','volleyball','running','handmade','shuttle','cooking']){const t=guard(s);ok('guard accepts '+s,t.ctx.__TOPKEY_HUB_ENTRY_VALID===true&&t.ctx.entryDecision===undefined);ok('ready true '+s,!!t.ctx.entryGuardReady)}
const mismatch=guard('badminton','mismatch');ok('version mismatch redirects once',String(mismatch.location.redirect).includes('deploy-mismatch'));ok('mismatch does not authorize',mismatch.ctx.__TOPKEY_HUB_ENTRY_VALID!==true);
const missing=guard('football','valid',false);ok('missing runtime fails closed',String(missing.location.redirect).includes('release-runtime-missing'));
async function hubFlow(allowed){const a={getAttribute(name){return name==='href'?'./sports/vnext/index.html?sport=football':''}};const clicks=[];const ss=session();const loc={href:'https://example.invalid/index.html',search:'',assign(dest){this.assigned=dest}};const doc={readyState:'complete',addEventListener(name,fn){if(name==='click')clicks.push(fn)},querySelector(){return null},getElementById(){return null},createElement(){return {style:{},classList:{add(){}}}}};const ctx=vmEnv({location:loc,sessionStorage:ss,document:doc,crypto:{randomUUID:()=> 'new-nonce'},TopkeyReleaseHealth:{ready:Promise.resolve(),canLaunch:()=>allowed}});vm.runInContext(read('hub-auth-flow.js'),ctx);let blocked=0;const evt={target:{closest:()=>a},preventDefault(){blocked++},stopPropagation(){}};await clicks[0](evt);return {loc,ss,blocked}}
(async()=>{
 const denied=await hubFlow(false);ok('Hub blocks entry while release mismatch',!denied.loc.assigned);ok('Hub blocks navigation default while status unresolved',denied.blocked===1);
 const accepted=await hubFlow(true);ok('Hub uses release tag in URL',String(accepted.loc.assigned).includes('v='+rel.cacheTag));ok('Hub session records release tag',accepted.ss.getItem('topkey_hub_session_v86').includes(rel.cacheTag));
 const planning=read('club-planning.js');ok('planning no H105 tag',!planning.includes('u122h105'));ok('planning parallel reads',planning.includes('Promise.all(keys.map'));ok('planning cleans up auth listener',planning.includes("window.removeEventListener('topkey:languagechange'"));ok('planning auth epoch prevents stale render',planning.includes('epoch!==authEpoch'));
 const health=read('release-coordinator.js');ok('parity check deduped',health.includes('if(checkInFlight)return checkInFlight'));ok('manifest requests concurrent',health.includes('Promise.all(jobs)'));ok('coordinator version from runtime',health.includes('TopkeyRelease?.cacheTag'));
 for(const f of ['sw.js','sports/badminton/sw.js','sports/vnext/sw.js']){const source=read(f);ok(f+' uses H109 cache',source.includes('topkey-h109'));ok(f+' uses network first for critical auth',source.includes('hub-entry-guard|release-runtime'));ok(f+' does not force skipWaiting on install',!source.includes('then(()=>self.skipWaiting()'))}
 const auth=read('h108-auth-guard.js');ok('auth waits for guard',auth.includes('await window.entryGuardReady'));ok('auth does not use localStorage for privilege',!auth.includes('localStorage.setItem('));
 console.log('PASS H109 Release & Runtime architecture:',checks,'checks');
 fs.writeFileSync(path.join(root,'H109_ARCHITECTURE_TEST_RESULTS.json'),JSON.stringify({pass:true,checks,releaseId:rel.releaseId,cacheTag:rel.cacheTag},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
