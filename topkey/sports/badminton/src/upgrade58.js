(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade58Installed)return;
App.__upgrade58Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade58-match-focus-pwa';
const CACHE_TAG='u58-20261029';
const BUILD='upgrade58';
const $=id=>document.getElementById(id);
let scoreFocus=false,nativeFullscreen=false;

function stamp(){
  T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
  document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;
}
function ensureExit(){
  let b=$('tk58-focus-exit');if(b)return b;
  b=document.createElement('button');b.id='tk58-focus-exit';b.type='button';b.title='Thu nhỏ màn hình trọng tài';b.setAttribute('aria-label','Thu nhỏ màn hình trọng tài');b.textContent='↙';
  b.addEventListener('click',()=>exitScoreFocus());document.body.appendChild(b);return b;
}
function applyScoreFocus(on){
  scoreFocus=!!on;
  document.documentElement.classList.toggle('tk58-score-focus',scoreFocus);
  document.body.classList.toggle('tk58-score-focus',scoreFocus);
  // Disable Upgrade57's broader focus layout; Upgrade58 owns the match-only view.
  document.documentElement.classList.toggle('tk57-referee-focus',false);
  document.body.classList.toggle('tk57-referee-focus',false);
  ensureExit();
  if(scoreFocus){try{scrollTo(0,0)}catch{}setTimeout(()=>App.renderUmpire?.(),0)}
}
async function enterScoreFocus(){
  const s=App.state?.activeMatches?.[App.currentCourt];
  if(!s)return false;
  applyScoreFocus(true);
  if(!document.fullscreenElement&&document.documentElement.requestFullscreen){
    try{try{await document.documentElement.requestFullscreen({navigationUI:'hide'})}catch{await document.documentElement.requestFullscreen()}nativeFullscreen=true}catch(e){nativeFullscreen=false;console.info('Upgrade58 native fullscreen unavailable; using match focus viewport.',e?.message||e)}
  }
  return true;
}
async function exitScoreFocus({exitNative=true}={}){
  applyScoreFocus(false);
  if(exitNative&&document.fullscreenElement&&document.exitFullscreen){try{await document.exitFullscreen()}catch{}}
  nativeFullscreen=false;
}

// Start Match is the only automatic entry point: immediately switch from setup controls to score/court/actions.
const baseStart=App.startUmpire?.bind(App);
if(baseStart)App.startUmpire=async function(...args){
  const s=this.state?.activeMatches?.[this.currentCourt];
  if(!s)return baseStart(...args);
  // Called while the Start button still owns a user gesture, so Android can grant native fullscreen.
  const focusPromise=enterScoreFocus();
  try{return await baseStart(...args)}catch(e){await exitScoreFocus();throw e}finally{focusPromise?.catch?.(()=>{})}
};

// Manual Upgrade57 button becomes a preview/exit control, but the normal flow is Start Match -> focus.
function patch57Button(){
  const b=$('tk57-referee-focus-btn');if(!b)return;
  // Upgrade58 makes focus automatic after Start Match; disable the old manual trigger to avoid two fullscreen controllers.
  b.textContent='⛶ Tự động sau Bắt đầu';b.title='Sau khi bấm Bắt đầu trận, màn hình tự chuyển sang chế độ chỉ chấm điểm';
  b.disabled=true;b.onclick=null;
}

// Leaving the referee tab or ending the match returns to the normal shell.
const baseShowTab=App.showTab?.bind(App);
if(baseShowTab)App.showTab=function(tab,...args){if(tab!=='umpire'&&scoreFocus)exitScoreFocus();const out=baseShowTab(tab,...args);if(tab==='umpire')setTimeout(patch57Button,0);return out};
const baseEnd=App.endMatch?.bind(App);
if(baseEnd)App.endMatch=async function(...args){const out=await baseEnd(...args);if(scoreFocus)await exitScoreFocus();return out};

document.addEventListener('fullscreenchange',()=>{if(nativeFullscreen&&!document.fullscreenElement&&scoreFocus){nativeFullscreen=false;applyScoreFocus(false)}});

function isStandalone(){return matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true}
function installNote(text,kind=''){
  const host=document.querySelector('.top-actions');if(!host)return;
  let n=$('tk58-install-note');if(!n){n=document.createElement('small');n.id='tk58-install-note';n.className='tk58-install-note';host.appendChild(n)}
  n.className='tk58-install-note'+(kind?' '+kind:'');n.textContent=text;
}
function syncInstallUi(){
  const b=$('tk53-install');if(!b)return;
  if(isStandalone()){b.textContent='✓ TOPKEY đang chạy dạng ứng dụng';b.disabled=true;installNote('Đã mở từ ứng dụng Android/PWA.','ok')}
}
window.addEventListener('appinstalled',()=>{
  const b=$('tk53-install');if(b){b.textContent='✓ TOPKEY đã cài';b.disabled=true}
  installNote('Đã cài TOPKEY Badminton VNext. Trên Android, tìm “TOPKEY Badminton” trong danh sách ứng dụng; nếu muốn icon ngoài màn hình chính, giữ icon và chọn Thêm vào Màn hình chính.','ok');
  try{U.toast('TOPKEY đã cài. Tìm TOPKEY Badminton trong danh sách ứng dụng Android.','ok')}catch{}
});

const baseHealth=App.renderHealth?.bind(App);
if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade58 SW',e)}}
function install(){stamp();ensureExit();patch57Button();syncInstallUi();setTimeout(()=>{stamp();patch57Button();syncInstallUi()},0);setTimeout(()=>{patch57Button();syncInstallUi()},900);refreshSW()}
install();
window.addEventListener('focus',()=>{stamp();syncInstallUi();refreshSW()},{passive:true});
window.TopkeyUpgrade58={installed:true,VERSION,CACHE_TAG,BUILD,enterScoreFocus,exitScoreFocus,isStandalone};
})();
