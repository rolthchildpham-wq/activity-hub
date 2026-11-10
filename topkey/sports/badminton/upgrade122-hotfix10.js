(()=>{
'use strict';
const VERSION='u122h47-20261104';
const $=id=>document.getElementById(id);
const T=()=>window.Topkey||null;
const App=()=>window.Topkey?.App||null;
const U=()=>window.Topkey?.U||null;
let installed=false, autoInstallBusy=false, lastAfterLogin=0;

function role(){return String(T()?.Auth?.role?.()||'').toUpperCase()}
function isOperator(){return ['ADMIN','UMPIRE'].includes(role())}
function forceAutoPreference(){
  try{localStorage.setItem('topkey_auto_blv','1')}catch{}
  try{window.TopkeyUpgrade78?.saveSettings?.({userEnabled:true})}catch{}
  try{window.TopkeyUpgrade49?.saveSettings?.({enabled:true,autoCommentary:true})}catch{}
  const auto=$('auto-commentary'); if(auto)auto.checked=true;
}

// Browser autoplay is unlocked from the actual login tap, before async Firebase login starts.
function primeLoginGesture(){
  try{window.speechSynthesis?.resume?.()}catch{}
  try{
    const rate=8000,samples=640,buf=new ArrayBuffer(44+samples),v=new DataView(buf);
    const s=(o,x)=>{for(let i=0;i<x.length;i++)v.setUint8(o+i,x.charCodeAt(i))};
    s(0,'RIFF');v.setUint32(4,36+samples,true);s(8,'WAVE');s(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate,true);v.setUint16(32,1,true);v.setUint16(34,8,true);s(36,'data');v.setUint32(40,samples,true);for(let i=44;i<44+samples;i++)v.setUint8(i,128);
    const url=URL.createObjectURL(new Blob([buf],{type:'audio/wav'}));
    const a=document.createElement('audio');a.preload='auto';a.playsInline=true;a.volume=.001;a.src=url;
    Promise.resolve(a.play()).then(()=>{setTimeout(()=>{try{a.pause()}catch{};try{URL.revokeObjectURL(url)}catch{}},140)}).catch(()=>{try{URL.revokeObjectURL(url)}catch{}});
  }catch{}
}

function bindLoginGesture(){
  const form=$('login-form'); if(!form||form.dataset.h10Gesture==='1')return;
  form.dataset.h10Gesture='1';
  form.addEventListener('pointerdown',primeLoginGesture,{capture:true,passive:true});
  form.addEventListener('touchstart',primeLoginGesture,{capture:true,passive:true});
  form.addEventListener('submit',primeLoginGesture,{capture:true});
}

async function maybeAutoInstallVoice(){
  if(autoInstallBusy||!isOperator()||!navigator.onLine)return false;
  const U49=window.TopkeyUpgrade49; if(!U49)return false;
  try{
    const voices=U49.localSystemVoices?.()||[];
    const installBtn=document.querySelector('#tk49-auto-voice-umpire .tk49-install');
    if(voices.length||!installBtn||installBtn.classList.contains('hidden')||installBtn.disabled)return false;
    autoInstallBusy=true;
    U()?.toast?.('Đang tự tải giọng TOPKEY Offline để dùng BLV…','info');
    installBtn.click();
    return true;
  }catch{return false}finally{setTimeout(()=>{autoInstallBusy=false},1500)}
}

async function armAudio(reason='h10'){
  if(!isOperator())return;
  forceAutoPreference();
  try{await window.TopkeyUpgrade49?.activate?.('umpire',reason)}catch{}
  try{window.TopkeyUpgrade78?.evaluate?.()}catch{}
  try{window.TopkeyUpgrade87?.syncAudioButtons?.()}catch{}
  try{window.TopkeyUpgrade87?.primeNaturalCrowdFromGesture?.()}catch{}
  // If no engine exists yet, start the one-time offline voice download automatically.
  setTimeout(()=>maybeAutoInstallVoice(),100);
}

function compactAndRefresh(){
  try{window.TopkeyUpgrade122Hotfix6?.ensureBar?.()}catch{}
  try{window.TopkeyUpgrade122Hotfix6?.refreshPlayers?.()}catch{}
  try{window.TopkeyUpgrade122Hotfix7?.forceLayout?.()}catch{}
}

function hookApp(){
  const A=App(); if(!A||A.__u122h10Hooked)return !!A;
  A.__u122h10Hooked=true;
  const baseAfter=A.afterLogin?.bind(A);
  if(baseAfter)A.afterLogin=async function(...args){
    const out=await baseAfter(...args); lastAfterLogin=Date.now();
    forceAutoPreference();
    if(role()==='UMPIRE'&&T()?.Auth?.can?.('umpire')){
      this.currentTab='umpire'; this.showTab?.('umpire');
      setTimeout(()=>{this.showTab?.('umpire');compactAndRefresh()},40);
    }
    setTimeout(()=>armAudio('h10-login'),80);
    setTimeout(()=>armAudio('h10-login-late'),850);
    return out;
  };
  const baseStart=A.startUmpire?.bind(A);
  if(baseStart)A.startUmpire=async function(...args){
    forceAutoPreference();
    try{await window.TopkeyUpgrade49?.activate?.('umpire','h10-start-gesture')}catch{}
    const out=await baseStart(...args);
    try{window.TopkeyUpgrade78?.evaluate?.();if(window.TopkeyUpgrade78?.canSpeakNow?.()===true)this.audioUnlocked=true}catch{}
    setTimeout(()=>{try{window.TopkeyUpgrade78?.evaluate?.();if(window.TopkeyUpgrade78?.canSpeakNow?.()===true)this.audioUnlocked=true;window.TopkeyUpgrade87?.syncAudioButtons?.()}catch{}},0);
    return out;
  };
  const baseScore=A.score?.bind(A);
  if(baseScore)A.score=async function(...args){
    forceAutoPreference();
    // Hotfix11: never block score mutation on TTS/audio verification. Prime in the
    // same gesture, then let the score transaction run immediately.
    try{window.TopkeyUpgrade122Hotfix11?.primeFromGesture?.()}catch{}
    // H20: never re-run Upgrade87 audio verification on every point. The legacy
    // verifier showed a toast on every tap and could race the real Piper audio.
    try{window.TopkeyUpgrade78?.evaluate?.()}catch{}
    try{if(window.TopkeyUpgrade78?.canSpeakNow?.()===true)this.audioUnlocked=true}catch{}
    const out=await baseScore(...args);
    setTimeout(()=>{try{window.TopkeyUpgrade78?.evaluate?.();window.TopkeyUpgrade87?.syncAudioButtons?.()}catch{}},0);
    return out;
  };
  const baseShow=A.showTab?.bind(A);
  if(baseShow)A.showTab=function(tab,...args){const out=baseShow(tab,...args);if(tab==='umpire'){forceAutoPreference();setTimeout(()=>{armAudio('h10-tab');compactAndRefresh()},60)}return out};
  return true;
}

function install(){
  if(installed)return; installed=true;
  bindLoginGesture(); forceAutoPreference();
  let tries=0; const wait=setInterval(()=>{bindLoginGesture();if(hookApp()||++tries>80)clearInterval(wait)},125);
  window.addEventListener('topkey:admin-ready',()=>{hookApp();if(role()==='UMPIRE'){App()?.showTab?.('umpire');setTimeout(()=>armAudio('h10-admin-ready'),20)}compactAndRefresh()});
  document.addEventListener('fullscreenchange',()=>setTimeout(compactAndRefresh,30));
  window.addEventListener('orientationchange',()=>setTimeout(compactAndRefresh,100),{passive:true});
  window.addEventListener('online',()=>setTimeout(()=>maybeAutoInstallVoice(),300),{passive:true});
  // If auth was restored before this hotfix attached, repair the route/audio immediately.
  setTimeout(()=>{if(T()?.Auth?.user){if(role()==='UMPIRE'){App()?.showTab?.('umpire')}armAudio('h10-restored');compactAndRefresh()}},900);
  window.TopkeyUpgrade122Hotfix10={installed:true,VERSION,forceAutoPreference,primeLoginGesture,armAudio,compactAndRefresh};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
