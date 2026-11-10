(()=>{'use strict';
const T=window.Topkey,App=T?.App;if(!T||!App||App.__upgrade93Installed)return;App.__upgrade93Installed=true;
const VERSION='2026.10.30-vnext-featureparity15-upgrade93-public-viewer-bootstrap-stability',BUILD='upgrade93',CACHE_TAG='u93-20261030';
const $=id=>document.getElementById(id),RUNTIME_CACHE='topkey-piper-runtime-ort122-phonemize100',CROWD_CACHE='topkey-natural-crowd-public-domain-v1';
const isSpectator=()=>location.hash.startsWith('#spectator');
function enforcePublicSurface(){
  if(!isSpectator())return false;
  document.documentElement.classList.add('tk-public-spectator-boot');
  $('login-screen')?.classList.add('hidden');$('app-shell')?.classList.add('hidden');$('public-spectator')?.classList.remove('hidden');
  return true;
}
function enforceVersion(){
  if(window.TopkeyUpgrade94?.installed){window.TopkeyUpgrade94.enforceVersion?.();return}
  try{if(T.VERSION!==VERSION)T.VERSION=VERSION;if(T.CONFIG_VERSION!==VERSION)T.CONFIG_VERSION=VERSION;if(T.RUNTIME_BUILD!==VERSION)T.RUNTIME_BUILD=VERSION}catch{}
  if(document.documentElement.dataset.topkeyBuild!==BUILD)document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h&&h.textContent!==VERSION)h.textContent=VERSION;
  const r=$('tk55-runtime-build');if(r&&r.textContent!==VERSION)r.textContent=VERSION;
  enforcePublicSurface();
}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);enforceVersion();return out};
async function fetchBuild(){const u=new URL('./build.json',location.href);u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));const r=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache','Pragma':'no-cache'}});if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
async function purgeLegacyShell(){
  try{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==RUNTIME_CACHE&&k!==CROWD_CACHE&&(k.startsWith('topkey-vnext-')||k.startsWith('topkey-sports-hub-'))).map(k=>caches.delete(k)))}catch{}
  try{const regs=await navigator.serviceWorker?.getRegistrations?.()||[];await Promise.all(regs.filter(r=>String(r.scope||'').includes('/sports/badminton/')).map(r=>r.unregister().catch(()=>false)))}catch{}
}
async function checkServerBuild93({repair=true}={}){
  if(window.TopkeyUpgrade94?.installed)return window.TopkeyUpgrade94.checkServerBuild94?.()??true;
  enforceVersion();try{const b=await fetchBuild();const s=$('tk55-server-build');if(s)s.textContent=b.version||b.build||'unknown';const st=$('tk55-update-state');
    if(String(b.build||'')===BUILD){if(st)st.textContent='✓ Runtime và server cùng Upgrade93.';sessionStorage.removeItem('topkey_u93_reload_guard');return true}
    if(st)st.textContent='Phát hiện runtime/server lệch build.';if(!repair)return false;
    const guard=String(b.cacheTag||b.build||b.version||'unknown');if(sessionStorage.getItem('topkey_u93_reload_guard')===guard)return false;sessionStorage.setItem('topkey_u93_reload_guard',guard);
    const keepHash=location.hash;await purgeLegacyShell();const n=new URL('./',location.href);n.search='';n.searchParams.set('__topkey_build',guard);n.searchParams.set('__topkey_reload','93');n.hash=keepHash;location.replace(n.href);return false
  }catch(e){const st=$('tk55-update-state');if(st)st.textContent='Không đọc được build server: '+(e?.message||e);return false}
}
async function refreshSW93(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register('./sw.js?v='+CACHE_TAG,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade93 SW',e)}}
function install(){
  try{window.__TOPKEY_U92_OBSERVER?.disconnect?.()}catch{};
  enforceVersion();setTimeout(enforceVersion,0);setTimeout(enforceVersion,600);setTimeout(enforceVersion,1400);setTimeout(()=>checkServerBuild93({repair:false}),1700);refreshSW93();
  const b=$('tk55-check-update');if(b)b.onclick=()=>checkServerBuild93({repair:true});
  // Observe only version text nodes/container changes. Do NOT observe data-topkey-build itself;
  // previous U92 observer could trigger itself indefinitely.
  try{const target=document.body;if(target){let queued=false;const mo=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;enforceVersion()})});mo.observe(target,{subtree:true,childList:true,characterData:true});window.__TOPKEY_U93_OBSERVER=mo}}catch{}
}
install();
window.addEventListener('focus',()=>{enforceVersion();setTimeout(()=>checkServerBuild93({repair:false}),120)},{passive:true});
window.addEventListener('pageshow',()=>setTimeout(enforceVersion,0),{passive:true});
window.addEventListener('hashchange',()=>{if(isSpectator()){enforcePublicSurface();try{App.startSpectator?.()}catch(e){console.warn('Spectator hash render',e)}}else document.documentElement.classList.remove('tk-public-spectator-boot')},{passive:true});
window.TopkeyUpgrade93={installed:true,VERSION,BUILD,CACHE_TAG,enforceVersion,enforcePublicSurface,fetchBuild,purgeLegacyShell,checkServerBuild93};
})();
