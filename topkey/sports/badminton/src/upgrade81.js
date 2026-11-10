(() => {
'use strict';
const T=window.Topkey,App=T?.App,U77=window.TopkeyUpgrade77,U80=window.TopkeyUpgrade80;
if(!T||!App||!U77||!U80||App.__upgrade81Installed)return;
App.__upgrade81Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade81-continuous-replay-10s';
const CACHE_TAG='u81-20261029',BUILD='upgrade81';
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
document.documentElement.dataset.topkeyBuild=BUILD;
function stamp(){
  const h=document.getElementById('health-version');
  if(h)h.textContent=VERSION;
  const line=document.getElementById('tk77-status');
  if(line)line.dataset.replayContract='continuous-10s';
}
const baseHealth=App.renderHealth?.bind(App);
if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out};
setTimeout(stamp,0);setTimeout(stamp,900);
try{navigator.serviceWorker?.getRegistration?.('./').then(r=>r?.update?.()).catch(()=>{})}catch{}
window.TopkeyUpgrade81={installed:true,VERSION,CACHE_TAG,BUILD,targetReplayMs:10000,preMs:U77.PRE_MS,postMs:U77.POST_MS,segmentMs:U77.SEGMENT_MS,contract:'CONTINUOUS_REPLAY_001'};
})();
