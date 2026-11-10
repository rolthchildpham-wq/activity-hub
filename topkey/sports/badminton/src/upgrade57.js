(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade57Installed)return;
App.__upgrade57Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade57-referee-focus';
const CACHE_TAG='u57-20261029';
const BUILD='upgrade57';
const $=id=>document.getElementById(id);
let focus=false,nativeFullscreen=false;

function stamp(){
  T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
  document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;
}
function viewportInfo(){
  const vv=window.visualViewport,w=Math.round(vv?.width||innerWidth||document.documentElement.clientWidth||0),h=Math.round(vv?.height||innerHeight||document.documentElement.clientHeight||0);
  const orientation=w>=h?'ngang':'dọc';
  const profile=(w>=1400&&h>=800)?'màn lớn':(w>=900?'laptop/tablet lớn':(w>=600?'tablet':'điện thoại'));
  document.documentElement.dataset.refereeViewport=`${w}x${h}`;
  document.documentElement.dataset.refereeOrientation=orientation;
  return {w,h,orientation,profile};
}
function updateViewportLabel(){
  const v=viewportInfo(),el=$('tk57-referee-screen');
  if(el)el.textContent=`Tự nhận diện: ${v.w}×${v.h} · ${v.profile} · ${v.orientation}`;
}
function markFields(){
  $('umpire-match')?.closest('.field')?.classList.add('tk57-match-field');
  $('umpire-court')?.closest('.field')?.classList.add('tk57-court-field');
}
function ensureToolbar(){
  const page=$('page-umpire'),card=page?.querySelector(':scope > .card');if(!card)return;
  markFields();
  let bar=$('tk57-referee-toolbar');
  if(!bar){
    bar=document.createElement('div');bar.id='tk57-referee-toolbar';bar.className='tk57-referee-toolbar';
    bar.innerHTML='<div class="tk57-referee-toolbar-main"><span class="tk57-referee-icon">🏸</span><div class="tk57-referee-copy"><strong>Màn hình Trọng tài</strong><small id="tk57-referee-screen" class="tk57-referee-toolbar-copy-wide">Tự nhận diện kích thước màn hình</small></div></div><button id="tk57-referee-focus-btn" type="button" class="btn primary" aria-pressed="false">⛶ Toàn màn hình</button>';
    card.insertBefore(bar,card.firstChild);
    $('tk57-referee-focus-btn').addEventListener('click',()=>toggleFocus());
  }
  updateViewportLabel();syncButton();
}
function syncButton(){
  const b=$('tk57-referee-focus-btn');if(!b)return;
  b.textContent=focus?'↙ Thu nhỏ':'⛶ Toàn màn hình';b.classList.toggle('ok',focus);b.classList.toggle('primary',!focus);b.setAttribute('aria-pressed',focus?'true':'false');
  b.title=focus?'Thoát chế độ chỉ dành cho trọng tài':'Ẩn menu và mở bảng chấm điểm toàn màn hình';
}
function applyFocus(on){
  focus=!!on;
  document.documentElement.classList.toggle('tk57-referee-focus',focus);
  document.body.classList.toggle('tk57-referee-focus',focus);
  syncButton();updateViewportLabel();
  if(focus){try{scrollTo(0,0)}catch{}setTimeout(()=>App.renderUmpire?.(),0)}
}
async function enterFocus(){
  ensureToolbar();applyFocus(true);
  const root=document.documentElement;
  if(!document.fullscreenElement&&root.requestFullscreen){
    try{try{await root.requestFullscreen({navigationUI:'hide'})}catch{await root.requestFullscreen()}nativeFullscreen=true}catch(e){nativeFullscreen=false;console.info('Upgrade57 native fullscreen unavailable; using viewport focus mode.',e?.message||e)}
  }
}
async function exitFocus({exitNative=true}={}){
  applyFocus(false);
  if(exitNative&&document.fullscreenElement&&document.exitFullscreen){try{await document.exitFullscreen()}catch{}}
  nativeFullscreen=false;
}
function toggleFocus(){return focus?exitFocus():enterFocus()}

document.addEventListener('fullscreenchange',()=>{
  if(nativeFullscreen&&!document.fullscreenElement&&focus){nativeFullscreen=false;applyFocus(false)}
  updateViewportLabel();
});
addEventListener('resize',updateViewportLabel,{passive:true});
window.visualViewport?.addEventListener('resize',updateViewportLabel,{passive:true});
window.visualViewport?.addEventListener('scroll',updateViewportLabel,{passive:true});

const baseShowTab=App.showTab?.bind(App);
if(baseShowTab)App.showTab=function(tab,...args){if(tab!=='umpire'&&focus)exitFocus();const out=baseShowTab(tab,...args);if(tab==='umpire')setTimeout(()=>{ensureToolbar();updateViewportLabel()},0);return out};
const baseRender=App.renderUmpire?.bind(App);
if(baseRender)App.renderUmpire=function(...args){const out=baseRender(...args);ensureToolbar();return out};
const baseHealth=App.renderHealth?.bind(App);
if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out};

async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade57 SW',e)}}
function install(){stamp();ensureToolbar();setTimeout(()=>{stamp();ensureToolbar();markFields()},0);setTimeout(()=>{ensureToolbar();updateViewportLabel()},900);refreshSW()}
install();
window.TopkeyUpgrade57={installed:true,VERSION,CACHE_TAG,BUILD,enterFocus,exitFocus,toggleFocus,viewportInfo};
})();
