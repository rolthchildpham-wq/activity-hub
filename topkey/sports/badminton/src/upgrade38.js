(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade38Installed)return;
App.__upgrade38Installed=true;
const VERSION=T.CONFIG_VERSION||T.VERSION;
const tr=(vi,en,zh)=>{const l=window.TopkeyI18n?.language||'vi';return l==='en'?en:l==='zh'?zh:vi;};
const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
let persistPromise=null,lastMigration=null;

function hideLegacyTeamBusy(){
  const card=document.querySelector('#page-schedule .scheduler-busy');
  if(!card)return;
  card.classList.add('tk38-legacy-team-busy-hidden');
  card.setAttribute('aria-hidden','true');
  try{card.inert=true;}catch{}
}
function normalizePlayerBusy(rows){
  const map=new Map();
  (rows||[]).forEach(r=>{
    const name=String(r?.name||'').trim(),date=String(r?.date||'').trim(),k=fold(name);
    if(!k||!date)return;
    const key=`${k}|${date}`;
    if(!map.has(key))map.set(key,{...r,name,date});
  });
  return [...map.values()].sort((a,b)=>fold(a.name).localeCompare(fold(b.name))||String(a.date).localeCompare(String(b.date)));
}
function migrationPlan(){
  const config=App.state.config||{},s=config.scheduler||{},legacy=Array.isArray(s.busy)?s.busy:[];
  if(!legacy.length)return null;
  const teams=App.state.teams||{};
  if(!Object.keys(teams).length)return null; // wait for the full teams snapshot
  const playerBusy=Array.isArray(s.playerBusy)?[...s.playerBusy]:[],unresolved=[];
  let migratedRules=0,createdPlayerRows=0;
  const existing=new Set(playerBusy.map(r=>`${fold(r?.name)}|${r?.date||''}`));
  legacy.forEach(r=>{
    const team=teams[r?.teamId],date=String(r?.date||'').trim();
    const names=team?[team.p1,team.p2].map(x=>String(x||'').trim()).filter(Boolean):[];
    if(!date||!names.length){unresolved.push({...r,reason:!team?'TEAM_NOT_FOUND':'NO_PLAYER_NAME'});return;}
    migratedRules++;
    names.forEach(name=>{
      const key=`${fold(name)}|${date}`;
      if(!fold(name)||existing.has(key))return;
      existing.add(key);createdPlayerRows++;
      playerBusy.push({name,date,updatedAt:Date.now(),source:'TEAM_BUSY_MIGRATION_V38',sourceTeamId:r.teamId});
    });
  });
  const nextScheduler={...s,busy:[],playerBusy:normalizePlayerBusy(playerBusy),busyMigrationV38:{completedAt:Date.now(),legacyRules:legacy.length,migratedRules,createdPlayerRows,unresolved:unresolved.length}};
  if(unresolved.length)nextScheduler.legacyBusyUnresolvedV38=unresolved;
  else delete nextScheduler.legacyBusyUnresolvedV38;
  const before={...config,scheduler:s},after={...config,scheduler:nextScheduler,updatedAt:Date.now()};
  return{before,after,nextScheduler,legacy,migratedRules,createdPlayerRows,unresolved};
}
function migrateLegacyBusy({persist=true,notify=false}={}){
  const p=migrationPlan();
  if(!p)return null;
  App.state.config=p.after; // immediately remove hidden team rules from the active scheduler
  lastMigration=p;
  try{window.TopkeyUpgrade33?.renderAll?.();}catch{}
  if(persist&&!persistPromise){
    persistPromise=(async()=>{
      try{
        await T.Data.queueSet('config',p.after,{type:'SCHED_BUSY_TEAM_TO_PLAYER_V38'});
        await T.Data.audit('MIGRATE','scheduler_busy','team_to_player_v38',p.legacy,{playerBusy:p.nextScheduler.playerBusy,migratedRules:p.migratedRules,createdPlayerRows:p.createdPlayerRows,unresolved:p.unresolved});
        if(notify)U.toast(tr(`Đã gộp ${p.migratedRules} quy tắc ngày bận theo đội sang VĐV.`,`Merged ${p.migratedRules} team busy-day rules into player rules.`,`已将 ${p.migratedRules} 条队伍不可用日期规则合并为运动员规则。`),'ok');
      }catch(e){
        console.error('Upgrade38 busy migration persist failed',e);
        U.toast(tr('Đã chuyển ngày bận sang VĐV trong phiên này nhưng chưa ghi được Firebase: ','Busy days were converted to players for this session, but Firebase save failed: ','本次会话已将不可用日期转换为运动员规则，但 Firebase 保存失败：')+(e?.message||e),'err');
      }finally{persistPromise=null;}
    })();
  }
  return p;
}
function patchRender(){
  const base=App.renderSchedulerControls?.bind(App);
  if(!base||App.__u38SchedulerRender)return;
  App.__u38SchedulerRender=true;
  App.renderSchedulerControls=function(...args){
    migrateLegacyBusy({persist:true,notify:false});
    const out=base(...args);
    hideLegacyTeamBusy();
    return out;
  };
}
function patchActions(){
  // The legacy DOM remains only because app.js binds static handlers to it at startup.
  // It is inert/hidden and this guard prevents any programmatic call from recreating team-busy rules.
  App.addBusyException=async function(){
    hideLegacyTeamBusy();
    U.toast(tr('Ngày bận hiện chỉ cài theo tên VĐV. Hãy dùng khối “Ngày bận theo VĐV”.','Busy days are now configured by player name only. Use “Player busy days”.','不可用日期现在仅按运动员姓名设置，请使用“运动员不可用日期”。'),'info');
  };
}
function patchScheduleEntry(){
  const base=App.autoSchedule?.bind(App);
  if(base&&!App.__u38AutoSchedule){App.__u38AutoSchedule=true;App.autoSchedule=async function(...args){migrateLegacyBusy({persist:true,notify:false});return base(...args);};}
  const preview=App.previewSchedule?.bind(App);
  if(preview&&!App.__u38PreviewSchedule){App.__u38PreviewSchedule=true;App.previewSchedule=function(...args){migrateLegacyBusy({persist:true,notify:false});return preview(...args);};}
}
function install(){
  if(VERSION&&T.VERSION!==VERSION)T.VERSION=VERSION;
  hideLegacyTeamBusy();patchRender();patchActions();patchScheduleEntry();
  setTimeout(()=>{hideLegacyTeamBusy();migrateLegacyBusy({persist:true,notify:false});},0);
}
install();
window.addEventListener('topkey:languagechange',()=>hideLegacyTeamBusy());
window.TopkeyUpgrade38={installed:true,VERSION,hideLegacyTeamBusy,normalizePlayerBusy,migrationPlan,migrateLegacyBusy,getLastMigration:()=>lastMigration};
})();
