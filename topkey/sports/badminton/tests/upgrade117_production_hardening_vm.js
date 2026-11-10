const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),code=fs.readFileSync(path.join(root,'src/core/production-hardening.js'),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let dataInitRuns=0,authInitRuns=0,baseFlushRuns=0,inFlush=0,maxConcurrent=0,refreshRuns=0,lastFlushOpts=null;
const Data={ready:false,connected:true,auth:{currentUser:{uid:'u1'}},pending:2,blocked:0,
 async init(){dataInitRuns++;await sleep(4);this.ready=true;return this},
 async flushQueue(opts){lastFlushOpts=opts;baseFlushRuns++;inFlush++;maxConcurrent=Math.max(maxConcurrent,inFlush);await sleep(3);inFlush--;return {synced:[opts.source||'x'],failed:[],blocked:[],deferred:[]}},
 async refreshQueueStats(){refreshRuns++;return {pending:this.pending,blocked:this.blocked}}
};
const Auth={async init(){authInitRuns++;await sleep(4);return true}};
const App={renderHealth(){return true}};
const dataRuntime={listenerState:{coreOffs:Array(6).fill(()=>{}),tabOffs:Array(1).fill(()=>{})}};
const ui={hooks:{tab:Array(4).fill({}),matches:Array(3).fill({}),spectator:[]}};
const atomic={state:{pending:new Map()}};
const listeners={};
const mkEl=()=>({id:'',className:'',style:{},innerHTML:'',appendChild(){},querySelector(){return null}});
const host=mkEl(),els={'tk103-runtime-health':host};host.appendChild=x=>{if(x?.id)els[x.id]=x};
const document={hidden:false,documentElement:{dataset:{}},getElementById:id=>els[id]||null,createElement:mkEl,addEventListener(ev,fn){listeners['doc:'+ev]=fn}};
const window={Topkey:{App,Data,Auth},TopkeyCoreDataRuntime115:dataRuntime,TopkeyUIBoundary:ui,TopkeyUpgrade113:atomic,TopkeyUpgrade88:{state:{}},addEventListener(ev,fn){listeners['win:'+ev]=fn}};
window.window=window;window.document=document;
const sandbox={window,document,console,Promise,Date,Math,setTimeout,clearTimeout,queueMicrotask,performance:{now:()=>Date.now()}};
vm.createContext(sandbox);vm.runInContext(code,sandbox);
(async()=>{
 assert(window.TopkeyProductionHardening117?.installed,'hardening not installed');
 await Promise.all(Array.from({length:40},()=>Data.init()));
 assert.strictEqual(dataInitRuns,1,'Data.init must be single-flight');
 await Promise.all(Array.from({length:30},()=>Auth.init()));
 assert.strictEqual(authInitRuns,1,'Auth.init must be single-flight');
 const flushes=Array.from({length:100},(_,i)=>Data.flushQueue({source:'s'+i,silent:true}));
 await Promise.all(flushes);
 assert.strictEqual(maxConcurrent,1,'flushQueue must never run underlying drains concurrently');
 assert(baseFlushRuns<=2,`100 concurrent flush requests should coalesce to <=2 drains, got ${baseFlushRuns}`);
 const st=window.TopkeyProductionHardening117.state;
 assert(st.flushCoalesced>=98,'coalesced flush metric too low');
 assert(st.dataInitCoalesced>=39&&st.authInitCoalesced>=29,'init coalesce metrics missing');
 await Data.flushQueue({source:'manual',retryBlocked:true});assert.strictEqual(lastFlushOpts.source,'manual','manual flush source semantics must be preserved');assert.strictEqual(lastFlushOpts.silent,false,'manual flush default silent=false must be preserved');
 const check=window.TopkeyProductionHardening117.runSelfCheck();assert(check.ok,'healthy runtime self-check should pass');
 dataRuntime.listenerState.coreOffs=Array(12).fill(()=>{});const bad=window.TopkeyProductionHardening117.runSelfCheck();assert(!bad.ok&&bad.problems.some(x=>x.includes('core listeners')),'listener leak warning missing');
 dataRuntime.listenerState.coreOffs=Array(6).fill(()=>{});
 const before=baseFlushRuns;for(let i=0;i<25;i++)window.TopkeyProductionHardening117.scheduleRecovery('resume'+i,0);await sleep(20);
 assert(baseFlushRuns<=before+1,'resume storm must coalesce to one recovery drain');
 assert(st.recoveryCoalesced>=24,'recovery coalesce metric missing');assert(refreshRuns>=1,'recovery must refresh queue stats');
 console.log('PASS upgrade117 production hardening VM');
})().catch(e=>{console.error(e);process.exit(1)});
