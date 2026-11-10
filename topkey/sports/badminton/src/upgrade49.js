(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U46=window.TopkeyUpgrade46,U47=window.TopkeyUpgrade47,U48=window.TopkeyUpgrade48;
if(!T||!App||!U||!U46||!U47||!U48||App.__upgrade49Installed)return;
App.__upgrade49Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade49';
const CACHE_TAG='u49-20261029';
const SETTINGS_KEY='topkey_u49_voice_autostart';
const $=id=>document.getElementById(id);
const Engine=U46.Engine,Piper=U47.Piper;
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;

function readSettings(){let x={enabled:true,autoCommentary:true,lastEngine:'',activatedAt:0};try{x={...x,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{}return x}
function saveSettings(patch){const x={...readSettings(),...patch};try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(x))}catch{}return x}
function eligible(){return !!T.Auth?.user&&!!(T.Auth.can?.('live')||T.Auth.can?.('umpire'))}
function targetTab(tab=App.currentTab){return eligible()&&['live','umpire'].includes(String(tab||''))&&!!T.Auth.can?.(tab)}
function localSystemVoices(){if(!('speechSynthesis'in window))return[];return speechSynthesis.getVoices().filter(v=>/^vi(?:[-_]|$)/i.test(v.lang||'')&&v.localService===true)}
function localSystemVoice(){const vs=localSystemVoices();return vs.find(v=>/google|vietnam|việt|nam|an|minh/i.test(v.name||''))||vs[0]||null}
function engineLabel(engine){return engine==='SYSTEM'?'GIỌNG LOCAL CỦA MÁY':engine==='PIPER'?'TOPKEY OFFLINE VOICE':'CHƯA CÓ GIỌNG'}
function outputAllowed(tab=App.currentTab){const g=window.TopkeyUpgrade78;return g?.canSpeakNow?g.canSpeakNow(tab):targetTab(tab)}
function forceAutoCommentary(tab=App.currentTab){if(!readSettings().autoCommentary||!outputAllowed(tab))return false;try{localStorage.setItem('topkey_auto_blv','1')}catch{}const el=$('auto-commentary');if(el)el.checked=true;return true}
function forceLocalPolicy(){const cfg=U46.settings?.()||{};if(cfg.localOnly!==true||cfg.voice!=='AUTO')U46.saveSettings?.({localOnly:true,voice:'AUTO'});try{App.populateVoices?.()}catch{}}

let primeUrl='',primeInFlight=null,lastActivationToken=0;
function silentWavBlob(ms=90){
  const rate=8000,samples=Math.max(80,Math.round(rate*ms/1000)),buf=new ArrayBuffer(44+samples),v=new DataView(buf);
  const s=(o,x)=>{for(let i=0;i<x.length;i++)v.setUint8(o+i,x.charCodeAt(i))};
  s(0,'RIFF');v.setUint32(4,36+samples,true);s(8,'WAVE');s(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate,true);v.setUint16(32,1,true);v.setUint16(34,8,true);s(36,'data');v.setUint32(40,samples,true);for(let i=44;i<44+samples;i++)v.setUint8(i,128);
  return new Blob([buf],{type:'audio/wav'});
}
function primePiperFromGesture(){
  if(!eligible()||!Piper.installed||Piper.busy||Piper.phase==='play'||primeInFlight)return primeInFlight||Promise.resolve(false);
  try{
    const a=Piper.ensureAudio?.();if(!a)return Promise.resolve(false);
    if(primeUrl)try{URL.revokeObjectURL(primeUrl)}catch{}
    primeUrl=URL.createObjectURL(silentWavBlob());const oldVolume=a.volume;a.src=primeUrl;a.volume=0;
    primeInFlight=Promise.resolve(a.play()).then(()=>new Promise(resolve=>{let settled=false,timer=0;const done=()=>{if(settled)return;settled=true;if(timer)clearTimeout(timer);a.onended=null;a.onerror=null;try{a.pause();a.currentTime=0}catch{}a.volume=oldVolume;saveSettings({mediaPrimedAt:Date.now()});resolve(true)};a.onended=done;a.onerror=done;timer=setTimeout(done,250)})).catch(()=>false).finally(()=>{primeInFlight=null;if(primeUrl){try{URL.revokeObjectURL(primeUrl)}catch{}primeUrl=''}});
    return primeInFlight;
  }catch{return Promise.resolve(false)}
}
function gesturePrime(){if(!eligible())return;try{speechSynthesis?.resume?.()}catch{}if(window.__TOPKEY_U50_AUDIO_GATE)return;if(Piper.installed)primePiperFromGesture();}

function ensureCards(){
  const make=(tab)=>{
    const page=$(`page-${tab}`);if(!page)return null;const id=`tk49-auto-voice-${tab}`;let box=$(id);if(box)return box;
    box=document.createElement('section');box.id=id;box.className='tk49-auto-voice';box.innerHTML=`<div class="tk49-head"><div><b>🔊 BLV TỰ ĐỘNG · ${tab==='umpire'?'TRỌNG TÀI':'LIVE & BÌNH LUẬN'}</b><div class="tk49-sub">Giọng được chuẩn bị sẵn; chỉ mở BLV khi đúng tab và có trận LIVE hợp lệ.</div></div><span class="tk49-badge" data-state="checking">ĐANG KIỂM TRA</span></div><div class="tk49-body"><span class="tk49-message">Đang kiểm tra giọng tiếng Việt trên thiết bị…</span><div class="tk49-actions"><button type="button" class="btn mini primary tk49-install">⬇ Tải giọng TOPKEY (~63 MB)</button><button type="button" class="btn mini tk49-activate">🔊 Kích hoạt âm thanh</button></div></div><div class="tk49-note">Model giọng được nhớ trên thiết bị. Âm thanh BLV không tự phát khi vừa mở website; Upgrade78 chỉ mở kênh cho trận LIVE hiện tại ở đúng tab Trọng tài/Live.</div>`;
    const first=page.firstElementChild;if(first)page.insertBefore(box,first);else page.appendChild(box);
    box.querySelector('.tk49-install').onclick=async()=>{const b=box.querySelector('.tk49-install');b.disabled=true;renderCards('Đang tải TOPKEY Offline Voice…','working');await Piper.install();b.disabled=false;if(Piper.installed){U47.saveSettings?.({mode:'PIPER'});gesturePrime();await activate(tab,'install')}renderCards()};
    box.querySelector('.tk49-activate').onclick=async()=>{gesturePrime();await activate(tab,'manual');renderCards()};
    return box;
  };
  make('umpire');make('live');
}
function renderCards(message='',forcedState=''){
  ensureCards();const local=localSystemVoices().length,installed=!!Piper.installed,engine=local?'SYSTEM':installed?'PIPER':'NONE',active=!!App.audioUnlocked&&engine!=='NONE';
  for(const tab of ['umpire','live']){
    const box=$(`tk49-auto-voice-${tab}`);if(!box)continue;const badge=box.querySelector('.tk49-badge'),msg=box.querySelector('.tk49-message'),install=box.querySelector('.tk49-install'),activateBtn=box.querySelector('.tk49-activate');
    let state=forcedState||'info',label='SẴN SÀNG',text=message;
    if(!eligible()){state='disabled';label='KHÔNG ÁP DỤNG';text='Tài khoản này không có quyền Trọng tài hoặc Live & Bình luận.'}
    else if(engine==='NONE'){state='need';label='CẦN TẢI GIỌNG';text=text||'Thiết bị chưa có giọng vi-VN local và chưa có TOPKEY Offline Voice. Hãy tải gói giọng TOPKEY một lần.'}
    else if(active){state='ok';label='TỰ ĐỘNG · ĐÃ BẬT';text=text||`${engineLabel(engine)} · Kênh giọng sẵn sàng; BLV chỉ phát khi Session Gate xác nhận trận LIVE hiện tại.`}
    else {state='ready';label='TỰ ĐỘNG · SẴN SÀNG';text=text||`${engineLabel(engine)} đã sẵn sàng. TOPKEY chỉ mở BLV khi Session Gate xác nhận đúng trận LIVE.`}
    badge.dataset.state=state;badge.textContent=label;msg.textContent=text;install.classList.toggle('hidden',engine!=='NONE'||!eligible());activateBtn.classList.toggle('hidden',engine==='NONE'||!eligible()||active);
  }
}

async function refreshAvailability(){
  forceLocalPolicy();try{App.populateVoices?.()}catch{}
  if(localSystemVoice())return'SYSTEM';
  try{await Piper.refresh()}catch{}
  if(Piper.installed)return'PIPER';
  return'NONE';
}
async function activate(tab=App.currentTab,reason='tab'){
  if(!readSettings().enabled||!targetTab(tab))return'INELIGIBLE';
  const token=++lastActivationToken;forceAutoCommentary(tab);const engine=await refreshAvailability();if(token!==lastActivationToken)return'STALE';
  if(engine==='NONE'){
    App.audioUnlocked=false;$('audio-overlay')?.classList.add('hidden');renderCards('Chưa có giọng Việt trên máy. Hãy bấm “Tải giọng TOPKEY (~63 MB)” một lần.','need');try{$(`tk49-auto-voice-${tab}`)?.scrollIntoView?.({behavior:reason==='tab'?'smooth':'auto',block:'nearest'})}catch{}return'NONE';
  }
  U47.saveSettings?.({mode:engine});App.audioUnlocked=!!outputAllowed(tab);$('audio-overlay')?.classList.add('hidden');saveSettings({lastEngine:engine,activatedAt:Date.now()});
  if(engine==='PIPER'){Piper.prepare?.().catch(()=>{})}else{try{speechSynthesis?.resume?.()}catch{}}
  try{App.renderHealth?.()}catch{}if(App.audioUnlocked)Engine.drain?.();renderCards();return engine;
}

// If Android blocks a Piper media play despite autostart, keep the preference and
// show a one-tap recovery instead of turning Auto BLV off.
const basePiperSpeak=Piper.speak.bind(Piper);
Piper.speak=async function(text,item={}){
  try{return await basePiperSpeak(text,item)}catch(e){
    if(/notallowed|user gesture|play\(\).*failed|autoplay/i.test(String(e?.name||'')+' '+String(e?.message||e))){App.audioUnlocked=false;renderCards('Android đang chặn autoplay sau khi trình duyệt vừa mở. Chạm một lần vào màn hình hoặc nút “Kích hoạt âm thanh”; các lần mở tab tiếp theo TOPKEY vẫn tự bật.','ready')}
    throw e;
  }
};

// A normal tab tap or umpire score tap is enough to prime Android media; no separate
// "Bật BLV" step is required when the voice is already installed.
const baseScore=App.score.bind(App);
App.score=function(...args){gesturePrime();return baseScore(...args)};
const baseShowTab=App.showTab.bind(App);
App.showTab=function(tab,...args){gesturePrime();const out=baseShowTab(tab,...args);if(['live','umpire'].includes(tab)){ensureCards();$('audio-overlay')?.classList.add('hidden');Promise.resolve().then(()=>activate(tab,'tab'))}return out};
const baseAfterLogin=App.afterLogin.bind(App);
App.afterLogin=async function(...args){const out=await baseAfterLogin(...args);ensureCards();if(targetTab(this.currentTab))await activate(this.currentTab,'login');else renderCards();return out};
const baseApplyRole=App.applyRole.bind(App);
App.applyRole=function(...args){const out=baseApplyRole(...args);setTimeout(()=>{ensureCards();if(targetTab(this.currentTab))activate(this.currentTab,'role');else renderCards()},0);return out};
const baseEnsureOverlay=App.ensureAudioOverlay?.bind(App);
App.ensureAudioOverlay=function(){if(targetTab('live')){$('audio-overlay')?.classList.add('hidden');activate('live','overlay');return}return baseEnsureOverlay?.()};

// Any first real touch on an eligible device silently primes the Piper media element.
document.addEventListener('pointerdown',()=>gesturePrime(),{capture:true,passive:true});
document.addEventListener('keydown',()=>gesturePrime(),{capture:true,passive:true});

const baseHealth=App.renderHealth?.bind(App);
App.renderHealth=function(...args){const out=baseHealth?.(...args);U.setText?.('health-version',VERSION);const h=$('health-audio');if(h&&eligible()){const e=localSystemVoice()?'SYSTEM':Piper.installed?'PIPER':'NONE';h.textContent=e==='NONE'?'AUTO BLV · CẦN TẢI GIỌNG':`AUTO BLV · ${this.audioUnlocked?'ON':'ARMED'} · ${engineLabel(e)}`}document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);return out};
async function hardenServiceWorker49(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade49 SW refresh',e)}}
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild='upgrade49';try{App.renderHealth?.()}catch{}}
function onVoicesChanged(){if(targetTab())activate(App.currentTab,'voices');else renderCards()}
function install(){ensureCards();stamp();setTimeout(()=>{ensureCards();renderCards();stamp()},0);setTimeout(()=>{ensureCards();renderCards();stamp();if(targetTab())activate(App.currentTab,'startup')},900);hardenServiceWorker49();if('speechSynthesis'in window){if(speechSynthesis.addEventListener)speechSynthesis.addEventListener('voiceschanged',onVoicesChanged);else{const old=speechSynthesis.onvoiceschanged;speechSynthesis.onvoiceschanged=()=>{try{old?.()}catch{}onVoicesChanged()}}}}
install();window.addEventListener('focus',()=>{ensureCards();stamp();hardenServiceWorker49();if(targetTab())activate(App.currentTab,'focus');else renderCards()},{passive:true});
window.TopkeyUpgrade49={installed:true,VERSION,CACHE_TAG,readSettings,saveSettings,eligible,targetTab,localSystemVoices,activate,renderCards,primePiperFromGesture};
})();
