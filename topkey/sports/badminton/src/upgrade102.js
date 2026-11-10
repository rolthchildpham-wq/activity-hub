(() => {
'use strict';
const T=window.Topkey,App=T?.App,U88=window.TopkeyUpgrade88,U94=window.TopkeyUpgrade94;
if(!T||!App||App.__upgrade102Installed)return;
App.__upgrade102Installed=true;
const VERSION='2026.10.30-vnext-featureparity15-upgrade102-firebase-latency';
const BUILD='upgrade102',CACHE_TAG='u102-20261030';
const $=id=>document.getElementById(id);
const raf=window.requestAnimationFrame?.bind(window)||((fn)=>setTimeout(fn,16));
const S={
  coreOffs:[],tabOffs:[],publicOffs:[],subscribed:false,activeTab:'',
  adminDirty:new Set(),adminRenderPending:false,publicSchedulePending:false,publicLivePending:false,
  metrics:{corePaths:0,dynamicPaths:0,publicPaths:0,adminRenderFlushes:0,publicScheduleFlushes:0,publicLiveFlushes:0,childEvents:0,inactiveBranchSkips:0,hiddenRenderDefers:0,overviewSkips:0},
  contracts:['FIREBASE_LATENCY_U102','TAB_SCOPED_LISTENERS_001','PUBLIC_VIEWER_INCREMENTAL_001']
};
function offAll(list){for(const off of list.splice(0)){try{off?.()}catch{}}}
function setMapChild(branch,key,val){const map=App.state[branch]&&typeof App.state[branch]==='object'?App.state[branch]:(App.state[branch]={});if(val===null||val===undefined)delete map[key];else map[key]=val}
function listenValue(path,apply){if(!T.Data?.ready||!T.Data?.ref)return()=>{};const r=T.Data.ref(path),f=s=>apply(s.val(),s.key);r.on('value',f);return()=>r.off('value',f)}
function listenGlobalValue(path,apply){if(!T.Data?.ready||!T.Data?.db)return()=>{};const r=T.Data.db.ref(`${T.ROOT}/${String(path).replace(/^\//,'')}`),f=s=>apply(s.val(),s.key);r.on('value',f);return()=>r.off('value',f)}
function listenMap(path,branch,onChange,{reset=true}={}){
  if(!T.Data?.ready||!T.Data?.ref)return()=>{};
  if(reset)App.state[branch]={};
  const r=T.Data.ref(path);
  const add=s=>{S.metrics.childEvents++;setMapChild(branch,s.key,s.val());onChange?.(branch,s.key,'add')};
  const change=s=>{S.metrics.childEvents++;setMapChild(branch,s.key,s.val());onChange?.(branch,s.key,'change')};
  const remove=s=>{S.metrics.childEvents++;setMapChild(branch,s.key,null);onChange?.(branch,s.key,'remove')};
  r.on('child_added',add);r.on('child_changed',change);r.on('child_removed',remove);
  return()=>{r.off('child_added',add);r.off('child_changed',change);r.off('child_removed',remove)};
}
const TAB_BRANCHES={
  overview:new Set(['config','teams','matches','courts','activeMatches','announcements']),
  teams:new Set(['config','teams','registrations']),
  schedule:new Set(['config','teams','matches','courts']),
  control:new Set(['teams','matches','courts','activeMatches']),
  umpire:new Set(['config','teams','matches','courts','activeMatches','commentary']),
  live:new Set(['config','teams','matches','courts','activeMatches','commentary']),
  finance:new Set(['finance']),announcements:new Set(['announcements']),audit:new Set(['audit']),settings:new Set(['config','users']),health:new Set()
};
function branchRelevant(branch,tab=App.currentTab||'overview'){const set=TAB_BRANCHES[String(tab||'overview')]||TAB_BRANCHES.overview;return set.has(branch)}
function flushAdminRender(){
  if(S.adminRenderPending)return;
  if(document.hidden){S.metrics.hiddenRenderDefers++;return}
  if(!S.adminDirty.size)return;
  S.adminRenderPending=true;raf(()=>{S.adminRenderPending=false;if(document.hidden){S.metrics.hiddenRenderDefers++;return}
    const dirty=[...S.adminDirty];S.adminDirty.clear();if(!dirty.length)return;const tab=String(App.currentTab||'overview');const relevant=dirty.filter(b=>branchRelevant(b,tab));
    S.metrics.inactiveBranchSkips+=dirty.length-relevant.length;if(!relevant.length)return;S.metrics.adminRenderFlushes++;
    for(const b of relevant){try{App.renderBranch?.(b)}catch(e){console.warn('U102 admin render',b,e)}}
  })
}
function scheduleAdminRender(branch){S.adminDirty.add(branch);flushAdminRender()}
function dynamicBranchesForTab(tab){
  switch(String(tab||'')){
    case 'teams':return['registrations'];
    case 'finance':return['finance'];
    case 'audit':return['audit'];
    case 'live':case 'umpire':return['commentary'];
    default:return[];
  }
}
function attachDynamicBranch(branch){
  S.metrics.dynamicPaths++;
  if(['finance','registrations','audit','commentary'].includes(branch))return listenMap(branch,branch,()=>scheduleAdminRender(branch));
  return listenValue(branch,v=>{App.state[branch]=v||{};scheduleAdminRender(branch)});
}
function activateTab(tab){
  if(!S.subscribed||location.hash.startsWith('#spectator'))return;
  tab=String(tab||App.currentTab||'overview');if(S.activeTab===tab)return;
  offAll(S.tabOffs);S.activeTab=tab;
  for(const branch of dynamicBranchesForTab(tab))S.tabOffs.push(attachDynamicBranch(branch));
  if(tab==='settings'&&String(T.Auth?.role?.()||'')==='ADMIN'){
    S.metrics.dynamicPaths++;
    S.tabOffs.push(listenGlobalValue('users',v=>{App.state.users=v||{};try{App.renderUsers?.()}catch{}}));
  }
  // Render cached state immediately; Firebase only refreshes the newly relevant branch afterward.
  try{App.renderBranch?.(tab==='finance'?'finance':tab==='audit'?'audit':tab==='teams'?'registrations':(['live','umpire'].includes(tab)?'commentary':'config'))}catch{}
}
function subscribeLatency(){
  offAll(S.coreOffs);offAll(S.tabOffs);try{(this.offs||[]).forEach(f=>f?.())}catch{};this.offs=[];S.subscribed=true;S.activeTab='';
  // Core operational state: stays live because it powers overview, scheduler, referee and Live ownership.
  S.coreOffs.push(listenValue('config',v=>{this.state.config=v||{};scheduleAdminRender('config')}));S.metrics.corePaths++;
  for(const branch of ['teams','matches','courts','activeMatches']){S.coreOffs.push(listenMap(branch,branch,()=>{scheduleAdminRender(branch);if(branch==='activeMatches'){try{U94?.onActiveMatches?.(App.state.activeMatches||{})}catch{};try{U94?.bindCourt?.()}catch{}}else if(branch==='courts'){try{U94?.bindCourt?.()}catch{}}}));S.metrics.corePaths++}
  // Latest announcement is needed on overview/login, but other heavy modules are tab-scoped.
  S.coreOffs.push(listenMap('announcements','announcements',()=>scheduleAdminRender('announcements')));S.metrics.corePaths++;
  this.offs=[...S.coreOffs];activateTab(this.currentTab);
}
const baseShowTab=App.showTab?.bind(App);
if(baseShowTab)App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);setTimeout(()=>activateTab(tab),0);return out};
App.subscribe=subscribeLatency;

function suppressLegacyViewerGlobalListeners(){
  const st=U94?.state;if(!st)return;
  try{for(const off of st.offs||[])off?.()}catch{}
  // Upgrade94 installUi checks .length before attaching its historical full-tree listeners.
  // Keep a no-op sentinel: commentary/<court>/latest remains independently bound by bindCourt().
  st.offs=[()=>{}];
}
function schedulePublicSchedule(){if(S.publicSchedulePending)return;S.publicSchedulePending=true;raf(()=>{S.publicSchedulePending=false;S.metrics.publicScheduleFlushes++;try{App.renderSpectator?.()}catch(e){console.warn('U102 spectator render',e)}try{U88?.ensureViewerAnnouncement?.()}catch{}})}
function schedulePublicLive(){if(S.publicLivePending)return;S.publicLivePending=true;raf(()=>{S.publicLivePending=false;S.metrics.publicLiveFlushes++;try{U88?.renderPublicLiveFirst?.()}catch(e){console.warn('U102 public live',e)}try{U94?.onActiveMatches?.(App.state.activeMatches||{})}catch{}try{U94?.bindCourt?.()}catch{}})}
function publicMap(path,branch,kind='schedule'){
  S.metrics.publicPaths++;
  return listenMap(path,branch,()=>{if(kind==='live')schedulePublicLive();else if(kind==='both')schedulePublicSchedule();else if(kind==='announce'){try{U88?.ensureViewerAnnouncement?.()}catch{}}else schedulePublicSchedule()});
}
function startSpectatorLatency(){
  if(this.spectatorStarted&&S.publicOffs.length)return;
  try{this.stopSpectator?.()}catch{};this.spectatorStarted=true;this.spectatorOffs=[];offAll(S.publicOffs);suppressLegacyViewerGlobalListeners();
  // Public Viewer no longer subscribes to the whole commentary tree. Upgrade94 follows only commentary/<selectedCourt>/latest.
  S.metrics.publicPaths++;
  S.publicOffs.push(listenValue('config/title',v=>{this.state.config={...(this.state.config||{}),title:v||'Topkey Badminton Live'};const e=$('spectator-title');if(e)e.textContent='🏸 '+(v||'Topkey Badminton Live')}));
  S.publicOffs.push(publicMap('teams','teams','both'));
  S.publicOffs.push(publicMap('matches','matches','both'));
  S.publicOffs.push(publicMap('courts','courts','live'));
  S.publicOffs.push(publicMap('activeMatches','activeMatches','live'));
  S.publicOffs.push(publicMap('announcements','announcements','announce'));
  this.spectatorOffs=[...S.publicOffs];
  schedulePublicSchedule();schedulePublicLive();
}
function stopSpectatorLatency(){offAll(S.publicOffs);this.spectatorOffs=[];this.spectatorStarted=false}
App.startSpectator=startSpectatorLatency;App.stopSpectator=stopSpectatorLatency;
suppressLegacyViewerGlobalListeners();

function enforceVersion(){
  T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h&&h.textContent!==VERSION)h.textContent=VERSION;const r=$('tk55-runtime-build');if(r&&r.textContent!==VERSION)r.textContent=VERSION;
}
async function checkServerBuild102(){
  enforceVersion();try{const u=new URL('./build.json',location.href);u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));const res=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});if(!res.ok)throw new Error('HTTP '+res.status);const x=await res.json();const s=$('tk55-server-build');if(s)s.textContent=x.version||x.build||'unknown';const ok=String(x.build||'')===BUILD;const st=$('tk55-update-state');if(st)st.textContent=ok?'✓ Runtime và server cùng Upgrade102.':'Runtime/server lệch build.';return ok}catch(e){const st=$('tk55-update-state');if(st)st.textContent='Không đọc được build server: '+(e?.message||e);return false}
}
for(const k of ['TopkeyUpgrade94','TopkeyUpgrade95','TopkeyUpgrade96','TopkeyUpgrade97','TopkeyUpgrade98','TopkeyUpgrade99','TopkeyUpgrade100','TopkeyUpgrade101']){const x=window[k];if(x){x.enforceVersion=enforceVersion;for(const n of Object.keys(x))if(/^checkServerBuild\d+$/.test(n))x[n]=checkServerBuild102}}
enforceVersion();setTimeout(enforceVersion,0);setTimeout(enforceVersion,700);setTimeout(enforceVersion,1700);setTimeout(enforceVersion,2800);
const check=$('tk55-check-update');if(check)check.onclick=()=>checkServerBuild102();
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#spectator')){suppressLegacyViewerGlobalListeners();setTimeout(()=>App.startSpectator?.(),0)}else if(S.publicOffs.length)App.stopSpectator?.()},{passive:true});
window.addEventListener('beforeunload',()=>{offAll(S.coreOffs);offAll(S.tabOffs);offAll(S.publicOffs)},{passive:true});
window.TopkeyUpgrade102={installed:true,VERSION,BUILD,CACHE_TAG,state:S,activateTab,listenMap,scheduleAdminRender,flushAdminRender,branchRelevant,startSpectatorLatency,stopSpectatorLatency,enforceVersion,checkServerBuild102,contract:'FIREBASE_LATENCY_INCREMENTAL_TAB_SCOPED_001'};
})();
