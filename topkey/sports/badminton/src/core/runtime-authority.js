(() => {
'use strict';
const T=window.Topkey,App=T?.App;if(!T||!App||window.TopkeyRuntime117?.installed)return;
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery',BUILD='upgrade122',CACHE_TAG='u122h47-20261104';
const LEGACY_CONTRACT='CONSOLIDATED_RUNTIME_AUTHORITY_003';
const $=id=>document.getElementById(id);
const S={installed:true,settleTicks:0,legacyAuthoritiesPatched:0,settled:false};
function enforce(){
  T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h&&h.textContent!==VERSION)h.textContent=VERSION;
  const r=$('tk55-runtime-build');if(r&&r.textContent!==VERSION)r.textContent=VERSION;
  const t=$('tk103-runtime-health')?.querySelector('h3');if(t&&t.textContent!=='⚡ Hotfix31 · Stability Consolidation')t.textContent='⚡ Hotfix31 · Stability Consolidation';
}
async function checkServerBuild({repair=false}={}){
  enforce();try{
    const u=new URL('./build.json',location.href);u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));
    const res=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache, no-store, must-revalidate','Pragma':'no-cache'}});if(!res.ok)throw new Error('HTTP '+res.status);
    const x=await res.json(),s=$('tk55-server-build');if(s)s.textContent=x.version||x.build||'unknown';
    const ok=String(x.cacheTag||'')===CACHE_TAG&&String(x.version||'')===VERSION,st=$('tk55-update-state');
    if(st)st.textContent=ok?'✓ Runtime, version và cacheTag cùng server.':'Runtime/server lệch version/cacheTag · không tự reload để bảo toàn phiên đăng nhập.';
    if(!ok&&repair&&window.TopkeyUpgrade55?.checkServerBuild){return window.TopkeyUpgrade55.checkServerBuild({manual:true,repair:true})}
    return ok;
  }catch(e){const st=$('tk55-update-state');if(st)st.textContent='Không đọc được build server: '+(e?.message||e);return false}
}
function patchLegacyAuthorities(){
  let n=0;for(const [k,x] of Object.entries(window)){
    if(!/^TopkeyUpgrade\d+$/.test(k)||!x||typeof x!=='object')continue;
    if(typeof x.enforceVersion==='function'){x.enforceVersion=enforce;n++}
    if(typeof x.enforce==='function'){x.enforce=enforce;n++}
    for(const name of Object.keys(x))if(/^checkServerBuild\d+$/.test(name)){x[name]=checkServerBuild;n++}
  }
  S.legacyAuthoritiesPatched=n;const b=$('tk55-check-update');if(b)b.onclick=()=>checkServerBuild({repair:true});
}
function ensureHealth(){
  const host=$('tk103-runtime-health');if(!host)return;let line=$('tk117-consolidation-health');
  if(!line){line=document.createElement('div');line.id='tk117-consolidation-health';line.className='muted';line.style.marginTop='6px';host.appendChild(line)}
  const b=window.TopkeyUIBoundary,s=window.TopkeyScheduleRuntime,u=window.TopkeyUmpireRuntime,l=window.TopkeyLiveRuntime;
  const hc=b?.hooks||{};line.innerHTML=`Production Runtime: <b>HARDENED</b> · UI boundary: <b>${b?.installed?'ON':'WAIT'}</b> · hooks tab/matches: <b>${hc.tab?.length||0}/${hc.matches?.length||0}</b> · Schedule: <b>${s?.installed?'BOUNDARY':'LEGACY'}</b> · Umpire: <b>${u?.installed?'BOUNDARY':'LEGACY'}</b> · Live: <b>${l?.installed?'BOUNDARY':'LEGACY'}</b> · patched exports: <b>${S.legacyAuthoritiesPatched}</b>`;
}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth&&!App.__u117AuthorityHealth){App.__u117AuthorityHealth=true;App.renderHealth=function(...a){const out=baseHealth(...a);queueMicrotask(()=>{enforce();patchLegacyAuthorities();ensureHealth()});return out}}
function settle(){enforce();patchLegacyAuthorities();ensureHealth();S.settleTicks++}
settle();const timer=setInterval(()=>{settle();if(S.settleTicks>=20){clearInterval(timer);S.settled=true;settle()}},250);
window.addEventListener('focus',settle,{passive:true});window.addEventListener('pageshow',()=>setTimeout(settle,0),{passive:true});
const api={installed:true,VERSION,BUILD,CACHE_TAG,state:S,enforce,checkServerBuild,patchLegacyAuthorities,ensureHealth,contract:'PRODUCTION_RUNTIME_AUTHORITY_004'};
window.TopkeyRuntime117=api;window.TopkeyRuntime116=window.TopkeyRuntime116||api;window.TopkeyRuntime115=window.TopkeyRuntime115||api;
})();
