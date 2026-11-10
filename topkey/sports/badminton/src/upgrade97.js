(()=>{
'use strict';
const T=window.Topkey,App=T?.App;if(!T||!App||App.__upgrade97Installed)return;App.__upgrade97Installed=true;
const VERSION='2026.10.30-vnext-featureparity15-upgrade97-viewer-orientation-guard',BUILD='upgrade97',CACHE_TAG='u97-20261030';
const $=id=>document.getElementById(id);
const state={focus:false};
function isSpectator(){return location.hash==='#spectator'||document.documentElement.classList.contains('tk-public-spectator-boot')}
function enforceVersion(){
  T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;const r=$('tk55-runtime-build');if(r)r.textContent=VERSION;
}
async function checkServerBuild97(){
  enforceVersion();try{const u=new URL('./build.json',location.href);u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));const res=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});if(!res.ok)throw new Error('HTTP '+res.status);const x=await res.json();const s=$('tk55-server-build');if(s)s.textContent=x.version||x.build||'unknown';const ok=String(x.build||'')===BUILD;const st=$('tk55-update-state');if(st)st.textContent=ok?'✓ Runtime và server cùng Upgrade97.':'Runtime/server lệch build.';return ok}catch(e){const st=$('tk55-update-state');if(st)st.textContent='Không đọc được build server: '+(e?.message||e);return false}
}
async function releaseViewerOrientation(){
  if(!isSpectator())return;
  // U100/U98 own Public Viewer fullscreen. Do not tear it down from focus/visibility hooks.
  if(window.TopkeyUpgrade100?.viewerNativeFullscreen===true||window.TopkeyUpgrade98?.allowLandscapeFullscreen===true){try{screen.orientation?.unlock?.()}catch{};return}
  try{if(document.fullscreenElement)await document.exitFullscreen?.()}catch{}
  try{screen.orientation?.unlock?.()}catch{}
}
function applyFocus(){
  const stage=$('tk88-public-live-stage');
  document.documentElement.classList.toggle('tk97-public-viewer-focus',state.focus);
  document.body.classList.toggle('tk97-public-viewer-focus',state.focus);
  stage?.classList.toggle('tk97-public-viewer-focus',state.focus);
  const b=$('tk88-public-full');
  if(b){const txt=state.focus?'↙ Thu nhỏ':'⛶ Mở lớn';if(b.textContent!==txt)b.textContent=txt;b.setAttribute('aria-pressed',state.focus?'true':'false');b.title='Viewer mở lớn trong đúng hướng màn hình hiện tại, không ép xoay ngang.'}
}
async function setFocus(on){
  if(!isSpectator())on=false;
  if(on){await releaseViewerOrientation();state.focus=true;applyFocus();try{$('tk88-public-video')?.play?.().catch(()=>{})}catch{};return true}
  state.focus=false;applyFocus();return true;
}
function toggleFocus(){return setFocus(!state.focus)}
function patchButton(){
  const b=$('tk88-public-full');if(!b)return false;
  if(b.dataset.tk97OrientationGuard!=='1')b.dataset.tk97OrientationGuard='1';
  applyFocus();return true;
}
// Capture before Upgrade88's target onclick so native requestFullscreen never runs on Public Viewer.
document.addEventListener('click',e=>{
  // Upgrade98 may deliberately restore native fullscreen + landscape for horizontal live video.
  if(window.TopkeyUpgrade98?.allowLandscapeFullscreen===true)return;
  const b=e.target?.closest?.('#tk88-public-full');if(!b||!isSpectator())return;
  e.preventDefault();e.stopImmediatePropagation();toggleFocus().catch(()=>{});
},true);
function enterSpectator(){releaseViewerOrientation().catch(()=>{});setFocus(false);setTimeout(patchButton,0);setTimeout(patchButton,250)}
window.addEventListener('hashchange',()=>{if(isSpectator())enterSpectator();else setFocus(false)},{passive:true});
window.addEventListener('pageshow',()=>{enforceVersion();if(isSpectator())enterSpectator()},{passive:true});
window.addEventListener('focus',()=>{enforceVersion();if(isSpectator())releaseViewerOrientation().catch(()=>{})},{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isSpectator())releaseViewerOrientation().catch(()=>{})},{passive:true});
const host=$('public-spectator');if(host&&window.MutationObserver){const mo=new MutationObserver(()=>patchButton());mo.observe(host,{childList:true,subtree:true});}
if(window.TopkeyUpgrade94){window.TopkeyUpgrade94.enforceVersion=enforceVersion;window.TopkeyUpgrade94.checkServerBuild94=checkServerBuild97}
if(window.TopkeyUpgrade95){window.TopkeyUpgrade95.enforceVersion=enforceVersion;window.TopkeyUpgrade95.checkServerBuild95=checkServerBuild97}
if(window.TopkeyUpgrade96){window.TopkeyUpgrade96.enforceVersion=enforceVersion;window.TopkeyUpgrade96.checkServerBuild96=checkServerBuild97}
function install(){
  enforceVersion();setTimeout(enforceVersion,0);setTimeout(enforceVersion,700);setTimeout(enforceVersion,1700);
  const c=$('tk55-check-update');if(c)c.onclick=()=>checkServerBuild97();
  if(isSpectator())enterSpectator();
  window.TopkeyUpgrade97={installed:true,VERSION,BUILD,CACHE_TAG,state,enforceVersion,checkServerBuild97,releaseViewerOrientation,setFocus,toggleFocus,patchButton,contract:'PUBLIC_VIEWER_ORIENTATION_GUARD_001'};
}
install();
})();
