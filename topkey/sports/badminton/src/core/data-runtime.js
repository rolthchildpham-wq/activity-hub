(()=>{
'use strict';
const T=window.Topkey,App=T?.App,U90=window.TopkeyUpgrade90;
if(!T||!App||!T.Data||window.TopkeyCoreDataRuntime115?.installed)return;
App.__upgrade102Installed=true;App.__upgrade103Installed=true;
const $=id=>document.getElementById(id),raf=window.requestAnimationFrame?.bind(window)||((fn)=>setTimeout(fn,16)),now=()=>window.performance?.now?.()||Date.now();
const L={coreOffs:[],tabOffs:[],subscribed:false,activeTab:'',adminDirty:new Set(),adminRenderPending:false,metrics:{corePaths:0,dynamicPaths:0,publicPaths:0,adminRenderFlushes:0,publicScheduleFlushes:0,publicLiveFlushes:0,childEvents:0,inactiveBranchSkips:0,hiddenRenderDefers:0,overviewSkips:0}};
const R={scoreSeq:0,pendingScore:null,metrics:{localScoreRenderMs:0,firebaseScoreWriteMs:0,viewerFirebaseReceiveMs:0,overviewSkips:0,legacyPollersStopped:0,healthRenders:0}};
const TAB_BRANCHES={
 overview:new Set(['config','teams','matches','courts','activeMatches','announcements']),
 teams:new Set(['config','teams','registrations']),schedule:new Set(['config','teams','matches','courts']),control:new Set(['teams','matches','courts','activeMatches']),
 umpire:new Set(['config','teams','matches','courts','activeMatches','commentary']),live:new Set(['config','teams','matches','courts','activeMatches','commentary']),
 finance:new Set(['finance']),announcements:new Set(['announcements']),audit:new Set(['audit']),settings:new Set(['config','users']),health:new Set()
};
function offAll(list){for(const off of list.splice(0)){try{off?.()}catch{}}}
function setMapChild(branch,key,val){const map=App.state[branch]&&typeof App.state[branch]==='object'?App.state[branch]:(App.state[branch]={});if(val===null||val===undefined)delete map[key];else map[key]=val}
function listenValue(path,apply){if(!T.Data?.ready||!T.Data?.ref)return()=>{};const r=T.Data.ref(path),f=s=>apply(s.val(),s.key);r.on('value',f);return()=>r.off('value',f)}
function listenGlobalValue(path,apply){if(!T.Data?.ready||!T.Data?.db)return()=>{};const r=T.Data.db.ref(`${T.ROOT}/${String(path).replace(/^\//,'')}`),f=s=>apply(s.val(),s.key);r.on('value',f);return()=>r.off('value',f)}
function listenMap(path,branch,onChange,{reset=true}={}){
 if(!T.Data?.ready||!T.Data?.ref)return()=>{};if(reset)App.state[branch]={};const r=T.Data.ref(path);
 const add=s=>{L.metrics.childEvents++;setMapChild(branch,s.key,s.val());onChange?.(branch,s.key,'add')};
 const change=s=>{L.metrics.childEvents++;setMapChild(branch,s.key,s.val());onChange?.(branch,s.key,'change')};
 const remove=s=>{L.metrics.childEvents++;setMapChild(branch,s.key,null);onChange?.(branch,s.key,'remove')};
 r.on('child_added',add);r.on('child_changed',change);r.on('child_removed',remove);
 return()=>{r.off('child_added',add);r.off('child_changed',change);r.off('child_removed',remove)};
}
function branchRelevant(branch,tab=App.currentTab||'overview'){const set=TAB_BRANCHES[String(tab||'overview')]||TAB_BRANCHES.overview;return set.has(branch)}
function flushAdminRender(){
 if(L.adminRenderPending)return;if(document.hidden){L.metrics.hiddenRenderDefers++;return}if(!L.adminDirty.size)return;
 L.adminRenderPending=true;raf(()=>{L.adminRenderPending=false;if(document.hidden){L.metrics.hiddenRenderDefers++;return}const dirty=[...L.adminDirty];L.adminDirty.clear();if(!dirty.length)return;
  const tab=String(App.currentTab||'overview'),relevant=dirty.filter(b=>branchRelevant(b,tab));L.metrics.inactiveBranchSkips+=dirty.length-relevant.length;if(!relevant.length)return;L.metrics.adminRenderFlushes++;
  for(const b of relevant){try{App.renderBranch?.(b)}catch(e){console.warn('Core data runtime render',b,e)}}
 });
}
function scheduleAdminRender(branch){L.adminDirty.add(branch);flushAdminRender()}
function dynamicBranchesForTab(tab){switch(String(tab||'')){case'teams':return['registrations'];case'finance':return['finance'];case'audit':return['audit'];case'live':case'umpire':return['commentary'];default:return[]}}
function attachDynamicBranch(branch){L.metrics.dynamicPaths++;if(['finance','registrations','audit','commentary'].includes(branch))return listenMap(branch,branch,()=>scheduleAdminRender(branch));return listenValue(branch,v=>{App.state[branch]=v||{};scheduleAdminRender(branch)})}
function activateTab(tab){
 if(!L.subscribed||location.hash.startsWith('#spectator'))return;tab=String(tab||App.currentTab||'overview');if(L.activeTab===tab)return;offAll(L.tabOffs);L.activeTab=tab;
 for(const branch of dynamicBranchesForTab(tab))L.tabOffs.push(attachDynamicBranch(branch));
 if(tab==='settings'&&String(T.Auth?.role?.()||'')==='ADMIN'){L.metrics.dynamicPaths++;L.tabOffs.push(listenGlobalValue('users',v=>{App.state.users=v||{};try{App.renderUsers?.()}catch{}}))}
 try{App.renderBranch?.(tab==='finance'?'finance':tab==='audit'?'audit':tab==='teams'?'registrations':(['live','umpire'].includes(tab)?'commentary':'config'))}catch{}
}
function subscribeCore(){
 offAll(L.coreOffs);offAll(L.tabOffs);try{(this.offs||[]).forEach(f=>f?.())}catch{};this.offs=[];L.subscribed=true;L.activeTab='';
 L.coreOffs.push(listenValue('config',v=>{this.state.config=v||{};scheduleAdminRender('config')}));L.metrics.corePaths++;
 for(const branch of ['teams','matches','courts','activeMatches']){L.coreOffs.push(listenMap(branch,branch,()=>scheduleAdminRender(branch)));L.metrics.corePaths++}
 L.coreOffs.push(listenMap('announcements','announcements',()=>scheduleAdminRender('announcements')));L.metrics.corePaths++;
 this.offs=[...L.coreOffs];activateTab(this.currentTab);
}
App.subscribe=subscribeCore;

try{U90?.stopLegacyPolling?.();R.metrics.legacyPollersStopped=1}catch{}
const baseOverview=App.renderOverview?.bind(App);
if(baseOverview&&!App.__core115Overview){App.__core115Overview=true;App.renderOverview=function(...args){if(location.hash.startsWith('#spectator')||String(this.currentTab||'overview')!=='overview'){R.metrics.overviewSkips++;L.metrics.overviewSkips++;return}return baseOverview(...args)}}
function renderTabFromCache(tab=App.currentTab){
 tab=String(tab||'overview');try{
  if(tab==='overview')return baseOverview?.();if(tab==='teams'){App.renderTeams?.();App.renderCheckin?.();App.renderRegistrations?.();return}
  if(tab==='schedule'){App.renderMatches?.();App.renderSelectors?.();App.renderStandings?.();App.renderSchedulerControls?.();return}
  if(tab==='control'){App.renderControl?.();App.renderSelectors?.();return}if(tab==='umpire'){App.renderUmpire?.();App.renderSelectors?.();return}if(tab==='live')return App.renderLiveScore?.();
  if(tab==='finance')return App.renderFinance?.();if(tab==='announcements')return App.renderAnnouncements?.();if(tab==='audit')return App.renderAudit?.();
  if(tab==='settings'){App.renderConfig?.();App.renderUsers?.();return}if(tab==='health')return App.renderHealth?.();
 }catch(e){console.warn('Core data runtime tab cache render',tab,e)}
}
const baseShowTab=App.showTab?.bind(App);
if(baseShowTab&&!App.__core115ShowTab){App.__core115ShowTab=true;App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);setTimeout(()=>{activateTab(tab);renderTabFromCache(tab)},0);return out}}
const baseRenderUmpire=App.renderUmpire?.bind(App);
if(baseRenderUmpire&&!App.__core115RenderUmpire){App.__core115RenderUmpire=true;App.renderUmpire=function(...args){const out=baseRenderUmpire(...args),p=R.pendingScore;if(p&&!p.rendered){p.rendered=true;R.metrics.localScoreRenderMs=Math.max(0,Math.round(now()-p.t0));renderRuntimeHealth()}return out}}
const baseScore=App.score?.bind(App);
if(baseScore&&!App.__core115Score){App.__core115Score=true;App.score=async function(...args){const token=++R.scoreSeq;R.pendingScore={token,t0:now(),rendered:false};try{return await baseScore(...args)}finally{setTimeout(()=>{if(R.pendingScore?.token===token)R.pendingScore=null},0)}}}
if(T.Data?.queueMulti&&!T.Data.__core115Latency){const baseQueue=T.Data.queueMulti.bind(T.Data);T.Data.__core115Latency=true;T.Data.__u103QueueWrapped=true;T.Data.queueMulti=async function(updates,meta={}){const score=String(meta?.type||'')==='SCORE',t0=score?now():0;try{return await baseQueue(updates,meta)}finally{if(score){R.metrics.firebaseScoreWriteMs=Math.max(0,Math.round(now()-t0));renderRuntimeHealth()}}}}
function ensureRuntimeHealth(){const page=$('page-health');if(!page)return null;let box=$('tk103-runtime-health');if(box)return box;box=document.createElement('section');box.id='tk103-runtime-health';box.className='card';box.style.marginTop='14px';box.innerHTML='<h3>⚡ Consolidated Runtime</h3><div id="tk103-runtime-grid" class="muted" style="line-height:1.7"></div>';page.appendChild(box);return box}
function renderRuntimeHealth(){const box=ensureRuntimeHealth(),g=$('tk103-runtime-grid');if(!box||!g)return;R.metrics.healthRenders++;const m=L.metrics;g.innerHTML=`Tap điểm → UI: <b>${R.metrics.localScoreRenderMs||'—'} ms</b> · Firebase SCORE write: <b>${R.metrics.firebaseScoreWriteMs||'—'} ms</b> · Viewer Firebase receive: <b>${R.metrics.viewerFirebaseReceiveMs||'—'} ms</b><br>Listener core/dynamic/public: <b>${m.corePaths||0}/${m.dynamicPaths||0}/${m.publicPaths||0}</b> · Render flush: <b>${m.adminRenderFlushes||0}</b> · bỏ render tab ẩn: <b>${m.inactiveBranchSkips||0}</b> · defer khi background: <b>${m.hiddenRenderDefers||0}</b> · legacy BLV poller: <b>${R.metrics.legacyPollersStopped?'OFF':'unknown'}</b>`}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth&&!App.__core115Health){App.__core115Health=true;App.renderHealth=function(...args){const out=baseHealth(...args);renderRuntimeHealth();return out}}
function onVisible(){if(document.hidden)return;flushAdminRender();setTimeout(()=>renderTabFromCache(App.currentTab),0)}
document.addEventListener('visibilitychange',onVisible,{passive:true});window.addEventListener('beforeunload',()=>{offAll(L.coreOffs);offAll(L.tabOffs)},{passive:true});
const compatEnforce=()=>window.TopkeyRuntime115?.enforce?.()||window.TopkeyRuntime114?.enforce?.();
const compatCheck=()=>window.TopkeyRuntime115?.checkServerBuild?.()||window.TopkeyRuntime114?.checkServerBuild?.()||Promise.resolve(false);
const U102={installed:true,VERSION:'consolidated-u115',BUILD:'upgrade115',CACHE_TAG:'u115-20261031',state:L,activateTab,listenMap,scheduleAdminRender,flushAdminRender,branchRelevant,startSpectatorLatency(){},stopSpectatorLatency(){},enforceVersion:compatEnforce,checkServerBuild102:compatCheck,contract:'FIREBASE_LATENCY_INCREMENTAL_TAB_SCOPED_001'};
const U103={installed:true,VERSION:'consolidated-u115',BUILD:'upgrade115',CACHE_TAG:'u115-20261031',state:R,renderTabFromCache,renderRuntimeHealth,enforceVersion:compatEnforce,checkServerBuild103:compatCheck,contract:'RENDER_RUNTIME_STABILITY_LATENCY_METRICS_001'};
window.TopkeyUpgrade102=U102;window.TopkeyUpgrade103=U103;
window.TopkeyCoreDataRuntime115={installed:true,listenerState:L,runtimeState:R,activateTab,flushAdminRender,renderTabFromCache,renderRuntimeHealth,contract:'CONSOLIDATED_DATA_RUNTIME_001'};
})();
