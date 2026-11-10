(()=>{
'use strict';
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const CACHE_TAG='u122h47-20261104';
let installed=false;
function boot(){
 const T=window.Topkey,App=T?.App,Data=T?.Data,U=T?.U;
 if(!T||!App||!Data||!T.idb){setTimeout(boot,80);return}
 if(installed||App.__upgrade122Hotfix22Installed)return;installed=true;App.__upgrade122Hotfix22Installed=true;
 const clone=v=>{try{return structuredClone(v)}catch{try{return JSON.parse(JSON.stringify(v))}catch{return v}}};
 const shadow={active:{},finished:{},loaded:false,flushing:false,lastCoalesced:0,lastRestore:0};
 const cacheKey=()=>`h22_offline_shadow_${String(Data.tid||'main_2026')}`;
 const activePathCourt=k=>{const m=String(k||'').match(/\/activeMatches\/([^/]+)$/);return m?.[1]||''};
 const matchPathId=k=>{const m=String(k||'').match(/\/matches\/([^/]+)$/);return m?.[1]||''};
 async function persistShadow(){try{await T.idb.put('cache',{key:cacheKey(),value:{active:shadow.active,finished:shadow.finished,updatedAt:Date.now()}})}catch(e){console.warn('H22 shadow persist',e)}}
 async function loadShadow(){try{const r=await T.idb.get('cache',cacheKey());const v=r?.value||{};shadow.active=v.active||{};shadow.finished=v.finished||{};shadow.loaded=true;restoreState();}catch(e){shadow.loaded=true;console.warn('H22 shadow load',e)}}
 function applyUpdatesToShadow(updates){
   let changed=false;
   for(const [k,v] of Object.entries(updates||{})){
     const court=activePathCourt(k);if(court){shadow.active[court]=v==null?null:clone(v);changed=true;continue}
     const mid=matchPathId(k);if(mid&&v&&String(v.status||'').toUpperCase()==='FINISHED'){shadow.finished[mid]=clone(v);changed=true}
   }
   if(changed){restoreState();persistShadow();}
 }
 function restoreState(){
   if(!App.state)return;
   App.state.activeMatches=App.state.activeMatches||{};App.state.matches=App.state.matches||{};
   for(const [court,s] of Object.entries(shadow.active)){
     if(s==null)delete App.state.activeMatches[court];
     else {
       const remote=App.state.activeMatches[court],lv=Number(s.version)||0,rv=Number(remote?.version)||0;
       if(!remote||s.matchId!==remote.matchId||lv>=rv)App.state.activeMatches[court]=clone(s);
     }
   }
   for(const [id,m] of Object.entries(shadow.finished)){
     const remote=App.state.matches[id];
     if(!remote||String(remote.status||'').toUpperCase()!=='FINISHED'||Number(m.updatedAt||m.finishedAt||0)>=Number(remote.updatedAt||remote.finishedAt||0))App.state.matches[id]=clone(m);
   }
   shadow.lastRestore=Date.now();
 }
 // Remote listeners may deliver the stale pre-offline snapshot immediately after reconnect.
 // Restore the local final snapshot before any UI branch renders it.
 const baseRenderBranch=App.renderBranch?.bind(App);
 if(baseRenderBranch&&!App.__h22RenderBranch){App.__h22RenderBranch=true;App.renderBranch=function(branch,...args){if(branch==='activeMatches'||branch==='matches')restoreState();return baseRenderBranch(branch,...args)}}
 // Capture every local tournament mutation that changes the active court or finishes a match.
 const baseQueue=Data.queueMulti.bind(Data);
 Data.queueMulti=async function(updates,meta={}){applyUpdatesToShadow(updates);const out=await baseQueue(updates,meta);if(this.connected)setTimeout(()=>reconcileAck().catch(()=>{}),120);return out};
 const baseSet=Data.queueSet?.bind(Data);
 if(baseSet)Data.queueSet=async function(p,value,meta={}){const up={[Data.path(p)]:value};applyUpdatesToShadow(up);const out=await baseSet(p,value,meta);if(this.connected)setTimeout(()=>reconcileAck().catch(()=>{}),120);return out};
 function isScore(item){return String(item?.meta?.type||'').toUpperCase()==='SCORE'}
 async function coalesceConsecutiveScores(){
   const items=(await T.idb.all('queue')).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
   const lastScoreByCourt=new Map();let changed=0;
   const save=async item=>{await T.idb.put('queue',item);changed++};
   // Keep all event/commentary/audit rows, but only one activeMatches snapshot per scoring phase.
   // A non-SCORE write to the same court (start/next-set/reset/finish) is a hard boundary.
   for(const item of items){
     const type=String(item?.meta?.type||'').toUpperCase();
     const entries=Object.entries(item.updates||{});
     const activeEntries=entries.filter(([k])=>!!activePathCourt(k));
     if(type==='SCORE'&&activeEntries.length){
       for(const [k] of activeEntries){
         const court=activePathCourt(k),prev=lastScoreByCourt.get(court);
         if(prev&&prev.id!==item.id&&Object.prototype.hasOwnProperty.call(prev.updates||{},prev.key)){
           delete prev.updates[prev.key];prev.meta={...(prev.meta||{}),h22SnapshotCompacted:true};await save(prev.item);
         }
         lastScoreByCourt.set(court,{id:item.id,item,key:k,updates:item.updates});
       }
       continue;
     }
     if(activeEntries.length){
       for(const [k] of activeEntries){
         const court=activePathCourt(k),prev=lastScoreByCourt.get(court);
         // The boundary already contains the authoritative court state (or null on finish),
         // so the preceding score snapshot is redundant and must not replay visually.
         if(prev&&Object.prototype.hasOwnProperty.call(prev.updates||{},prev.key)){
           delete prev.updates[prev.key];prev.meta={...(prev.meta||{}),h22SnapshotCompacted:true,h22Boundary:type||'ACTIVE_WRITE'};await save(prev.item);
         }
         lastScoreByCourt.delete(court);
       }
     }
   }
   shadow.lastCoalesced=changed;
   if(changed)await Data.refreshQueueStats?.();
   return changed>0;
 }
 async function queueTouches(pathRegex){const q=await T.idb.all('queue');return q.some(it=>Object.keys(it.updates||{}).some(k=>pathRegex.test(k)))}
 async function reconcileAck(){
   // Clear a shadow only after Firebase contains the same/final state and no queued write still owns it.
   for(const [court,s] of Object.entries({...shadow.active})){
     if(await queueTouches(new RegExp(`/activeMatches/${court}$`)))continue;
     try{const remote=(await Data.ref('activeMatches/'+court).once('value')).val();const same=s==null?remote==null:(remote&&remote.matchId===s.matchId&&(Number(remote.version)||0)>=(Number(s.version)||0));if(same)delete shadow.active[court]}catch{}
   }
   for(const [id,m] of Object.entries({...shadow.finished})){
     if(await queueTouches(new RegExp(`/matches/${id}$`)))continue;
     try{const remote=(await Data.ref('matches/'+id).once('value')).val();if(remote&&String(remote.status||'').toUpperCase()==='FINISHED'&&String(remote.winnerId||'')===String(m.winnerId||''))delete shadow.finished[id]}catch{}
   }
   await persistShadow();
 }
 const baseFlush=Data.flushQueue.bind(Data);
 Data.flushQueue=async function(opts={}){
   if(shadow.flushing)return baseFlush(opts); // production hardening still serializes underlying drains
   shadow.flushing=true;
   try{
     restoreState();
     await coalesceConsecutiveScores();
     const out=await baseFlush(opts);
     restoreState();
     if(this.connected)setTimeout(()=>reconcileAck().catch(()=>{}),220);
     return out;
   }finally{shadow.flushing=false}
 };
 // If a match is finished offline, keep it FINISHED locally and remove it from the court immediately.
 const baseEnd=App.endMatch?.bind(App);
 if(baseEnd&&!App.__h22End){App.__h22End=true;App.endMatch=async function(...args){const court=this.currentCourt,s0=clone(this.state.activeMatches?.[court]),mid=s0?.matchId;const out=await baseEnd(...args);if(mid){const q=await T.idb.all('queue');for(const item of q){if(String(item?.meta?.type||'').toUpperCase()!=='MATCH_FINISHED')continue;applyUpdatesToShadow(item.updates||{})}restoreState();this.renderMatches?.();this.renderUmpire?.();}return out}}
 // Reapply shadow whenever the browser/network says it is reconnecting; do not let stale server state flash first.
 addEventListener('online',()=>{restoreState();setTimeout(()=>{restoreState();App.renderUmpire?.();},0)},{passive:true});
 const oldHealth=App.renderHealth?.bind(App);
 if(oldHealth&&!App.__h22Health){App.__h22Health=true;App.renderHealth=function(...args){const out=oldHealth(...args);let el=document.getElementById('tk-h22-health');const host=document.getElementById('page-health')?.querySelector('.card:last-of-type')||document.getElementById('page-health');if(host&&!el){el=document.createElement('div');el.id='tk-h22-health';el.className='note';el.style.marginTop='10px';host.appendChild(el)}if(el){const a=Object.keys(shadow.active).length,f=Object.keys(shadow.finished).length;el.textContent=`Offline reconcile: ${a} sân snapshot · ${f} trận kết thúc chờ xác nhận · coalesce gần nhất ${shadow.lastCoalesced||0} điểm.`}return out}}
 function stamp(){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild='upgrade122-hotfix33';const h=document.getElementById('health-version');if(h)h.textContent=VERSION}
 loadShadow().then(()=>{restoreState();App.renderAll?.();}).catch(()=>{});stamp();setTimeout(stamp,800);
 window.TopkeyUpgrade122Hotfix22={installed:true,VERSION,CACHE_TAG,state:shadow,restoreState,coalesceConsecutiveScores,reconcileAck,applyUpdatesToShadow};
}
boot();
})();
