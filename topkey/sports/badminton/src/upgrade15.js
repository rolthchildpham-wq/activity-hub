(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U)return;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function physicalNumber(half,row){
  // Fixed physical court numbers requested by TOPKEY:
  // LEFT half: 1 top / 2 bottom. RIGHT half: 2 top / 1 bottom.
  return half==='left'?(row===0?'1':'2'):(row===0?'2':'1');
}
function ensurePositions(s){
  s.positions=s.positions||{};
  for(const side of ['A','B']){
    const p=s.positions[side]||(s.positions[side]={p1:'right',p2:'left'});
    if(!['right','left'].includes(p.p1)||!['right','left'].includes(p.p2)||p.p1===p.p2){p.p1='right';p.p2='left';}
  }
}
function playerAt(s,side,pos){
  ensurePositions(s);
  return s.positions[side].p1===pos?'p1':'p2';
}
function normalizeOpeningServer(s){
  ensurePositions(s);
  if(s.started)return;
  if(!['A','B'].includes(s.serverSide))s.serverSide='A';
  // At 0-0 the opening server must stand in the EVEN service court.
  s.serverPlayer=playerAt(s,s.serverSide,'right');
}
function orderForPhysicalHalf(s,side,half){
  ensurePositions(s);
  // A team's RIGHT/even service court appears at the bottom on the left half,
  // but at the top on the right half because the teams face each other.
  const topPos=half==='left'?'left':'right';
  const bottomPos=topPos==='left'?'right':'left';
  return [playerAt(s,side,topPos),playerAt(s,side,bottomPos)];
}
function playerCard(side,key,team,s,half,row){
  const pos=s.positions?.[side]?.[key]||'left';
  const even=pos==='right',slot=physicalNumber(half,row),serving=s.serverSide===side&&s.serverPlayer===key;
  const preselect=!s.started&&slot==='2';
  const name=team?.[key]||`VĐV ${key==='p1'?'1':'2'}`;
  const hint=preselect?(serving?' · ✓ ĐÃ CHỌN PHÁT ĐẦU':' · BẤM CHỌN PHÁT ĐẦU'):'';
  return `<div class="player tk11-player tk13-player tk15-player ${serving?'serving':''} ${preselect?'tk15-opening-choice':''}" data-side="${side}" data-player="${key}" data-court-slot="${slot}" ${preselect?'data-opening-server="1" role="button" tabindex="0"':''}><span class="tk11-player-no tk13-fixed-court-no" title="Số vị trí sân cố định">${slot}</span><div><b>${esc(name)}</b><small>${even?'Ô CHẴN · BÊN PHẢI':'Ô LẺ · BÊN TRÁI'}${serving?' · 🏸 PHÁT CẦU':''}${hint}</small></div></div>`;
}
function teamHalf(side,team,s,half){
  const order=orderForPhysicalHalf(s,side,half);
  return `<div class="court-half tk13-${half}" data-side="${side}"><div class="tk11-team-head"><b>${esc(team?.name||`Đội ${side}`)}</b><button class="btn mini tk11-swap-pos" data-swap-pos="${side}">↕ Đổi vị trí</button></div>${order.map((k,i)=>playerCard(side,k,team,s,half,i)).join('')}</div>`;
}

App.selectOpeningServer=function(side,key){
  const s=this.state.activeMatches?.[this.currentCourt];
  if(!s)return U.toast('Load trận trước','err');
  if(s.started)return U.toast('Trận đã bắt đầu; quyền phát cầu sẽ tự chạy theo điểm chẵn/lẻ','info');
  ensurePositions(s);
  // Only a player physically occupying fixed slot 2 may be selected.
  const evenPlayer=playerAt(s,side,'right');
  if(key!==evenPlayer)return U.toast('Trước khi bắt đầu chỉ được chọn người ở ô CHẴN số 2','err');
  s.serverSide=side;s.serverPlayer=key;s.openingServerSelected=true;s.updatedAt=Date.now();s.version=(s.version||0)+1;
  this.renderUmpire();
  const m=this.state.matches?.[s.matchId],team=this.state.teams?.[side==='A'?m?.teamAId:m?.teamBId],name=team?.[key]||'VĐV';
  U.toast(`Đã chọn ${name} phát cầu đầu tiên · ô CHẴN số 2`,'ok');
};

App.renderUmpire=function(){
  const court=$('umpire-court')?.value||this.currentCourt;this.currentCourt=court||this.currentCourt;
  const s=this.state.activeMatches?.[this.currentCourt],box=$('umpire-board');if(!box)return;
  if(!s){box.innerHTML='<div class="empty">Chọn trận và bấm Load.</div>';return;}
  ensurePositions(s);normalizeOpeningServer(s);
  const m=this.state.matches?.[s.matchId],set=s.sets?.[s.setIndex]||{a:0,b:0},A=this.state.teams?.[m?.teamAId]||{},B=this.state.teams?.[m?.teamBId]||{};
  const left=s.sideSwapped?'B':'A',right=left==='A'?'B':'A',teams={A,B},serverTeam=teams[s.serverSide]||{},serverPos=s.positions?.[s.serverSide]?.[s.serverPlayer]||'right',serverName=serverTeam?.[s.serverPlayer]||'—';
  const serviceText=s.started
    ?`🏸 Phát cầu: <b>${esc(serverName)}</b> · Bên ${s.serverSide} · ${serverPos==='right'?'Ô CHẴN':'Ô LẺ'}`
    :`🏸 Phát cầu đầu tiên: <b>${esc(serverName)}</b> · Bên ${s.serverSide} · <b>Ô CHẴN SỐ 2</b> <span class="tk15-prestart-note">(bấm ô số 2 bên kia để đổi người phát)</span>`;
  box.innerHTML=`<div class="score-head"><div><small>SET ${s.setIndex+1} · A</small><strong>${set.a}</strong></div><span>${esc(A.name||'Đội A')} vs ${esc(B.name||'Đội B')}</span><div><small>SET ${s.setIndex+1} · B</small><strong>${set.b}</strong></div></div><div class="tk11-service-line ${s.started?'':'tk15-prestart-line'}"><span>${serviceText}</span><span class="tk13-court-legend">Số sân cố định: TRÁI 1↑/2↓ · PHẢI 2↑/1↓ · Ô 2 = CHẴN</span><button class="btn mini primary" id="tk11-swap-court">⇄ Đổi bên sân</button></div><div class="court">${teamHalf(left,teams[left],s,'left')}<div class="net"></div>${teamHalf(right,teams[right],s,'right')}</div>`;
  box.querySelectorAll('[data-swap-pos]').forEach(b=>b.onclick=()=>this.swapTeamPositions(b.dataset.swapPos));
  $('tk11-swap-court').onclick=()=>this.swapCourtSides();
  box.querySelectorAll('[data-opening-server="1"]').forEach(card=>{
    const choose=()=>this.selectOpeningServer(card.dataset.side,card.dataset.player);
    card.onclick=choose;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};
  });
};

const baseStart=App.startUmpire?.bind(App);
if(baseStart)App.startUmpire=async function(){
  const s=this.state.activeMatches?.[this.currentCourt];
  if(s&&!s.started){normalizeOpeningServer(s);const m=this.state.matches?.[s.matchId],team=this.state.teams?.[s.serverSide==='A'?m?.teamAId:m?.teamBId],name=team?.[s.serverPlayer]||'VĐV';U.toast(`Bắt đầu với ${name} phát cầu tại ô CHẴN số 2`,'ok');}
  return baseStart();
};

window.TopkeyUpgrade15={physicalNumber,orderForPhysicalHalf,normalizeOpeningServer};
})();
