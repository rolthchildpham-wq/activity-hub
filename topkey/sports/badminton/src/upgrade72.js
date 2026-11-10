(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U46=window.TopkeyUpgrade46,U47=window.TopkeyUpgrade47,U49=window.TopkeyUpgrade49,U50=window.TopkeyUpgrade50,U51=window.TopkeyUpgrade51;
if(!T||!App||!U||!U46||!U47||!U49||!U50||!U51||App.__upgrade72Installed)return;
App.__upgrade72Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade72-auto-voice-bootstrap';
const CACHE_TAG='u72-20261029',BUILD='upgrade72';
const STATE_KEY='topkey_u72_voice_bootstrap';
const $=id=>document.getElementById(id),Piper=U47.Piper,Engine=U46.Engine;
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;

function state(){let x={autoInstall:true,lastAttemptAt:0,lastSuccessAt:0,lastError:'',mediaPrimedAt:0,engine:'',phase:'idle'};try{x={...x,...JSON.parse(localStorage.getItem(STATE_KEY)||'{}')}}catch{}return x}
function save(p){const x={...state(),...p};try{localStorage.setItem(STATE_KEY,JSON.stringify(x))}catch{}return x}
function eligible(){return U49.eligible?.()===true}
function localVoices(){return U49.localSystemVoices?.()||[]}
function localVoice(){return localVoices()[0]||null}
function outputAllowed(tab=App.currentTab){const g=window.TopkeyUpgrade78;return g?.canSpeakNow?g.canSpeakNow(tab):U49.targetTab?.(tab)===true}
function autoBlvOn(){if(!outputAllowed())return false;try{localStorage.setItem('topkey_auto_blv','1')}catch{}const c=$('auto-commentary');if(c)c.checked=true;try{U49.saveSettings?.({enabled:true,autoCommentary:true})}catch{}return true}
function setMode(mode){try{U47.saveSettings?.({mode})}catch{}save({engine:mode});}
function canAutoInstall(){return !!(window.isSecureContext&&navigator.storage?.getDirectory&&navigator.onLine!==false)}
function installedEngine(){if(localVoice())return'SYSTEM';if(Piper.installed)return'PIPER';return'NONE'}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
async function waitForSystemVoice(timeout=1600){
  const first=localVoice();if(first)return first;
  if(!('speechSynthesis'in window))return null;
  return await new Promise(resolve=>{
    let done=false,timer=0;const finish=()=>{if(done)return;done=true;if(timer)clearTimeout(timer);try{speechSynthesis.removeEventListener?.('voiceschanged',onchange)}catch{}resolve(localVoice())};
    const onchange=()=>{if(localVoice())finish()};
    try{speechSynthesis.getVoices();speechSynthesis.addEventListener?.('voiceschanged',onchange,{once:false})}catch{}
    timer=setTimeout(finish,timeout);
  });
}

let primePromise=null,primeUrl='',sessionMediaPrimed=false;
function silentWav(ms=48){
  const rate=8000,samples=Math.max(64,Math.round(rate*ms/1000)),buf=new ArrayBuffer(44+samples),v=new DataView(buf),s=(o,x)=>{for(let i=0;i<x.length;i++)v.setUint8(o+i,x.charCodeAt(i))};
  s(0,'RIFF');v.setUint32(4,36+samples,true);s(8,'WAVE');s(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate,true);v.setUint16(32,1,true);v.setUint16(34,8,true);s(36,'data');v.setUint32(40,samples,true);for(let i=44;i<44+samples;i++)v.setUint8(i,128);return new Blob([buf],{type:'audio/wav'});
}
async function primeMediaFromGesture(){
  if(sessionMediaPrimed||window.__TOPKEY_AUDIO_SESSION_PRIMED===true){sessionMediaPrimed=true;return true;}
  if(!eligible())return false;
  try{speechSynthesis?.resume?.()}catch{}
  if(primePromise)return primePromise;
  const a=Piper.ensureAudio?.();if(!a)return false;
  primePromise=(async()=>{
    const oldVol=a.volume,oldRate=a.playbackRate;
    try{
      if(primeUrl)try{URL.revokeObjectURL(primeUrl)}catch{}
      primeUrl=URL.createObjectURL(silentWav());a.src=primeUrl;a.volume=0;a.playbackRate=1;
      await a.play();await wait(40);try{a.pause();a.currentTime=0}catch{};
      const now=Date.now();sessionMediaPrimed=true;window.__TOPKEY_AUDIO_SESSION_PRIMED=true;save({mediaPrimedAt:now,lastError:''});App.audioUnlocked=installedEngine()!=='NONE'&&outputAllowed();
      if(Piper.installed)try{U50.saveGate?.({verified:true,engine:'PIPER',verifiedAt:now,lastError:''})}catch{}
      renderStatus();if(App.audioUnlocked)Engine.drain?.();return true;
    }catch(e){save({lastError:'Trình duyệt chặn âm thanh: '+(e?.message||e)});renderStatus();return false}
    finally{a.volume=oldVol;a.playbackRate=oldRate;if(primeUrl){try{URL.revokeObjectURL(primeUrl)}catch{}primeUrl=''}primePromise=null}
  })();
  return primePromise;
}

function ensureStatusUi(){
  for(const tab of ['umpire','live']){
    const card=$(`tk49-auto-voice-${tab}`);if(!card)continue;
    let row=card.querySelector('.tk72-auto-bootstrap');
    if(!row){row=document.createElement('div');row.className='tk72-auto-bootstrap';row.innerHTML='<span class="tk72-auto-dot"></span><span class="tk72-auto-text">Đang tự chuẩn bị giọng bình luận…</span><button type="button" class="btn mini tk72-retry hidden">↻ Thử lại tự động</button>';card.appendChild(row);row.querySelector('.tk72-retry').onclick=()=>bootstrap('manual',true)}
    const oldNote=card.querySelector('.tk49-note');if(oldNote)oldNote.textContent='TOPKEY vẫn tự chuẩn bị/tải giọng khi mở web, nhưng không tự phát bình luận. Upgrade78 chỉ mở âm thanh khi có trận LIVE hợp lệ và đang ở đúng tab Trọng tài/Live; commentary cũ khi mở tab mới bị bỏ qua.';
  }
}
function renderStatus(message=''){
  ensureStatusUi();const s=state(),engine=installedEngine();
  let text=message,stateName='info',retry=false;
  if(!eligible()){text='Tự động giọng chỉ áp dụng cho tài khoản có quyền Trọng tài/Live.';stateName='muted'}
  else if(s.phase==='installing'){text='Thiết bị chưa có giọng Việt · TOPKEY đang tự tải gói Offline Voice (~63 MB)…';stateName='working'}
  else if(s.phase==='warming'){text='Đã có TOPKEY Offline Voice · đang tự khởi tạo bộ máy phát giọng…';stateName='working'}
  else if(engine==='SYSTEM'){text=`✓ Giọng Việt thiết bị đã sẵn sàng${App.audioUnlocked?' · BLV LIVE đang mở loa':' · BLV chờ Session Gate LIVE'}.`;stateName=App.audioUnlocked?'ok':'ready'}
  else if(engine==='PIPER'&&Piper.runtimeHealthy){text=`✓ TOPKEY Offline Voice đã sẵn sàng${App.audioUnlocked?' · BLV LIVE đang mở loa':' · BLV chờ Session Gate LIVE'}.`;stateName=App.audioUnlocked?'ok':'ready'}
  else if(engine==='PIPER'){text='TOPKEY Offline Voice đã có trên máy · runtime sẽ tự khởi tạo.';stateName='ready'}
  else if(s.lastError){text='Chưa tự chuẩn bị được giọng: '+s.lastError;stateName='err';retry=true}
  else{text='Đang tự kiểm tra giọng Việt trên thiết bị…';stateName='working'}
  document.querySelectorAll('.tk72-auto-bootstrap').forEach(row=>{row.dataset.state=stateName;const t=row.querySelector('.tk72-auto-text'),b=row.querySelector('.tk72-retry'),card=row.closest?.('.tk49-auto-voice'),install=card?.querySelector?.('.tk49-install');if(t)t.textContent=text;if(b)b.classList.toggle('hidden',!retry);if(install&&s.phase==='installing'){install.disabled=true;install.textContent='⏳ Đang tự tải giọng TOPKEY…'}else if(install&&engine==='NONE'&&s.lastError){install.disabled=false;install.textContent='↻ Tải lại giọng TOPKEY'}});
}

let bootPromise=null,lastBootToken=0;
async function autoInstallPiper(force=false){
  if(Piper.installed)return true;
  const s=state(),now=Date.now();
  if(!force&&s.lastAttemptAt&&now-s.lastAttemptAt<60000&&s.lastError)return false;
  if(!canAutoInstall()){save({phase:'error',lastAttemptAt:now,lastError:navigator.onLine===false?'Thiết bị đang offline. Khi có mạng TOPKEY sẽ tự tải lại.':'Trình duyệt này không hỗ trợ bộ nhớ OPFS/HTTPS để cài giọng offline.'});renderStatus();return false}
  save({phase:'installing',lastAttemptAt:now,lastError:''});renderStatus();
  try{await Piper.install()}catch(e){save({phase:'error',lastError:e?.message||String(e)});renderStatus();return false}
  if(!Piper.installed){save({phase:'error',lastError:Piper.lastError||'Tải gói giọng chưa hoàn tất.'});renderStatus();return false}
  setMode('PIPER');save({phase:'warming',lastSuccessAt:Date.now(),lastError:''});renderStatus();return true;
}
async function bootstrap(reason='startup',force=false){
  if(!eligible()){renderStatus();return'INELIGIBLE'};
  if(bootPromise&&!force)return bootPromise;
  const token=++lastBootToken;
  bootPromise=(async()=>{
    autoBlvOn();ensureStatusUi();save({phase:'checking'});renderStatus();
    // Probe/warm an already-installed Piper in parallel while Android is still loading
    // its system voice list. This removes the old sequential 1.6 s wait + warmup path.
    const piperProbe=(async()=>{try{await Piper.refresh();if(Piper.installed)return await Piper.prepare?.(false)}catch{}return false})();
    const sys=await waitForSystemVoice(force?250:1600);if(token!==lastBootToken)return'STALE';
    if(sys){setMode('SYSTEM');save({phase:'ready',lastSuccessAt:Date.now(),lastError:''});try{speechSynthesis?.resume?.()}catch{}App.audioUnlocked=false;renderStatus();return'SYSTEM'}
    const probeReady=await piperProbe;
    if(token!==lastBootToken)return'STALE';
    if(!Piper.installed){const ok=await autoInstallPiper(force);if(!ok)return'NONE'}
    setMode('PIPER');save({phase:'warming',lastError:''});renderStatus();
    let ready=!!probeReady||!!(Piper.fastSession&&Piper.runtimeHealthy);try{if(!ready)ready=await Piper.prepare?.(force)}catch(e){save({lastError:e?.message||String(e)})}
    if(token!==lastBootToken)return'STALE';
    if(!ready&&Piper.runtimeError){save({phase:'error',lastError:Piper.runtimeError});renderStatus();return'PIPER_ERROR'}
    const primed=sessionMediaPrimed;
    App.audioUnlocked=primed&&outputAllowed();
    save({phase:'ready',lastSuccessAt:Date.now(),lastError:''});renderStatus();if(App.audioUnlocked)Engine.drain?.();return'PIPER'
  })().finally(()=>{bootPromise=null});
  return bootPromise;
}

// The first ordinary user action opens the media channel even if the 63 MB model is
// still downloading. When installation finishes, the same Piper <audio> element is
// already gesture-primed, so commentary can start without a separate settings step.
let gestureSeen=false;
function firstGesture(){if(!eligible())return;gestureSeen=true;const allowed=outputAllowed();const e=installedEngine();if(e==='SYSTEM'){try{speechSynthesis?.resume?.()}catch{}App.audioUnlocked=!!allowed;if(App.audioUnlocked)Engine.drain?.();renderStatus();return;}primeMediaFromGesture().then(ok=>{if(ok&&installedEngine()==='PIPER'){App.audioUnlocked=!!outputAllowed();if(App.audioUnlocked)Engine.drain?.();renderStatus();}}).catch(()=>{});if(e==='NONE')bootstrap('gesture').catch(()=>{})}
document.addEventListener('pointerdown',firstGesture,{capture:true,passive:true});
document.addEventListener('keydown',firstGesture,{capture:true,passive:true});
document.addEventListener('touchstart',firstGesture,{capture:true,passive:true});

const baseAfterLogin=App.afterLogin.bind(App);
App.afterLogin=async function(...args){const out=await baseAfterLogin(...args);ensureStatusUi();setTimeout(()=>bootstrap('login').catch(()=>{}),120);return out};
const baseApplyRole=App.applyRole.bind(App);
App.applyRole=function(...args){const out=baseApplyRole(...args);setTimeout(()=>bootstrap('role').catch(()=>{}),180);return out};
const baseShowTab=App.showTab.bind(App);
App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);if(['umpire','live'].includes(tab)){ensureStatusUi();bootstrap('tab').catch(()=>{})}return out};

function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=$('health-version');if(h)h.textContent=VERSION;document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION)}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();const h=$('health-audio');if(h&&eligible()){const e=installedEngine(),s=state();h.textContent=e==='SYSTEM'?(App.audioUnlocked?'AUTO BLV · SYSTEM READY · AUDIO ON':'AUTO BLV · SYSTEM READY · CHỜ CHẠM ĐẦU'):e==='PIPER'?(Piper.runtimeHealthy?(sessionMediaPrimed?'AUTO BLV · PIPER READY · AUDIO PRIMED':'AUTO BLV · PIPER READY · CHỜ CHẠM ĐẦU'):'AUTO BLV · PIPER WARMUP'):'AUTO BLV · ĐANG TỰ TẢI GIỌNG'}return out};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade72 SW refresh',e)}}
function install(){stamp();ensureStatusUi();renderStatus();refreshSW();setTimeout(()=>{stamp();ensureStatusUi();if(eligible())bootstrap('startup').catch(()=>{})},900)}
install();
window.addEventListener('online',()=>bootstrap('online',true).catch(()=>{}),{passive:true});
window.addEventListener('focus',()=>{stamp();ensureStatusUi();refreshSW();if(eligible())bootstrap('focus').catch(()=>{})},{passive:true});
window.TopkeyUpgrade72={installed:true,VERSION,CACHE_TAG,BUILD,state,save,eligible,localVoices,installedEngine,waitForSystemVoice,primeMediaFromGesture,autoInstallPiper,bootstrap,renderStatus,get gestureSeen(){return gestureSeen}};
})();
