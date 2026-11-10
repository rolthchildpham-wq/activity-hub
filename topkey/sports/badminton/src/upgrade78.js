(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U46=window.TopkeyUpgrade46,U47=window.TopkeyUpgrade47,U75=window.TopkeyUpgrade75,U76=window.TopkeyUpgrade76;
if(!T||!App||!U||!U46||!U47||App.__upgrade78Installed)return;
App.__upgrade78Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade78-blv-live-session-gate';
const CACHE_TAG='u78-20261029',BUILD='upgrade78';
const SETTINGS_KEY='topkey_u78_blv_live_gate';
const $=id=>document.getElementById(id),Engine=U46.Engine,Piper=U47.Piper;
const TAB_ID=(globalThis.crypto?.randomUUID?.()||`tab_${Date.now()}_${Math.random().toString(36).slice(2)}`);
const state={active:false,armedAt:0,tab:'',courtId:'',matchId:'',baselineId:'',reason:'BOOT_MUTED',ownerId:'',lastStopAt:0,lastStopReason:'',dropped:0};
let channel=null,stopping=false;
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;

function readSettings(){try{return{userEnabled:true,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{return{userEnabled:true}}}
function saveSettings(p){const x={...readSettings(),...p};try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(x))}catch{}return x}
function focused(){if(document.hidden||document.visibilityState==='hidden')return false;try{if(typeof document.hasFocus==='function'&&!document.hasFocus())return false}catch{}return true}
function selectedCourt(tab=App.currentTab){
  if(tab==='live')return $('stream-court')?.value||App.currentCourt||'';
  if(tab==='umpire')return $('umpire-court')?.value||App.currentCourt||'';
  return'';
}
function gateSnapshot(tab=App.currentTab){
  tab=String(tab||'');
  if(!T.Auth?.user)return{ok:false,reason:'NO_AUTH',tab};
  if(!focused())return{ok:false,reason:'BROWSER_BACKGROUND',tab};
  if(!['umpire','live'].includes(tab))return{ok:false,reason:'WRONG_APP_TAB',tab};
  if(!T.Auth.can?.(tab))return{ok:false,reason:'NO_TAB_PERMISSION',tab};
  const courtId=selectedCourt(tab);if(!courtId)return{ok:false,reason:'NO_COURT',tab};
  const active=App.state?.activeMatches?.[courtId];if(!active?.matchId)return{ok:false,reason:'NO_ACTIVE_MATCH',tab,courtId};
  const match=App.state?.matches?.[active.matchId];if(!match)return{ok:false,reason:'MATCH_DELETED',tab,courtId,matchId:active.matchId};
  const court=App.state?.courts?.[courtId];if(!court)return{ok:false,reason:'COURT_DELETED',tab,courtId,matchId:active.matchId};
  if(active.started!==true)return{ok:false,reason:'MATCH_NOT_STARTED',tab,courtId,matchId:active.matchId};
  if(String(match.status||'').toUpperCase()!=='LIVE')return{ok:false,reason:'MATCH_NOT_LIVE',tab,courtId,matchId:active.matchId};
  if(match.courtId&&String(match.courtId)!==String(courtId))return{ok:false,reason:'MATCH_OTHER_COURT',tab,courtId,matchId:active.matchId};
  if(String(court.status||'').toUpperCase()!=='LIVE'||String(court.activeMatchId||'')!==String(active.matchId))return{ok:false,reason:'COURT_NOT_LIVE',tab,courtId,matchId:active.matchId};
  const role=String(T.Auth.role?.()||'').toUpperCase(),uid=T.Auth.user?.uid||'';
  if(tab==='umpire'&&role!=='ADMIN'){
    if(!court.umpireUid)return{ok:false,reason:'UMPIRE_UNASSIGNED',tab,courtId,matchId:active.matchId};
    if(String(court.umpireUid)!==String(uid))return{ok:false,reason:'WRONG_UMPIRE',tab,courtId,matchId:active.matchId};
  }
  return{ok:true,reason:'LIVE_OK',tab,courtId,matchId:active.matchId,active,match,court};
}
function canSpeakNow(tab=App.currentTab){return gateSnapshot(tab).ok===true}
function currentLatest(courtId){return App.state?.commentary?.[courtId]?.latest||null}
function claimOwner(){state.ownerId=TAB_ID;try{channel?.postMessage?.({type:'CLAIM',id:TAB_ID,at:Date.now()})}catch{}}
function releaseOwner(){if(state.ownerId===TAB_ID){try{channel?.postMessage?.({type:'RELEASE',id:TAB_ID,at:Date.now()})}catch{}state.ownerId=''}}
function finishPiperAudio(){const a=Piper?.audio,done=a?.onended;try{Piper?.stop?.()}catch{}try{if(typeof done==='function')done.call(a,new Event('ended'))}catch{}}
function hardStop(reason='GATE_CLOSED',lockAudio=true){
  if(stopping)return;stopping=true;
  try{
    try{Engine.queue=[];Engine.speaking=false;Engine.current=null}catch{}
    try{speechSynthesis?.cancel?.()}catch{}
    finishPiperAudio();
    try{U75?.stopMandarin?.()}catch{}
    try{U76?.stopAll?.()}catch{}
    if(lockAudio)App.audioUnlocked=false;
    state.lastStopAt=Date.now();state.lastStopReason=reason;
  }finally{stopping=false}
}
function syncAutoUi(active=state.active){
  const el=$('auto-commentary'),enabled=readSettings().userEnabled!==false;
  if(el){el.disabled=!active;el.checked=!!(active&&enabled);el.title=active?'Auto BLV chỉ nhận sự kiện mới của trận LIVE hiện tại.':'BLV bị khóa: cần đúng tab Trọng tài/Live và trận LIVE hợp lệ.'}
  try{localStorage.setItem('topkey_auto_blv',active&&enabled?'1':'0')}catch{}
}
function arm(g){
  const key=`${g.tab}|${g.courtId}|${g.matchId}`,old=`${state.tab}|${state.courtId}|${state.matchId}`;
  if(state.active&&key===old){state.reason='LIVE_OK';syncAutoUi(true);renderGate();return g}
  hardStop('REARM_NEW_LIVE_CONTEXT',false);
  state.active=true;state.armedAt=Date.now();state.tab=g.tab;state.courtId=g.courtId;state.matchId=g.matchId;state.reason='LIVE_OK';
  state.baselineId=String(currentLatest(g.courtId)?.id||'');
  if(state.baselineId)try{Engine.seen?.add?.(state.baselineId)}catch{}
  claimOwner();syncAutoUi(true);renderGate();return g;
}
function close(reason){
  if(state.active||state.reason!==reason)hardStop(reason,true);
  state.active=false;state.armedAt=0;state.tab='';state.courtId='';state.matchId='';state.baselineId='';state.reason=reason||'GATE_CLOSED';releaseOwner();syncAutoUi(false);renderGate();
}
function evaluate(){const g=gateSnapshot();if(g.ok)return arm(g);close(g.reason);return g}
function manualTestAllowed(){return focused()&&['umpire','live'].includes(String(App.currentTab||''))&&!!T.Auth?.can?.(App.currentTab)}
function itemAllowed(item){
  const source=String(item?.source||'AUTO').toUpperCase();
  if(source==='MANUAL'&&String(item?.kind||'').toUpperCase()==='TEST')return manualTestAllowed();
  const g=evaluate();if(!g.ok||!state.active||state.ownerId&&state.ownerId!==TAB_ID)return false;
  const court=String(item?.court||item?.courtId||g.courtId||'');if(court&&court!==String(g.courtId))return false;
  if(source==='REMOTE'){
    if(String(item?.id||'')&&String(item.id)===state.baselineId)return false;
    const t=Number(item?.eventAt||item?.createdAt||0);if(!t||t<=state.armedAt)return false;
  }
  const t=Number(item?.eventAt||item?.createdAt||Date.now());if(source!=='MANUAL'&&t+1000<state.armedAt)return false;
  return true;
}
function drop(item,reason='BLV_GATE'){state.dropped++;Engine.status?.(`BLV khóa · ${reason} · bỏ câu cũ/không đúng phiên.`,'info');renderGate();return false}

// Final authority over every legacy commentary queue/transport.
const baseEnqueue=Engine.enqueue.bind(Engine);
Engine.enqueue=function(item){return itemAllowed(item)?baseEnqueue(item):drop(item,state.reason)};
const baseDrain=Engine.drain.bind(Engine);
Engine.drain=function(...args){
  const head=this.queue?.[0];
  if(head&&!itemAllowed(head)){this.queue.shift();drop(head,state.reason);return this.drain(...args)}
  if(!head&&!canSpeakNow())return;
  const manual=head&&String(head.source||'').toUpperCase()==='MANUAL'&&String(head.kind||'').toUpperCase()==='TEST';
  if(head&&!state.active&&!manual)return;
  return baseDrain(...args);
};
const baseComment=App.comment?.bind(App);
if(baseComment)App.comment=async function(text,meta={}){
  const source=String(meta.source||'AUTO').toUpperCase(),probe={...meta,text,source,court:meta.court||this.currentCourt||selectedCourt(),createdAt:Date.now()};
  if(source!=='MANUAL'&&!itemAllowed(probe))return null;
  return baseComment(text,meta);
};
const baseSpeak=App.speakCommentary?.bind(App);
if(baseSpeak)App.speakCommentary=function(row){const item={...row,court:row?.courtId,source:'REMOTE'};return itemAllowed(item)?baseSpeak(row):drop(item,'STALE_REMOTE')};
const baseRenderCommentary=App.renderCommentary?.bind(App);
if(baseRenderCommentary)App.renderCommentary=function(...args){
  const g=evaluate();
  if(!g.ok){U.setText?.('live-caption','BLV đang tắt · chỉ phát khi có trận LIVE và đang mở đúng tab Trọng tài/Live.');return}
  const row=currentLatest(g.courtId);if(row&&String(row.id||'')===state.baselineId){U.setText?.('live-caption','BLV LIVE · đang chờ diễn biến mới của trận hiện tại.');return}
  return baseRenderCommentary(...args);
};

const baseShowTab=App.showTab?.bind(App);
if(baseShowTab)App.showTab=function(tab,...args){
  if(!['umpire','live'].includes(String(tab||'')))close('WRONG_APP_TAB');
  const out=baseShowTab(tab,...args);setTimeout(evaluate,0);return out;
};
const baseRenderBranch=App.renderBranch?.bind(App);
if(baseRenderBranch)App.renderBranch=function(branch,...args){const out=baseRenderBranch(branch,...args);if(['matches','courts','activeMatches','commentary'].includes(branch))setTimeout(evaluate,0);return out};
const baseApplyRole=App.applyRole?.bind(App);
if(baseApplyRole)App.applyRole=function(...args){const out=baseApplyRole(...args);setTimeout(evaluate,0);return out};
const baseAfterLogin=App.afterLogin?.bind(App);
if(baseAfterLogin)App.afterLogin=async function(...args){hardStop('LOGIN_BOOT_MUTED',true);const out=await baseAfterLogin(...args);setTimeout(evaluate,0);setTimeout(evaluate,1100);return out};
const baseBind=App.bindStatic?.bind(App);
if(baseBind)App.bindStatic=function(...args){const out=baseBind(...args);const el=$('auto-commentary');if(el){el.onchange=e=>{const requested=!!e.target.checked;if(!state.active&&requested){saveSettings({userEnabled:true});e.target.checked=false;U.toast('BLV chỉ bật khi có trận LIVE và đang mở đúng tab Trọng tài/Live.','info');return}saveSettings({userEnabled:requested});syncAutoUi(state.active);if(!requested)hardStop('USER_DISABLED',false)}}syncAutoUi(false);return out};

function reasonText(r){return({BOOT_MUTED:'Vừa mở website · BLV mặc định tắt.',LOGIN_BOOT_MUTED:'Vừa khôi phục đăng nhập · chưa phát bình luận.',BROWSER_BACKGROUND:'Browser tab đang nền/không focus.',WRONG_APP_TAB:'Hãy mở đúng tab Trọng tài hoặc Live.',NO_AUTH:'Chưa đăng nhập.',NO_TAB_PERMISSION:'Tài khoản không có quyền tab hiện tại.',NO_COURT:'Chưa chọn sân.',NO_ACTIVE_MATCH:'Sân không có trận đang chạy.',MATCH_DELETED:'Trận đã bị xóa khỏi dữ liệu.',COURT_DELETED:'Sân đã bị xóa.',MATCH_NOT_STARTED:'Trận chưa bấm Bắt đầu.',MATCH_NOT_LIVE:'Trận không còn trạng thái LIVE.',MATCH_OTHER_COURT:'Trận LIVE thuộc sân khác.',COURT_NOT_LIVE:'Sân không còn gắn đúng trận LIVE.',UMPIRE_UNASSIGNED:'Sân chưa gán trọng tài.',WRONG_UMPIRE:'Sân đang gán cho trọng tài khác.',OTHER_BROWSER_TAB:'Một browser tab khác đang giữ kênh BLV.',USER_DISABLED:'Auto BLV đã được tắt thủ công.'})[r]||'BLV đang khóa.'}
function ensureUi(){
  for(const tab of ['umpire','live']){
    const host=$(`tk49-auto-voice-${tab}`)||$(`page-${tab}`);if(!host)continue;
    let row=host.querySelector('.tk78-live-gate');if(row)continue;
    row=document.createElement('div');row.className='tk78-live-gate';row.innerHTML='<span class="tk78-gate-dot"></span><div><b class="tk78-gate-title">BLV SESSION GATE</b><div class="tk78-gate-text">Đang kiểm tra phiên LIVE…</div></div>';
    host.appendChild(row);
  }
}
function renderGate(){ensureUi();const on=state.active&&canSpeakNow()&&readSettings().userEnabled!==false;const g=gateSnapshot();document.querySelectorAll('.tk78-live-gate').forEach(row=>{row.dataset.state=on?'live':'locked';const title=row.querySelector('.tk78-gate-title'),txt=row.querySelector('.tk78-gate-text');if(title)title.textContent=on?'🔊 BLV LIVE · CHỈ SỰ KIỆN MỚI':'🔇 BLV KHÓA';if(txt)txt.textContent=on?`${g.court?.name||g.courtId} · ${g.match?.code||g.matchId} · mở ${g.tab==='umpire'?'Trọng tài':'Live'} · không đọc commentary cũ.`:reasonText(g.reason||state.reason)});}
function setupChannel(){try{if(!('BroadcastChannel'in window))return;channel=new BroadcastChannel('topkey_blv_audio_owner_v1');channel.onmessage=e=>{const m=e?.data||{};if(m.type==='CLAIM'&&m.id&&m.id!==TAB_ID){state.ownerId=m.id;if(state.active){hardStop('OTHER_BROWSER_TAB',true);state.active=false;state.reason='OTHER_BROWSER_TAB';syncAutoUi(false);renderGate()}}else if(m.type==='RELEASE'&&state.ownerId===m.id){state.ownerId='';setTimeout(evaluate,0)}}}catch{channel=null}}
function bindSelectors(){for(const id of ['umpire-court','stream-court'])$(id)?.addEventListener?.('change',()=>{hardStop('COURT_CHANGED',false);state.active=false;setTimeout(evaluate,0)})}
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=$('health-version');if(h)h.textContent=VERSION;renderGate()}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();const h=$('health-audio');if(h)h.textContent+=(state.active&&canSpeakNow())?' · BLV LIVE GATE':' · BLV MUTED';return out};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade78 SW refresh',e)}}
function install(){
  hardStop('BOOT_MUTED',true);try{localStorage.setItem('topkey_auto_blv','0')}catch{}setupChannel();bindSelectors();ensureUi();syncAutoUi(false);stamp();refreshSW();setTimeout(evaluate,0);setTimeout(evaluate,1200);setTimeout(evaluate,2400);
}
install();
document.addEventListener('visibilitychange',()=>{if(document.hidden)close('BROWSER_BACKGROUND');else setTimeout(evaluate,0)},{passive:true});
window.addEventListener('blur',()=>close('BROWSER_BACKGROUND'),{passive:true});
window.addEventListener('focus',()=>{setTimeout(evaluate,0);setTimeout(evaluate,250)},{passive:true});
window.addEventListener('pagehide',()=>close('BROWSER_BACKGROUND'),{passive:true});
window.addEventListener('pageshow',()=>setTimeout(evaluate,0),{passive:true});
window.addEventListener('beforeunload',()=>{releaseOwner();hardStop('PAGE_UNLOAD',true)});
window.TopkeyUpgrade78={installed:true,VERSION,CACHE_TAG,BUILD,TAB_ID,state,readSettings,saveSettings,selectedCourt,gateSnapshot,canSpeakNow,itemAllowed,evaluate,hardStop,reasonText};
})();
