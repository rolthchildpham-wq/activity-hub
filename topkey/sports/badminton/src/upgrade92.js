(()=>{'use strict';
const bootRank=Number((String(window.__TOPKEY_BOOT_BUILD||'').match(/upgrade(\d+)/i)||[])[1]||0);if(bootRank>92)return;
const T=window.Topkey,App=T?.App;if(!T||!App||App.__upgrade92Installed)return;App.__upgrade92Installed=true;
const VERSION='2026.10.30-vnext-featureparity15-upgrade92-stability-public-viewer',BUILD='upgrade92',CACHE_TAG='u92-20261030';
const $=id=>document.getElementById(id),RUNTIME_CACHE='topkey-piper-runtime-ort122-phonemize100',CROWD_CACHE='topkey-natural-crowd-public-domain-v1';
const isSpectator=()=>location.hash.startsWith('#spectator');
function enforcePublicSurface(){if(!isSpectator())return;document.documentElement.classList.add('tk-public-spectator-boot');$('login-screen')?.classList.add('hidden');$('app-shell')?.classList.add('hidden');$('public-spectator')?.classList.remove('hidden')}
function enforceVersion(){
  try{T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION}catch{}
  document.documentElement.dataset.topkeyBuild=BUILD;
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
async function checkServerBuild92({repair=true}={}){
  enforceVersion();try{const b=await fetchBuild();const s=$('tk55-server-build');if(s)s.textContent=b.version||b.build||'unknown';const st=$('tk55-update-state');
    if(String(b.build||'')===BUILD){if(st)st.textContent='✓ Runtime và server cùng Upgrade92.';sessionStorage.removeItem('topkey_u92_reload_guard');return true}
    if(st)st.textContent='Phát hiện runtime/server lệch build.';if(!repair)return false;
    const guard=String(b.cacheTag||b.build||b.version||'unknown');if(sessionStorage.getItem('topkey_u92_reload_guard')===guard)return false;sessionStorage.setItem('topkey_u92_reload_guard',guard);
    const keepHash=location.hash;await purgeLegacyShell();const n=new URL('./',location.href);n.searchParams.set('__topkey_build',guard);n.searchParams.set('__topkey_reload','92');n.hash=keepHash;location.replace(n.href);return false
  }catch(e){const st=$('tk55-update-state');if(st)st.textContent='Không đọc được build server: '+(e?.message||e);return false}
}
async function refreshSW92(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register('./sw.js?v='+CACHE_TAG,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade92 SW',e)}}
function install(){enforceVersion();setTimeout(enforceVersion,0);setTimeout(enforceVersion,750);setTimeout(enforceVersion,1400);setTimeout(()=>checkServerBuild92({repair:false}),1700);refreshSW92();
  const b=$('tk55-check-update');if(b)b.onclick=()=>checkServerBuild92({repair:true});
  try{const mo=new MutationObserver(()=>enforceVersion());mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-topkey-build']});window.__TOPKEY_U92_OBSERVER=mo}catch{}
}
install();
window.addEventListener('focus',()=>{enforceVersion();setTimeout(()=>checkServerBuild92({repair:false}),120)},{passive:true});
window.addEventListener('pageshow',()=>setTimeout(enforceVersion,0),{passive:true});
window.addEventListener('hashchange',()=>{if(isSpectator()){enforcePublicSurface();App.startSpectator?.()}else document.documentElement.classList.remove('tk-public-spectator-boot')},{passive:true});
window.TopkeyUpgrade92={installed:true,VERSION,BUILD,CACHE_TAG,enforceVersion,enforcePublicSurface,fetchBuild,purgeLegacyShell,checkServerBuild92};
})();
