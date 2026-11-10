(() => {
'use strict';
const T=window.Topkey,App=T?.App;
if(!T||!App||App.__upgrade74Installed)return;
App.__upgrade74Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade74-mobile-score-contract-registry';
const CACHE_TAG='u74-20261029',BUILD='upgrade74';

function viewport(){const vv=window.visualViewport;return{w:Math.round(vv?.width||innerWidth||document.documentElement.clientWidth||0),h:Math.round(vv?.height||innerHeight||document.documentElement.clientHeight||0)};}
function scoreVisibility(){
  const head=document.querySelector('#umpire-board>.score-head');
  if(!head)return{ok:true,reason:'no-score-head'};
  const v=viewport(),parts=[head.children[0],head.children[2]].filter(Boolean),tol=2;
  const rects=parts.map(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width}});
  const ok=rects.every(r=>r.left>=-tol&&r.right<=v.w+tol&&r.width>0);
  document.body?.classList.toggle('tk74-score-overflow',!ok);
  return{ok,viewport:v,rects};
}
function guard(){requestAnimationFrame(()=>{const r=scoreVisibility();if(!r.ok)console.warn('Upgrade74 MOBILE_SCORE_001 guard detected overflow',r);});}
function stamp(){
  T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
  document.documentElement.dataset.topkeyBuild=BUILD;
  const h=document.getElementById('health-version');if(h)h.textContent=VERSION;
  document.querySelectorAll('#page-health .version-badge,#page-health .upgrade-version,#page-health [data-version-badge],#tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);
  guard();
}
const baseRender=App.renderUmpire?.bind(App);if(baseRender)App.renderUmpire=function(...args){const out=baseRender(...args);guard();return out;};
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out;};
let raf=0;const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{stamp();guard();});};
window.addEventListener('resize',schedule,{passive:true});window.addEventListener('orientationchange',schedule,{passive:true});document.addEventListener('fullscreenchange',schedule,{passive:true});window.visualViewport?.addEventListener('resize',schedule,{passive:true});
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade74 SW refresh',e)}}
stamp();refreshSW();setTimeout(stamp,100);
window.TopkeyUpgrade74={installed:true,VERSION,CACHE_TAG,BUILD,viewport,scoreVisibility,contracts:['MOBILE_SCORE_001','PACKAGE_HISTORY_001']};
})();
