(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U77=window.TopkeyUpgrade77,U84=window.TopkeyUpgrade84;
if(!T||!App||!U||!U77||!U84||App.__upgrade85Installed)return;
App.__upgrade85Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade85-disk-lazy-replay';
const CACHE_TAG='u85-20261029',BUILD='upgrade85';
const libs=new Map();
function loadScriptOnce(src,globalName){
  if(globalName&&window[globalName])return Promise.resolve(window[globalName]);
  if(libs.has(src))return libs.get(src);
  const p=new Promise((resolve,reject)=>{
    const existing=[...document.scripts].find(s=>s.src===src);
    if(existing){existing.addEventListener('load',()=>resolve(globalName?window[globalName]:true),{once:true});existing.addEventListener('error',()=>reject(new Error('Không tải được '+src)),{once:true});return}
    const s=document.createElement('script');s.src=src;s.async=true;s.crossOrigin='anonymous';s.onload=()=>resolve(globalName?window[globalName]:true);s.onerror=()=>reject(new Error('Không tải được thư viện'));document.head.appendChild(s)
  });libs.set(src,p);return p
}
const ensureJSZip=()=>loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js','JSZip');
const ensureHls=()=>loadScriptOnce('https://cdn.jsdelivr.net/npm/hls.js@1','Hls');
window.TopkeyLazyLibs={...(window.TopkeyLazyLibs||{}),ensureJSZip,ensureHls,loadScriptOnce};
const baseLoadStream=App.loadStream?.bind(App);
if(baseLoadStream)App.loadStream=function(type,url){
  if(type==='HLS'&&!window.Hls){
    const fallback=document.getElementById('stream-fallback');if(fallback){fallback.classList.remove('hidden');fallback.textContent='Đang nạp HLS khi cần…'}
    ensureHls().then(()=>{if(fallback)fallback.classList.add('hidden');baseLoadStream(type,url)}).catch(e=>{if(fallback){fallback.classList.remove('hidden');fallback.textContent='Không tải được HLS.js.'}U.toast('Không tải được HLS.js: '+(e?.message||e),'err')});return
  }
  return baseLoadStream(type,url)
};
const baseFinanceZip=App.exportFinanceZip?.bind(App);
if(baseFinanceZip)App.exportFinanceZip=async function(...args){if(!window.JSZip)await ensureJSZip();return baseFinanceZip(...args)};
function stamp(){
  T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=document.getElementById('health-version');if(h)h.textContent=VERSION;
  const s=document.getElementById('tk77-status');if(s){s.dataset.replayStorage='disk-lazy';s.dataset.replayPlayback='single-segment-url';s.dataset.startupGuard='u85'}
}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out};
stamp();setTimeout(stamp,0);setTimeout(stamp,700);
try{navigator.serviceWorker?.getRegistration?.('./').then(r=>r?.update?.()).catch(()=>{})}catch{}
window.TopkeyUpgrade85={installed:true,VERSION,CACHE_TAG,BUILD,ensureJSZip,ensureHls,contracts:['REPLAY_DISK_LAZY_001','STARTUP_PERFORMANCE_001']};
})();
