(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U88=window.TopkeyUpgrade88,U47=window.TopkeyUpgrade47;
if(!T||!App||!U||App.__upgrade94Installed)return;
App.__upgrade94Installed=true;
const VERSION='2026.10.30-vnext-featureparity15-upgrade94-viewer-blv-audio-stability';
const BUILD='upgrade94',CACHE_TAG='u94-20261030';
const $=id=>document.getElementById(id);
const S={enabled:false,court:'',lastCommentId:'',lastSpokenAt:0,lastScore:{},fallbackTimer:0,offs:[],voiceStarted:false,lastSeenByCourt:{},lastSpokenByCourt:{}};
const isViewer=()=>location.hash.startsWith('#spectator')||['VIEWER','LIVE_ONLY'].includes(String(T.Auth?.role?.()||'').toUpperCase());
function selectedCourt(){
  if(location.hash.startsWith('#spectator')){
    const c=String(U88?.state?.publicCourt||'');
    if(c)return c;
    try{const p=U88?.preferredLiveCourt?.();if(p)return p}catch{}
  }
  return $('stream-court')?.value||App.currentCourt||Object.keys(App.state?.activeMatches||{})[0]||'court_1';
}
function publicStatusHost(){return $('tk88-public-live-stage')||$('tk88-public-live-card')||$('public-spectator')}
function setStatus(text,state='info'){
  let e=$('tk94-viewer-blv-status');
  if(!e){
    const host=publicStatusHost()||$('video-box')||$('page-live');if(!host)return;
    e=document.createElement('div');e.id='tk94-viewer-blv-status';e.className='tk94-viewer-blv-status';
    e.style.cssText='margin:8px 0 0;padding:7px 10px;border-radius:9px;background:rgba(2,18,32,.88);color:#dff7ff;font-size:12px;line-height:1.35;border:1px solid rgba(70,220,220,.26)';
    const toolbar=$('tk88-public-live-stage')?.querySelector('.tk88-public-toolbar');
    if(toolbar)toolbar.insertAdjacentElement('afterend',e);else host.appendChild(e);
  }
  e.dataset.state=state;e.textContent=text;
}
function visibleButton(){return location.hash.startsWith('#spectator')?$('tk88-public-unmute'):$('tk89-viewer-audio')}
function syncButton(){const b=visibleButton();if(!b)return;b.textContent=S.enabled?'✓ Tiếng + BLV đã bật':'🔊 Bật tiếng + BLV';b.disabled=false}
function viVoice(){
  try{
    const vs=speechSynthesis.getVoices?.()||[];
    return vs.find(v=>/^vi(?:[-_]|$)/i.test(v.lang||''))||vs.find(v=>/vietnam|vietnamese|hoai|nam|minh/i.test(v.name||''))||null;
  }catch{return null}
}
async function piperFallback(text){
  const p=U47?.Piper;if(!p?.installed||typeof p.speak!=='function')return false;
  try{setStatus('🔊 Đang đọc BLV bằng TOPKEY Offline Voice…','working');await p.speak(text,{kind:'VIEWER_U94'});setStatus('✓ Đã đọc BLV bằng TOPKEY Offline Voice.','ok');return true}catch(e){setStatus('❌ Offline Voice lỗi: '+(e?.message||e),'err');return false}
}
async function say(text,{id='',court='',kind='COMMENTARY',force=false}={}){
  text=String(text||'').trim();court=court||selectedCourt();if(!text||!S.enabled||!isViewer())return false;
  if(!force&&id&&S.lastSpokenByCourt[court]===id)return false;
  if(id){S.lastCommentId=id;S.lastSpokenByCourt[court]=id}if(court)S.court=court;
  const piperReady=!!U47?.Piper?.installed;
  if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined')return piperReady?piperFallback(text):(setStatus('❌ Thiết bị Viewer không có bộ phát giọng.','err'),false);
  try{
    speechSynthesis.cancel?.();speechSynthesis.resume?.();
    const utter=new SpeechSynthesisUtterance(text);utter.lang='vi-VN';utter.rate=1.06;utter.pitch=.98;utter.volume=1;
    const voice=viVoice();if(voice)utter.voice=voice;
    S.voiceStarted=false;let settled=false;
    const finish=(ok,msg,state)=>{if(settled)return;settled=true;clearTimeout(timer);if(ok)S.lastSpokenAt=Date.now();setStatus(msg,state)};
    utter.onstart=()=>{S.voiceStarted=true;setStatus(`🔊 BLV ${kind==='SCORE_FALLBACK'?'tỷ số':'Firebase'} · ${text.slice(0,110)}`,'working')};
    utter.onend=()=>finish(true,'✓ Đã phát BLV tỷ số · '+new Date().toLocaleTimeString('vi-VN'),'ok');
    utter.onerror=async e=>{if(settled)return;settled=true;clearTimeout(timer);if(piperReady){await piperFallback(text);S.lastSpokenAt=Date.now()}else setStatus('❌ TTS Viewer lỗi: '+(e?.error||'speech error')+'. Thiết bị chưa có TOPKEY Offline Voice.','err')};
    const timer=setTimeout(async()=>{if(settled||S.voiceStarted)return;if(piperReady){settled=true;await piperFallback(text);S.lastSpokenAt=Date.now()}else setStatus('⚠️ Đã gửi lệnh TTS nhưng thiết bị chưa bắt đầu phát. Kiểm tra âm lượng/giọng hệ thống.','err')},1800);
    speechSynthesis.speak(utter);return true;
  }catch(e){return piperReady?piperFallback(text):(setStatus('❌ Không phát được BLV Viewer: '+(e?.message||e),'err'),false)}
}
function unmuteVideo(){for(const id of ['tk88-public-video','live-video']){const v=$(id);if(v){v.muted=false;v.defaultMuted=false;v.volume=1;v.play?.().catch(()=>{})}}}
async function enable({test=true}={}){
  if(!isViewer())return false;S.enabled=true;/* Viewer BLV is isolated from legacy BTC Local BLV: never flip App.audioUnlocked here. */unmuteVideo();try{speechSynthesis.resume?.()}catch{}
  S.court=selectedCourt();syncButton();setTimeout(syncButton,0);bindCourt(true);
  setStatus(`✓ Audio Viewer ON · đang nghe BLV ${S.court}.`,'ok');
  if(test)await say('Âm thanh bình luận tỷ số đã bật.',{id:'u94-enable-'+Date.now(),court:S.court,kind:'TEST',force:true});
  return true;
}
function teamName(id){return App.state?.teams?.[id]?.name||'đội thi đấu'}
function scoreFallback(court,cur,prev){
  if(!S.enabled||court!==selectedCourt()||!cur?.matchId)return;
  const set=cur.sets?.[cur.setIndex]||{},old=prev?.sets?.[prev?.setIndex]||{},a=Number(set.a||0),b=Number(set.b||0),oa=Number(old.a||0),ob=Number(old.b||0);
  if(a===oa&&b===ob)return;
  const m=App.state?.matches?.[cur.matchId]||{};let who='';if(a>oa&&b===ob)who=teamName(m.teamAId);else if(b>ob&&a===oa)who=teamName(m.teamBId);
  const text=who?`${who} ghi điểm, tỷ số ${a} - ${b}.`:`Tỷ số được cập nhật, ${teamName(m.teamAId)} ${a} - ${b} ${teamName(m.teamBId)}.`;
  clearTimeout(S.fallbackTimer);S.fallbackTimer=setTimeout(()=>{
    // Prefer a real commentary row if it arrived shortly after the score update.
    say(text,{id:`score:${court}:${cur.matchId}:${cur.setIndex}:${a}:${b}`,court,kind:'SCORE_FALLBACK'});
  },700);
}
function onActiveMatches(next){
  next=next||{};const courts=new Set([...Object.keys(S.lastScore||{}),...Object.keys(next)]);
  for(const court of courts){const prev=S.lastScore[court],cur=next[court];if(prev&&cur)scoreFallback(court,cur,prev);S.lastScore[court]=cur?JSON.parse(JSON.stringify(cur)):cur}
}
function commentKey(row,court){
  if(!row)return'';return String(row.id||row.createdAt||`${court}:${String(row.text||'').trim()}`);
}
function onCommentary(row,court,{initial=false}={}){
  if(!row?.text)return;const key=commentKey(row,court);if(!key)return;
  // Firebase value listeners emit the current latest row immediately on bind. Treat it as a baseline,
  // never as a fresh event. This prevents old score commentary replay after enable/reload/rebind.
  if(initial){S.lastSeenByCourt[court]=key;return}
  if(S.lastSeenByCourt[court]===key)return;S.lastSeenByCourt[court]=key;
  if(!S.enabled||court!==selectedCourt())return;
  clearTimeout(S.fallbackTimer);S.fallbackTimer=0;
  say(row.text,{id:key,court,kind:'COMMENTARY'});
}
let boundCourt='';let commentaryOff=null;
function bindCourt(force=false){
  if(!T.Data?.ready||!T.Data?.listen||!isViewer())return false;const c=selectedCourt();
  if(!force&&c===boundCourt)return true;boundCourt=c;S.court=c;try{commentaryOff?.()}catch{}
  let firstSnapshot=true;
  commentaryOff=T.Data.listen(`commentary/${c}/latest`,r=>{const initial=firstSnapshot;firstSnapshot=false;onCommentary(r,c,{initial})});
  syncButton();if(S.enabled)setStatus(`✓ Audio Viewer ON · đang nghe BLV ${c}.`,'ok');return true;
}
function bindGlobal(){
  if(!T.Data?.ready||!T.Data?.listen||S.offs.length)return;
  S.offs.push(T.Data.listen('activeMatches',v=>{App.state.activeMatches=v||{};onActiveMatches(v||{});bindCourt()}));
  S.offs.push(T.Data.listen('matches',v=>{App.state.matches=v||{}}));
  S.offs.push(T.Data.listen('teams',v=>{App.state.teams=v||{}}));
  S.offs.push(T.Data.listen('courts',v=>{App.state.courts=v||{};bindCourt()}));
  bindCourt(true);
}
function installUi(){
  if(!isViewer())return;syncButton();bindGlobal();bindCourt();
  if(S.enabled)setStatus(`✓ Audio Viewer ON · đang nghe BLV ${selectedCourt()}.`,'ok');
}
// Public Viewer button from U88 is the actual visible user gesture. Capture it and enable BLV too.
document.addEventListener('click',e=>{
  const pub=e.target?.closest?.('#tk88-public-unmute'),auth=e.target?.closest?.('#tk89-viewer-audio');
  if(!pub&&!auth)return;if(!isViewer())return;enable({test:!S.enabled}).catch(err=>setStatus('❌ Bật BLV lỗi: '+(err?.message||err),'err'));
},true);
// Court selection in public Live changes dynamically; rebind commentary to the actual court being watched.
document.addEventListener('click',e=>{if(e.target?.closest?.('.tk88-live-choice'))setTimeout(()=>bindCourt(true),80)},true);
// Upgrade103 runtime policy: no continuous 700 ms polling. U102 activeMatches/courts callbacks,
// public court clicks, hashchange and focus are sufficient to keep the selected-court listener current.
window.addEventListener('hashchange',()=>setTimeout(()=>{if(isViewer())installUi()},50));
if('speechSynthesis'in window){const old=speechSynthesis.onvoiceschanged;speechSynthesis.onvoiceschanged=()=>{try{old?.()}catch{};if(S.enabled)syncButton()}}

function enforceVersion(){
  T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;const r=$('tk55-runtime-build');if(r)r.textContent=VERSION;
}
async function checkServerBuild94(){
  enforceVersion();try{const u=new URL('./build.json',location.href);u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));const res=await fetch(u,{cache:'no-store'});const b=await res.json();const s=$('tk55-server-build');if(s)s.textContent=b.version||b.build||'unknown';const st=$('tk55-update-state');if(st)st.textContent=String(b.build||'')===BUILD?'✓ Runtime và server cùng Upgrade94.':'Runtime/server lệch build.';return String(b.build||'')===BUILD}catch{return false}
}
try{window.__TOPKEY_U93_OBSERVER?.disconnect?.()}catch{}
enforceVersion();setTimeout(enforceVersion,0);setTimeout(()=>{enforceVersion();installUi()},600);
const check=$('tk55-check-update');if(check)check.onclick=()=>checkServerBuild94();
window.addEventListener('focus',()=>{enforceVersion();installUi()},{passive:true});
window.TopkeyUpgrade94={installed:true,VERSION,BUILD,CACHE_TAG,state:S,enable,say,selectedCourt,onActiveMatches,onCommentary,bindCourt,bindGlobal,enforceVersion,checkServerBuild94};
})();
