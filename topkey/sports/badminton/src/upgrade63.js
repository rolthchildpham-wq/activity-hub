(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||!T.Scoring||App.__upgrade63Installed)return;
App.__upgrade63Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade63-auto-set-rotation';
const CACHE_TAG='u63-20261029';
const BUILD='upgrade63';
const $=id=>document.getElementById(id);

function ensurePositions(s){
  s.positions=s.positions||{};
  for(const side of ['A','B']){
    const p=s.positions[side]||(s.positions[side]={p1:'right',p2:'left'});
    if(!['right','left'].includes(p.p1)||!['right','left'].includes(p.p2)||p.p1===p.p2){p.p1='right';p.p2='left';}
  }
  return s.positions;
}
function playerAt(s,side,pos='right'){
  ensurePositions(s);
  return s.positions[side].p1===pos?'p1':'p2';
}
function opposite(side){return String(side||'A').toUpperCase()==='B'?'A':'B';}
function openingAnchor(s){
  if(['A','B'].includes(s?.openingServerSideSet1))return s.openingServerSideSet1;
  const idx=Math.max(0,Number(s?.setIndex)||0),current=['A','B'].includes(s?.serverSide)?s.serverSide:'A';
  // For an older LIVE match without the Upgrade63 marker, infer the set-1 side
  // from the current set's alternating pattern.
  return idx%2===0?current:opposite(current);
}
function openingSideForSet(s,setIndex=Number(s?.setIndex)||0){
  const anchor=openingAnchor(s);
  return Number(setIndex)%2===0?anchor:opposite(anchor);
}
function setOpeningServer(s,side,setIndex=Number(s?.setIndex)||0){
  ensurePositions(s);
  side=['A','B'].includes(side)?side:openingSideForSet(s,setIndex);
  s.serverSide=side;
  s.serverPlayer=playerAt(s,side,'right');
  s.openingServerSelected=true;
  s.openingServerSetIndex=Number(setIndex)||0;
  s.autoOpeningServer=true;
  return s;
}
function prepareSetOneAnchor(s){
  if(!s)return s;
  if(!['A','B'].includes(s.openingServerSideSet1))s.openingServerSideSet1=['A','B'].includes(s.serverSide)?s.serverSide:'A';
  return s;
}
function isCurrentSetFinished(s){return !!s?.sets?.[Number(s?.setIndex)||0]?.finished;}
function currentSetScore(s){const x=s?.sets?.[Number(s?.setIndex)||0]||{};return {a:Number(x.a)||0,b:Number(x.b)||0};}

// Remember only the set-1 choice. Sets 2/3 are generated automatically from it.
const baseSelectOpening=App.selectOpeningServer?.bind(App);
if(baseSelectOpening)App.selectOpeningServer=async function(side,key,...args){
  const s=this.state.activeMatches?.[this.currentCourt];
  const idx=Number(s?.setIndex)||0;
  if(idx>0&&s?.autoOpeningServer)return U.toast(`Set ${idx+1}: quyền phát đầu đã tự luân phiên theo set`,'info');
  const out=await baseSelectOpening(side,key,...args);
  const now=this.state.activeMatches?.[this.currentCourt];
  if(now&&idx===0&&now.openingServerSelected){
    now.openingServerSideSet1=now.serverSide;now.autoOpeningServer=false;
    if(now.started){try{await T.Data?.queueSet?.('activeMatches/'+this.currentCourt,now,{type:'SET1_OPENING_SERVER_ANCHOR'});}catch(e){console.warn('Upgrade63: chưa đồng bộ mốc phát Set 1',e);}}
  }
  return out;
};

// Make sure the selected set-1 side is persisted by MATCH_START.
const baseStart=App.startUmpire?.bind(App);
if(baseStart)App.startUmpire=async function(...args){
  const s=this.state.activeMatches?.[this.currentCourt];
  if(s&&Number(s.setIndex||0)===0&&s.openingServerSelected)prepareSetOneAnchor(s);
  return baseStart(...args);
};

// Upgrade23 intentionally asks for a fresh opening-server choice after nextSet.
// Upgrade63 replaces that behavior: swap ends and alternate the opening team.
const baseNextSet=T.Scoring.nextSet.bind(T.Scoring);
T.Scoring.nextSet=function(state,...args){
  const previousSwapped=!!state?.sideSwapped;
  const anchor=openingAnchor(state);
  const n=baseNextSet(state,...args);
  n.openingServerSideSet1=anchor;
  n.sideSwapped=!previousSwapped;
  const nextSide=openingSideForSet(n,n.setIndex);
  setOpeningServer(n,nextSide,n.setIndex);
  n.updatedAt=Date.now();
  n.version=(Number(n.version)||0)+1;
  return n;
};

function teamNameForSide(s,side){
  const m=App.state.matches?.[s?.matchId];
  const id=side==='B'?m?.teamBId:m?.teamAId;
  return App.state.teams?.[id]?.name||`Đội ${side}`;
}
function decorateOpeningTeam(){
  const s=App.state.activeMatches?.[App.currentCourt],box=$('umpire-board');
  if(!s||!box)return;
  const set=s.sets?.[Number(s.setIndex)||0],zero=(Number(set?.a)||0)===0&&(Number(set?.b)||0)===0&&!set?.finished;
  box.querySelectorAll('.tk63-opening-team').forEach(el=>el.classList.remove('tk63-opening-team'));
  box.querySelectorAll('.tk63-opening-badge').forEach(el=>el.remove());
  if(!zero||!s.openingServerSelected)return;
  if(Number(s.setIndex||0)>0&&s.autoOpeningServer){
    box.querySelectorAll('[data-opening-server="1"]').forEach(card=>{
      card.classList.remove('tk23-opening-allowed','tk15-opening-choice');card.removeAttribute('role');card.removeAttribute('tabindex');delete card.dataset.openingServer;card.onclick=null;card.onkeydown=null;
    });
  }
  const side=s.serverSide;
  box.querySelector(`.court-half[data-side="${side}"]`)?.classList.add('tk63-opening-team');
  box.querySelector(`.score-head [data-team-side="${side}"]`)?.classList.add('tk63-opening-team');
  const half=box.querySelector(`.court-half[data-side="${side}"] .tk11-team-head`);
  if(half){const badge=document.createElement('span');badge.className='tk63-opening-badge';badge.textContent=`🏸 PHÁT ĐẦU SET ${Number(s.setIndex||0)+1}`;half.appendChild(badge);}
  const line=box.querySelector('.tk11-service-line');
  if(line&&Number(s.setIndex||0)>0){
    const note=document.createElement('span');note.className='tk63-opening-badge tk63-service-note';note.textContent=`Tự động luân phiên · ${teamNameForSide(s,side)} phát đầu set này`;
    line.appendChild(note);
  }
}
const baseRender=App.renderUmpire?.bind(App);
if(baseRender)App.renderUmpire=function(...args){const out=baseRender(...args);decorateOpeningTeam();return out;};

let advancing=false;
async function autoAdvanceAfterFinishedSet(){
  if(advancing)return false;
  const s=App.state.activeMatches?.[App.currentCourt];
  if(!s||!s.started||s.finished||!isCurrentSetFinished(s))return false;
  advancing=true;
  try{
    const oldIndex=Number(s.setIndex)||0,score=currentSetScore(s),oldSide=s.serverSide;
    await App.nextSet();
    const n=App.state.activeMatches?.[App.currentCourt];
    if(!n||Number(n.setIndex)!==oldIndex+1)return false;
    App.renderUmpire?.();
    const nextName=teamNameForSide(n,n.serverSide);
    U.toast(`Set ${oldIndex+1} kết thúc ${score.a}-${score.b} · Đã đổi bên · Set ${oldIndex+2}: ${nextName} phát cầu trước`,'ok');
    return {oldIndex,oldSide,nextSide:n.serverSide};
  }finally{advancing=false;}
}

// Final score wrapper: when a non-deciding set ends, move immediately to the next set.
// A match-winning set stays on its final score so the referee can finish the match normally.
const baseScore=App.score?.bind(App);
if(baseScore)App.score=async function(side,delta,...args){
  const before=this.state.activeMatches?.[this.currentCourt];
  if(advancing)return U.toast('Đang tự chuyển set và đổi bên…','info');
  if(before&&!before.finished&&isCurrentSetFinished(before))return autoAdvanceAfterFinishedSet();
  const out=await baseScore(side,delta,...args);
  const after=this.state.activeMatches?.[this.currentCourt];
  if(Number(delta)>0&&after&&!after.finished&&isCurrentSetFinished(after))await autoAdvanceAfterFinishedSet();
  return out;
};

// Manual button remains as a recovery path, but uses exactly the same rotation rules.
const nextBtn=$('umpire-next-set');
if(nextBtn){nextBtn.textContent='Set tiếp (dự phòng)';nextBtn.title='Bình thường TOPKEY tự chuyển set; dùng nút này chỉ khi cần khôi phục thủ công.';}

function stamp(){
  T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
  document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;
  document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);
}
const baseHealth=App.renderHealth?.bind(App);
if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out;};
async function refreshSW(){
  if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;
  try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade63 SW refresh',e)}
}
stamp();refreshSW();setTimeout(()=>{stamp();decorateOpeningTeam()},50);
window.addEventListener('focus',()=>{stamp();refreshSW()},{passive:true});
window.TopkeyUpgrade63={installed:true,VERSION,CACHE_TAG,BUILD,opposite,openingAnchor,openingSideForSet,setOpeningServer,autoAdvanceAfterFinishedSet};
})();
