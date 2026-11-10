(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U77=window.TopkeyUpgrade77,U83=window.TopkeyUpgrade83;
if(!T||!App||!U||!U77||!U83||App.__upgrade84Installed)return;
App.__upgrade84Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade84-live-first-focus';
const CACHE_TAG='u84-20261029',BUILD='upgrade84';
const $=id=>document.getElementById(id);
const state={focus:false,nativeRequested:false,scrollY:0};
function ensureLayout(){
  const page=$('page-live');if(!page)return false;
  const grid=page.querySelector(':scope > .grid.g3')||page.querySelector('.grid.g3');if(!grid)return false;
  const children=[...grid.children];let viewer=$('tk84-viewer-card')||children.find(x=>x.querySelector?.('#video-box'))||$('video-box')?.closest('.card');
  let blv=$('tk84-blv-card')||children.find(x=>x!==viewer&&x.querySelector?.('#auto-commentary'))||$('auto-commentary')?.closest('.card');
  const source=$('tk84-source-card')||$('stream-court')?.closest('.card'),replay=$('tk77-replay-card');
  if(!viewer||!blv||!source)return false;
  viewer.id='tk84-viewer-card';blv.id='tk84-blv-card';source.id='tk84-source-card';grid.id='tk84-live-layout';page.classList.add('tk84-live-ready');
  let left=$('tk84-live-left');if(!left){left=document.createElement('div');left.id='tk84-live-left';grid.insertBefore(left,viewer)}
  if(viewer.parentElement!==left)left.appendChild(viewer);
  if(source.parentElement!==left)left.appendChild(source);
  if(replay&&replay.parentElement!==left)left.appendChild(replay);
  if(blv.parentElement!==grid)grid.appendChild(blv);
  const bar=viewer.querySelector(':scope > .split .action-bar')||viewer.querySelector('.action-bar');
  if(bar&&!$('tk84-focus-open')){const b=document.createElement('button');b.id='tk84-focus-open';b.type='button';b.className='btn mini primary';b.textContent='↗ Mở màn Live';b.onclick=()=>enterLiveFocus({native:true,reason:'manual'});bar.appendChild(b)}
  if(bar&&!$('tk84-focus-exit')){const b=document.createElement('button');b.id='tk84-focus-exit';b.type='button';b.className='btn mini';b.textContent='↓ Thu nhỏ';b.onclick=()=>exitLiveFocus({exitNative:true,restoreScroll:true});bar.appendChild(b)}
  return true;
}
function tryNativeFullscreen(){
  const viewer=$('tk84-viewer-card');if(!viewer||document.fullscreenElement||!viewer.requestFullscreen)return;
  state.nativeRequested=true;
  try{const p=viewer.requestFullscreen({navigationUI:'hide'});p?.catch?.(()=>{try{viewer.requestFullscreen?.().catch?.(()=>{})}catch{}})}catch{try{viewer.requestFullscreen?.().catch?.(()=>{})}catch{}}
}
function enterLiveFocus({native=false,reason='manual'}={}){
  if(!ensureLayout())return false;
  if(!state.focus)state.scrollY=window.scrollY||0;state.focus=true;document.body.classList.add('tk84-live-focus');document.documentElement.classList.add('tk84-live-focus');
  const v=$('live-video');try{v?.play?.().catch(()=>{})}catch{}
  if(native)tryNativeFullscreen();
  requestAnimationFrame(()=>{try{$('video-box')?.scrollIntoView?.({block:'center',inline:'nearest'})}catch{}});
  const open=$('tk84-focus-open'),exit=$('tk84-focus-exit');if(open)open.setAttribute('aria-pressed','true');if(exit)exit.dataset.reason=reason;
  return true;
}
async function exitLiveFocus({exitNative=true,restoreScroll=false}={}){
  state.focus=false;document.body.classList.remove('tk84-live-focus');document.documentElement.classList.remove('tk84-live-focus');
  if(exitNative&&document.fullscreenElement){try{await document.exitFullscreen?.()}catch{}}
  state.nativeRequested=false;const open=$('tk84-focus-open');if(open)open.setAttribute('aria-pressed','false');
  if(restoreScroll)setTimeout(()=>{try{window.scrollTo({top:state.scrollY||0,behavior:'smooth'})}catch{window.scrollTo(0,state.scrollY||0)}},20);
}
function autoFocusAfterApply(){const court=$('stream-court')?.value;if(!court)return;enterLiveFocus({native:true,reason:'apply'})}
const baseApply=App.applyStream?.bind(App);if(baseApply)App.applyStream=function(...args){const court=$('stream-court')?.value;const out=baseApply(...args);if(court)autoFocusAfterApply();return out};
const baseFull=App.fullscreenVideo?.bind(App);if(baseFull)App.fullscreenVideo=function(...args){if(App.currentTab==='live'){enterLiveFocus({native:true,reason:'fullscreen-button'});return}return baseFull(...args)};
const baseFit=App.fitVideo?.bind(App);if(baseFit)App.fitVideo=function(...args){if(state.focus||document.body.classList.contains('tk84-live-focus')){exitLiveFocus({exitNative:true,restoreScroll:true});return}return baseFit(...args)};
const baseStop=App.stopLive?.bind(App);if(baseStop)App.stopLive=async function(...args){const out=await baseStop(...args);await exitLiveFocus({exitNative:true,restoreScroll:false});return out};
const baseShowTab=App.showTab?.bind(App);if(baseShowTab)App.showTab=function(tab,...args){if(tab!=='live'&&state.focus)exitLiveFocus({exitNative:true,restoreScroll:false});const out=baseShowTab(tab,...args);if(tab==='live')setTimeout(ensureLayout,0);return out};
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);const h=$('health-version');if(h)h.textContent=VERSION;return out};
document.addEventListener('fullscreenchange',()=>{if(state.nativeRequested&&!document.fullscreenElement){state.nativeRequested=false;if(state.focus)exitLiveFocus({exitNative:false,restoreScroll:false})}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.focus&&!document.fullscreenElement){e.preventDefault();exitLiveFocus({exitNative:false,restoreScroll:true})}},true);
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;ensureLayout();const h=$('health-version');if(h)h.textContent=VERSION}
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade84 SW refresh',e)}}
stamp();setTimeout(stamp,0);setTimeout(stamp,700);refreshSW();
window.TopkeyUpgrade84={installed:true,VERSION,CACHE_TAG,BUILD,state,ensureLayout,enterLiveFocus,exitLiveFocus,contract:'LIVE_FIRST_WORKSPACE_001'};
})();
