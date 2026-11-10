(()=>{
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U103=window.TopkeyUpgrade103;
if(!T||!App||!T.Data||App.__upgrade105Installed)return;App.__upgrade105Installed=true;
const VERSION='2026.10.30-vnext-featureparity15-upgrade105-scoring-fast-lane-schedule-collapse',BUILD='upgrade105',CACHE_TAG='u105-20261030';
const $=id=>document.getElementById(id),perf=()=>window.performance?.now?.()||Date.now();
const S={directOk:0,fallbackQueued:0,blocked:0,queuedScoreKeys:new Set(),lastMode:'—',lastDispatchMs:0,lastAckMs:0,lastError:'',contracts:['SCORING_FAST_LANE_001','SCHEDULE_COLLAPSE_001']};
const clean=v=>{if(v===undefined)return undefined;if(v===null||typeof v==='string'||typeof v==='boolean')return v;if(typeof v==='number')return Number.isFinite(v)?v:null;if(Array.isArray(v))return v.map(x=>{const c=clean(x);return c===undefined?null:c});if(typeof v==='object'){const o={};for(const [k,x] of Object.entries(v)){const c=clean(x);if(c!==undefined)o[k]=c}return o}return String(v)};
const errText=e=>String(e?.code||e?.message||e||'Firebase error');
const permissionDenied=e=>/permission[_ -]?denied|PERMISSION_DENIED/i.test(errText(e));
function scoreKey(updates){return Object.keys(updates||{}).find(k=>/\/activeMatches\/[^/]+$/.test(String(k)))||'';}
function courtFromKey(key){const m=String(key||'').match(/\/activeMatches\/([^/]+)$/);return m?.[1]||'';}
function newestActiveForKey(key,updates){
  const court=courtFromKey(key),local=court?App.state?.activeMatches?.[court]:null,remote=updates?.[key];
  if(!local||!remote)return updates;
  const lv=Number(local.version)||0,rv=Number(remote.version)||0;if(lv<rv)return updates;
  return {...updates,[key]:clean(local)};
}
async function syncQueuedScoreKeys(){
  try{const items=await T.idb.all('queue');S.queuedScoreKeys.clear();for(const item of items||[]){if(String(item?.meta?.type||'')!=='SCORE')continue;const key=item?.meta?.fastLaneKey||scoreKey(item?.updates);if(key)S.queuedScoreKeys.add(key)}}catch{}
  renderFastHealth();
}
async function persistFallback(updates,meta,id,key,error){
  const denied=permissionDenied(error)&&!!T.Data.auth?.currentUser;
  const normalized=clean(newestActiveForKey(key,updates))||{};
  const item={id,updates:normalized,meta:clean({...meta,fastLaneKey:key,fastLane:'FALLBACK'})||{},createdAt:Date.now(),attempts:1,status:denied?'BLOCKED':'PENDING',lastError:errText(error),lastAttemptAt:Date.now()};
  if(denied)item.blockedAt=Date.now();
  await T.idb.put('queue',item);if(key)S.queuedScoreKeys.add(key);await T.Data.refreshQueueStats?.();
  S.lastError=item.lastError;S.lastMode=denied?'BLOCKED':'QUEUE';denied?S.blocked++:S.fallbackQueued++;renderFastHealth();
  if(denied)throw new Error(item.lastError||'Firebase không cho phép ghi SCORE');
  setTimeout(()=>{if(T.Data.connected)T.Data.flushQueue?.({source:'score-fast-lane-fallback',silent:true}).catch?.(()=>{})},1200);
  return item;
}
const baseQueueMulti=T.Data.queueMulti.bind(T.Data);
if(!T.Data.__u105FastLane){
  T.Data.__u105FastLane=true;
  T.Data.queueMulti=async function(updates,meta={}){
    if(String(meta?.type||'')!=='SCORE')return baseQueueMulti(updates,meta);
    const id=meta.eventId||U?.id?.('q')||('q_'+Date.now()),normalized=clean(updates)||{},key=scoreKey(normalized);
    const canDirect=!!(this.ready&&this.connected&&this.db&&this.auth?.currentUser&&key&&!S.queuedScoreKeys.has(key));
    if(!canDirect){
      const reason=!this.connected?new Error('OFFLINE_QUEUE'):!this.auth?.currentUser?new Error('AUTH_NOT_READY_QUEUE'):new Error('ORDERED_SCORE_QUEUE');
      return persistFallback(normalized,meta,id,key,reason);
    }
    const t0=perf();let p;
    try{
      p=this.db.ref().update(normalized);S.lastDispatchMs=Math.max(0,Math.round(perf()-t0));S.lastMode='DIRECT';renderFastHealth();
      await p;S.lastAckMs=Math.max(0,Math.round(perf()-t0));S.directOk++;S.lastError='';
      if(U103?.state?.metrics)U103.state.metrics.firebaseScoreWriteMs=S.lastAckMs;
      renderFastHealth();return {id,updates:normalized,meta:{...meta,fastLane:'DIRECT'},createdAt:Date.now(),status:'SYNCED',direct:true};
    }catch(e){S.lastAckMs=Math.max(0,Math.round(perf()-t0));return persistFallback(normalized,meta,id,key,e)}
  };
}
const baseFlush=T.Data.flushQueue?.bind(T.Data);
if(baseFlush&&!T.Data.__u105FlushWrapped){T.Data.__u105FlushWrapped=true;T.Data.flushQueue=async function(...args){const out=await baseFlush(...args);await syncQueuedScoreKeys();return out;};}
setTimeout(syncQueuedScoreKeys,0);

function txt(vi,en,zh){const l=window.TopkeyI18n?.language||'vi';return l==='en'?en:l==='zh'?zh:vi;}
function storeGet(k){try{return localStorage.getItem(k)==='1'}catch{return false}}
function storeSet(k,v){try{localStorage.setItem(k,v?'1':'0')}catch{}}
function refreshCollapse(card,key){
  const btn=card?.querySelector('.tk105-collapse-btn'),stat=card?.querySelector('.tk105-collapse-status'),body=card?.querySelector('.tk105-collapse-body');if(!btn||!body)return;
  const collapsed=card.classList.contains('tk105-collapsed');
  btn.setAttribute('aria-expanded',collapsed?'false':'true');
  const full=btn.querySelector('.tk105-label-full'),short=btn.querySelector('.tk105-label-short');
  if(full)full.textContent=collapsed?txt('↓ Mở rộng','↓ Expand','↓ 展开'):txt('↑ Thu gọn','↑ Collapse','↑ 收起');
  if(short)short.textContent=collapsed?txt('↓ Mở','↓ Open','↓ 展开'):txt('↑ Gọn','↑ Fold','↑ 收起');
  if(stat)stat.textContent=collapsed?txt('Đã thu gọn · xem BXH nhanh','Collapsed · standings ready','已收起 · 快速查看排名'):txt('Lịch đang mở','Schedule expanded','赛程已展开');
  body.style.maxHeight=collapsed?'0px':(body.scrollHeight+32)+'px';storeSet(key,collapsed);
}
function wrapScheduleCard(card,key){
  if(!card)return;if(card.dataset.u105Ready==='1'){refreshCollapse(card,key);return}
  const header=card.querySelector(':scope > .split')||card.querySelector(':scope > h2')?.parentElement||card.firstElementChild;if(!header)return;
  card.dataset.u105Ready='1';header.classList.add('tk105-collapse-head');
  let actions=header.querySelector('.action-bar');if(!actions){actions=document.createElement('div');actions.className='tk105-collapse-actions';header.appendChild(actions)}
  const body=document.createElement('div');body.className='tk105-collapse-body';[...card.children].filter(n=>n!==header).forEach(n=>body.appendChild(n));card.appendChild(body);
  const btn=document.createElement('button');btn.type='button';btn.className='btn mini tk105-collapse-btn';btn.innerHTML='<span class="tk105-label-full"></span><span class="tk105-label-short"></span>';
  const stat=document.createElement('span');stat.className='pill tk105-collapse-status';actions.prepend(stat);actions.prepend(btn);
  card.classList.toggle('tk105-collapsed',storeGet(key));
  btn.addEventListener('click',()=>{card.classList.toggle('tk105-collapsed');refreshCollapse(card,key)});
  const resize=()=>refreshCollapse(card,key);window.addEventListener('resize',resize,{passive:true});
  const mo=new MutationObserver(()=>{if(!card.classList.contains('tk105-collapsed'))body.style.maxHeight=(body.scrollHeight+32)+'px'});mo.observe(body,{childList:true,subtree:true,characterData:true});
  refreshCollapse(card,key);
}
function installScheduleCollapse(){
  const pub=$('spectator-schedule')?.closest('.card');if(pub)wrapScheduleCard(pub,'topkey_u105_public_schedule_collapsed');
  const admin=$('matches-list')?.closest('.card');if(admin)wrapScheduleCard(admin,'topkey_u105_admin_schedule_collapsed');
}
const baseSpectator=App.renderSpectator?.bind(App);if(baseSpectator&&!App.__u105Spectator){App.__u105Spectator=true;App.renderSpectator=function(...args){const out=baseSpectator(...args);setTimeout(installScheduleCollapse,0);return out};}
const baseMatches=App.renderMatches?.bind(App);if(baseMatches&&!App.__u105Matches){App.__u105Matches=true;App.renderMatches=function(...args){const out=baseMatches(...args);setTimeout(installScheduleCollapse,0);return out};}

function ensureFastHealth(){const box=$('tk103-runtime-health');if(!box)return null;let line=$('tk105-fastlane-health');if(!line){line=document.createElement('div');line.id='tk105-fastlane-health';line.className='muted';box.appendChild(line)}return line}
function renderFastHealth(){const line=ensureFastHealth();if(!line)return;line.innerHTML=`Scoring Fast Lane: <b>${S.lastMode}</b> · dispatch <b>${S.lastDispatchMs||'—'} ms</b> · ACK <b>${S.lastAckMs||'—'} ms</b> · direct <b>${S.directOk}</b> · queue fallback <b>${S.fallbackQueued}</b> · blocked <b>${S.blocked}</b> · ordered court queue <b>${S.queuedScoreKeys.size}</b>`;}
function enforceVersion(){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=$('health-version');if(h)h.textContent=VERSION;const r=$('tk55-runtime-build');if(r)r.textContent=VERSION;const title=$('tk103-runtime-health')?.querySelector('h3');if(title)title.textContent='⚡ Upgrade105 · Runtime/Latency + Fast Lane';}
async function checkServerBuild105(){enforceVersion();try{const u=new URL('./build.json',location.href);u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));const res=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});if(!res.ok)throw new Error('HTTP '+res.status);const x=await res.json();const s=$('tk55-server-build');if(s)s.textContent=x.version||x.build||'unknown';const ok=String(x.build||'')===BUILD;const st=$('tk55-update-state');if(st)st.textContent=ok?'✓ Runtime và server cùng Upgrade105.':'Runtime/server lệch build.';return ok}catch(e){const st=$('tk55-update-state');if(st)st.textContent='Không đọc được build server: '+(e?.message||e);return false}}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth&&!App.__u105Health){App.__u105Health=true;App.renderHealth=function(...args){const out=baseHealth(...args);enforceVersion();renderFastHealth();return out};}
for(const k of ['TopkeyUpgrade94','TopkeyUpgrade95','TopkeyUpgrade96','TopkeyUpgrade97','TopkeyUpgrade98','TopkeyUpgrade99','TopkeyUpgrade100','TopkeyUpgrade101','TopkeyUpgrade102','TopkeyUpgrade103']){const x=window[k];if(x)x.enforceVersion=enforceVersion;}
installScheduleCollapse();enforceVersion();renderFastHealth();setTimeout(()=>{installScheduleCollapse();enforceVersion();renderFastHealth()},0);setTimeout(enforceVersion,900);setTimeout(enforceVersion,1900);setTimeout(enforceVersion,2800);
window.addEventListener('hashchange',()=>setTimeout(installScheduleCollapse,0));window.addEventListener('topkey:languagechange',()=>setTimeout(installScheduleCollapse,0));window.addEventListener('focus',()=>{enforceVersion();renderFastHealth()},{passive:true});
const check=$('tk55-check-update');if(check)check.onclick=()=>checkServerBuild105();
window.TopkeyUpgrade105={installed:true,VERSION,BUILD,CACHE_TAG,state:S,syncQueuedScoreKeys,installScheduleCollapse,renderFastHealth,enforceVersion,checkServerBuild105,contract:'SCORING_FAST_LANE_SCHEDULE_COLLAPSE_001'};
})();
