(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U63=window.TopkeyUpgrade63;
if(!T||!App||!U||!T.Scoring||App.__upgrade64Installed)return;
App.__upgrade64Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade64-set-commit-fix';
const CACHE_TAG='u64-20261029';
const BUILD='upgrade64';
const $=id=>document.getElementById(id);
let committing=false;

function rules(){return {...(T.DEFAULT_RULES||{}),...(App.state.config?.rules||{})};}
function clone(v){return U.clone?U.clone(v):JSON.parse(JSON.stringify(v));}
function currentSet(s){return s?.sets?.[Number(s?.setIndex)||0]||null;}
function completedSets(s){return (s?.sets||[]).filter(x=>x?.finished).map(x=>({a:Number(x.a)||0,b:Number(x.b)||0,finished:true}));}
function matchWinner(s){return T.Scoring.winner(s?.sets||[],rules());}
function opposite(side){return String(side||'A').toUpperCase()==='B'?'A':'B';}
function openingAnchor(s){
  if(U63?.openingAnchor)return U63.openingAnchor(s);
  if(['A','B'].includes(s?.openingServerSideSet1))return s.openingServerSideSet1;
  const idx=Math.max(0,Number(s?.setIndex)||0),cur=['A','B'].includes(s?.serverSide)?s.serverSide:'A';
  return idx%2===0?cur:opposite(cur);
}
function openingSide(s,index){
  if(U63?.openingSideForSet)return U63.openingSideForSet(s,index);
  const anchor=openingAnchor(s);return Number(index)%2===0?anchor:opposite(anchor);
}
function ensurePositions(s){
  s.positions=s.positions||{};
  for(const side of ['A','B']){
    const p=s.positions[side]||(s.positions[side]={p1:'right',p2:'left'});
    if(!['right','left'].includes(p.p1)||!['right','left'].includes(p.p2)||p.p1===p.p2){p.p1='right';p.p2='left';}
  }
}
function setOpening(s,side,index){
  if(U63?.setOpeningServer)return U63.setOpeningServer(s,side,index);
  ensurePositions(s);s.serverSide=side;s.serverPlayer=s.positions[side].p1==='right'?'p1':'p2';s.openingServerSelected=true;s.openingServerSetIndex=Number(index)||0;s.autoOpeningServer=true;return s;
}
function repairFlags(s){
  if(!s)return false;
  let changed=false;const set=currentSet(s),w=matchWinner(s);
  if(set&&T.Scoring.isSetWon(Number(set.a)||0,Number(set.b)||0,rules())&&!set.finished){set.finished=true;changed=true;}
  if(s.finished&&!w){s.finished=false;delete s.winnerSide;if(s.started!==true)s.started=true;changed=true;}
  if(w&&set?.finished&&(!s.finished||s.winnerSide!==w)){s.finished=true;s.winnerSide=w;changed=true;}
  return changed;
}
function matchMirror(s,m){
  return {...m,status:'LIVE',sets:completedSets(s),liveSetIndex:Number(s.setIndex)||0,updatedAt:Date.now()};
}
async function persistSnapshot(s,type='SET_SNAPSHOT_U64'){
  const m=App.state.matches?.[s?.matchId];if(!s||!m)return null;
  const after=matchMirror(s,m),updates={};
  updates[T.Data.path('activeMatches/'+App.currentCourt)]=s;
  updates[T.Data.path('matches/'+m.id)]=after;
  App.state.matches[m.id]=after;
  await T.Data.queueMulti(updates,{type});
  return after;
}
async function commitNextSet({manual=false}={}){
  if(committing)return null;
  const court=App.currentCourt,s0=App.state.activeMatches?.[court];if(!s0)return U.toast('\u0043h\u01b0a load tr\u1eadn','err');
  committing=true;
  try{
    const s=clone(s0);repairFlags(s);const idx=Number(s.setIndex)||0,set=currentSet(s);
    if(!s.started)return U.toast('Tr\u1eadn ch\u01b0a b\u1eaft \u0111\u1ea7u','err');
    if(!set?.finished)return U.toast('Set hi\u1ec7n t\u1ea1i ch\u01b0a k\u1ebft th\u00fac','info');
    const w=matchWinner(s),m=App.state.matches?.[s.matchId];if(!m)return U.toast('Kh\u00f4ng t\u00ecm th\u1ea5y tr\u1eadn','err');
    if(w){
      s.finished=true;s.winnerSide=w;s.updatedAt=Date.now();s.version=(Number(s.version)||0)+1;
      App.state.activeMatches[court]=s;await persistSnapshot(s,'FINAL_SET_SAVED_U64');App.renderUmpire?.();
      U.toast('\u0110\u00e3 l\u01b0u set quy\u1ebft \u0111\u1ecbnh. Tr\u1eadn \u0111\u00e3 \u0111\u1ee7 s\u1ed1 set th\u1eafng; b\u1ea5m K\u1ebft th\u00fac tr\u1eadn \u0111\u1ec3 ch\u1ed1t BXH.','ok');
      return s;
    }
    const oldScore={a:Number(set.a)||0,b:Number(set.b)||0},anchor=openingAnchor(s),nextIndex=idx+1;
    const n=clone(s);n.openingServerSideSet1=anchor;n.setIndex=nextIndex;n.sets=Array.isArray(n.sets)?n.sets:[];n.sets[nextIndex]={a:0,b:0,finished:false};
    n.sideSwapped=!Boolean(s.sideSwapped);n.started=true;n.finished=false;delete n.winnerSide;
    setOpening(n,openingSide(n,nextIndex),nextIndex);n.updatedAt=Date.now();n.version=(Number(s.version)||0)+1;
    const after=matchMirror(n,m),eventId=U.id('evt'),evt={id:eventId,type:'SET_COMMITTED_NEXT',matchId:n.matchId,courtId:court,setCompleted:idx+1,score:oldScore,nextSet:nextIndex+1,nextOpeningSide:n.serverSide,sideSwapped:n.sideSwapped,actorUid:T.Auth.user?.uid||'local',clientAt:Date.now(),source:manual?'MANUAL_RECOVERY':'AUTO'};
    const updates={};updates[T.Data.path('activeMatches/'+court)]=n;updates[T.Data.path('matches/'+m.id)]=after;updates[T.Data.path('events/'+court+'/'+eventId)]=evt;
    App.state.activeMatches[court]=n;App.state.matches[m.id]=after;App.renderUmpire?.();
    await T.Data.queueMulti(updates,{eventId,type:'SET_COMMIT_NEXT_U64'});
    const teamId=n.serverSide==='B'?m.teamBId:m.teamAId,name=App.state.teams?.[teamId]?.name||('D\u1ed9i '+n.serverSide);
    U.toast(`\u0110\u00e3 l\u01b0u Set ${idx+1}: ${oldScore.a}-${oldScore.b} \u00b7 Set ${nextIndex+1} = 0-0 \u00b7 \u0110\u00e3 \u0111\u1ed5i b\u00ean \u00b7 ${name} ph\u00e1t c\u1ea7u tr\u01b0\u1edbc`,'ok');
    return n;
  }catch(e){console.error('Upgrade64 set commit failed',e);U.toast('Chuy\u1ec3n set l\u1ed7i: '+(e?.message||e),'err');return null;}
  finally{committing=false;}
}

// Replace the legacy multi-wrapper next-set path with one atomic state transition.
App.nextSet=async function(){return commitNextSet({manual:true});};

// Keep Upgrade63/48/50 score and BLV behavior, but repair stale flags before scoring
// and guarantee that a finished set is mirrored to matches and advanced exactly once.
const baseScore=App.score?.bind(App);
if(baseScore)App.score=async function(side,delta,...args){
  const before=this.state.activeMatches?.[this.currentCourt];
  if(before&&before.started){const fixed=repairFlags(before);if(fixed){before.updatedAt=Date.now();before.version=(Number(before.version)||0)+1;}}
  const beforeIndex=Number(before?.setIndex)||0,out=await baseScore(side,delta,...args),after=this.state.activeMatches?.[this.currentCourt];
  if(!after)return out;
  repairFlags(after);const set=currentSet(after);
  if(set?.finished){
    const w=matchWinner(after);
    if(w){await persistSnapshot(after,'FINAL_SET_SAVED_U64');}
    else if(Number(after.setIndex)===beforeIndex){await commitNextSet({manual:false});}
  }
  return out;
};

function patchButton(){
  const b=$('umpire-next-set');if(!b)return;const s=App.state.activeMatches?.[App.currentCourt],set=currentSet(s),w=s?matchWinner(s):null;
  b.textContent='Chuy\u1ec3n set (d\u1ef1 ph\u00f2ng)';b.title='TOPKEY t\u1ef1 l\u01b0u v\u00e0 chuy\u1ec3n set khi \u0111\u1ee7 \u0111i\u1ec3m. N\u00fat n\u00e0y ch\u1ec9 d\u00f9ng khi c\u1ea7n kh\u00f4i ph\u1ee5c.';b.disabled=!!s&&(!set?.finished||!!w);
}
const baseRender=App.renderUmpire?.bind(App);
if(baseRender)App.renderUmpire=function(...args){const out=baseRender(...args);patchButton();return out;};

function stamp(){
  T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;
  document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);
}
const baseHealth=App.renderHealth?.bind(App);
if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out;};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade64 SW refresh',e)}}
stamp();patchButton();refreshSW();setTimeout(()=>{stamp();patchButton()},50);window.addEventListener('focus',()=>{stamp();patchButton();refreshSW()},{passive:true});
window.TopkeyUpgrade64={installed:true,VERSION,CACHE_TAG,BUILD,repairFlags,completedSets,matchWinner,commitNextSet,persistSnapshot};
})();
