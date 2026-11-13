/* TOPKEY Badminton fast-start H124.
 * Only background the housekeeping reads invoked by App.afterLogin.
 * NEVER skip Firebase Auth, profile validation or permission gates.
 * Intentionally do not change subscriptions, scoring, navigation, or sign-in persistence.
 */
(()=>{'use strict';
const T=window.Topkey,app=T?.App;
if(!app||!T?.Auth||window.TopkeyBadmintonFastStart124?.installed)return;
const jobs=new Map();
let epoch=0;
const delay=callback=>{
  if(typeof requestIdleCallback==='function')return requestIdleCallback(callback,{timeout:1500});
  return setTimeout(callback,120);
};
function deferredMethod(name){
 const original=app[name];
 if(typeof original!=='function')return;
 app[name]=function(...args){
  const uid=T.Auth?.user?.uid||T.Data?.auth?.currentUser?.uid||'';
  // Only after the server profile has been verified. No cached permission shortcuts.
  if(!uid||T.Auth?._profileVerifiedUid!==uid)return original.apply(this,args);
  const key=uid+'|'+name;
  if(jobs.has(key))return Promise.resolve();
  const token=epoch;
  jobs.set(key,'scheduled');
  delay(()=>{
   if(token!==epoch||T.Auth?._profileVerifiedUid!==uid||T.Data?.auth?.currentUser?.uid!==uid){
    jobs.delete(key);return;
   }
   Promise.resolve().then(()=>original.apply(app,args)).then(()=>{
    jobs.set(key,'done');
   }).catch(error=>{
    jobs.delete(key);
    console.warn('TOPKEY background '+name+' deferred:',error?.message||error);
   });
  });
  return Promise.resolve();
 };
}
deferredMethod('ensureSchema');
deferredMethod('seedIfEmpty');
/* First authenticated view should render only the visible tab.
   Previous App.renderAll loops over every module (finance, audit, courts,
   matches, etc.) synchronously before the user opens any of those tabs.
   Subsequent explicit refreshes still use the original function. */
const firstFullRender=app.renderAll;
let initialRenderReduced=false;
if(typeof firstFullRender==='function'&&!app.__firstViewLightweight){
 app.__firstViewLightweight=true;
 app.renderAll=function(...args){
  if(initialRenderReduced)return firstFullRender.apply(this,args);
  const uid=T.Auth?._profileVerifiedUid;
  if(!uid||uid!==T.Data?.auth?.currentUser?.uid)return firstFullRender.apply(this,args);
  initialRenderReduced=true;
  const tab=String(this.currentTab||'overview');
  const routine=window.TopkeyCoreDataRuntime115?.renderTabFromCache;
  if(typeof routine==='function'){
   try{routine(tab);return} catch(e){console.warn('TOPKEY initial tab render fallback',e)}
  }
  // Always render active content when core tab router is not yet present.
  const basic={
   overview:['renderOverview'],teams:['renderTeams','renderCheckin','renderRegistrations'],
   schedule:['renderMatches','renderStandings'],control:['renderControl'],
   umpire:['renderUmpire'],live:['renderLiveScore'],finance:['renderFinance'],
   announcements:['renderAnnouncements'],audit:['renderAudit'],
   settings:['renderConfig','renderUsers'],health:['renderHealth']
  };
  for(const method of basic[tab]||['renderOverview'])try{this[method]?.()}catch(e){console.warn('TOPKEY initial render',method,e)}
 };
}

// A Firestore/RTDB burst may update many branches in one animation frame.
// The legacy renderBranch() calls renderOverview() on each branch change,
// which redundantly rebuilds the dashboard and can stall every button press.
const renderOverviewBase=app.renderOverview;
let overviewPending=false,overviewRequested=0,overviewFlushed=0;
if(typeof renderOverviewBase==='function'&&!app.__fastStartOverviewCoalesced){
 app.__fastStartOverviewCoalesced=true;
 app.renderOverview=function(...args){
  if(String(this.currentTab||'overview')!=='overview')return;
  overviewRequested++;
  if(overviewPending)return;
  overviewPending=true;
  const run=()=>{
   overviewPending=false;
   if(String(app.currentTab||'overview')!=='overview')return;
   overviewFlushed++;
   try{renderOverviewBase.apply(app,args)}catch(error){console.warn('TOPKEY overview refresh:',error)}
  };
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);
  else setTimeout(run,16);
 };
}

const originalLogout=T.Auth.logout?.bind(T.Auth);
if(originalLogout&&!T.Auth.__fastStartLogoutWrapped){
 T.Auth.__fastStartLogoutWrapped=true;
 T.Auth.logout=async function(...args){epoch++;jobs.clear();return originalLogout(...args)};
}
window.TopkeyBadmintonFastStart124=Object.freeze({installed:true,contract:'AFTER_LOGIN_HOUSEKEEPING_NONBLOCKING',get pending(){return [...jobs.entries()].filter(([,v])=>v==='scheduled').length},get overviewRequested(){return overviewRequested},get overviewFlushed(){return overviewFlushed}});
})();