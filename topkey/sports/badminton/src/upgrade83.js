(() => {
'use strict';
const T=window.Topkey,App=T?.App,U77=window.TopkeyUpgrade77,U82=window.TopkeyUpgrade82;
if(!T||!App||!U77||!U82||App.__upgrade83Installed)return;
App.__upgrade83Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade83-replay-performance-guard';
const CACHE_TAG='u83-20261029',BUILD='upgrade83';
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
document.documentElement.dataset.topkeyBuild=BUILD;
function stamp(){
  const h=document.getElementById('health-version');if(h)h.textContent=VERSION;
  const s=document.getElementById('tk77-status');if(s){s.dataset.replayPerformance='guarded';s.dataset.replayRamList=String(U77.LIST_CLIPS||8);s.dataset.replayDbMax=String(U77.MAX_CLIPS||24)}
}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out};
stamp();setTimeout(stamp,0);setTimeout(stamp,700);
try{navigator.serviceWorker?.getRegistration?.('./').then(r=>r?.update?.()).catch(()=>{})}catch{}
window.TopkeyUpgrade83={installed:true,VERSION,CACHE_TAG,BUILD,ramListLimit:U77.LIST_CLIPS||8,dbClipLimit:U77.MAX_CLIPS||24,contract:'REPLAY_PERFORMANCE_001'};
})();
