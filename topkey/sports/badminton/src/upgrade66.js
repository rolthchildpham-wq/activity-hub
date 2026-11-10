(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U58=window.TopkeyUpgrade58;
if(!T||!App||!U||App.__upgrade66Installed)return;
App.__upgrade66Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade67-start-gate-blv-fx';
const CACHE_TAG='u67-20261029';
const BUILD='upgrade66';
const $=id=>document.getElementById(id);

function currentSet(s){return s?.sets?.[Number(s?.setIndex)||0]||null;}
function ensurePositions(s){
  s.positions=s.positions||{};
  for(const side of ['A','B']){
    const p=s.positions[side]||(s.positions[side]={p1:'right',p2:'left'});
    if(!['right','left'].includes(p.p1)||!['right','left'].includes(p.p2)||p.p1===p.p2){p.p1='right';p.p2='left';}
  }
  return s.positions;
}
function prestartServerValid(s){
  if(!s||s.started||Number(s.setIndex||0)!==0)return false;
  const set=currentSet(s);
  if(!set||set.finished||(Number(set.a)||0)!==0||(Number(set.b)||0)!==0)return false;
  if(!s.openingServerSelected||Number(s.openingServerSetIndex)!==0)return false;
  if(!['A','B'].includes(s.serverSide)||!['p1','p2'].includes(s.serverPlayer))return false;
  ensurePositions(s);
  return s.positions[s.serverSide]?.[s.serverPlayer]==='right';
}
function syncStartGate(){
  const b=$('umpire-start');if(!b)return;
  const s=App.state?.activeMatches?.[App.currentCourt];
  const loaded=!!s,started=!!s?.started,ready=prestartServerValid(s);
  b.dataset.tk66StartReady=ready?'1':'0';
  b.classList.toggle('tk66-start-ready',ready);
  b.classList.toggle('tk66-start-locked',loaded&&!started&&!ready);
  if(started){b.disabled=true;b.textContent='Trận đang LIVE';b.title='Trận đã bắt đầu. Dùng nút Toàn màn hình để mở lại Match Focus.';}
  else if(!loaded){b.disabled=false;b.textContent='Bắt đầu trận';b.title='Load trận trước, chọn người phát cầu Set 1 rồi mới bắt đầu.';}
  else if(!ready){b.disabled=true;b.textContent='🔒 Chọn người phát trước';b.title='Bắt buộc chọn 1 VĐV ở ô số 2 / ô CHẴN trước khi Bắt đầu trận và vào Full màn hình.';}
  else{b.disabled=false;b.textContent='Bắt đầu trận';b.title='Đã chọn người phát Set 1. Bấm để bắt đầu trận và vào Full màn hình.';}
}
function warnNeedServer(){
  try{U.toast('Bắt buộc chọn người phát cầu Set 1 ở một trong hai ô số 2 (Ô CHẴN) trước khi Bắt đầu trận / Full màn hình.','err')}catch{}
  try{App.renderUmpire?.()}catch{}
  syncStartGate();
  return false;
}

// FINAL start gate. Upgrade58 enters native fullscreen before the older validation runs;
// therefore this wrapper must be loaded last and reject invalid starts BEFORE calling
// the wrapped start chain at all. No wrapped call = no Match Focus / requestFullscreen.
const baseStart=App.startUmpire?.bind(App);
if(baseStart)App.startUmpire=async function(...args){
  const s=this.state?.activeMatches?.[this.currentCourt];
  if(!s)return baseStart(...args);
  if(s.started){syncStartGate();return U.toast('Trận đã bắt đầu. Nếu muốn mở lại màn hình chấm điểm, bấm Toàn màn hình.','info');}
  if(!prestartServerValid(s)){
    if(document.fullscreenElement||document.documentElement.classList.contains('tk58-score-focus')||document.body.classList.contains('tk58-score-focus')){
      try{await U58?.exitScoreFocus?.()}catch{}
    }
    return warnNeedServer();
  }
  const out=await baseStart(...args);
  syncStartGate();
  return out;
};

// Keep the button state synchronized after every referee repaint and after the referee
// explicitly chooses the Set-1 opening server.
const baseRender=App.renderUmpire?.bind(App);
if(baseRender)App.renderUmpire=function(...args){const out=baseRender(...args);syncStartGate();return out;};
const baseSelect=App.selectOpeningServer?.bind(App);
if(baseSelect)App.selectOpeningServer=async function(...args){const out=await baseSelect(...args);syncStartGate();return out;};
const baseLoad=App.loadUmpireMatch?.bind(App);
if(baseLoad)App.loadUmpireMatch=function(...args){const out=baseLoad(...args);syncStartGate();setTimeout(syncStartGate,0);return out;};
const baseShowTab=App.showTab?.bind(App);
if(baseShowTab)App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);if(tab==='umpire'){syncStartGate();setTimeout(syncStartGate,0);}return out;};

function stamp(){
  T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;
  document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);
}
const baseHealth=App.renderHealth?.bind(App);
if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out;};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade66 SW refresh',e)}}
function install(){stamp();syncStartGate();refreshSW();setTimeout(()=>{stamp();syncStartGate()},60);setTimeout(syncStartGate,700)}
install();
window.addEventListener('focus',()=>{stamp();syncStartGate();refreshSW()},{passive:true});
window.addEventListener('pageshow',syncStartGate,{passive:true});
window.TopkeyUpgrade66={installed:true,VERSION,CACHE_TAG,BUILD,prestartServerValid,syncStartGate,warnNeedServer};
})();
