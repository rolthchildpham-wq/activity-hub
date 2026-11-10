(()=>{
'use strict';
const T=window.Topkey,App=T?.App;if(!T||!App||App.__upgrade96Installed)return;App.__upgrade96Installed=true;
const VERSION='2026.10.30-vnext-featureparity15-upgrade96-performance-safe-blv-lifecycle',BUILD='upgrade96',CACHE_TAG='u96-20261030';
const $=id=>document.getElementById(id);
function enforceVersion(){
  T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;const r=$('tk55-runtime-build');if(r)r.textContent=VERSION;
}
async function checkServerBuild96(){
  enforceVersion();try{const u=new URL('./build.json',location.href);u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));const res=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});if(!res.ok)throw new Error('HTTP '+res.status);const x=await res.json();const s=$('tk55-server-build');if(s)s.textContent=x.version||x.build||'unknown';const ok=String(x.build||'')===BUILD;const st=$('tk55-update-state');if(st)st.textContent=ok?'✓ Runtime và server cùng Upgrade96.':'Runtime/server lệch build.';return ok}catch(e){const st=$('tk55-update-state');if(st)st.textContent='Không đọc được build server: '+(e?.message||e);return false}
}
if(window.TopkeyUpgrade94){window.TopkeyUpgrade94.enforceVersion=enforceVersion;window.TopkeyUpgrade94.checkServerBuild94=checkServerBuild96}
if(window.TopkeyUpgrade95){window.TopkeyUpgrade95.enforceVersion=enforceVersion;window.TopkeyUpgrade95.checkServerBuild95=checkServerBuild96}
function install(){
  enforceVersion();setTimeout(enforceVersion,0);setTimeout(enforceVersion,700);setTimeout(enforceVersion,1500);
  const c=$('tk55-check-update');if(c)c.onclick=()=>checkServerBuild96();
  window.TopkeyUpgrade96={installed:true,VERSION,BUILD,CACHE_TAG,enforceVersion,checkServerBuild96,blvLifecycle:'baseline-ignore-per-court-dedupe'};
}
install();
window.addEventListener('focus',()=>{enforceVersion();setTimeout(enforceVersion,0)},{passive:true});
window.addEventListener('pageshow',()=>setTimeout(enforceVersion,0),{passive:true});
})();
