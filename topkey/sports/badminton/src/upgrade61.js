(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U58=window.TopkeyUpgrade58;
if(!T||!App||!U||!U58?.enterScoreFocus||App.__upgrade61Installed)return;
App.__upgrade61Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade61-manual-refocus';
const CACHE_TAG='u61-20261029';
const BUILD='upgrade61';
const $=id=>document.getElementById(id);

function stamp(){
  T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
  document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;
}
function activeStartedMatch(){
  const s=App.state?.activeMatches?.[App.currentCourt];
  return s?.started?s:null;
}
function manualRefocus(){
  const s=activeStartedMatch();
  if(!s){try{U.toast('Bắt đầu trận trước khi mở toàn màn hình chấm điểm.','info')}catch{};return false}
  U58.enterScoreFocus().catch(e=>{try{U.toast('Không mở được toàn màn hình: '+String(e?.message||e),'err')}catch{}});
  return true;
}
function patchFocusButton(){
  let b=$('tk57-referee-focus-btn');if(!b)return;
  // Upgrade57 attached its own broad-focus listener when this button was created.
  // Replace the node once so the button has exactly one Upgrade61 action: re-enter match focus.
  if(b.dataset.tk61ManualRefocus!=='1'){
    const n=b.cloneNode(true);
    n.dataset.tk61ManualRefocus='1';
    b.replaceWith(n);b=n;
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();manualRefocus()});
  }
  const ready=!!activeStartedMatch();
  b.disabled=!ready;
  b.textContent='⛶ Toàn màn hình';
  b.title=ready?'Mở lại màn hình chấm điểm toàn màn hình':'Bắt đầu trận trước; lần đầu hệ thống sẽ tự vào toàn màn hình';
  b.setAttribute('aria-pressed','false');
  b.classList.remove('ok');b.classList.add('primary');
}
function schedulePatch(){setTimeout(patchFocusButton,0);setTimeout(patchFocusButton,40);setTimeout(patchFocusButton,250)}

// Upgrade58 still auto-enters Match Focus only on the Start Match user action.
// Returning to the Referee tab never auto-enters; the user explicitly presses Fullscreen.
const baseShowTab=App.showTab?.bind(App);
if(baseShowTab)App.showTab=function(tab,...args){
  const out=baseShowTab(tab,...args);
  if(tab==='umpire')schedulePatch();
  return out;
};
const baseRender=App.renderUmpire?.bind(App);
if(baseRender)App.renderUmpire=function(...args){const out=baseRender(...args);schedulePatch();return out};
const baseStart=App.startUmpire?.bind(App);
if(baseStart)App.startUmpire=async function(...args){const out=await baseStart(...args);schedulePatch();return out};
const baseEnd=App.endMatch?.bind(App);
if(baseEnd)App.endMatch=async function(...args){const out=await baseEnd(...args);schedulePatch();return out};
const baseHealth=App.renderHealth?.bind(App);
if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out};

async function refreshSW(){
  if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;
  try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade61 SW refresh',e)}
}
function install(){stamp();schedulePatch();refreshSW();setTimeout(()=>{stamp();schedulePatch()},900)}
install();
window.addEventListener('focus',()=>{stamp();schedulePatch();refreshSW()},{passive:true});
window.addEventListener('pageshow',schedulePatch,{passive:true});
window.TopkeyUpgrade61={installed:true,VERSION,CACHE_TAG,BUILD,activeStartedMatch,manualRefocus,patchFocusButton};
})();
