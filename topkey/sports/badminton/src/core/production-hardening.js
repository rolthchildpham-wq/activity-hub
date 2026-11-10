(()=>{
'use strict';
const T=window.Topkey,App=T?.App,Data=T?.Data,Auth=T?.Auth;
if(!T||!App||!Data||!Auth||window.TopkeyProductionHardening117?.installed)return;
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery',BUILD='upgrade122',CACHE_TAG='u122h47-20261104';
const $=id=>document.getElementById(id);
const S={
 installed:true,dataInitRequests:0,dataInitRuns:0,dataInitCoalesced:0,authInitRequests:0,authInitRuns:0,authInitCoalesced:0,
 flushRequests:0,flushRuns:0,flushCoalesced:0,flushErrors:0,recoveryRequests:0,recoveryRuns:0,recoveryCoalesced:0,recoverySkipped:0,
 queueHighWater:0,lastFlushSource:'',lastRecoverySource:'',lastSelfCheck:null,selfChecks:0,warnings:0,contracts:['PRODUCTION_HARDENING_SINGLEFLIGHT_001','PRODUCTION_HARDENING_SOAK_001']
};
const emptyReport=()=>({synced:[],failed:[],blocked:[],deferred:[]});
const mergeReport=(a,b)=>{a=a||emptyReport();b=b||emptyReport();for(const k of ['synced','failed','blocked','deferred'])a[k]=[...(a[k]||[]),...(b[k]||[])];return a};

// Boot hardening: Data/Auth init are long-lived listener installers. They must be single-flight.
const baseDataInit=Data.init.bind(Data);let dataInitFlight=null,dataInitDone=false;
Data.init=function(...args){
 S.dataInitRequests++;
 if(dataInitDone&&this.ready){S.dataInitCoalesced++;return dataInitFlight||Promise.resolve(this)}
 if(dataInitFlight){S.dataInitCoalesced++;return dataInitFlight}
 S.dataInitRuns++;
 dataInitFlight=Promise.resolve().then(()=>baseDataInit(...args)).then(v=>{dataInitDone=!!this.ready;return v}).catch(e=>{dataInitDone=false;dataInitFlight=null;throw e}).finally(()=>{renderHealth()});
 return dataInitFlight;
};
const baseAuthInit=Auth.init.bind(Auth);let authInitFlight=null,authInitDone=false;
Auth.init=function(...args){
 S.authInitRequests++;
 if(authInitDone&&authInitFlight){S.authInitCoalesced++;return authInitFlight}
 if(authInitFlight){S.authInitCoalesced++;return authInitFlight}
 S.authInitRuns++;
 authInitFlight=Promise.resolve().then(()=>baseAuthInit(...args)).then(v=>{authInitDone=true;return v}).catch(e=>{authInitDone=false;authInitFlight=null;throw e}).finally(()=>{renderHealth()});
 return authInitFlight;
};

// Queue hardening: Firebase connection + browser online + user action can all request a flush at once.
// Serialize the underlying IDB/Firebase drain and merge concurrent triggers into the same flight.
const baseFlush=Data.flushQueue.bind(Data);let flushFlight=null,pendingFlush=null;
function mergeOptions(a,b){
 a=a||{};b=b||{};
 const left=Array.isArray(a.sources)&&a.sources.length?a.sources:(a.source?[a.source]:[]),right=Array.isArray(b.sources)&&b.sources.length?b.sources:(b.source?[b.source]:[]);
 const sources=[...new Set([...left,...right].filter(Boolean).map(String))];
 const leftSilent=Object.keys(a).length?a.silent===true:true,rightSilent=b.silent===true;
 const source=sources.includes('manual')?'manual':(sources.length===1?sources[0]:(sources.includes('action')?'action':'coalesced'));
 return {source,sources,focusId:b.focusId||a.focusId||'',retryBlocked:!!(a.retryBlocked||b.retryBlocked),silent:leftSilent&&rightSilent};
}
Data.flushQueue=function(opts={}){
 S.flushRequests++;pendingFlush=mergeOptions(pendingFlush,opts);
 if(flushFlight){S.flushCoalesced++;return flushFlight}
 flushFlight=(async()=>{
  let total=emptyReport();
  while(pendingFlush){
   const run=pendingFlush;pendingFlush=null;S.flushRuns++;S.lastFlushSource=run.source;
   try{total=mergeReport(total,await baseFlush(run))}catch(e){S.flushErrors++;throw e}
   // Let same-turn reconnect/online/action triggers join before deciding the drain is complete.
   await Promise.resolve();
  }
  return total;
 })().finally(()=>{flushFlight=null;updateQueueHighWater();renderHealth()});
 return flushFlight;
};

let recoveryTimer=0,recoverySource='';
function scheduleRecovery(source='resume',delay=180){
 S.recoveryRequests++;recoverySource=recoverySource?`${recoverySource}+${source}`:source;
 if(recoveryTimer){S.recoveryCoalesced++;return}
 recoveryTimer=setTimeout(async()=>{
  recoveryTimer=0;const src=recoverySource||source;recoverySource='';
  if(!Data.ready||!Data.connected||!Data.auth?.currentUser){S.recoverySkipped++;renderHealth();return}
  S.recoveryRuns++;S.lastRecoverySource=src;
  try{await Data.flushQueue({source:`resume:${src}`,silent:true});await Data.refreshQueueStats?.()}catch(e){S.flushErrors++;console.warn('U117 recovery flush',e)}
  updateQueueHighWater();runSelfCheck();renderHealth();
 },Math.max(0,Number(delay)||0));
}
function updateQueueHighWater(){const n=Math.max(0,Number(Data.pending||0)+Number(Data.blocked||0));if(n>S.queueHighWater)S.queueHighWater=n;return n}
function runtimeSnapshot(){
 const dr=window.TopkeyCoreDataRuntime115?.listenerState||window.TopkeyUpgrade102?.state||{};
 const ui=window.TopkeyUIBoundary,atomic=window.TopkeyUpgrade113?.state,rtc=window.TopkeyUpgrade88?.state;
 return {coreListeners:dr.coreOffs?.length||0,dynamicListeners:dr.tabOffs?.length||0,uiTabHooks:ui?.hooks?.tab?.length||0,uiMatchHooks:ui?.hooks?.matches?.length||0,uiSpectatorHooks:ui?.hooks?.spectator?.length||0,atomicPending:atomic?.pending?.size||0,queuePending:Number(Data.pending||0),queueBlocked:Number(Data.blocked||0),rtcHeartbeat:rtc?.broadcastHeartbeatTimer?1:0,rtcHeal:rtc?.broadcastHealTimer?1:0};
}
function runSelfCheck(){
 const x=runtimeSnapshot(),problems=[];
 if(x.coreListeners>8)problems.push(`core listeners ${x.coreListeners}>8`);
 if(x.dynamicListeners>3)problems.push(`dynamic listeners ${x.dynamicListeners}>3`);
 if(x.uiTabHooks>12)problems.push(`tab hooks ${x.uiTabHooks}>12`);
 if(x.uiMatchHooks>8)problems.push(`match hooks ${x.uiMatchHooks}>8`);
 if(x.atomicPending>4)problems.push(`atomic pending ${x.atomicPending}>4`);
 if(x.queuePending<0||x.queueBlocked<0)problems.push('queue counters invalid');
 const out={ok:problems.length===0,problems,snapshot:x,at:Date.now()};S.selfChecks++;S.lastSelfCheck=out;if(!out.ok)S.warnings++;return out;
}
function ensureHealth(){
 const host=$('tk103-runtime-health');if(!host)return null;let line=$('tk117-hardening-health');
 if(!line){line=document.createElement('div');line.id='tk117-hardening-health';line.className='muted';line.style.marginTop='6px';host.appendChild(line)}return line;
}
function renderHealth(){
 const line=ensureHealth();if(!line)return;updateQueueHighWater();const c=S.lastSelfCheck||runSelfCheck(),x=c.snapshot;
 line.innerHTML=`Production Hardening: <b>${c.ok?'OK':'WARN'}</b> · init Data/Auth runs <b>${S.dataInitRuns}/${S.authInitRuns}</b> · avoided <b>${S.dataInitCoalesced+S.authInitCoalesced}</b> · flush req/run <b>${S.flushRequests}/${S.flushRuns}</b> · coalesced <b>${S.flushCoalesced}</b> · recovery <b>${S.recoveryRuns}</b> · queue high-water <b>${S.queueHighWater}</b> · listeners core/dyn <b>${x.coreListeners}/${x.dynamicListeners}</b>`;
}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth&&!App.__u117Health){App.__u117Health=true;App.renderHealth=function(...a){const out=baseHealth(...a);queueMicrotask(()=>{runSelfCheck();renderHealth()});return out}}
const onVisible=()=>{if(!document.hidden)scheduleRecovery('visible')};
document.addEventListener('visibilitychange',onVisible,{passive:true});
window.addEventListener('pageshow',()=>scheduleRecovery('pageshow'),{passive:true});
window.addEventListener('online',()=>scheduleRecovery('online',120),{passive:true});
window.addEventListener('focus',()=>{runSelfCheck();renderHealth()},{passive:true});
window.addEventListener('pagehide',()=>{if(recoveryTimer){clearTimeout(recoveryTimer);recoveryTimer=0;recoverySource=''}},{passive:true});
updateQueueHighWater();runSelfCheck();renderHealth();
window.TopkeyProductionHardening117={installed:true,VERSION,BUILD,CACHE_TAG,state:S,scheduleRecovery,runSelfCheck,runtimeSnapshot,renderHealth,contract:'PRODUCTION_HARDENING_SINGLEFLIGHT_SOAK_001'};
})();
