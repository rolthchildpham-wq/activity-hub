(()=>{
'use strict';
const VERSION='u122h47-20261104';
const $=id=>document.getElementById(id);
const T=()=>window.Topkey||null,A=()=>window.Topkey?.App||null,U=()=>window.Topkey?.U||null;
let installed=false, primeUrl='', primeBusy=false, mirrorBusy=false, lastMirrorSig='';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function role(){return String(T()?.Auth?.role?.()||'').toUpperCase()}
function current(){const a=A(),court=a?.currentCourt||$('umpire-court')?.value||'';return {a,court,s:a?.state?.activeMatches?.[court]||null}}
function liveContext(){
  const {a,court,s}=current(); if(!a||!court||!s?.matchId||s.started!==true)return false;
  if(!['ADMIN','UMPIRE'].includes(role())||String(a.currentTab||'')!=='umpire')return false;
  const m=a.state?.matches?.[s.matchId],c=a.state?.courts?.[court]; if(!m||!c)return false;
  if(String(m.status||'').toUpperCase()!=='LIVE')return false;
  if(String(c.status||'').toUpperCase()!=='LIVE'||String(c.activeMatchId||'')!==String(s.matchId))return false;
  if(role()==='UMPIRE'&&c.umpireUid&&String(c.umpireUid)!==String(T()?.Auth?.user?.uid||''))return false;
  return true;
}
function silentBlob(ms=1200){
  const rate=8000,n=Math.max(80,Math.round(rate*ms/1000)),b=new ArrayBuffer(44+n),v=new DataView(b),str=(o,x)=>{for(let i=0;i<x.length;i++)v.setUint8(o+i,x.charCodeAt(i))};
  str(0,'RIFF');v.setUint32(4,36+n,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate,true);v.setUint16(32,1,true);v.setUint16(34,8,true);str(36,'data');v.setUint32(40,n,true);for(let i=44;i<44+n;i++)v.setUint8(i,128);return new Blob([b],{type:'audio/wav'});
}
function primeFromGesture(){
  try{speechSynthesis?.resume?.()}catch{}
  const P=window.TopkeyUpgrade47?.Piper;
  if(window.__TOPKEY_AUDIO_SESSION_PRIMED===true){try{if(window.TopkeyUpgrade78?.canSpeakNow?.()===true)A().audioUnlocked=true}catch{};return true}
  if(!P?.installed||primeBusy||P.busy||P.phase==='synth'||P.phase==='play')return false;
  try{
    primeBusy=true;const audio=P.ensureAudio?.();if(!audio){primeBusy=false;return false}
    if(primeUrl)try{URL.revokeObjectURL(primeUrl)}catch{}
    const url=URL.createObjectURL(silentBlob()),vol=audio.volume;primeUrl=url;audio.src=url;audio.volume=0;
    Promise.resolve(audio.play()).then(()=>{window.__TOPKEY_AUDIO_SESSION_PRIMED=true;try{if(window.TopkeyUpgrade78?.canSpeakNow?.()===true)A().audioUnlocked=true}catch{}}).catch(()=>false).finally(()=>setTimeout(()=>{
      // H20: only stop the silent priming source if Piper has not replaced it.
      // This prevents the old 120 ms timer from pausing the real commentary audio.
      try{if(audio.src===url&&!P.busy&&P.phase!=='synth'&&P.phase!=='play'){audio.pause();audio.currentTime=0}audio.volume=vol}catch{}
      try{URL.revokeObjectURL(url)}catch{};if(primeUrl===url)primeUrl='';primeBusy=false
    },650));
    return true;
  }catch{primeBusy=false;return false}
}
async function warmVoice(){
  if(!['ADMIN','UMPIRE'].includes(role()))return;
  try{A()?.populateVoices?.();speechSynthesis?.resume?.()}catch{}
  const P=window.TopkeyUpgrade47?.Piper;
  try{if(P&&!P.checking&&!P.installed)await P.refresh?.()}catch{}
  try{if(P?.installed){await P.load?.();await P.prepare?.()}}catch{}
  try{localStorage.setItem('topkey_auto_blv','1');window.TopkeyUpgrade78?.saveSettings?.({userEnabled:true})}catch{}
  try{window.TopkeyUpgrade78?.evaluate?.()}catch{}
  if(liveContext()){A().audioUnlocked=true;try{window.TopkeyUpgrade46?.Engine?.drain?.()}catch{}}
}
function chosenSystemVoice(){try{return A()?.chooseVoice?.()||null}catch{return null}}
async function directSpeak(text,{manual=false,onStart=null}={}){
  text=String(text||'').trim();if(!text)return false;if(!manual&&!liveContext())return false;
  const a=A(); if(!a)return false; primeFromGesture(); a.audioUnlocked=true;
  const voice=chosenSystemVoice();
  if(voice&&'speechSynthesis'in window){
    return await new Promise(resolve=>{const u=new SpeechSynthesisUtterance(text);u.lang='vi-VN';u.voice=voice;u.rate=Math.max(.85,Math.min(1.28,Number($('blv-rate')?.value)||1.08));u.pitch=Math.max(.8,Math.min(1.2,Number($('blv-pitch')?.value)||.98));u.volume=Math.max(.1,Math.min(1,Number($('blv-volume')?.value)||1));let started=false;u.onstart=()=>{started=true;try{onStart?.()}catch{}};u.onend=()=>resolve(true);u.onerror=()=>resolve(started);try{speechSynthesis.resume();speechSynthesis.speak(u)}catch{resolve(false)}});
  }
  const P=window.TopkeyUpgrade47?.Piper;
  if(P?.installed){
    try{
      const audio=P.ensureAudio?.();let started=false;
      const onplay=()=>{started=true;try{onStart?.()}catch{}};
      audio?.addEventListener?.('playing',onplay,{once:true});
      await P.speak(text,{source:'H20_DIRECT',eventAt:Date.now()});
      return started;
    }catch(e){console.warn('H20 direct Piper',e);return false}
  }
  return false;
}
function scoreFallbackText(side){
  const {a,s}=current();if(!a||!s)return'';const m=a.state?.matches?.[s.matchId]||{},teamId=side==='B'?m.teamBId:m.teamAId,team=a.state?.teams?.[teamId]||{},set=s.sets?.[Number(s.setIndex)||0]||{};
  return `Điểm cho ${team.name||('Đội '+side)}. Tỷ số ${Number(set.a)||0} - ${Number(set.b)||0}.`;
}
function stripAutoScoreQueue(){try{const E=window.TopkeyUpgrade46?.Engine;if(E?.queue)E.queue=E.queue.filter(q=>String(q?.source||'').toUpperCase()!=='AUTO'||!['SCORE','BIG_LEAD','STREAK','LEAD_CHANGE'].includes(String(q?.kind||'').toUpperCase()))}catch{}}
async function maybeFallbackScore(side,beforeSpoken){
  await sleep(260); if(!liveContext())return;
  const E=window.TopkeyUpgrade46?.Engine,a=A();
  if(E?.speaking||a?.lastSpokenCommentId!==beforeSpoken)return;
  stripAutoScoreQueue(); await directSpeak(scoreFallbackText(side),{manual:false});
}
function funText(){
  const p=$('tk122h6-fun-player'),q=$('tk122h6-fun-phrase'),o=p?.selectedOptions?.[0],raw=String(q?.value||'').trim();if(!o||!raw)return'';
  const address=o.dataset.address||o.dataset.name||'VĐV',pron=o.dataset.pronoun||'bạn';
  return /^\s*\{name\}/.test(raw)?raw.replace('{name}',address):`${address}, ${raw.replaceAll('{name}',pron).replace(/^./,c=>c.toLowerCase())}`;
}
async function playFun(){
  const text=funText();if(!text)return U()?.toast?.('Chọn VĐV và câu bình luận','info');
  const btn=$('tk122h6-fun-speak');if(btn)btn.disabled=true;
  let started=false;const ok=await directSpeak(text,{manual:true,onStart:()=>{started=true;U()?.toast?.('Đang phát bình luận vui','ok')}});
  if(!ok&&!started)U()?.toast?.('Không phát được âm thanh. Kiểm tra giọng Việt/Piper trên máy.','err');
  if(btn)btn.disabled=false;
}
function bindFun(){const b=$('tk122h6-fun-speak');if(b&&b.dataset.h11!=='1'){b.dataset.h11='1';b.onclick=e=>{e.preventDefault();primeFromGesture();playFun()}}}
function mirrorFromMatch(s){
  const a=A(),m=s&&a?.state?.matches?.[s.matchId];if(!s||!m)return false;let changed=false;
  if((!s.openingServers||!s.openingServers['0'])&&m.openingServers?.['0']){s.openingServers=JSON.parse(JSON.stringify(m.openingServers));changed=true}
  for(const k of ['openingServerSideSet1','openingServerPlayerSet1','openingServerNameSet1','openingServerRecordedAtSet1'])if((s[k]===undefined||s[k]===null||s[k]==='')&&m[k]!==undefined){s[k]=m[k];changed=true}
  return changed;
}
async function persistOpeningMirror(source='H11_OPENING_MIRROR'){
  if(mirrorBusy)return;const {a,court,s}=current(),D=T()?.Data;if(!a||!court||!s?.matchId||!D?.queueMulti)return;
  mirrorFromMatch(s);const snap=s.openingServers?.['0'];if(!snap||!['A','B'].includes(snap.side)||!['p1','p2'].includes(snap.player))return;
  const payload={openingServers:s.openingServers,openingServerSideSet1:s.openingServerSideSet1||snap.side,openingServerPlayerSet1:s.openingServerPlayerSet1||snap.player,openingServerNameSet1:s.openingServerNameSet1||snap.playerName||'',openingServerRecordedAtSet1:s.openingServerRecordedAtSet1||snap.selectedAt||Date.now()};
  const sig=JSON.stringify([s.matchId,payload]);if(sig===lastMirrorSig)return;mirrorBusy=true;
  try{const up={};for(const [k,v] of Object.entries(payload)){up[D.path(`activeMatches/${court}/${k}`)]=v;up[D.path(`matches/${s.matchId}/${k}`)]=v;a.state.matches[s.matchId][k]=JSON.parse(JSON.stringify(v));}await D.queueMulti(up,{type:source});lastMirrorSig=sig}catch(e){console.warn('H11 opening mirror pending',e)}finally{mirrorBusy=false}
}
function hook(){
  const a=A();if(!a||a.__u122h11Hooked)return !!a;a.__u122h11Hooked=true;
  const baseSelect=a.selectOpeningServer?.bind(a);if(baseSelect)a.selectOpeningServer=async function(...args){const out=await baseSelect(...args);await persistOpeningMirror('H11_OPENING_SELECTED');return out};
  const baseStart=a.startUmpire?.bind(a);if(baseStart)a.startUmpire=async function(...args){primeFromGesture();const out=await baseStart(...args);await persistOpeningMirror('H11_MATCH_START_ANCHOR');setTimeout(()=>warmVoice(),0);return out};
  const baseRender=a.renderUmpire?.bind(a);if(baseRender)a.renderUmpire=function(...args){try{if(window.TopkeyUpgrade78?.canSpeakNow?.()===true)this.audioUnlocked=true}catch{};const s=this.state.activeMatches?.[this.currentCourt];if(s&&mirrorFromMatch(s))setTimeout(()=>persistOpeningMirror('H11_OPENING_RESTORE'),0);const out=baseRender(...args);setTimeout(bindFun,0);return out};
  const baseScore=a.score?.bind(a);if(baseScore)a.score=async function(side,delta,...args){primeFromGesture();try{if(window.TopkeyUpgrade78?.canSpeakNow?.()===true)this.audioUnlocked=true}catch{};const before=this.lastSpokenCommentId||'';const out=await baseScore(side,delta,...args);if(Number(delta)>0){try{window.TopkeyUpgrade78?.evaluate?.()}catch{};this.audioUnlocked=true;try{window.TopkeyUpgrade46?.Engine?.drain?.()}catch{};maybeFallbackScore(side,before)}return out};
  const baseAfter=a.afterLogin?.bind(a);if(baseAfter)a.afterLogin=async function(...args){const out=await baseAfter(...args);setTimeout(()=>{warmVoice();bindFun();persistOpeningMirror('H11_LOGIN_RESTORE')},40);return out};
  return true;
}
function install(){if(installed)return;installed=true;let n=0;const t=setInterval(()=>{bindFun();if(hook()||++n>80)clearInterval(t)},100);window.addEventListener('topkey:admin-ready',()=>{hook();setTimeout(()=>{warmVoice();bindFun();persistOpeningMirror('H11_ADMIN_READY')},20)});document.addEventListener('pointerdown',primeFromGesture,{capture:true,passive:true});document.addEventListener('touchstart',primeFromGesture,{capture:true,passive:true});document.addEventListener('fullscreenchange',()=>setTimeout(bindFun,30));setTimeout(()=>{hook();warmVoice();bindFun()},600);window.TopkeyUpgrade122Hotfix11={installed:true,VERSION,primeFromGesture,warmVoice,directSpeak,persistOpeningMirror,playFun};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
