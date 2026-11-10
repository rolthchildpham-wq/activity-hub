(() => {
'use strict';
const T=window.Topkey,App=T?.App;
if(!T||!App||App.__upgrade32Installed)return;
App.__upgrade32Installed=true;
const $=id=>document.getElementById(id);
const DONE=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
const CANCELLED='CANCELLED';
const DRAFT_VALUE_IDS=[
  'adv-category','auto-date','auto-end-date','auto-time','auto-interval','auto-max-day','auto-sunday','auto-reschedule',
  'lock-date','busy-date','priority-from','priority-to','limit-from','limit-to','limit-count',
  'tk20-player-window-name','tk20-player-window-from-date','tk20-player-window-to-date','tk20-player-window-from-time','tk20-player-window-to-time','tk20-player-window-limit','tk20-player-window-early'
];
const DRAFT_PICKERS=['busy-team-grid','priority-team-grid','limit-team-grid'];
let saveTimer=0;
function lang(){return window.TopkeyI18n?.language||'vi';}
function tr(vi,en,zh){const l=lang();return l==='en'?en:l==='zh'?zh:vi;}
function draftKey(){return `topkey_scheduler_draft_v32:${T.Data?.tid||'main_2026'}`;}
function readDraft(){try{const raw=localStorage.getItem(draftKey());if(!raw)return null;const v=JSON.parse(raw);return v&&typeof v==='object'?v:null;}catch{return null;}}
function pickerSelection(id){return [...document.querySelectorAll(`#${id} input[type="checkbox"][data-team-id]:checked`)].map(x=>x.dataset.teamId).filter(Boolean);}
function collectDraft(){
  const values={};
  DRAFT_VALUE_IDS.forEach(id=>{const el=$(id);if(!el)return;values[id]=el.type==='checkbox'?!!el.checked:el.value;});
  const selected={};DRAFT_PICKERS.forEach(id=>selected[id]=pickerSelection(id));
  return {version:32,tournamentId:T.Data?.tid||'main_2026',updatedAt:Date.now(),values,selected};
}
function saveDraft(){try{localStorage.setItem(draftKey(),JSON.stringify(collectDraft()));}catch{}}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveDraft,80);}
function latestPlayerWindow(){const rows=App.state.config?.scheduler?.playerTimeWindows;return Array.isArray(rows)&&rows.length?[...rows].sort((a,b)=>(Number(b.updatedAt)||0)-(Number(a.updatedAt)||0))[0]:null;}
function applyValue(el,value){if(!el||value===undefined||value===null)return;if(el.type==='checkbox')el.checked=!!value;else el.value=String(value);}
function restoreDraft(){
  const draft=readDraft(),values=draft?.values||{};
  DRAFT_VALUE_IDS.forEach(id=>{if(Object.prototype.hasOwnProperty.call(values,id))applyValue($(id),values[id]);});
  if(!draft){
    const r=latestPlayerWindow();if(r){
      applyValue($('tk20-player-window-name'),r.name||'');applyValue($('tk20-player-window-from-date'),r.fromDate||'');applyValue($('tk20-player-window-to-date'),r.toDate||'');applyValue($('tk20-player-window-from-time'),r.fromTime||'17:15');applyValue($('tk20-player-window-to-time'),r.toTime||'22:00');applyValue($('tk20-player-window-limit'),r.enforceWindow!==false);applyValue($('tk20-player-window-early'),!!r.preferEarliest);
    }
  }
  const selected=draft?.selected||{};
  DRAFT_PICKERS.forEach(id=>{const ids=new Set(Array.isArray(selected[id])?selected[id]:[]);document.querySelectorAll(`#${id} input[type="checkbox"][data-team-id]`).forEach(cb=>{cb.checked=ids.has(cb.dataset.teamId);});});
  try{window.TopkeyUpgrade21?.refreshDatePickers?.(false);}catch{}
}
function bindDraftPersistence(){
  const page=$('page-schedule');if(!page||page.dataset.tk32DraftBound==='1')return;page.dataset.tk32DraftBound='1';
  const watched=new Set(DRAFT_VALUE_IDS),pickers=new Set(DRAFT_PICKERS);
  const onChange=e=>{const el=e.target;if(!el)return;const pickerHit=[...pickers].some(id=>el.closest?.(`#${id}`)&&el.matches?.('input[data-team-id]'));if(pickerHit)saveDraft();else if(watched.has(el.id))scheduleSave();};
  page.addEventListener('input',onChange,true);page.addEventListener('change',onChange,true);
  addEventListener('pagehide',saveDraft);addEventListener('beforeunload',saveDraft);
}
function findAdminMatch(row){
  const id=row?.dataset?.matchId;if(id&&App.state.matches?.[id])return App.state.matches[id];
  const code=row?.cells?.[0]?.textContent?.trim()||'';return Object.values(App.state.matches||{}).find(m=>String(m.code||m.id||'').trim()===code)||null;
}
function adminGroupRows(header){const out=[];let n=header?.nextElementSibling;while(n&&!n.classList.contains('tk12-day-row')){if(n.classList.contains('tk12-match-row'))out.push(n);n=n.nextElementSibling;}return out;}
function updateAdminDayHeaders(){
  const box=$('matches-list');if(!box)return;
  [...box.querySelectorAll('tr.tk12-day-row')].forEach(header=>{
    const rows=adminGroupRows(header);if(!rows.length){header.remove();return;}
    const done=rows.reduce((n,row)=>n+(DONE.has(findAdminMatch(row)?.status)?1:0),0),span=header.querySelector('.tk12-day-head span');
    if(span)span.textContent=done?tr(`${rows.length} trận · ${done} đã kết thúc`,`${rows.length} matches · ${done} completed`,`${rows.length} 场 · ${done} 场已结束`):tr(`${rows.length} trận`,`${rows.length} matches`,`${rows.length} 场`);
  });
}
function hideCancelledAdmin(){
  const box=$('matches-list');if(!box)return 0;let removed=0;
  [...box.querySelectorAll('tr.tk12-match-row')].forEach(row=>{const m=findAdminMatch(row);if(row.classList.contains('tk12-status-cancelled')||m?.status===CANCELLED){row.remove();removed++;}});
  updateAdminDayHeaders();
  setTimeout(()=>{try{window.TopkeyUpgrade24?.applyAdminSearch?.();}catch{}},0);
  return removed;
}
function findPublicMatch(card){const code=card?.querySelector('.tk12-match-code')?.textContent?.trim()||'';return Object.values(App.state.matches||{}).find(m=>String(m.code||m.id||'').trim()===code)||null;}
function publicGroupCards(header){const out=[];let n=header?.nextElementSibling;while(n&&!n.classList.contains('tk12-public-day')){if(n.classList.contains('tk12-public-match'))out.push(n);n=n.nextElementSibling;}return out;}
function updatePublicDayHeaders(){
  const sched=$('spectator-schedule');if(!sched)return;
  [...sched.querySelectorAll('.tk12-public-day')].forEach(header=>{const cards=publicGroupCards(header);if(!cards.length){header.remove();return;}const span=header.querySelector('span');if(span)span.textContent=tr(`${cards.length} trận`,`${cards.length} matches`,`${cards.length} 场`);});
}
function hideCancelledPublic(){
  const sched=$('spectator-schedule');if(!sched)return 0;let removed=0;
  [...sched.querySelectorAll('.tk12-public-match')].forEach(card=>{const m=findPublicMatch(card);if(card.classList.contains('tk12-status-cancelled')||m?.status===CANCELLED){card.remove();removed++;}});
  updatePublicDayHeaders();
  setTimeout(()=>{try{window.TopkeyUpgrade26?.applyPublicSearch?.();}catch{}},0);
  return removed;
}
function installCancelledFilters(){
  const baseMatches=App.renderMatches?.bind(App);if(baseMatches&&!App.__u32Matches){App.__u32Matches=true;App.renderMatches=function(...args){const out=baseMatches(...args);hideCancelledAdmin();return out;};}
  const baseSpectator=App.renderSpectator?.bind(App);if(baseSpectator&&!App.__u32Spectator){App.__u32Spectator=true;App.renderSpectator=function(...args){const out=baseSpectator(...args);hideCancelledPublic();return out;};}
}
function installScheduleSplit(){
  const page=$('page-schedule');if(!page||page.classList.contains('tk32-split-ready'))return false;
  const cards=[...page.children].filter(el=>el.classList?.contains('card'));if(cards.length<3)return false;
  const workspace=document.createElement('div'),upper=document.createElement('div'),lower=document.createElement('div');
  workspace.className='tk32-schedule-workspace';upper.className='tk32-schedule-upper';lower.className='tk32-schedule-lower';
  page.insertBefore(workspace,cards[0]);workspace.append(upper,lower);upper.append(cards[0],cards[1]);lower.append(cards[2]);
  cards[2].classList.add('tk32-schedule-list-card');cards[2].querySelector('.table-wrap')?.classList.add('tk32-schedule-table-scroll');page.classList.add('tk32-split-ready');
  return true;
}
function patchSchedulerConfigPreserve(){
  const base=App.schedulerConfig?.bind(App);if(!base||App.__u32SchedulerConfig)return;App.__u32SchedulerConfig=true;
  App.schedulerConfig=function(...args){const stored=this.state.config?.scheduler||{},current=base(...args)||{};return {...stored,...current,playerBusy:Array.isArray(stored.playerBusy)?stored.playerBusy:(current.playerBusy||[]),playerTimeWindows:Array.isArray(stored.playerTimeWindows)?stored.playerTimeWindows:(current.playerTimeWindows||[])};};
}
function patchSchedulerRender(){
  const base=App.renderSchedulerControls?.bind(App);if(base&&!App.__u32SchedulerRender){App.__u32SchedulerRender=true;App.renderSchedulerControls=function(...args){const out=base(...args);restoreDraft();bindDraftPersistence();return out;};}
  const preview=App.previewSchedule?.bind(App);if(preview&&!App.__u32Preview){App.__u32Preview=true;App.previewSchedule=function(...args){saveDraft();return preview(...args);};}
  const auto=App.autoSchedule?.bind(App);if(auto&&!App.__u32Auto){App.__u32Auto=true;App.autoSchedule=function(...args){saveDraft();return auto(...args);};}
  for(const name of ['addPriorityWindow','addBusyException','addDailyLimit']){const base=App[name]?.bind(App),flag='__u32Persist_'+name;if(base&&!App[flag]){App[flag]=true;App[name]=function(...args){saveDraft();return base(...args);};}}
}
function install(){
  patchSchedulerConfigPreserve();installCancelledFilters();patchSchedulerRender();installScheduleSplit();bindDraftPersistence();restoreDraft();hideCancelledAdmin();hideCancelledPublic();
  setTimeout(()=>{installScheduleSplit();bindDraftPersistence();restoreDraft();hideCancelledAdmin();hideCancelledPublic();},0);
}
install();
window.addEventListener('topkey:languagechange',()=>{updateAdminDayHeaders();updatePublicDayHeaders();});
window.TopkeyUpgrade32={installed:true,collectDraft,readDraft,saveDraft,restoreDraft,hideCancelledAdmin,hideCancelledPublic,installScheduleSplit,patchSchedulerConfigPreserve,draftKey};
})();
