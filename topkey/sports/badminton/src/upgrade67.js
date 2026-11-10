(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U58=window.TopkeyUpgrade58,U60=window.TopkeyUpgrade60,U46=window.TopkeyUpgrade46;
if(!T||!App||!U||App.__upgrade67Installed)return;
App.__upgrade67Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade67-start-gate-blv-fx';
const CACHE_TAG='u67-20261029';
const BUILD='upgrade67';
const $=id=>document.getElementById(id);
const SCORE_IDS=['umpire-plus-a','umpire-minus-a','umpire-plus-b','umpire-minus-b'];
let exitingPrestartFocus=false,fxCtx=null,lastFxKey='',lastFxAt=0;

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
function serverLabel(s){
  if(!s||!['A','B'].includes(s.serverSide)||!['p1','p2'].includes(s.serverPlayer))return '';
  const m=App.state?.matches?.[s.matchId],teamId=s.serverSide==='B'?m?.teamBId:m?.teamAId,team=App.state?.teams?.[teamId]||{};
  return `${team[s.serverPlayer]||'VĐV'} · ${team.name||('Đội '+s.serverSide)}`;
}
function stage(s){
  if(!s)return 'NO_MATCH';
  if(s.finished)return 'FINISHED';
  if(s.started)return 'LIVE';
  return prestartServerValid(s)?'READY':'NEED_SERVER';
}
function ensureHint(){
  const b=$('umpire-start'),grid=b?.closest('.form-grid');if(!b||!grid)return null;
  let h=$('tk67-start-hint');
  if(!h){h=document.createElement('div');h.id='tk67-start-hint';h.className='tk67-start-hint';grid.appendChild(h);}
  return h;
}
async function exitPrestartFocus(){
  const s=App.state?.activeMatches?.[App.currentCourt];
  if(!s||s.started||exitingPrestartFocus)return;
  const focused=document.fullscreenElement||document.documentElement.classList.contains('tk58-score-focus')||document.body.classList.contains('tk58-score-focus');
  if(!focused)return;
  exitingPrestartFocus=true;
  try{if(U58?.exitScoreFocus)await U58.exitScoreFocus();else if(document.fullscreenElement&&document.exitFullscreen)await document.exitFullscreen();}
  catch(e){console.warn('Upgrade67 prestart focus cleanup',e)}
  finally{exitingPrestartFocus=false;}
}
function syncGateUi(){
  const s=App.state?.activeMatches?.[App.currentCourt],st=stage(s),b=$('umpire-start'),hint=ensureHint();
  if(b){
    b.dataset.tk67Stage=st;
    b.classList.toggle('tk67-start-locked',st==='NEED_SERVER'||st==='NO_MATCH');
    b.classList.toggle('tk67-start-ready',st==='READY');
    b.classList.toggle('tk67-start-live',st==='LIVE');
    // Keep pre-start button clickable so a mistaken tap can explain the required next step.
    if(st==='NO_MATCH'){b.disabled=false;b.setAttribute('aria-disabled','true');b.textContent='Bắt đầu trận';b.title='Bước 1: Load trận. Bước 2: chọn người phát Set 1. Bước 3: Bắt đầu trận.';}
    else if(st==='NEED_SERVER'){b.disabled=false;b.setAttribute('aria-disabled','true');b.textContent='Bắt đầu trận';b.title='Chưa thể bắt đầu: hãy chọn người/bên phát cầu Set 1 ở ô số 2 · CHẴN.';}
    else if(st==='READY'){b.disabled=false;b.setAttribute('aria-disabled','false');b.textContent='▶ Bắt đầu trận';b.title='Đã chọn người phát. Bấm để chuyển LIVE và tự mở Full màn hình.';}
    else if(st==='LIVE'){b.disabled=true;b.setAttribute('aria-disabled','true');b.textContent='✓ Trận đang LIVE';b.title='Đã bắt đầu. Có thể chấm điểm; nếu đã thoát Full hãy dùng nút Toàn màn hình.';}
    else {b.disabled=true;b.setAttribute('aria-disabled','true');b.textContent='✓ Trận đã kết thúc';b.title='Trận đã kết thúc.';}
  }
  if(hint){
    hint.dataset.state=st;
    if(st==='NO_MATCH')hint.innerHTML='<b>① Load trận</b> → ② chọn người phát Set 1 → ③ Bắt đầu trận → ④ mới chấm điểm.';
    else if(st==='NEED_SERVER')hint.innerHTML='<b>① CHỌN NGƯỜI/BÊN PHÁT CẦU SET 1</b> tại một ô số 2 · CHẴN. Nút Bắt đầu đang khóa; chưa thể cộng/trừ điểm.';
    else if(st==='READY')hint.innerHTML=`<b>✓ Đã chọn ${escapeHtml(serverLabel(s))}</b> · ② Bấm <b>Bắt đầu trận</b> để vào LIVE/Full màn hình. Chưa thể cộng điểm trước bước này.`;
    else if(st==='LIVE')hint.innerHTML='<b>✓ LIVE</b> · Đã mở quyền chấm điểm. Nếu thoát Full, dùng nút “Toàn màn hình” để vào lại.';
    else hint.innerHTML='<b>✓ Trận đã kết thúc</b> · Điểm đã khóa.';
  }
  SCORE_IDS.forEach(id=>{const el=$(id);if(!el)return;const locked=st!=='LIVE';el.classList.toggle('tk67-score-locked',locked);el.setAttribute('aria-disabled',locked?'true':'false');el.title=locked?(st==='READY'?'Bấm Bắt đầu trận trước khi chấm điểm.':'Chọn người phát Set 1 rồi bấm Bắt đầu trận trước khi chấm điểm.'):(el.title||'Chấm điểm trận đang LIVE');});
  if(s&&!s.started&&(document.fullscreenElement||document.body.classList.contains('tk58-score-focus')))Promise.resolve().then(exitPrestartFocus);
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function warnForStage(action='thao tác'){
  const s=App.state?.activeMatches?.[App.currentCourt],st=stage(s);
  if(st==='NO_MATCH')U.toast(`Chưa thể ${action}: hãy Load trận trước. Sau đó chọn người phát Set 1 → Bắt đầu trận.`,'err');
  else if(st==='NEED_SERVER')U.toast(`BƯỚC 1: chọn người/bên phát cầu Set 1 ở ô số 2 · CHẴN. Sau đó mới bấm Bắt đầu trận; chưa thể ${action}.`,'err');
  else if(st==='READY')U.toast(`BƯỚC 2: đã chọn người phát. Hãy bấm “Bắt đầu trận” để vào LIVE/Full màn hình rồi mới ${action}.`,'err');
  else if(st==='FINISHED')U.toast(`Không thể ${action}: trận đã kết thúc.`,'err');
  syncGateUi();return false;
}

// FINAL explicit start gate. No valid Set-1 server => no Start and no Fullscreen.
const baseStart=App.startUmpire?.bind(App);
if(baseStart)App.startUmpire=async function(...args){
  const s=this.state?.activeMatches?.[this.currentCourt],st=stage(s);
  if(st!=='READY'){
    if(st==='LIVE')return U.toast('Trận đã LIVE. Muốn mở lại màn hình chấm điểm hãy bấm “Toàn màn hình”.','info');
    await exitPrestartFocus();return warnForStage('bắt đầu trận');
  }
  // Persist an explicit-start marker before the legacy chain. The core Start persists the whole active state.
  s.tk67StartRequestedAt=Date.now();
  try{
    const out=await baseStart(...args);
    const now=this.state?.activeMatches?.[this.currentCourt];
    if(now?.started){now.tk67StartConfirmed=true;now.tk67StartConfirmedAt=Date.now();}
    syncGateUi();return out;
  }catch(e){delete s.tk67StartRequestedAt;syncGateUi();throw e;}
};

// FINAL scoring gate. Selecting a server never starts a match and never unlocks scoring.
const baseScore=App.score?.bind(App);
if(baseScore)App.score=async function(side,delta,...args){
  const s=this.state?.activeMatches?.[this.currentCourt],st=stage(s);
  if(st!=='LIVE')return warnForStage(Number(delta)>=0?'cộng điểm':'trừ điểm');
  primeFxContext();
  return baseScore(side,delta,...args);
};

// Keep the UI synchronized after every state-changing referee action.
const baseRender=App.renderUmpire?.bind(App);
if(baseRender)App.renderUmpire=function(...args){const out=baseRender(...args);syncGateUi();return out;};
const baseSelect=App.selectOpeningServer?.bind(App);
if(baseSelect)App.selectOpeningServer=async function(...args){const out=await baseSelect(...args);syncGateUi();return out;};
const baseLoad=App.loadUmpireMatch?.bind(App);
if(baseLoad)App.loadUmpireMatch=function(...args){const out=baseLoad(...args);syncGateUi();setTimeout(syncGateUi,0);return out;};
const baseShowTab=App.showTab?.bind(App);
if(baseShowTab)App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);if(tab==='umpire'){syncGateUi();setTimeout(syncGateUi,0);}return out;};

// --- BLV applause + encouragement -------------------------------------------
function scoreFirst(a,b,side){
  a=Number(a)||0;b=Number(b)||0;if(a===b)return `${a} đều`;
  if(U60?.scoreFirstPair)return U60.scoreFirstPair(a,b,side,', ');
  return String(side||'A').toUpperCase()==='B'?`${b}, ${a}`:`${a}, ${b}`;
}
function teamNameFor(m,side){const id=String(side).toUpperCase()==='B'?m?.teamBId:m?.teamAId;return App.teamName?.(id)||App.state?.teams?.[id]?.name||`Đội ${side}`;}
function classifyCelebration(result){
  const a=Number(result?.after?.a)||0,b=Number(result?.after?.b)||0;
  if(result?.matchFinished)return 'MATCH_FINISH';
  if(result?.setFinished)return 'SET_FINISH';
  if(a===b&&a+b>0)return 'TIE';
  return '';
}
function isTrailingFightback(result,side){
  const a=Number(result?.after?.a)||0,b=Number(result?.after?.b)||0,scorer=String(side||'A').toUpperCase(),mine=scorer==='B'?b:a,opp=scorer==='B'?a:b,gap=opp-mine;
  return mine<opp&&gap>=5&&gap<=10&&String(result?.after?.serverSide||scorer).toUpperCase()===scorer;
}
function fightbackText(m,result,side,total=0){
  const a=Number(result?.after?.a)||0,b=Number(result?.after?.b)||0,name=teamNameFor(m,side),gap=Math.abs(a-b),score=scoreFirst(a,b,side);
  const variants=[
    `Điểm cho ${name}, ${score}. ${name} đã giành quyền phát. Cố lên, tiếp tục rút ngắn cách biệt ${gap} điểm!`,
    `${name} gỡ thêm một điểm, ${score}, và giành lại quyền phát. Vẫn còn cơ hội, hãy tiếp tục bám đuổi!`,
    `Một điểm rất cần thiết cho ${name}. ${score}. Quyền phát đã về tay ${name}; cố lên, từng điểm một để thu hẹp cách biệt!`
  ];
  return variants[Math.abs(Number(total)||0)%variants.length];
}
const Engine=U46?.Engine;
if(Engine?.composeScore){
  Engine.priority=Engine.priority||{};Engine.priority.FIGHTBACK_SERVE=66;
  const baseCompose=Engine.composeScore.bind(Engine);
  Engine.composeScore=function(m,result,side){
    const meta=baseCompose(m,result,side)||{},celebration=classifyCelebration(result);
    if(celebration)meta.applause=celebration;
    if(isTrailingFightback(result,side)){
      meta.kind='FIGHTBACK_SERVE';meta.priority=Engine.priority.FIGHTBACK_SERVE;meta.text=fightbackText(m,result,side,meta.total);meta.fightbackServe=true;
    }
    return meta;
  };
}
function audioCtor(){return window.AudioContext||window.webkitAudioContext||null;}
function primeFxContext(){
  try{const C=audioCtor();if(!C)return null;if(!fxCtx)fxCtx=new C();if(fxCtx.state==='suspended')fxCtx.resume?.().catch?.(()=>{});return fxCtx;}catch{return null;}
}
function clapBurst(ctx,at,amp=.16){
  const sr=ctx.sampleRate||44100,len=Math.max(64,Math.floor(sr*.045)),buf=ctx.createBuffer(1,len,sr),d=buf.getChannelData(0);
  for(let i=0;i<len;i++){const env=Math.pow(1-i/len,3.2),seed=Math.sin((i+1)*12.9898+at*78.233)*43758.5453;d[i]=((seed-Math.floor(seed))*2-1)*env;}
  const src=ctx.createBufferSource(),bp=ctx.createBiquadFilter(),gain=ctx.createGain();src.buffer=buf;bp.type='bandpass';bp.frequency.value=1500+((Math.floor(at*1000)%5)*180);bp.Q.value=.7;gain.gain.setValueAtTime(amp,at);gain.gain.exponentialRampToValueAtTime(.001,at+.07);src.connect(bp);bp.connect(gain);gain.connect(ctx.destination);src.start(at);src.stop(at+.08);
}
function playApplause(kind='TIE'){
  if(window.TopkeyUpgrade76?.playApplause)return window.TopkeyUpgrade76.playApplause(kind);
  if($('auto-commentary')?.checked===false||!App.audioUnlocked)return false;
  const ctx=primeFxContext();if(!ctx)return false;
  const now=ctx.currentTime+.015,long=kind==='MATCH_FINISH',medium=kind==='SET_FINISH',count=long?22:medium?15:8,spacing=long ? .055 : (medium ? .06 : .065);
  for(let i=0;i<count;i++)clapBurst(ctx,now+i*spacing+(i%3)*.008,long ? .14 : (medium ? .13 : .105));
  return true;
}
function maybeApplause(meta){
  const kind=meta?.applause;if(!kind)return false;
  const key=`${App.currentCourt||''}|${meta.setNo||''}|${meta.after?.a||0}-${meta.after?.b||0}|${kind}`,now=Date.now();
  if(key===lastFxKey&&now-lastFxAt<2500)return false;lastFxKey=key;lastFxAt=now;return playApplause(kind);
}
if(Engine){
  // App.comment receives only eventAt from Upgrade48, while score metadata is kept in __u46PendingScoreMeta.
  // Peek it before the older wrapper consumes it, then add the crowd effect exactly once.
  const baseComment=App.comment?.bind(App);
  if(baseComment)App.comment=async function(text,meta={}){const pending=this.__u46PendingScoreMeta;maybeApplause(meta?.applause?meta:pending);return baseComment(text,meta);};
}

function stamp(){
  T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;
  document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);
}
const baseHealth=App.renderHealth?.bind(App);
if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out;};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade67 SW refresh',e)}}
function install(){stamp();syncGateUi();refreshSW();setTimeout(()=>{stamp();syncGateUi()},60);setTimeout(syncGateUi,700);}
install();
window.addEventListener('focus',()=>{stamp();syncGateUi();refreshSW()},{passive:true});
window.addEventListener('pageshow',syncGateUi,{passive:true});
window.TopkeyUpgrade67={installed:true,VERSION,CACHE_TAG,BUILD,stage,prestartServerValid,syncGateUi,warnForStage,classifyCelebration,isTrailingFightback,fightbackText,scoreFirst,primeFxContext,playApplause};
})();
