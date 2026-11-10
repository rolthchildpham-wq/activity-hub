(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade22Installed)return;
App.__upgrade22Installed=true;
const $=id=>document.getElementById(id);

function teamForSide(m,side){
  if(!m)return{};
  return App.state.teams?.[side==='A'?m.teamAId:m.teamBId]||{};
}
function scoreForSide(set,side){return side==='A'?(Number(set?.a)||0):(Number(set?.b)||0);}
function syncScoreButtons(left,right,m){
  const actions=$('umpire-plus-a')?.parentElement;
  if(!actions)return;
  const ids={A:{plus:'umpire-plus-a',minus:'umpire-minus-a'},B:{plus:'umpire-plus-b',minus:'umpire-minus-b'}};
  const decorate=(side,physical,orderBase)=>{
    const team=teamForSide(m,side),name=team.name||`Đội ${side}`;
    const plus=$(ids[side].plus),minus=$(ids[side].minus);
    if(plus){plus.style.order=String(orderBase);plus.textContent=`+1 ${side} · ${physical}`;plus.title=`Cộng 1 điểm: ${name} · sân ${physical.toLowerCase()}`;plus.dataset.physicalSide=physical;}
    if(minus){minus.style.order=String(orderBase+1);minus.textContent=`−1 ${side} · ${physical}`;minus.title=`Trừ 1 điểm: ${name} · sân ${physical.toLowerCase()}`;minus.dataset.physicalSide=physical;}
  };
  decorate(left,'TRÁI',1);decorate(right,'PHẢI',3);
  [['umpire-undo',5],['umpire-next-set',6],['umpire-reset',7],['umpire-end',8]].forEach(([id,order])=>{const el=$(id);if(el)el.style.order=String(order);});
  actions.dataset.leftTeam=left;actions.dataset.rightTeam=right;
}
function syncPhysicalScoreboard(){
  const s=App.state.activeMatches?.[App.currentCourt],box=$('umpire-board');
  if(!s||!box)return;
  const m=App.state.matches?.[s.matchId];if(!m)return;
  const set=s.sets?.[s.setIndex]||{a:0,b:0},left=s.sideSwapped?'B':'A',right=left==='A'?'B':'A';
  const leftTeam=teamForSide(m,left),rightTeam=teamForSide(m,right),head=box.querySelector('.score-head');
  if(head&&head.children.length>=3){
    const l=head.children[0],center=head.children[1],r=head.children[2];
    l.classList.add('tk22-score-side','tk22-score-left');r.classList.add('tk22-score-side','tk22-score-right');
    l.dataset.teamSide=left;r.dataset.teamSide=right;
    const ls=l.querySelector('small'),lv=l.querySelector('strong'),rs=r.querySelector('small'),rv=r.querySelector('strong');
    if(ls)ls.textContent=`SET ${Number(s.setIndex||0)+1} · ${left} · TRÁI`;
    if(lv)lv.textContent=String(scoreForSide(set,left));
    if(rs)rs.textContent=`SET ${Number(s.setIndex||0)+1} · ${right} · PHẢI`;
    if(rv)rv.textContent=String(scoreForSide(set,right));
    center.innerHTML=`<b>${App.escape?.(leftTeam.name||`Đội ${left}`)||leftTeam.name||`Đội ${left}`}</b><span class="tk22-vs"> ↔ </span><b>${App.escape?.(rightTeam.name||`Đội ${right}`)||rightTeam.name||`Đội ${right}`}</b><small class="tk22-side-note">Bảng điểm luôn đi theo vị trí sân hiện tại</small>`;
  }
  syncScoreButtons(left,right,m);
}
function patchUmpire(){
  const base=App.renderUmpire?.bind(App);if(!base||App.__u22Umpire)return;App.__u22Umpire=true;
  App.renderUmpire=function(...args){const out=base(...args);syncPhysicalScoreboard();return out;};
  setTimeout(()=>App.renderUmpire?.(),0);
}
function addUmpireRulesNotice(){
  const page=$('page-umpire');if(!page||$('tk22-umpire-access-note'))return;
  const card=page.querySelector('.card');if(!card)return;
  const n=document.createElement('div');n.id='tk22-umpire-access-note';n.className='tk22-umpire-access-note';
  n.innerHTML='🔐 <b>Quyền chấm điểm:</b> tài khoản UMPIRE / quyền Trọng tài = Chỉnh sửa được phép ghi điểm, sự kiện, trạng thái trận và sân. Nếu Firebase vẫn báo PERMISSION_DENIED, hãy Publish <b>Database Rules Upgrade 22</b>.';
  card.insertBefore(n,$('umpire-board'));
}
function install(){patchUmpire();addUmpireRulesNotice();}
install();
window.TopkeyUpgrade22={syncPhysicalScoreboard};
})();
