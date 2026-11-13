/* TOPKEY H133: keep rapid tab clicks responsive by splitting heavy renders.
 * Pure presentation scheduler. No Firebase listener, auth, or writes are touched.
 */
(()=>{'use strict';
const T=window.Topkey,app=T?.App,core=window.TopkeyCoreDataRuntime115;
if(!app||!T?.Auth||!core||window.TopkeyTabPerf133?.installed)return;
const metrics={requests:0,cancelled:0,completed:0,longRenders:0,maxRenderMs:0,lastTab:'',byMethod:{}};
let sequence=0;
const raf=window.requestAnimationFrame?.bind(window)||((fn)=>setTimeout(fn,16));
const allowed=()=>Boolean(T.Auth?._profileVerifiedUid&&T.Auth?._profileVerifiedUid===T.Data?.auth?.currentUser?.uid);
const plans={
 schedule:['renderMatches','renderStandings','renderSelectors','renderSchedulerControls'],
 umpire:['renderUmpire','renderSelectors'],
 teams:['renderTeams','renderCheckin','renderRegistrations'],
 control:['renderControl','renderSelectors'],
 settings:['renderConfig','renderUsers']
};
const original=core.renderTabFromCache;
function schedule(tab){
 tab=String(tab||app.currentTab||'overview');
 metrics.requests++;metrics.lastTab=tab;
 const id=++sequence;
 if(!allowed())return original(tab);
 const steps=plans[tab];
 if(!steps)return original(tab);
 const next=(index)=>{
  raf(()=>{
   if(id!==sequence||String(app.currentTab||'overview')!==tab||!allowed()){
    metrics.cancelled++;return;
   }
   const name=steps[index],fn=app[name];
   if(typeof fn==='function'){
    const now=()=>window.performance?.now?.()||Date.now(),start=now();
    try{fn.call(app)}catch(error){console.warn('TOPKEY H133 tab render',tab,name,error)}
    const ms=Math.max(0,Math.round(now()-start));
    const m=metrics.byMethod[name]||(metrics.byMethod[name]={calls:0,maxMs:0});
    m.calls++;m.maxMs=Math.max(m.maxMs,ms);
    metrics.maxRenderMs=Math.max(metrics.maxRenderMs,ms);
    if(ms>=50)metrics.longRenders++;
   }
   if(index+1<steps.length)next(index+1);else metrics.completed++;
  });
 };
 next(0);
}
core.renderTabFromCache=schedule;
const originalShow=app.showTab;
if(typeof originalShow==='function'){
 app.showTab=function(tab,...args){
  // Cancel all previous tab subrender jobs before synchronous nav commit.
  sequence++;
  return originalShow.call(this,tab,...args);
 };
}
window.TopkeyTabPerf133=Object.freeze({
 installed:true,contract:'CANCELLABLE_INCREMENTAL_RENDER_BY_ACTIVE_TAB',
 get snapshot(){return JSON.parse(JSON.stringify(metrics))},
 cancel(){sequence++}
});
})();