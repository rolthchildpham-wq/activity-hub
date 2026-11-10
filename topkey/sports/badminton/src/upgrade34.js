(() => {
'use strict';
const T=window.Topkey,App=T?.App;
if(!T||!App||App.__upgrade34Installed)return;
App.__upgrade34Installed=true;
const $=id=>document.getElementById(id);
const VERSION=T.CONFIG_VERSION||T.VERSION;
function lang(){return window.TopkeyI18n?.language||'vi';}
function tr(vi,en,zh){const l=lang();return l==='en'?en:l==='zh'?zh:vi;}

// Version must have exactly one source of truth. config.js owns the version;
// this guard also repairs sessions that loaded a stale Upgrade 25 script before Upgrade 34.
function repairVersion(){
  if(T.VERSION!==VERSION)T.VERSION=VERSION;
  const health=$('health-version');if(health)health.textContent=VERSION;
  const repair=$('tk19-repair-card')?.querySelector('.pill');if(repair)repair.textContent=VERSION;
}
function patchHealth(){
  const base=App.renderHealth?.bind(App);if(base&&!App.__u34Health){App.__u34Health=true;App.renderHealth=function(...args){repairVersion();const out=base(...args);repairVersion();return out;};}
  repairVersion();
}

let activePane=null;
function buttonLabel(expanded){return expanded?tr('🗗 Thu nhỏ','🗗 Restore','🗗 还原'):tr('⛶ Phóng to','⛶ Full screen','⛶ 全屏');}
function paneTitle(kind){return kind==='upper'?tr('Tạo lịch / Smart Scheduler','Schedule / Smart Scheduler','创建赛程 / 智能排程'):tr('Lịch thi đấu','Match schedule','比赛日程');}
function updateButtons(){
  document.querySelectorAll('[data-tk34-pane-toggle]').forEach(btn=>{
    const kind=btn.dataset.tk34PaneToggle,expanded=activePane?.dataset.tk34Pane===kind;
    btn.textContent=buttonLabel(expanded);btn.setAttribute('aria-pressed',expanded?'true':'false');
    btn.title=expanded?tr(`Thu nhỏ ${paneTitle(kind)}`,`Restore ${paneTitle(kind)}`,`还原${paneTitle(kind)}`):tr(`Phóng to ${paneTitle(kind)}`,`Full screen ${paneTitle(kind)}`,`${paneTitle(kind)}全屏`);
  });
}
function closePane(){
  if(!activePane)return;
  activePane.classList.remove('tk34-pane-maximized');activePane.removeAttribute('data-tk34-active');
  document.body.classList.remove('tk34-pane-open');activePane=null;updateButtons();
}
function openPane(pane){
  if(!pane)return;
  if(activePane===pane){closePane();return;}
  closePane();activePane=pane;pane.classList.add('tk34-pane-maximized');pane.dataset.tk34Active='1';document.body.classList.add('tk34-pane-open');updateButtons();
  requestAnimationFrame(()=>pane.querySelector('[data-tk34-pane-toggle]')?.focus({preventScroll:true}));
}
function addToggle(kind,pane,card){
  if(!pane||!card)return;
  pane.dataset.tk34Pane=kind;
  let btn=card.querySelector(`[data-tk34-pane-toggle="${kind}"]`);if(btn)return;
  btn=document.createElement('button');btn.type='button';btn.className='btn mini tk34-pane-toggle';btn.dataset.tk34PaneToggle=kind;btn.setAttribute('aria-pressed','false');btn.onclick=()=>openPane(pane);
  const split=card.querySelector(':scope > .split');let bar=split?.querySelector('.action-bar');
  if(split&&!bar){bar=document.createElement('div');bar.className='action-bar';split.appendChild(bar);}
  if(bar)bar.appendChild(btn);else card.insertBefore(btn,card.firstChild);
}
function ensurePaneControls(){
  const page=$('page-schedule');if(!page)return false;
  try{window.TopkeyUpgrade32?.installScheduleSplit?.();}catch{}
  const upper=page.querySelector('.tk32-schedule-upper'),lower=page.querySelector('.tk32-schedule-lower');
  if(!upper||!lower)return false;
  const upperCard=upper.querySelector(':scope > .card'),lowerCard=lower.querySelector(':scope > .card');
  addToggle('upper',upper,upperCard);addToggle('lower',lower,lowerCard);updateButtons();return true;
}
function patchScheduleRender(){
  const base=App.renderSchedulerControls?.bind(App);if(base&&!App.__u34SchedulerRender){App.__u34SchedulerRender=true;App.renderSchedulerControls=function(...args){const out=base(...args);setTimeout(ensurePaneControls,0);return out;};}
  const baseMatches=App.renderMatches?.bind(App);if(baseMatches&&!App.__u34Matches){App.__u34Matches=true;App.renderMatches=function(...args){const out=baseMatches(...args);setTimeout(ensurePaneControls,0);return out;};}
}
function install(){repairVersion();patchHealth();patchScheduleRender();ensurePaneControls();setTimeout(()=>{repairVersion();ensurePaneControls();App.renderHealth?.();},0);}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&activePane){const overlay=document.querySelector('.modal:not(.hidden),.tk28-language-modal:not(.tk28-hidden),.tk9-draw-modal:not(.hidden),.public-register:not(.hidden),.audio-overlay:not(.hidden),.video-box.pseudo-full,.tk9-unlock-pop:not(.hidden)');if(overlay)return;e.preventDefault();closePane();}},true);
window.addEventListener('topkey:languagechange',()=>{updateButtons();repairVersion();});
window.addEventListener('pagehide',closePane);
install();
window.TopkeyUpgrade34={installed:true,VERSION,repairVersion,ensurePaneControls,openPane,closePane,get activePane(){return activePane;}};
})();
