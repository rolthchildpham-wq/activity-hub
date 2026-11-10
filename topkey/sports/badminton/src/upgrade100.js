(()=>{
'use strict';
const T=window.Topkey,App=T?.App;if(!T||!App||App.__upgrade100Installed)return;App.__upgrade100Installed=true;
const VERSION='2026.10.30-vnext-featureparity15-upgrade100-viewer-auto-landscape-fullscreen-cleanup',BUILD='upgrade100',CACHE_TAG='u100-20261030';
const $=id=>document.getElementById(id);
function enforceVersion(){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=$('health-version');if(h&&h.textContent!==VERSION)h.textContent=VERSION;const r=$('tk55-runtime-build');if(r&&r.textContent!==VERSION)r.textContent=VERSION}
async function checkServerBuild100(){enforceVersion();try{const u=new URL('./build.json',location.href);u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));const res=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});if(!res.ok)throw new Error('HTTP '+res.status);const x=await res.json();const s=$('tk55-server-build');if(s)s.textContent=x.version||x.build||'unknown';const ok=String(x.build||'')===BUILD;const st=$('tk55-update-state');if(st)st.textContent=ok?'✓ Runtime và server cùng Upgrade100.':'Runtime/server lệch build.';return ok}catch(e){const st=$('tk55-update-state');if(st)st.textContent='Không đọc được build server: '+(e?.message||e);return false}}
for(const k of ['TopkeyUpgrade94','TopkeyUpgrade95','TopkeyUpgrade96','TopkeyUpgrade97','TopkeyUpgrade98','TopkeyUpgrade99']){const x=window[k];if(x){x.enforceVersion=enforceVersion;for(const n of Object.keys(x))if(/^checkServerBuild\d+$/.test(n))x[n]=checkServerBuild100}}
enforceVersion();setTimeout(enforceVersion,0);setTimeout(enforceVersion,700);setTimeout(enforceVersion,1700);const c=$('tk55-check-update');if(c)c.onclick=()=>checkServerBuild100();
window.addEventListener('pageshow',()=>setTimeout(enforceVersion,0),{passive:true});
window.TopkeyUpgrade100={installed:true,VERSION,BUILD,CACHE_TAG,viewerNativeFullscreen:true,enforceVersion,checkServerBuild100,contract:'VIEWER_AUTO_LANDSCAPE_INLINE_FULLSCREEN_CLEANUP_001'};
})();
