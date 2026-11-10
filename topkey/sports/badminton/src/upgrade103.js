(()=>{
'use strict';
const T=window.Topkey,App=T?.App,U102=window.TopkeyUpgrade102,U90=window.TopkeyUpgrade90,U94=window.TopkeyUpgrade94;
if(!T||!App||App.__upgrade103Installed)return;App.__upgrade103Installed=true;
const VERSION='2026.10.30-vnext-featureparity15-upgrade103-render-runtime-stability',BUILD='upgrade103',CACHE_TAG='u103-20261030';
const $=id=>document.getElementById(id),now=()=>window.performance?.now?.()||Date.now();
const S={scoreSeq:0,pendingScore:null,metrics:{localScoreRenderMs:0,firebaseScoreWriteMs:0,viewerFirebaseReceiveMs:0,overviewSkips:0,legacyPollersStopped:0,healthRenders:0},contracts:['RENDER_RUNTIME_STABILITY_U103','LATENCY_METRICS_U103','LEGACY_POLLER_RETIRE_U103']};

// U94 is the canonical Viewer BLV engine. Retire U90's legacy polling/listener path.
try{U90?.stopLegacyPolling?.();S.metrics.legacyPollersStopped=1}catch{}

// renderOverview is only visible on the Overview tab. Historical renderBranch() calls it for every branch;
// skip that hidden DOM work and refresh once when Overview becomes active.
const baseOverview=App.renderOverview?.bind(App);
if(baseOverview)App.renderOverview=function(...args){
  if(location.hash.startsWith('#spectator')||String(this.currentTab||'overview')!=='overview'){S.metrics.overviewSkips++;if(U102?.state?.metrics)U102.state.metrics.overviewSkips=(U102.state.metrics.overviewSkips||0)+1;return}
  return baseOverview(...args)
};

function renderTabFromCache(tab=App.currentTab){
  tab=String(tab||'overview');
  try{
    if(tab==='overview')return baseOverview?.();
    if(tab==='teams'){App.renderTeams?.();App.renderCheckin?.();App.renderRegistrations?.();return}
    if(tab==='schedule'){App.renderMatches?.();App.renderSelectors?.();App.renderStandings?.();App.renderSchedulerControls?.();return}
    if(tab==='control'){App.renderControl?.();App.renderSelectors?.();return}
    if(tab==='umpire'){App.renderUmpire?.();App.renderSelectors?.();return}
    if(tab==='live'){App.renderLiveScore?.();return}
    if(tab==='finance')return App.renderFinance?.();
    if(tab==='announcements')return App.renderAnnouncements?.();
    if(tab==='audit')return App.renderAudit?.();
    if(tab==='settings'){App.renderConfig?.();App.renderUsers?.();return}
    if(tab==='health')return App.renderHealth?.();
  }catch(e){console.warn('U103 tab cache render',tab,e)}
}
const baseShowTab=App.showTab?.bind(App);
if(baseShowTab)App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);setTimeout(()=>renderTabFromCache(tab),0);return out};

// Passive latency instrumentation. No scoring or persistence semantics are changed.
const baseRenderUmpire=App.renderUmpire?.bind(App);
if(baseRenderUmpire)App.renderUmpire=function(...args){const out=baseRenderUmpire(...args);const p=S.pendingScore;if(p&&!p.rendered){p.rendered=true;S.metrics.localScoreRenderMs=Math.max(0,Math.round(now()-p.t0));renderRuntimeHealth()}return out};
const baseScore=App.score?.bind(App);
if(baseScore)App.score=async function(...args){const token=++S.scoreSeq;S.pendingScore={token,t0:now(),rendered:false};try{return await baseScore(...args)}finally{setTimeout(()=>{if(S.pendingScore?.token===token)S.pendingScore=null},0)}};
if(T.Data?.queueMulti&&!T.Data.__u103QueueWrapped){
  const baseQueue=T.Data.queueMulti.bind(T.Data);T.Data.__u103QueueWrapped=true;
  T.Data.queueMulti=async function(updates,meta={}){const score=String(meta?.type||'')==='SCORE',t0=score?now():0;try{return await baseQueue(updates,meta)}finally{if(score){S.metrics.firebaseScoreWriteMs=Math.max(0,Math.round(now()-t0));renderRuntimeHealth()}}};
}
if(U94?.onActiveMatches&&!U94.__u103LatencyWrapped){
  const base=U94.onActiveMatches.bind(U94);U94.__u103LatencyWrapped=true;
  U94.onActiveMatches=function(map){if(location.hash.startsWith('#spectator')){let newest=0;for(const v of Object.values(map||{}))newest=Math.max(newest,Number(v?.updatedAt)||0);if(newest){const d=Date.now()-newest;if(d>=0&&d<60000)S.metrics.viewerFirebaseReceiveMs=Math.round(d)}}const out=base(map);renderRuntimeHealth();return out};
}

function ensureRuntimeHealth(){
  const page=$('page-health');if(!page)return null;let box=$('tk103-runtime-health');if(box)return box;
  box=document.createElement('section');box.id='tk103-runtime-health';box.className='card';box.style.marginTop='14px';
  box.innerHTML='<h3>⚡ Upgrade103 · Runtime/Latency</h3><div id="tk103-runtime-grid" class="muted" style="line-height:1.7"></div>';
  page.appendChild(box);return box
}
function renderRuntimeHealth(){
  const box=ensureRuntimeHealth(),g=$('tk103-runtime-grid');if(!box||!g)return;S.metrics.healthRenders++;
  const m=U102?.state?.metrics||{};g.innerHTML=`Tap điểm → UI: <b>${S.metrics.localScoreRenderMs||'—'} ms</b> · Firebase SCORE write: <b>${S.metrics.firebaseScoreWriteMs||'—'} ms</b> · Viewer Firebase receive: <b>${S.metrics.viewerFirebaseReceiveMs||'—'} ms</b><br>Listener core/dynamic/public: <b>${m.corePaths||0}/${m.dynamicPaths||0}/${m.publicPaths||0}</b> · Render flush: <b>${m.adminRenderFlushes||0}</b> · bỏ render tab ẩn: <b>${m.inactiveBranchSkips||0}</b> · defer khi background: <b>${m.hiddenRenderDefers||0}</b> · legacy BLV poller: <b>${S.metrics.legacyPollersStopped?'OFF':'unknown'}</b>`;
}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);renderRuntimeHealth();return out};

document.addEventListener('visibilitychange',()=>{if(!document.hidden){try{U102?.flushAdminRender?.()}catch{};setTimeout(()=>renderTabFromCache(App.currentTab),0)}},{passive:true});

function enforceVersion(){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=$('health-version');if(h&&h.textContent!==VERSION)h.textContent=VERSION;const r=$('tk55-runtime-build');if(r&&r.textContent!==VERSION)r.textContent=VERSION}
async function checkServerBuild103(){enforceVersion();try{const u=new URL('./build.json',location.href);u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));const res=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});if(!res.ok)throw new Error('HTTP '+res.status);const x=await res.json();const s=$('tk55-server-build');if(s)s.textContent=x.version||x.build||'unknown';const ok=String(x.build||'')===BUILD;const st=$('tk55-update-state');if(st)st.textContent=ok?'✓ Runtime và server cùng Upgrade103.':'Runtime/server lệch build.';return ok}catch(e){const st=$('tk55-update-state');if(st)st.textContent='Không đọc được build server: '+(e?.message||e);return false}}
for(const k of ['TopkeyUpgrade94','TopkeyUpgrade95','TopkeyUpgrade96','TopkeyUpgrade97','TopkeyUpgrade98','TopkeyUpgrade99','TopkeyUpgrade100','TopkeyUpgrade101','TopkeyUpgrade102']){const x=window[k];if(x){x.enforceVersion=enforceVersion;for(const n of Object.keys(x))if(/^checkServerBuild\d+$/.test(n))x[n]=checkServerBuild103}}
enforceVersion();setTimeout(()=>{enforceVersion();renderRuntimeHealth()},0);setTimeout(enforceVersion,700);setTimeout(enforceVersion,1700);
const check=$('tk55-check-update');if(check)check.onclick=()=>checkServerBuild103();
window.TopkeyUpgrade103={installed:true,VERSION,BUILD,CACHE_TAG,state:S,renderTabFromCache,renderRuntimeHealth,enforceVersion,checkServerBuild103,contract:'RENDER_RUNTIME_STABILITY_LATENCY_METRICS_001'};
})();
