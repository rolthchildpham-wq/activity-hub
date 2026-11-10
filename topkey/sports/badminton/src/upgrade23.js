(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade23Installed)return;
App.__upgrade23Installed=true;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function ensurePositions(s){
  s.positions=s.positions||{};
  for(const side of ['A','B']){
    const p=s.positions[side]||(s.positions[side]={p1:'right',p2:'left'});
    if(!['right','left'].includes(p.p1)||!['right','left'].includes(p.p2)||p.p1===p.p2){p.p1='right';p.p2='left';}
  }
}
function currentSet(s){return s?.sets?.[Number(s?.setIndex)||0]||{a:0,b:0,finished:false};}
function isZeroZero(s){const set=currentSet(s);return (Number(set.a)||0)===0&&(Number(set.b)||0)===0&&!set.finished;}
function playerAt(s,side,pos){ensurePositions(s);return s.positions[side].p1===pos?'p1':'p2';}
function teamForSide(m,side){return App.state.teams?.[side==='A'?m?.teamAId:m?.teamBId]||{};}
function scoreForSide(set,side){return side==='A'?(Number(set?.a)||0):(Number(set?.b)||0);}
function serverScore(s){const set=currentSet(s);return s?.serverSide==='B'?(Number(set.b)||0):(Number(set.a)||0);}
function enforceServerParity(s){
  if(!s||!['A','B'].includes(s.serverSide))return s;
  ensurePositions(s);
  const wanted=serverScore(s)%2===0?'right':'left';
  s.serverPlayer=playerAt(s,s.serverSide,wanted);
  return s;
}
function openingSelectionValid(s){return !!s?.openingServerSelected&&Number(s.openingServerSetIndex)===Number(s.setIndex||0)&&['A','B'].includes(s.serverSide)&&['p1','p2'].includes(s.serverPlayer);}
function markOpeningPending(s){if(!s)return;s.openingServerSelected=false;s.openingServerSetIndex=Number(s.setIndex)||0;}

// Core scoring invariant: 0-0 requires an explicit choice from one of the two physical slot-2 players.
// After every score/correction the serving player is normalized to the service court matching
// the serving side's score parity: EVEN = right court, ODD = left court.
const baseInitial=T.Scoring?.initial?.bind(T.Scoring);
if(baseInitial)T.Scoring.initial=function(...args){const s=baseInitial(...args);markOpeningPending(s);return s;};
const baseNextSet=T.Scoring?.nextSet?.bind(T.Scoring);
if(baseNextSet)T.Scoring.nextSet=function(...args){const s=baseNextSet(...args);markOpeningPending(s);return s;};
const basePoint=T.Scoring?.point?.bind(T.Scoring);
if(basePoint)T.Scoring.point=function(state,side,delta,rules){
  if(Number(delta)>0&&isZeroZero(state)&&!openingSelectionValid(state))throw new Error('Tỷ số 0-0: hãy chọn người phát cầu tại một trong hai ô số 2 (ô CHẴN) trước khi cộng điểm.');
  const beforePositions=state?.positions?U.clone(state.positions):null;
  const result=basePoint(state,side,delta,rules);
  if(beforePositions)result.before.positions=beforePositions;
  result.state.openingServerSelected=true;
  result.state.openingServerSetIndex=Number(result.state.setIndex)||0;
  enforceServerParity(result.state);
  result.after.serverSide=result.state.serverSide;
  result.after.serverPlayer=result.state.serverPlayer;
  result.after.positions=U.clone(result.state.positions);
  return result;
};

App.selectOpeningServer=async function(side,key){
  const s=this.state.activeMatches?.[this.currentCourt];
  if(!s)return U.toast('Load trận trước','err');
  if(!isZeroZero(s))return U.toast('Chỉ chọn người phát đầu set khi tỷ số đang là 0-0','info');
  if(!['A','B'].includes(side)||!['p1','p2'].includes(key))return;
  ensurePositions(s);
  const evenPlayer=playerAt(s,side,'right');
  if(key!==evenPlayer)return U.toast('0-0 chỉ được chọn VĐV đang ở ô số 2 · Ô CHẴN','err');
  s.serverSide=side;s.serverPlayer=key;s.openingServerSelected=true;s.openingServerSetIndex=Number(s.setIndex)||0;s.updatedAt=Date.now();s.version=(s.version||0)+1;
  if(s.started){
    try{await T.Data.queueSet('activeMatches/'+this.currentCourt,s,{type:'OPENING_SERVER_SELECTED'});await this.logEvent?.('OPENING_SERVER_SELECTED',s,null,{serverSide:side,serverPlayer:key,setIndex:s.setIndex});}
    catch(e){console.warn('Không lưu được người phát đầu set',e);U.toast('Đã chọn trên máy; Firebase chưa đồng bộ: '+(e?.message||e),'err');}
  }
  this.renderUmpire();
  const m=this.state.matches?.[s.matchId],team=teamForSide(m,side),name=team?.[key]||'VĐV';
  U.toast(`Đã chọn ${name} phát cầu · ô số 2 (CHẴN)`,'ok');
};

const baseStart=App.startUmpire?.bind(App);
if(baseStart)App.startUmpire=async function(...args){
  const s=this.state.activeMatches?.[this.currentCourt];
  if(s&&isZeroZero(s)&&!openingSelectionValid(s))return U.toast('0-0: chọn người phát cầu ở một trong hai ô số 2 trước khi bắt đầu trận','err');
  return baseStart(...args);
};

// Reset về 0-0 cũng quay lại trạng thái chọn người phát đầu set ở hai ô số 2.
App.resetSet=async function(){
  const ok=await U.confirmDanger('Reset set hiện tại','Hành động này đưa tỷ số set về 0-0 và yêu cầu chọn lại người phát ở ô số 2.','RESET');if(!ok)return;
  const s=U.clone(this.state.activeMatches?.[this.currentCourt]);if(!s)return;const before=U.clone(s);
  s.sets[s.setIndex]={a:0,b:0,finished:false};s.finished=false;markOpeningPending(s);s.version=(s.version||0)+1;s.updatedAt=Date.now();
  this.state.activeMatches[this.currentCourt]=s;
  await T.Data.queueSet('activeMatches/'+this.currentCourt,s,{type:'RESET_SET'});await this.logEvent('SET_RESET',s,before,s);await T.Data.audit('RESET_SET','match',s.matchId,before,s);this.renderUmpire();
};

// Restore positions as well as score/server on Undo so the parity rule cannot drift.
App.undoLastEvent=async function(){
  const s=this.state.activeMatches?.[this.currentCourt];if(!s)return;
  const events=await T.Data.read('events/'+this.currentCourt)||{};
  const arr=Object.values(events).filter(e=>e.matchId===s.matchId&&['POINT_AWARDED','POINT_CORRECTED'].includes(e.type)).sort((a,b)=>(Number(b.clientAt)||0)-(Number(a.clientAt)||0));
  const last=arr[0];if(!last?.before)return U.toast('Không có điểm để hoàn tác','info');
  const n=U.clone(s),set=currentSet(n);set.a=Number(last.before.a)||0;set.b=Number(last.before.b)||0;n.serverSide=last.before.serverSide;n.serverPlayer=last.before.serverPlayer;
  if(last.before.positions)n.positions=U.clone(last.before.positions);else enforceServerParity(n);
  set.finished=false;n.finished=false;n.version=(n.version||0)+1;n.updatedAt=Date.now();
  if((Number(set.a)||0)===(0)&&(Number(set.b)||0)===0){n.openingServerSelected=true;n.openingServerSetIndex=Number(n.setIndex)||0;}
  this.state.activeMatches[this.currentCourt]=n;
  const id=U.id('evt'),evt={id,type:'UNDO',undoEventId:last.id,matchId:s.matchId,courtId:this.currentCourt,before:{a:set.a,b:set.b,serverSide:n.serverSide,serverPlayer:n.serverPlayer,positions:U.clone(n.positions)},clientAt:Date.now(),actorUid:T.Auth.user?.uid||'local'};
  const updates={};updates[T.Data.path('activeMatches/'+this.currentCourt)]=n;updates[T.Data.path('events/'+this.currentCourt+'/'+id)]=evt;
  await T.Data.queueMulti(updates,{eventId:id,type:'UNDO'});this.renderUmpire();
};

function syncScoreButtons(left,right,m){
  const actions=$('umpire-plus-a')?.parentElement;if(!actions)return;
  const ids={A:{plus:'umpire-plus-a',minus:'umpire-minus-a'},B:{plus:'umpire-plus-b',minus:'umpire-minus-b'}};
  const decorate=(side,physical,orderBase)=>{
    const team=teamForSide(m,side),name=team.name||`Đội ${side}`,plus=$(ids[side].plus),minus=$(ids[side].minus);
    if(plus){plus.style.order=String(orderBase);plus.textContent=`+1 Đội ${side} · ${physical}`;plus.title=`Cộng 1 điểm: ${name} · sân ${physical.toLowerCase()}`;plus.dataset.physicalSide=physical;}
    if(minus){minus.style.order=String(orderBase+1);minus.textContent=`−1 Đội ${side} · ${physical}`;minus.title=`Trừ 1 điểm: ${name} · sân ${physical.toLowerCase()}`;minus.dataset.physicalSide=physical;}
  };
  decorate(left,'TRÁI',1);decorate(right,'PHẢI',3);
  [['umpire-undo',5],['umpire-next-set',6],['umpire-reset',7],['umpire-end',8]].forEach(([id,order])=>{const el=$(id);if(el)el.style.order=String(order);});
  actions.dataset.leftTeam=left;actions.dataset.rightTeam=right;
}
function syncPhysicalScoreboard(s,box){
  const m=App.state.matches?.[s.matchId];if(!m||!box)return;
  const set=currentSet(s),left=s.sideSwapped?'B':'A',right=left==='A'?'B':'A',leftTeam=teamForSide(m,left),rightTeam=teamForSide(m,right),head=box.querySelector('.score-head');
  if(head&&head.children.length>=3){
    const l=head.children[0],center=head.children[1],r=head.children[2],ls=l.querySelector('small'),lv=l.querySelector('strong'),rs=r.querySelector('small'),rv=r.querySelector('strong');
    l.classList.add('tk22-score-side','tk22-score-left','tk23-score-physical');r.classList.add('tk22-score-side','tk22-score-right','tk23-score-physical');l.dataset.teamSide=left;r.dataset.teamSide=right;
    if(ls)ls.textContent=`SET ${Number(s.setIndex||0)+1} · ${left} · TRÁI`;
    if(lv)lv.textContent=String(scoreForSide(set,left));
    if(rs)rs.textContent=`SET ${Number(s.setIndex||0)+1} · ${right} · PHẢI`;
    if(rv)rv.textContent=String(scoreForSide(set,right));
    center.innerHTML=`<b>${esc(leftTeam.name||`Đội ${left}`)}</b><span class="tk22-vs"> ↔ </span><b>${esc(rightTeam.name||`Đội ${right}`)}</b><small class="tk22-side-note">Tỷ số hiển thị theo vị trí sân TRÁI / PHẢI · dữ liệu vẫn lưu đúng đội A/B</small>`;
  }
  syncScoreButtons(left,right,m);
}
function syncOpeningServerUI(s,box){
  if(!box)return;
  const zero=isZeroZero(s),selected=openingSelectionValid(s),m=App.state.matches?.[s.matchId],team=teamForSide(m,s.serverSide),serverName=team?.[s.serverPlayer]||'—';
  box.querySelectorAll('[data-court-slot]').forEach(card=>{
    const slot=card.dataset.courtSlot,isAllowed=zero&&slot==='2';
    card.classList.toggle('tk23-opening-allowed',isAllowed);card.classList.toggle('tk23-opening-locked',zero&&slot!=='2');
    if(isAllowed){card.setAttribute('role','button');card.tabIndex=0;card.dataset.openingServer='1';const choose=()=>App.selectOpeningServer(card.dataset.side,card.dataset.player);card.onclick=choose;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};}
    else if(zero){card.removeAttribute('role');card.removeAttribute('tabindex');delete card.dataset.openingServer;card.onclick=null;card.onkeydown=null;}
    if(zero&&!selected){card.classList.remove('serving');const small=card.querySelector('small');if(small)small.textContent=small.textContent.replace(/\s*·\s*🏸\s*PHÁT CẦU/gu,'').replace(/\s*·\s*✓\s*ĐÃ CHỌN PHÁT ĐẦU/gu,'');}
  });
  if(!zero)return;
  const line=box.querySelector('.tk11-service-line'),label=line?.querySelector('span');if(!label)return;
  line.classList.add('tk23-zero-zero-line');
  label.innerHTML=selected
    ?`🏸 0-0 · Phát cầu đầu set: <b>${esc(serverName)}</b> · Bên ${esc(s.serverSide)} · <b>Ô SỐ 2 / CHẴN</b> <small>(có thể bấm ô số 2 bên kia để đổi trước điểm đầu tiên)</small>`
    :`🏸 <b>0-0: CHỌN NGƯỜI PHÁT CẦU</b> · Chỉ bấm <b>1 trong 2 ô SỐ 2</b> (ô CHẴN / bên phải). Ô số 1 bị khóa chọn phát.`;
}

const baseRender=App.renderUmpire?.bind(App);
if(baseRender)App.renderUmpire=function(...args){
  const out=baseRender(...args),s=this.state.activeMatches?.[this.currentCourt],box=$('umpire-board');
  if(s&&box){syncPhysicalScoreboard(s,box);syncOpeningServerUI(s,box);}
  return out;
};

// Repaint once after all Upgrade 23 patches are installed. Unique asset name + cache version
// also prevents EdgeOne/PWA from silently reusing the older Upgrade 22 umpire renderer.
setTimeout(()=>App.renderUmpire?.(),0);
window.TopkeyUpgrade23={ensurePositions,isZeroZero,playerAt,enforceServerParity,openingSelectionValid,syncPhysicalScoreboard,syncOpeningServerUI};
})();
