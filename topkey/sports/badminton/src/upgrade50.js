(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U46=window.TopkeyUpgrade46,U47=window.TopkeyUpgrade47,U48=window.TopkeyUpgrade48,U49=window.TopkeyUpgrade49;
if(!T||!App||!U||!U46||!U47||!U48||!U49||App.__upgrade50Installed)return;
App.__upgrade50Installed=true;
window.__TOPKEY_U50_AUDIO_GATE=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade50';
const CACHE_TAG='u50-20261029';
const $=id=>document.getElementById(id);
const Engine=U46.Engine,Piper=U47.Piper;
const GATE_KEY='topkey_u50_audio_gate';
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;

function gateState(){let x={verified:false,engine:'',verifiedAt:0,lastError:'',lastTestAt:0};try{x={...x,...JSON.parse(localStorage.getItem(GATE_KEY)||'{}')}}catch{}return x}
function saveGate(p){const x={...gateState(),...p};try{localStorage.setItem(GATE_KEY,JSON.stringify(x))}catch{}return x}
function eligible(){return U49.eligible?.()===true}
function target(tab=App.currentTab){return U49.targetTab?.(tab)===true}
function outputAllowed(tab=App.currentTab){const g=window.TopkeyUpgrade78;return g?.canSpeakNow?g.canSpeakNow(tab):target(tab)}
function selectedEngine(){return U47.selectedEngine?.()||'NONE'}
function localVoice(){return U49.localSystemVoices?.()[0]||null}
function markVerified(engine){App.audioUnlocked=!!outputAllowed();if(engine==='PIPER'){sessionPiperUnlocked=true;window.__TOPKEY_AUDIO_SESSION_PRIMED=true;}saveGate({verified:true,engine,verifiedAt:Date.now(),lastError:''});renderGate(`Đã xác nhận loa phát được · ${engine==='PIPER'?'TOPKEY Offline':'giọng local máy'}`,'ok');try{App.renderHealth?.()}catch{}}
function markBlocked(message){App.audioUnlocked=false;saveGate({verified:false,lastError:String(message||'Audio bị chặn')});renderGate(String(message||'Android đang chặn phát âm thanh.'),'blocked');try{App.renderHealth?.()}catch{}}

function silentWav(ms=32){
  const rate=8000,samples=Math.max(64,Math.round(rate*ms/1000)),buf=new ArrayBuffer(44+samples),v=new DataView(buf),s=(o,x)=>{for(let i=0;i<x.length;i++)v.setUint8(o+i,x.charCodeAt(i))};
  s(0,'RIFF');v.setUint32(4,36+samples,true);s(8,'WAVE');s(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate,true);v.setUint16(32,1,true);v.setUint16(34,8,true);s(36,'data');v.setUint32(40,samples,true);for(let i=44;i<44+samples;i++)v.setUint8(i,128);return new Blob([buf],{type:'audio/wav'});
}
let unlockPromise=null,unlockUrl='',sessionPiperUnlocked=false;
async function unlockPiperFromGesture(){
  if(window.__TOPKEY_AUDIO_SESSION_PRIMED===true||sessionPiperUnlocked)return true;
  if(!Piper.installed)return false;
  if(unlockPromise)return unlockPromise;
  const a=Piper.ensureAudio?.();if(!a)return false;
  unlockPromise=(async()=>{
    try{
      if(unlockUrl)try{URL.revokeObjectURL(unlockUrl)}catch{}
      unlockUrl=URL.createObjectURL(silentWav());
      const oldVol=a.volume,oldRate=a.playbackRate;
      a.src=unlockUrl;a.volume=0;a.playbackRate=1;
      await a.play();
      await new Promise(r=>setTimeout(r,45));
      try{a.pause();a.currentTime=0}catch{}
      a.volume=oldVol;a.playbackRate=oldRate;
      // This verifies that Android accepted media playback in a real user gesture.
      saveGate({verified:true,engine:'PIPER',verifiedAt:Date.now(),lastError:''});App.audioUnlocked=!!outputAllowed();sessionPiperUnlocked=true;window.__TOPKEY_AUDIO_SESSION_PRIMED=true;
      return true;
    }catch(e){markBlocked('Android chưa mở kênh âm thanh: '+(e?.message||e));return false}
    finally{if(unlockUrl){try{URL.revokeObjectURL(unlockUrl)}catch{}unlockUrl=''}unlockPromise=null}
  })();
  return unlockPromise;
}

// Observe the browser's real speech start event as proof that SYSTEM voice reached audio.
if('speechSynthesis'in window&&speechSynthesis.speak&&!speechSynthesis.__topkeyU50Wrapped){
  const nativeSpeak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.__topkeyU50Wrapped=true;
  speechSynthesis.speak=function(utterance){
    const oldStart=utterance?.onstart,oldError=utterance?.onerror;
    if(utterance){utterance.onstart=function(e){if(eligible()&&target())markVerified('SYSTEM');try{return oldStart?.call(this,e)}catch{}};utterance.onerror=function(e){const code=String(e?.error||'');if(/not-allowed|audio-busy|network/i.test(code)&&eligible()&&target())markBlocked('Giọng hệ thống không phát được: '+code);try{return oldError?.call(this,e)}catch{}}}
    return nativeSpeak(utterance);
  };
}

function verifySystemFromGesture(){
  const v=localVoice();if(!v||!('speechSynthesis'in window))return Promise.resolve(false);
  return new Promise(resolve=>{
    let settled=false,timer=0;const done=(ok,err='')=>{if(settled)return;settled=true;if(timer)clearTimeout(timer);if(ok){try{speechSynthesis.cancel()}catch{}markVerified('SYSTEM')}else if(err)markBlocked(err);resolve(ok)};
    try{
      speechSynthesis.resume?.();const u=new SpeechSynthesisUtterance('sẵn sàng');u.lang='vi-VN';u.voice=v;u.volume=.01;u.rate=1.35;
      u.onstart=()=>done(true);u.onerror=e=>done(false,'Giọng local chưa phát được: '+(e?.error||'speech error'));speechSynthesis.speak(u);timer=setTimeout(()=>done(false,'Giọng local chưa phản hồi. Chạm “Test giọng” để thử lại.'),1800);
    }catch(e){done(false,'Không mở được giọng local: '+(e?.message||e))}
  });
}
async function verifyFromGesture(){
  if(!eligible())return false;const engine=selectedEngine();
  if(engine==='PIPER')return unlockPiperFromGesture();
  if(engine==='SYSTEM')return verifySystemFromGesture();
  return false;
}

// U48 marked latency before audio.play(). U50 records the real `playing` event and
// rejects playback errors so the UI can never claim "ON" when Android stayed silent.
Piper.speak=async function(text,item={}){
  if(!this.installed)throw new Error('Chưa tải TOPKEY Offline Voice.');
  const token=++this.token,a=this.ensureAudio();this.busy=true;this.phase='synth';
  const started=performance.now();
  try{
    const ready=await this.prepare();if(token!==this.token)return false;
    const synthAt=performance.now();let wav;
    if(ready&&this.fastSession?.predict)wav=await this.fastSession.predict(text);else{const m=await this.load();wav=await m.predict({text,voiceId:U47.PIPER_VOICE})}
    this.lastSynthMs=Math.round(performance.now()-synthAt);if(token!==this.token)return false;
    if(this.objectUrl)try{URL.revokeObjectURL(this.objectUrl)}catch{}
    this.objectUrl=URL.createObjectURL(wav);a.src=this.objectUrl;a.playbackRate=Math.max(.82,Math.min(1.35,Number($('blv-rate')?.value)||1.12));a.volume=Math.max(0,Math.min(1,Number($('blv-volume')?.value)||1));this.phase='play';
    const eventAt=Number(item.eventAt||item.createdAt||Date.now());
    const played=new Promise((resolve,reject)=>{let startedAudio=false;const cleanup=()=>{a.removeEventListener('playing',onplay);a.removeEventListener('error',onerr)};const onplay=()=>{startedAudio=true;this.lastStartLatency=Math.max(0,Date.now()-eventAt);markVerified('PIPER');cleanup();resolve(true)};const onerr=()=>{cleanup();reject(new Error('Audio Piper không phát được'))};a.addEventListener('playing',onplay,{once:true});a.addEventListener('error',onerr,{once:true});setTimeout(()=>{if(!startedAudio){cleanup();reject(new Error('Audio Piper không bắt đầu sau 2 giây'))}},2000)});
    try{await a.play()}catch(e){throw new Error('Android chặn audio.play(): '+(e?.message||e))}
    await played;
    return await new Promise((resolve,reject)=>{const done=()=>{a.onended=null;a.onerror=null;resolve(true)};a.onended=done;a.onerror=()=>{a.onended=null;a.onerror=null;reject(new Error('Piper bị lỗi khi đang phát'))}});
  }catch(e){markBlocked(e?.message||e);throw e}
  finally{if(token===this.token){this.busy=false;this.phase=this.fastSession?'ready':'idle'}this.lastTotalMs=Math.round(performance.now()-started);try{U48.renderRealtime?.()}catch{}}
};

function ensureGateUi(){
  for(const tab of ['umpire','live']){
    const card=$(`tk49-auto-voice-${tab}`);if(!card)continue;let row=card.querySelector('.tk50-audio-proof');
    if(!row){row=document.createElement('div');row.className='tk50-audio-proof';row.innerHTML='<span class="tk50-proof-text">Đang kiểm tra kênh âm thanh…</span><button type="button" class="btn mini tk50-test">🔊 Test giọng ngay</button>';card.appendChild(row);row.querySelector('.tk50-test').onclick=async()=>{saveGate({lastTestAt:Date.now()});const engine=selectedEngine();if(engine==='NONE'){renderGate('Chưa có giọng. Hãy tải giọng TOPKEY trước.','need');return}App.audioUnlocked=true;const ok=await verifyFromGesture();if(!ok)return;Engine.enqueue({text:'TOPKEY bình luận đã sẵn sàng.',kind:'TEST',priority:100,total:0,source:'MANUAL',eventAt:Date.now()})}}
  }
  renderGate();
}
function renderGate(message='',state=''){
  const engine=selectedEngine(),g=gateState();
  for(const tab of ['umpire','live']){
    const card=$(`tk49-auto-voice-${tab}`);if(!card)continue;const badge=card.querySelector('.tk49-badge'),msg=card.querySelector('.tk49-message'),proof=card.querySelector('.tk50-proof-text'),test=card.querySelector('.tk50-test');
    if(test)test.classList.toggle('hidden',engine==='NONE'||!eligible());
    if(engine==='NONE'){if(proof)proof.textContent='Chưa có giọng Việt để phát.';continue}
    if(message&&proof)proof.textContent=message;else if(proof)proof.textContent=g.verified?`✓ Kênh loa đã được xác nhận · ${g.engine==='PIPER'?'TOPKEY Offline':'giọng local'}`:'Kênh giọng đã sẵn sàng; lần chạm đầu tiên sẽ xác nhận loa.';
    if(!eligible())continue;
    if(state==='blocked'){if(badge){badge.dataset.state='need';badge.textContent='CẦN MỞ ÂM THANH'}if(msg)msg.textContent=message||g.lastError;continue}
    if(g.verified&&App.audioUnlocked){if(badge){badge.dataset.state='ok';badge.textContent='TỰ ĐỘNG · LOA ĐÃ XÁC NHẬN'}if(msg)msg.textContent=`${engine==='PIPER'?'TOPKEY Offline Voice':'Giọng local của máy'} · Auto BLV đang bật và đã xác nhận phát âm thanh.`}
  }
}

// Disable U49's competing silent-prime path (upgrade49.js checks this flag).
// For score taps we finish the real media unlock first, then execute scoring/commentary.
const baseScore=App.score.bind(App);
App.score=async function(...args){
  if(target('umpire')&&selectedEngine()!=='NONE'){
    if(selectedEngine()==='PIPER'&&window.__TOPKEY_AUDIO_SESSION_PRIMED!==true)await unlockPiperFromGesture();
    else {try{speechSynthesis?.resume?.()}catch{}App.audioUnlocked=!!outputAllowed('umpire')}
  }
  return baseScore(...args);
};
const baseShowTab=App.showTab.bind(App);
App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);if(['umpire','live'].includes(tab)&&target(tab)){App.audioUnlocked=selectedEngine()!=='NONE'&&outputAllowed(tab);ensureGateUi();if(outputAllowed(tab))Promise.resolve().then(()=>verifyFromGesture()).catch(()=>{})}return out};

const baseAfterLogin=App.afterLogin.bind(App);
App.afterLogin=async function(...args){const out=await baseAfterLogin(...args);ensureGateUi();return out};
const baseHealth=App.renderHealth?.bind(App);
App.renderHealth=function(...args){const out=baseHealth?.(...args);U.setText?.('health-version',VERSION);const h=$('health-audio'),g=gateState(),e=selectedEngine();if(h&&eligible())h.textContent=e==='NONE'?'AUTO BLV · CẦN TẢI GIỌNG':g.verified&&this.audioUnlocked?`AUTO BLV · AUDIO VERIFIED · ${e}`:`AUTO BLV · ARMED · ${e}`;document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);return out};
async function hardenServiceWorker50(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade50 SW refresh',e)}}
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild='upgrade50';try{App.renderHealth?.()}catch{}}
function install(){ensureGateUi();stamp();setTimeout(()=>{ensureGateUi();stamp()},0);setTimeout(()=>{ensureGateUi();stamp()},1000);hardenServiceWorker50()}
install();window.addEventListener('focus',()=>{ensureGateUi();stamp();hardenServiceWorker50()},{passive:true});
window.TopkeyUpgrade50={installed:true,VERSION,CACHE_TAG,gateState,saveGate,verifyFromGesture,unlockPiperFromGesture,renderGate};
})();
