(()=>{
'use strict';
const T=window.Topkey,App=T?.App;if(!T||!App||App.__upgrade95Installed)return;App.__upgrade95Installed=true;
const VERSION='2026.10.30-vnext-featureparity15-upgrade95-performance-safe',BUILD='upgrade95',CACHE_TAG='u95-20261030';
const $=id=>document.getElementById(id);
function enforceVersion(){
  T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;const r=$('tk55-runtime-build');if(r)r.textContent=VERSION;
}
async function checkServerBuild95(){
  enforceVersion();try{const u=new URL('./build.json',location.href);u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));const res=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});if(!res.ok)throw new Error('HTTP '+res.status);const x=await res.json();const s=$('tk55-server-build');if(s)s.textContent=x.version||x.build||'unknown';const ok=String(x.build||'')===BUILD;const st=$('tk55-update-state');if(st)st.textContent=ok?'✓ Runtime và server cùng Upgrade95.':'Runtime/server lệch build.';return ok}catch(e){const st=$('tk55-update-state');if(st)st.textContent='Không đọc được build server: '+(e?.message||e);return false}
}
// Upgrade93 delegates through TopkeyUpgrade94. Redirect that public delegation to the final U95 authority.
if(window.TopkeyUpgrade94){window.TopkeyUpgrade94.enforceVersion=enforceVersion;window.TopkeyUpgrade94.checkServerBuild94=checkServerBuild95}
function install(){
  enforceVersion();setTimeout(enforceVersion,0);setTimeout(enforceVersion,700);setTimeout(enforceVersion,1500);
  const c=$('tk55-check-update');if(c)c.onclick=()=>checkServerBuild95();
  const perf={build:BUILD,cacheTag:CACHE_TAG,bundled:true,bootAt:performance?.timeOrigin||Date.now(),loadedAt:Date.now()};
  window.TopkeyUpgrade95={installed:true,VERSION,BUILD,CACHE_TAG,enforceVersion,checkServerBuild95,perf};
}
install();
window.addEventListener('focus',()=>{enforceVersion();setTimeout(enforceVersion,0)},{passive:true});
window.addEventListener('pageshow',()=>setTimeout(enforceVersion,0),{passive:true});
})();
