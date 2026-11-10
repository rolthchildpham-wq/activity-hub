(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U63=window.TopkeyUpgrade63;
if(!T||!App||!U||!T.Scoring||App.__upgrade69Installed)return;
App.__upgrade69Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade69-opening-server-ledger';
const CACHE_TAG='u69-20261029';
const BUILD='upgrade69';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let recovering=false,persisting=false;

function clone(v){return U.clone?U.clone(v):JSON.parse(JSON.stringify(v));}
function opposite(side){return String(side||'').toUpperCase()==='A'?'B':String(side||'').toUpperCase()==='B'?'A':'';}
function ensurePositions(s){
  s.positions=s.positions||{};
  for(const side of ['A','B']){
    const p=s.positions[side]||(s.positions[side]={p1:'right',p2:'left'});
    if(!['right','left'].includes(p.p1)||!['right','left'].includes(p.p2)||p.p1===p.p2){p.p1='right';p.p2='left';}
  }
  return s.positions;
}
function playerAt(s,side,pos='right'){ensurePositions(s);return s.positions?.[side]?.p1===pos?'p1':'p2';}
function currentSet(s){return s?.sets?.[Number(s?.setIndex)||0]||null;}
function isZeroSet(s){const x=currentSet(s);return !!x&&!x.finished&&(Number(x.a)||0)===0&&(Number(x.b)||0)===0;}
function matchFor(s){return App.state?.matches?.[s?.matchId]||null;}
function teamIdFor(s,side){const m=matchFor(s);return side==='B'?m?.teamBId:m?.teamAId;}
function teamFor(s,side){return App.state?.teams?.[teamIdFor(s,side)]||{};}
function snapshotFor(s,index){return s?.openingServers?.[String(Number(index)||0)]||null;}
function validSnapshot(x){return !!x&&['A','B'].includes(x.side)&&['p1','p2'].includes(x.player);}
function makeSnapshot(s,index,side,player,source='ZERO_ZERO_SELECTION',locked=true,selectedAt=Date.now()){
  const team=teamFor(s,side),teamId=teamIdFor(s,side)||'';
  return {setIndex:Number(index)||0,side,player,playerName:String(team?.[player]||'VĐV'),teamId,teamName:String(team?.name||`Đội ${side}`),selectedAt:Number(selectedAt)||Date.now(),source,locked:!!locked};
}
function rememberOpening(s,{index=Number(s?.setIndex)||0,side=s?.serverSide,player=s?.serverPlayer,source='ZERO_ZERO_SELECTION',locked=true,allowReplace=false,selectedAt=Date.now()}={}){
  if(!s||!['A','B'].includes(side)||!['p1','p2'].includes(player))return null;
  index=Number(index)||0;s.openingServers=s.openingServers||{};
  const key=String(index),old=s.openingServers[key];
  if(validSnapshot(old)&&old.locked&&!allowReplace)return old;
  const snap=makeSnapshot(s,index,side,player,source,locked,selectedAt);
  s.openingServers[key]=snap;
  if(index===0){s.openingServerSideSet1=side;s.openingServerPlayerSet1=player;s.openingServerNameSet1=snap.playerName;s.openingServerRecordedAtSet1=snap.selectedAt;}
  s.openingServerLedgerVersion=BUILD;
  return snap;
}
function anchorSide(s){
  const snap=snapshotFor(s,0);if(validSnapshot(snap))return snap.side;
  if(['A','B'].includes(s?.openingServerSideSet1))return s.openingServerSideSet1;
  // Only while Set 1 is still 0-0 may the current selection be used as the anchor.
  // NEVER infer the Set-1 opening side from a later rally/current server.
  if(Number(s?.setIndex||0)===0&&isZeroSet(s)&&s?.openingServerSelected&&['A','B'].includes(s.serverSide))return s.serverSide;
  return '';
}
function designatedSide(s,index=Number(s?.setIndex)||0){const a=anchorSide(s);if(!a)return '';return Number(index)%2===0?a:opposite(a);}
function freezeSetOneSelection(s,source='MATCH_START_U69'){
  if(!s||Number(s.setIndex||0)!==0||!s.openingServerSelected||!['A','B'].includes(s.serverSide)||!['p1','p2'].includes(s.serverPlayer))return null;
  return rememberOpening(s,{index:0,side:s.serverSide,player:s.serverPlayer,source,locked:true,allowReplace:true});
}
function ensureCurrentOpening(s,{source='AUTO_SET_OPENING_U69',lock=true}={}){
  if(!s||!isZeroSet(s))return null;
  const idx=Number(s.setIndex)||0;
  if(idx===0){
    if(!s.openingServerSelected||!['A','B'].includes(s.serverSide)||!['p1','p2'].includes(s.serverPlayer))return null;
    const old=snapshotFor(s,0);
    return rememberOpening(s,{index:0,side:s.serverSide,player:s.serverPlayer,source,locked:lock,allowReplace:!old||!old.locked});
  }
  const side=designatedSide(s,idx);if(!side)return null;
  const existing=snapshotFor(s,idx);
  if(validSnapshot(existing)){
    s.serverSide=existing.side;s.serverPlayer=existing.player;s.openingServerSelected=true;s.openingServerSetIndex=idx;s.autoOpeningServer=true;return existing;
  }
  const player=playerAt(s,side,'right');
  s.serverSide=side;s.serverPlayer=player;s.openingServerSelected=true;s.openingServerSetIndex=idx;s.autoOpeningServer=true;
  return rememberOpening(s,{index:idx,side,player,source,locked:true});
}
async function persistState(s,type='OPENING_SERVER_LEDGER_U69'){
  if(!s||persisting||!T.Data?.queueSet)return;
  persisting=true;try{await T.Data.queueSet('activeMatches/'+App.currentCourt,s,{type});}catch(e){console.warn('Upgrade69 opening ledger pending',e);}finally{persisting=false;}
}
function firstPointEvent(events,matchId){
  return Object.values(events||{}).filter(e=>e?.matchId===matchId&&e?.type==='POINT_AWARDED'&&Number(e?.before?.a||0)===0&&Number(e?.before?.b||0)===0&&['A','B'].includes(e?.before?.serverSide)&&['p1','p2'].includes(e?.before?.serverPlayer)).sort((a,b)=>(Number(a.clientAt)||0)-(Number(b.clientAt)||0))[0]||null;
}
async function recoverSet1FromEvents(s,{force=false}={}){
  if(!s||recovering||!T.Data?.read)return null;
  const existing=snapshotFor(s,0);
  if(validSnapshot(existing)&&!force)return existing;
  recovering=true;
  try{
    const events=await T.Data.read('events/'+(s.courtId||App.currentCourt))||{},evt=firstPointEvent(events,s.matchId);
    if(!evt)return existing||null;
    const side=evt.before.serverSide,player=evt.before.serverPlayer;
    const snap=rememberOpening(s,{index:0,side,player,source:'RECOVERED_FIRST_POINT_EVENT_U69',locked:true,allowReplace:true,selectedAt:evt.clientAt});
    // If the current set is still 0-0, immediately correct the opening server from the recovered H1 anchor.
    if(Number(s.setIndex||0)>0&&isZeroSet(s)){
      delete s.openingServers[String(Number(s.setIndex)||0)];
      ensureCurrentOpening(s,{source:'REPAIRED_FROM_H1_EVENT_U69',lock:true});
    }
    s.updatedAt=Date.now();s.version=(Number(s.version)||0)+1;
    await persistState(s,'OPENING_SERVER_RECOVERED_U69');
    App.renderUmpire?.();
    return snap;
  }catch(e){console.warn('Upgrade69 cannot recover Set-1 opening server',e);return existing||null;}
  finally{recovering=false;}
}
async function requireAnchor(s){
  let a=anchorSide(s);if(a)return a;
  await recoverSet1FromEvents(s);a=anchorSide(s);
  if(!a)U.toast('Không xác định được người phát đầu Set 1 nên TOPKEY không tự suy luận từ người phát cuối set. Hãy kiểm tra lịch sử trận trước khi chuyển set.','err');
  return a;
}

// Replace Upgrade63 helpers dynamically. Upgrade64/65 call these object properties at runtime.
if(U63){
  U63.openingAnchor=anchorSide;
  U63.openingSideForSet=(s,index=Number(s?.setIndex)||0)=>designatedSide(s,index);
  U63.setOpeningServer=(s,side,index=Number(s?.setIndex)||0)=>{
    const idx=Number(index)||0,expected=idx===0?(side||anchorSide(s)):designatedSide(s,idx);
    if(!expected)return s;
    ensurePositions(s);const player=playerAt(s,expected,'right');
    s.serverSide=expected;s.serverPlayer=player;s.openingServerSelected=true;s.openingServerSetIndex=idx;s.autoOpeningServer=idx>0;
    rememberOpening(s,{index:idx,side:expected,player,source:idx===0?'SET1_SELECTION_U69':'AUTO_SET_ROTATION_U69',locked:idx>0});
    return s;
  };
}

// Record every valid 0-0 selection. Set 1 may still be corrected before Start; Start freezes it.
const baseSelect=App.selectOpeningServer?.bind(App);
if(baseSelect)App.selectOpeningServer=async function(side,key,...args){
  const out=await baseSelect(side,key,...args),s=this.state.activeMatches?.[this.currentCourt];
  if(s&&isZeroSet(s)&&s.openingServerSelected&&Number(s.openingServerSetIndex)===Number(s.setIndex||0)){
    const idx=Number(s.setIndex)||0,lock=idx>0||!!s.started;
    const old=snapshotFor(s,idx);
    rememberOpening(s,{index:idx,side:s.serverSide,player:s.serverPlayer,source:idx===0?'ZERO_ZERO_SELECTED_SET1_U69':'ZERO_ZERO_CONFIRMED_U69',locked:lock,allowReplace:idx===0&&!old?.locked});
    s.updatedAt=Date.now();s.version=(Number(s.version)||0)+1;
    await persistState(s,'OPENING_SERVER_ZERO_ZERO_SELECTED_U69');
    this.renderUmpire?.();
  }
  return out;
};

// Freeze the exact Set-1 player/side BEFORE the legacy Start/Fullscreen chain persists the match.
const baseStart=App.startUmpire?.bind(App);
if(baseStart)App.startUmpire=async function(...args){
  const s=this.state.activeMatches?.[this.currentCourt];
  if(s&&!s.started&&Number(s.setIndex||0)===0&&s.openingServerSelected){
    freezeSetOneSelection(s,'MATCH_START_U69');s.updatedAt=Date.now();s.version=(Number(s.version)||0)+1;
  }
  const out=await baseStart(...args),now=this.state.activeMatches?.[this.currentCourt];
  if(now?.started&&snapshotFor(now,0))await persistState(now,'OPENING_SERVER_SET1_FROZEN_U69');
  return out;
};

// Never enter the next set without a trustworthy Set-1 anchor. After transition, snapshot
// the actual 0-0 player for that set so later rallies can never rewrite history.
const baseNext=App.nextSet?.bind(App);
if(baseNext)App.nextSet=async function(...args){
  const before=this.state.activeMatches?.[this.currentCourt];if(before&&!(await requireAnchor(before)))return null;
  const out=await baseNext(...args),s=this.state.activeMatches?.[this.currentCourt];
  if(s&&isZeroSet(s)){
    const snap=ensureCurrentOpening(s,{source:'NEXT_SET_ZERO_ZERO_U69',lock:true});
    if(snap){s.updatedAt=Date.now();s.version=(Number(s.version)||0)+1;await persistState(s,'OPENING_SERVER_NEXT_SET_FROZEN_U69');this.renderUmpire?.();}
  }
  return out;
};

// Before the first rally of any set, guarantee the immutable opening snapshot exists.
const baseScore=App.score?.bind(App);
if(baseScore)App.score=async function(side,delta,...args){
  const s=this.state.activeMatches?.[this.currentCourt];
  if(s&&Number(delta)>0){
    // Legacy protection: Upgrade64 may auto-transition inside its score wrapper. Recover the
    // H1 anchor BEFORE calling that chain so it can never fall back to the last rally server.
    if(s.started&&!anchorSide(s)&&!(await requireAnchor(s)))return null;
    if(isZeroSet(s)){
      const snap=ensureCurrentOpening(s,{source:'FIRST_RALLY_GUARD_U69',lock:true});
      if(!snap)return U.toast('0-0: chưa xác định được người phát đầu set. Hãy chọn/xác nhận người phát trước khi cộng điểm.','err');
      await persistState(s,'OPENING_SERVER_FIRST_RALLY_GUARD_U69');
    }
  }
  return baseScore(side,delta,...args);
};

function historyText(s){
  const parts=[];for(let i=0;i<3;i++){const x=snapshotFor(s,i);if(validSnapshot(x))parts.push(`H${i+1}: ${x.playerName} · ${x.teamName}`);}
  return parts.join('  →  ');
}
function patchLedgerUI(){
  const s=App.state.activeMatches?.[App.currentCourt],box=$('umpire-board');if(!s||!box)return;
  let line=box.querySelector('.tk69-opening-history');
  if(!line){line=document.createElement('div');line.className='tk69-opening-history';const service=box.querySelector('.tk11-service-line');(service||box).insertAdjacentElement(service?'afterend':'afterbegin',line);}
  const h=historyText(s),a=anchorSide(s),next=a?opposite(a):'';
  line.innerHTML=h?`<b>🔒 MỐC PHÁT ĐẦU:</b> ${esc(h)}${snapshotFor(s,0)?` <small>· Luân phiên đội: H1 ${esc(a)} → H2 ${esc(next)} → H3 ${esc(a)}</small>`:''}`:`<b>🔒 MỐC PHÁT ĐẦU:</b> chưa ghi nhận. Chọn người phát ở 0-0 Set 1 rồi bấm Bắt đầu.`;
}
const baseRender=App.renderUmpire?.bind(App);
if(baseRender)App.renderUmpire=function(...args){
  const s=this.state.activeMatches?.[this.currentCourt];
  if(s&&Number(s.setIndex||0)>0&&!validSnapshot(snapshotFor(s,0)))Promise.resolve().then(()=>recoverSet1FromEvents(s));
  const out=baseRender(...args);patchLedgerUI();return out;
};

function stamp(){
  T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;
  document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);
}
const baseHealth=App.renderHealth?.bind(App);
if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out;};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade69 SW refresh',e)}}
function install(){stamp();refreshSW();setTimeout(()=>{stamp();App.renderUmpire?.()},80);}
install();window.addEventListener('focus',()=>{stamp();refreshSW()},{passive:true});
window.TopkeyUpgrade69={installed:true,VERSION,CACHE_TAG,BUILD,opposite,ensurePositions,playerAt,isZeroSet,snapshotFor,validSnapshot,rememberOpening,anchorSide,designatedSide,freezeSetOneSelection,ensureCurrentOpening,firstPointEvent,recoverSet1FromEvents,requireAnchor,historyText};
})();
