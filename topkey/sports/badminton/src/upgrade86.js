(() => {
'use strict';
const T=window.Topkey,App=T?.App,U84=window.TopkeyUpgrade84,U85=window.TopkeyUpgrade85;
if(!T||!App||!U84||!U85||App.__upgrade86Installed)return;
App.__upgrade86Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade86-live-layout-race-guard';
const CACHE_TAG='u86-20261029',BUILD='upgrade86';
const $=id=>document.getElementById(id);
let pending=false,observer=null;
function ensureLayout(){
  try{U84.ensureLayout?.()}catch{}
  const page=$('page-live'),left=$('tk84-live-left'),viewer=$('tk84-viewer-card'),source=$('tk84-source-card'),replay=$('tk77-replay-card'),blv=$('tk84-blv-card'),grid=$('tk84-live-layout');
  if(!page||!left||!viewer||!source||!grid)return false;
  if(viewer.parentElement!==left)left.insertBefore(viewer,left.firstChild||null);
  if(source.parentElement!==left)left.appendChild(source);
  if(replay&&replay.parentElement!==left)left.appendChild(replay);
  if(blv&&blv.parentElement!==grid)grid.appendChild(blv);
  page.dataset.liveLayout='locked-u86';
  if(replay)replay.dataset.liveColumn='left';
  return !replay||replay.parentElement===left;
}
function queueEnsure(){
  if(pending)return;pending=true;
  requestAnimationFrame(()=>{pending=false;ensureLayout()});
}
function watchLateReplay(){
  const page=$('page-live');if(!page||observer)return;
  observer=new MutationObserver(records=>{
    if(records.some(r=>[...r.addedNodes].some(n=>n?.id==='tk77-replay-card'||n?.querySelector?.('#tk77-replay-card'))))queueEnsure();
  });
  // Deliberately observe only direct Live-page children: Upgrade77 lazily appends Replay here.
  // This avoids a whole-document/subtree observer and preserves Upgrade85 startup/performance guards.
  observer.observe(page,{childList:true});
}
function settle(){watchLateReplay();ensureLayout();setTimeout(ensureLayout,90);setTimeout(ensureLayout,240)}
const baseShowTab=App.showTab?.bind(App);if(baseShowTab)App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);if(tab==='live')settle();return out};
for(const name of ['startLocalCamera','startWebRTCBroadcast','startWebRTCViewer']){
  const base=App[name]?.bind(App);if(!base)continue;
  App[name]=async function(...args){const out=await base(...args);settle();return out};
}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out};
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=$('health-version');if(h)h.textContent=VERSION;if(App.currentTab==='live')settle()}
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade86 SW refresh',e)}}
stamp();setTimeout(stamp,0);setTimeout(stamp,700);refreshSW();
window.TopkeyUpgrade86={installed:true,VERSION,CACHE_TAG,BUILD,ensureLayout,settle,contract:'LIVE_LAYOUT_RACE_GUARD_001'};
})();
