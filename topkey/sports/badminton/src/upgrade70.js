(() => {
'use strict';
const T=window.Topkey,App=T?.App;
if(!T||!App||App.__upgrade70Installed)return;
App.__upgrade70Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade70-responsive-referee-fullscreen';
const CACHE_TAG='u70-20261029',BUILD='upgrade70';

function viewportKind(){
  const vv=window.visualViewport,w=Math.round(vv?.width||innerWidth||document.documentElement.clientWidth||0),h=Math.round(vv?.height||innerHeight||document.documentElement.clientHeight||0),land=w>h;
  let kind='desktop';
  if(!land&&w<=430)kind='phone-portrait';
  else if(!land&&w<=900)kind='tablet-portrait';
  else if(land&&h<=500)kind='phone-landscape';
  else if(land&&h<=650)kind='compact-landscape';
  else if(w>=1600&&w/h>=2.05)kind='ultrawide';
  else if(w>=1280&&h>=720)kind='desktop-large';
  else if(w<=1100)kind='tablet';
  return{kind,w,h,landscape:land};
}
function syncViewport(){
  const v=viewportKind(),root=document.documentElement,body=document.body;
  root.dataset.tk70Viewport=v.kind;root.dataset.tk70Width=String(v.w);root.dataset.tk70Height=String(v.h);
  if(body){body.dataset.tk70Viewport=v.kind;body.style.setProperty('--tk70-vwpx',`${v.w/100}px`);body.style.setProperty('--tk70-vhpx',`${v.h/100}px`);}
  return v;
}
let raf=0;function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(syncViewport);}
window.addEventListener('resize',schedule,{passive:true});window.addEventListener('orientationchange',schedule,{passive:true});document.addEventListener('fullscreenchange',schedule,{passive:true});window.visualViewport?.addEventListener('resize',schedule,{passive:true});

function stamp(){
  T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=document.getElementById('health-version');if(h)h.textContent=VERSION;
  document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);
  syncViewport();
}
const baseRender=App.renderUmpire?.bind(App);if(baseRender)App.renderUmpire=function(...args){const out=baseRender(...args);syncViewport();return out;};
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out;};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade70 SW refresh',e)}}
function install(){stamp();refreshSW();setTimeout(stamp,80)}
install();window.addEventListener('focus',()=>{stamp();refreshSW()},{passive:true});
window.TopkeyUpgrade70={installed:true,VERSION,CACHE_TAG,BUILD,viewportKind,syncViewport};
})();
