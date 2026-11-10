(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U63=window.TopkeyUpgrade63,U64=window.TopkeyUpgrade64;
if(!T||!App||!U||!T.Scoring||App.__upgrade65Installed)return;
App.__upgrade65Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade65-opening-server-fix';
const CACHE_TAG='u65-20261029';
const BUILD='upgrade65';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let repairPersisting=false;

function clone(v){return U.clone?U.clone(v):JSON.parse(JSON.stringify(v));}
function opposite(side){return String(side||'A').toUpperCase()==='B'?'A':'B';}
function ensurePositions(s){
  s.positions=s.positions||{};
  for(const side of ['A','B']){
    const p=s.positions[side]||(s.positions[side]={p1:'right',p2:'left'});
    if(!['right','left'].includes(p.p1)||!['right','left'].includes(p.p2)||p.p1===p.p2){p.p1='right';p.p2='left';}
  }
  return s.positions;
}
function playerAt(s,side,pos='right'){ensurePositions(s);return s.positions[side].p1===pos?'p1':'p2';}
function currentSet(s){return s?.sets?.[Number(s?.setIndex)||0]||null;}
function isZeroSet(s){const x=currentSet(s);return !!x&&!x.finished&&(Number(x.a)||0)===0&&(Number(x.b)||0)===0;}
function openingAnchor(s){
  if(['A','B'].includes(s?.openingServerSideSet1))return s.openingServerSideSet1;
  if(U63?.openingAnchor)return U63.openingAnchor(s);
  const idx=Math.max(0,Number(s?.setIndex)||0),cur=['A','B'].includes(s?.serverSide)?s.serverSide:'A';
  return idx%2===0?cur:opposite(cur);
}
function designatedSide(s,index=Number(s?.setIndex)||0){
  const anchor=openingAnchor(s);return Number(index)%2===0?anchor:opposite(anchor);
}
function teamName(s,side){
  const m=App.state.matches?.[s?.matchId],id=side==='B'?m?.teamBId:m?.teamAId;
  return App.state.teams?.[id]?.name||`Đội ${side}`;
}
function playerName(s,side,key){
  const m=App.state.matches?.[s?.matchId],id=side==='B'?m?.teamBId:m?.teamAId;
  return App.state.teams?.[id]?.[key]||'VĐV';
}
function openingValid(s){
  const idx=Number(s?.setIndex)||0;
  return !!s?.openingServerSelected&&Number(s?.openingServerSetIndex)===idx&&['A','B'].includes(s?.serverSide)&&['p1','p2'].includes(s?.serverPlayer);
}
function normalizeAutoOpening(s,{touch=false}={}){
  if(!s||Number(s.setIndex||0)<1||!isZeroSet(s))return false;
  ensurePositions(s);
  const idx=Number(s.setIndex)||0,side=designatedSide(s,idx),key=playerAt(s,side,'right');
  let changed=false;
  const set=(k,v)=>{if(s[k]!==v){s[k]=v;changed=true;}};
  if(!['A','B'].includes(s.openingServerSideSet1)){s.openingServerSideSet1=idx%2===0?side:opposite(side);changed=true;}
  set('serverSide',side);set('serverPlayer',key);set('openingServerSelected',true);set('openingServerSetIndex',idx);set('autoOpeningServer',true);
  if(changed&&touch){s.updatedAt=Date.now();s.version=(Number(s.version)||0)+1;}
  return changed;
}
async function persistRepair(s,type='AUTO_OPENING_REPAIR_U65'){
  if(!s?.started||repairPersisting||!T.Data?.queueSet)return;
  repairPersisting=true;
  try{await T.Data.queueSet('activeMatches/'+App.currentCourt,s,{type});}
  catch(e){console.warn('Upgrade65 opening-server repair pending',e);}
  finally{repairPersisting=false;}
}

// Last safety gate before the legacy 0-0 validator: Set 2/3 must always have a real
// server player, not just a team-side marker. This also repairs Upgrade63/64 states
// already stored in Firebase with autoOpeningServer=true but openingServerSelected=false.
const basePoint=T.Scoring.point.bind(T.Scoring);
T.Scoring.point=function(state,side,delta,rules){
  if(Number(delta)>0&&Number(state?.setIndex||0)>0&&isZeroSet(state))normalizeAutoOpening(state,{touch:true});
  return basePoint(state,side,delta,rules);
};

// Team right alternates automatically; referee may still tap the EVEN/slot-2 player
// of that designated team to confirm/recover. The other team's slot-2 is blocked.
const baseSelect=App.selectOpeningServer?.bind(App);
App.selectOpeningServer=async function(side,key,...args){
  const s=this.state.activeMatches?.[this.currentCourt],idx=Number(s?.setIndex)||0;
  if(!s)return U.toast('Load trận trước','err');
  if(idx<1)return baseSelect?.(side,key,...args);
  if(!isZeroSet(s))return U.toast('Chỉ xác nhận người phát đầu khi set đang 0-0','info');
  ensurePositions(s);
  const allowedSide=designatedSide(s,idx),allowedKey=playerAt(s,allowedSide,'right');
  if(side!==allowedSide)return U.toast(`Set ${idx+1}: quyền phát đầu thuộc ${teamName(s,allowedSide)} theo luân phiên set`,'info');
  if(key!==allowedKey)return U.toast('Người phát đầu phải đứng ô số 2 · Ô CHẴN','err');
  const before=clone(s);normalizeAutoOpening(s,{touch:true});
  try{
    if(s.started){await T.Data.queueSet('activeMatches/'+this.currentCourt,s,{type:'OPENING_SERVER_CONFIRMED_U65'});await this.logEvent?.('OPENING_SERVER_CONFIRMED',s,before,{serverSide:s.serverSide,serverPlayer:s.serverPlayer,setIndex:idx});}
  }catch(e){console.warn('Upgrade65 confirm opening server',e);}
  this.renderUmpire?.();
  U.toast(`Set ${idx+1}: ${playerName(s,allowedSide,allowedKey)} đã được xác nhận phát đầu cho ${teamName(s,allowedSide)}`,'ok');
  return s;
};

// If the serving team's positions are manually swapped at 0-0, keep the actual server
// attached to the player who is now in the EVEN/right service court.
const baseSwapPos=App.swapTeamPositions?.bind(App);
if(baseSwapPos)App.swapTeamPositions=async function(side,...args){
  const out=await baseSwapPos(side,...args),s=this.state.activeMatches?.[this.currentCourt];
  if(s&&Number(s.setIndex||0)>0&&isZeroSet(s)&&side===designatedSide(s)){
    const changed=normalizeAutoOpening(s,{touch:true});
    if(changed)await persistRepair(s,'AUTO_OPENING_AFTER_POSITION_SWAP_U65');
    this.renderUmpire?.();
  }
  return out;
};

// Keep the atomic Upgrade64 transition, then assert the new-set invariant again.
const baseNext=App.nextSet?.bind(App);
if(baseNext)App.nextSet=async function(...args){
  const out=await baseNext(...args),s=this.state.activeMatches?.[this.currentCourt];
  if(s&&Number(s.setIndex||0)>0&&isZeroSet(s)){
    const changed=normalizeAutoOpening(s,{touch:true});
    if(changed)await persistRepair(s,'AUTO_OPENING_AFTER_NEXT_SET_U65');
    this.renderUmpire?.();
  }
  return out;
};

// Extra post-score recovery: if an older wrapper leaves a completed non-final set in place,
// advance it once. Normal Upgrade64 flow has already advanced, so this is a no-op there.
const baseScore=App.score?.bind(App);
if(baseScore)App.score=async function(side,delta,...args){
  const s0=this.state.activeMatches?.[this.currentCourt];
  if(s0&&Number(delta)>0&&Number(s0.setIndex||0)>0&&isZeroSet(s0))normalizeAutoOpening(s0,{touch:true});
  const beforeIndex=Number(s0?.setIndex)||0,out=await baseScore(side,delta,...args),s=this.state.activeMatches?.[this.currentCourt];
  if(s&&Number(delta)>0){
    const set=currentSet(s),winner=T.Scoring.winner(s.sets||[],{...(T.DEFAULT_RULES||{}),...(this.state.config?.rules||{})});
    if(set?.finished&&!winner&&Number(s.setIndex)===beforeIndex)await this.nextSet();
    else if(Number(s.setIndex||0)>0&&isZeroSet(s)){
      const changed=normalizeAutoOpening(s,{touch:true});
      if(changed)await persistRepair(s,'AUTO_OPENING_POST_SCORE_U65');
      this.renderUmpire?.();
    }
  }
  return out;
};

function patchOpeningUI(){
  const s=App.state.activeMatches?.[App.currentCourt],box=$('umpire-board');
  if(!s||!box||Number(s.setIndex||0)<1||!isZeroSet(s))return;
  const idx=Number(s.setIndex)||0,side=designatedSide(s,idx),key=playerAt(s,side,'right'),name=playerName(s,side,key),team=teamName(s,side);
  box.querySelectorAll('[data-court-slot="2"]').forEach(card=>{
    const allowed=card.dataset.side===side&&card.dataset.player===key;
    card.classList.toggle('tk65-opening-confirm',allowed);
    card.classList.toggle('tk65-opening-blocked',!allowed);
    card.classList.toggle('tk23-opening-allowed',allowed);
    if(allowed){
      card.setAttribute('role','button');card.tabIndex=0;card.dataset.openingServer='1';
      const choose=()=>App.selectOpeningServer(side,key);card.onclick=choose;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};
    }else{card.removeAttribute('role');card.removeAttribute('tabindex');delete card.dataset.openingServer;card.onclick=null;card.onkeydown=null;}
  });
  const line=box.querySelector('.tk11-service-line'),label=line?.querySelector('span');
  if(label)label.innerHTML=`🏸 <b>SET ${idx+1} · PHÁT ĐẦU TỰ ĐỘNG:</b> <b>${esc(name)}</b> · ${esc(team)} · Ô SỐ 2 / CHẴN <small>· quyền đội luân phiên theo set; có thể bấm ô này để xác nhận lại</small>`;
}

const baseRender=App.renderUmpire?.bind(App);
if(baseRender)App.renderUmpire=function(...args){
  const s=this.state.activeMatches?.[this.currentCourt];
  if(s&&Number(s.setIndex||0)>0&&isZeroSet(s)){
    const changed=normalizeAutoOpening(s,{touch:true});
    if(changed)Promise.resolve().then(()=>persistRepair(s));
  }
  const out=baseRender(...args);patchOpeningUI();return out;
};

function stamp(){
  T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;
  document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);
}
const baseHealth=App.renderHealth?.bind(App);
if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out;};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade65 SW refresh',e)}}
stamp();refreshSW();setTimeout(()=>{stamp();App.renderUmpire?.()},60);window.addEventListener('focus',()=>{stamp();refreshSW()},{passive:true});
window.TopkeyUpgrade65={installed:true,VERSION,CACHE_TAG,BUILD,ensurePositions,playerAt,openingAnchor,designatedSide,openingValid,normalizeAutoOpening};
})();
