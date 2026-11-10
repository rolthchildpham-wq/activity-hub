(()=>{
'use strict';
const T=window.Topkey,App=T?.App;
if(!T||!App||App.__upgrade107Installed)return;App.__upgrade107Installed=true;
const VERSION='2026.10.30-vnext-featureparity15-upgrade107-schedule-dom-safety',BUILD='upgrade107',CACHE_TAG='u107-20261030';
const $=id=>document.getElementById(id);
function repairSearchParents(){
  const admin=$('matches-list'),adminBar=$('tk16-admin-search');
  if(admin&&adminBar){const wrap=admin.closest('.table-wrap')||admin.parentElement,parent=wrap?.parentElement;if(parent&&adminBar.parentElement!==parent)parent.insertBefore(adminBar,wrap||null);}
  const pub=$('spectator-schedule'),pubBar=$('tk16-public-search');
  if(pub&&pubBar){const parent=pub.parentElement;if(parent&&pubBar.parentElement!==parent)parent.insertBefore(pubBar,pub);}
}
function enforceVersion(){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=$('health-version');if(h)h.textContent=VERSION;const r=$('tk55-runtime-build');if(r)r.textContent=VERSION;const title=$('tk103-runtime-health')?.querySelector('h3');if(title)title.textContent='⚡ Upgrade107 · Runtime/Latency + Fast Lane';}
async function checkServerBuild107(){enforceVersion();try{const u=new URL('./build.json',location.href);u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));const res=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});if(!res.ok)throw new Error('HTTP '+res.status);const x=await res.json(),server=$('tk55-server-build');if(server)server.textContent=x.version||x.build||'unknown';const ok=String(x.build||'')===BUILD,st=$('tk55-update-state');if(st)st.textContent=ok?'✓ Runtime và server cùng Upgrade107.':'Runtime/server lệch build.';return ok}catch(e){const st=$('tk55-update-state');if(st)st.textContent='Không đọc được build server: '+(e?.message||e);return false}}
function install(){repairSearchParents();enforceVersion();}
const bm=App.renderMatches?.bind(App);if(bm&&!App.__u107Matches){App.__u107Matches=true;App.renderMatches=function(...a){const o=bm(...a);setTimeout(repairSearchParents,0);return o}}
const bs=App.renderSpectator?.bind(App);if(bs&&!App.__u107Spectator){App.__u107Spectator=true;App.renderSpectator=function(...a){const o=bs(...a);setTimeout(repairSearchParents,0);return o}}
const bh=App.renderHealth?.bind(App);if(bh&&!App.__u107Health){App.__u107Health=true;App.renderHealth=function(...a){const o=bh(...a);setTimeout(enforceVersion,0);return o}}
install();setTimeout(install,0);setTimeout(install,700);setTimeout(enforceVersion,1800);setTimeout(enforceVersion,4000);
window.addEventListener('hashchange',()=>setTimeout(repairSearchParents,0));window.addEventListener('focus',()=>setTimeout(enforceVersion,0),{passive:true});
const check=$('tk55-check-update');if(check)check.onclick=()=>checkServerBuild107();
window.TopkeyUpgrade107={installed:true,VERSION,BUILD,CACHE_TAG,repairSearchParents,enforceVersion,checkServerBuild107,contract:'SCHEDULE_DOM_PARENT_SAFETY_001'};
})();
