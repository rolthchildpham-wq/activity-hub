(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U46=window.TopkeyUpgrade46,U47=window.TopkeyUpgrade47;
if(!T||!App||!U||!U46||!U47||App.__upgrade48Installed)return;
App.__upgrade48Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade48';
const CACHE_TAG='u48-20261029';
const FAST_PIPER_MODULE='https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@1.0.5/+esm';
const PIPER_VOICE=U47.PIPER_VOICE||'vi_VN-vais1000-medium';
const RT_KEY='topkey_u48_realtime_blv';
const $=id=>document.getElementById(id);
const Engine=U46.Engine,Piper=U47.Piper;
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;

function rtSettings(){let x={enabled:true,shortScore:true,interruptStale:true,systemFastPath:false};try{x={...x,...JSON.parse(localStorage.getItem(RT_KEY)||'{}')}}catch{}return x}
function saveRt(p){const x={...rtSettings(),...p};try{localStorage.setItem(RT_KEY,JSON.stringify(x))}catch{}return x}
function compactName(name){return String(name||'').replace(/^\s*Đội\s*\d+\s*:\s*/iu,'').replace(/^\s*(MEN|MIX|WOMEN)\s*[-:]\s*/iu,'').replace(/\s+/g,' ').trim()||'đội thi đấu'}
function viSystemVoicesAny(){if(!('speechSynthesis'in window))return[];return speechSynthesis.getVoices().filter(v=>/^vi(?:[-_]|$)/i.test(v.lang||''))}
function fastSystemVoice(){const vs=viSystemVoicesAny();return vs.find(v=>/google|vietnam|việt|nam|an|minh/i.test(v.name||''))||vs[0]||null}
function realtimeText(meta){
  if(!rtSettings().shortScore||!meta)return meta?.text||'';
  const a=Number(meta.after?.a??0),b=Number(meta.after?.b??0),name=compactName(meta.name),score=a===b?`${a} đều`:`${a}, ${b}`;
  switch(meta.kind){
    case 'SCORE': return `${name}. ${score}.`;
    case 'BIG_LEAD': return `${name} đang dẫn. ${score}.`;
    case 'LEAD_CHANGE': return `${name} vượt lên. ${score}.`;
    case 'COMEBACK': return `${name} ngược dòng. ${score}.`;
    case 'STREAK': return `${name} đang có chuỗi điểm. ${score}.`;
    case 'DEUCE': return `${a} đều!`;
    case 'GAME_POINT': return `Điểm set cho ${name}. ${score}.`;
    case 'MATCH_POINT': return `Match point cho ${name}! ${score}.`;
    default:return meta.text;
  }
}

// --- Piper realtime transport -------------------------------------------------
// Upgrade47 used @diffusionstudio/vits-web. The Mintplex fork keeps one TtsSession
// alive, so the 63 MB model / ONNX session is not recreated for every score.
Piper.fastModule=null;Piper.fastModulePromise=null;Piper.fastSession=null;Piper.fastReadyPromise=null;Piper.phase='idle';Piper.lastSynthMs=0;Piper.lastStartLatency=0;
Piper.load=async function(){
  if(this.fastModule)return this.fastModule;
  if(!this.fastModulePromise)this.fastModulePromise=import(FAST_PIPER_MODULE).then(m=>{this.fastModule=m;return m}).catch(e=>{this.fastModulePromise=null;throw e});
  return this.fastModulePromise;
};
Piper.prepare=async function(force=false){
  if(!this.installed)return false;
  if(this.fastSession&&!force)return true;
  if(this.fastReadyPromise&&!force)return this.fastReadyPromise;
  this.phase='warmup';renderRealtime();
  this.fastReadyPromise=(async()=>{
    const m=await this.load();
    if(m.TtsSession?.create)this.fastSession=await m.TtsSession.create({voiceId:PIPER_VOICE,logger:()=>{}});
    else if(m.TtsSession)this.fastSession=new m.TtsSession({voiceId:PIPER_VOICE});
    this.phase='ready';renderRealtime();return !!this.fastSession;
  })().catch(e=>{this.phase='error';this.lastError=e?.message||String(e);renderRealtime();return false}).finally(()=>{this.fastReadyPromise=null});
  return this.fastReadyPromise;
};
const oldPiperStop=Piper.stop.bind(Piper);
Piper.stop=function(){oldPiperStop();this.phase=this.fastSession?'ready':'idle';renderRealtime()};
Piper.speak=async function(text,item={}){
  if(!this.installed)throw new Error('Chưa tải TOPKEY Offline Voice.');
  const token=++this.token,a=this.ensureAudio();this.busy=true;this.phase='synth';renderRealtime();
  const started=performance.now();
  try{
    let wav;
    const ready=await this.prepare();
    if(token!==this.token)return false;
    const synthAt=performance.now();
    if(ready&&this.fastSession?.predict)wav=await this.fastSession.predict(text);
    else {const m=await this.load();wav=await m.predict({text,voiceId:PIPER_VOICE});}
    this.lastSynthMs=Math.round(performance.now()-synthAt);
    if(token!==this.token)return false;
    if(this.objectUrl)try{URL.revokeObjectURL(this.objectUrl)}catch{}
    this.objectUrl=URL.createObjectURL(wav);a.src=this.objectUrl;a.playbackRate=Math.max(.82,Math.min(1.35,Number($('blv-rate')?.value)||1.12));a.volume=Math.max(0,Math.min(1,Number($('blv-volume')?.value)||1));
    this.phase='play';
    const eventAt=Number(item.eventAt||item.createdAt||Date.now());this.lastStartLatency=Math.max(0,Date.now()-eventAt);renderRealtime();
    await a.play();
    return await new Promise(resolve=>{const done=()=>{a.onended=null;a.onerror=null;resolve(true)};a.onended=done;a.onerror=done});
  }finally{if(token===this.token){this.busy=false;this.phase=this.fastSession?'ready':'idle';renderRealtime()}this.lastTotalMs=Math.round(performance.now()-started)}
};

// Keep Upgrade46 analysis, but use compact broadcast wording for Android realtime.
const baseCompose=Engine.composeScore.bind(Engine);
Engine.composeScore=function(m,result,side){const meta=baseCompose(m,result,side);if(rtSettings().enabled)meta.text=realtimeText(meta);meta.eventAt=Date.now();return meta};

function canFastSystem(item){return rtSettings().enabled&&rtSettings().systemFastPath&&item?.source==='AUTO'&&['SCORE','BIG_LEAD'].includes(item.kind)&&!!fastSystemVoice()}
function speakSystemFast(item){
  return new Promise(resolve=>{const voice=fastSystemVoice();if(!voice)return resolve(false);const u=new SpeechSynthesisUtterance(item.text);u.lang='vi-VN';u.voice=voice;u.rate=Math.max(.8,Math.min(1.4,Number($('blv-rate')?.value)||1.12));u.pitch=Math.max(.8,Math.min(1.2,Number($('blv-pitch')?.value)||.98));u.volume=Math.max(0,Math.min(1,Number($('blv-volume')?.value)||1));u.onstart=()=>{Piper.lastStartLatency=Math.max(0,Date.now()-Number(item.eventAt||item.createdAt||Date.now()));renderRealtime()};u.onend=()=>resolve(true);u.onerror=()=>resolve(false);try{speechSynthesis.speak(u)}catch{resolve(false)}})
}

// Realtime queue: a new ordinary score supersedes an old ordinary score.
const baseEnqueue=Engine.enqueue.bind(Engine);
Engine.enqueue=function(item){
  if(item&&item.eventAt==null)item.eventAt=Date.now();
  const cfg=rtSettings();
  if(cfg.enabled&&cfg.interruptStale&&this.speaking&&this.current&&['SCORE','BIG_LEAD'].includes(item?.kind)&&['SCORE','BIG_LEAD'].includes(this.current.kind)){
    // Do not start two ONNX runs at once on Android. If an old Piper sentence is
    // still synthesizing, invalidate its result and let the hot session finish that
    // run before draining the newest score. If audio is already playing, stop it now.
    if(Piper.phase==='synth'){Piper.token++;}
    else {try{speechSynthesis?.cancel?.()}catch{}if(Piper.phase==='play')Piper.stop();this.speaking=false;this.current=null;}
  }
  const ok=baseEnqueue(item);
  return ok;
};

Engine.drain=async function(){
  if(this.speaking||!App.audioUnlocked)return;
  if($('auto-commentary')?.checked===false&&this.queue[0]?.source==='AUTO'){this.queue=this.queue.filter(x=>x.source!=='AUTO');this.status('BLV: Auto đang tắt.','info');return}
  const now=Date.now();while(this.queue.length&&this.queue[0].expiresAt<=now)this.queue.shift();const item=this.queue.shift();if(!item){this.status('BLV Realtime: sẵn sàng.','ok');renderRealtime();return}
  item.eventAt=Number(item.eventAt||item.createdAt||now);
  let transport=U47.selectedEngine();
  if(canFastSystem(item))transport='SYSTEM_FAST';
  if(transport==='NONE'){this.queue.unshift(item);this.status('Chưa có giọng Việt. Hãy tải TOPKEY Offline Voice hoặc chọn giọng hệ thống.','err');return}
  this.speaking=true;this.current=item;App.lastSpokenCommentId=item.id;
  this.status(`BLV Realtime · ${transport==='PIPER'?'Piper nóng':transport==='SYSTEM_FAST'?'Android fast voice':'giọng hệ thống'} · ${item.kind}: ${item.text}`,'ok');
  try{
    if(transport==='PIPER')await Piper.speak(item.text,item);
    else if(transport==='SYSTEM_FAST')await speakSystemFast(item);
    else await new Promise(resolve=>{const voice=App.chooseVoice?.()||fastSystemVoice();if(!voice)throw new Error('Không tìm thấy voice vi-VN hệ thống');const u=new SpeechSynthesisUtterance(item.text);u.lang='vi-VN';u.voice=voice;u.rate=Math.max(.8,Math.min(1.4,Number($('blv-rate')?.value)||1.12));u.pitch=Math.max(.8,Math.min(1.2,Number($('blv-pitch')?.value)||.98));u.volume=Math.max(0,Math.min(1,Number($('blv-volume')?.value)||1));u.onstart=()=>{Piper.lastStartLatency=Math.max(0,Date.now()-item.eventAt);renderRealtime()};u.onend=()=>resolve();u.onerror=()=>resolve();try{speechSynthesis.speak(u)}catch{resolve()}});
  }catch(e){this.status('BLV không phát được: '+(e?.message||e),'err')}
  finally{this.speaking=false;this.current=null;setTimeout(()=>this.drain(),35)}
};

// Score locally first. Firebase persistence starts immediately but no longer blocks
// the score render/commentary path. This removes network RTT from BLV latency.
App.score=async function(side,delta){
  const s=this.state.activeMatches[this.currentCourt];if(!s)return U.toast('Chưa load trận','err');
  try{
    const result=T.Scoring.point(s,side,delta,this.state.config.rules),eventAt=Date.now(),eventId=U.id('evt'),evt={id:eventId,seq:(s.version||0)+1,type:delta>0?'POINT_AWARDED':'POINT_CORRECTED',side,delta,before:result.before,after:result.after,matchId:s.matchId,courtId:this.currentCourt,actorUid:T.Auth.user?.uid||'local',clientAt:eventAt};
    this.state.activeMatches[this.currentCourt]=result.state;
    const updates={};updates[T.Data.path('activeMatches/'+this.currentCourt)]=result.state;updates[T.Data.path('events/'+this.currentCourt+'/'+eventId)]=evt;
    const persist=T.Data.queueMulti(updates,{eventId,type:'SCORE'}); // start persistence; do not block voice
    this.renderUmpire();
    const m=this.state.matches[s.matchId];
    if(delta>0){
      const text=this.buildScoreCommentary(m,result,side);
      if(this.__u46PendingScoreMeta)this.__u46PendingScoreMeta.eventAt=eventAt;
      this.comment(text,{eventAt});
    }
    if(result.setFinished)U.toast(result.matchFinished?'Set quyết định đã kết thúc.':'Set đã kết thúc. TOPKEY đang tự đổi bên và chuyển set…','ok');
    await persist;
  }catch(e){U.toast(e.message,'err')}
};

// Local commentary first: enqueue audio synchronously, then optionally sync the
// caption in background. Keep Upgrade46 metadata but carry the realtime timestamp.
App.comment=async function(text,meta={}){
  if(!text)return;
  if(App.__u46PendingScoreMeta&&(!meta.kind||meta.kind==='SCORE')){meta={...App.__u46PendingScoreMeta,...meta};App.__u46PendingScoreMeta=null;}
  if(!meta.kind&&/chính thức bắt đầu|bắt đầu trận/i.test(String(text)))meta={...meta,kind:'START',priority:Engine.priority.START,total:0};
  const court=meta.court||this.currentCourt||'court_1',id=meta.id||U.id('cmt'),eventAt=Number(meta.eventAt)||Date.now();
  const row={id,courtId:court,text,commentator:'TOPKEY Local BLV',createdAt:Date.now(),eventAt,engine:'LOCAL_BROWSER_U48_RT',priority:meta.priority||Engine.priority[meta.kind]||40,kind:meta.kind||'SCORE'};
  Engine.enqueue({...row,source:meta.source||'AUTO',total:meta.total??0,eventAt});
  Engine.lastCaption=row;U.setText?.('live-caption',`BLV: ${text}`);
  if(U46.settings().shareCaption&&T.Data?.ready){try{await T.Data.queueSet('commentary/'+court+'/latest',row,{type:'COMMENTARY_LOCAL_U48_RT'});}catch(e){console.warn('Upgrade48: caption sync failed; realtime audio continues',e)}}
  return row;
};

function renderRealtime(){
  const box=$('tk48-realtime');if(!box)return;const cfg=rtSettings(),badge=$('tk48-ready'),lat=$('tk48-latency'),synth=$('tk48-synth');
  if($('tk48-enable'))$('tk48-enable').checked=cfg.enabled;if($('tk48-short'))$('tk48-short').checked=cfg.shortScore;if($('tk48-fast-system'))$('tk48-fast-system').checked=cfg.systemFastPath;
  const ready=Piper.fastSession?'HOT':Piper.phase==='warmup'?'WARMING':Piper.installed?'COLD':'NO MODEL';
  if(badge){badge.textContent=`PIPER ${ready}`;badge.dataset.state=ready==='HOT'?'ok':ready==='WARMING'?'working':'info'}
  if(lat)lat.textContent=Piper.lastStartLatency?`Điểm → bắt đầu tiếng: ~${Piper.lastStartLatency} ms`:'Chưa có số đo độ trễ';
  if(synth)synth.textContent=Piper.lastSynthMs?`Piper inference gần nhất: ~${Piper.lastSynthMs} ms`:'Piper chưa inference';
}
function ensureUi(){
  const anchor=$('tk47-voice-pack')||$('tk46-controls');if(!anchor)return;
  if(!$('tk48-realtime')){
    const box=document.createElement('section');box.id='tk48-realtime';box.className='tk48-realtime';box.innerHTML=`<div class="tk48-head"><div><b>⚡ BLV REALTIME · Android</b><div class="muted">Bỏ chờ Firebase, giữ Piper nóng và rút gọn câu điểm thường.</div></div><span id="tk48-ready" class="tk48-badge">PIPER COLD</span></div><div class="tk48-options"><label><input id="tk48-enable" type="checkbox"> Bật tối ưu Realtime</label><label><input id="tk48-short" type="checkbox"> Câu SCORE ngắn</label><label><input id="tk48-fast-system" type="checkbox"> Android system voice cho điểm thường (nhanh nhất, tùy chọn)</label></div><div class="tk48-actions"><button id="tk48-warm" class="btn mini primary" type="button">🔥 Làm nóng giọng ngay</button><span id="tk48-latency">Chưa có số đo độ trễ</span><span id="tk48-synth">Piper chưa inference</span></div><div class="tk48-note">Khuyên dùng trên máy trọng tài: Realtime + Câu SCORE ngắn. Match point, deuce, kết thúc set/trận vẫn được ưu tiên bình luận đầy đủ. Nếu Android có voice vi-VN hệ thống, điểm thường có thể dùng fast path để bắt đầu gần như tức thời; Piper Offline vẫn là dự phòng.</div>`;
    anchor.insertAdjacentElement('afterend',box);
  }
  const bind=(id,key)=>{const el=$(id);if(el)el.onchange=e=>{saveRt({[key]:e.target.checked});renderRealtime()}};
  bind('tk48-enable','enabled');bind('tk48-short','shortScore');bind('tk48-fast-system','systemFastPath');
  if($('tk48-warm'))$('tk48-warm').onclick=async()=>{if(!Piper.installed){U.toast('Chưa có gói TOPKEY Offline Voice','err');return}Piper.phase='warmup';renderRealtime();const ok=await Piper.prepare();U.toast(ok?'Piper đã nóng · sẵn sàng realtime':'Không làm nóng được Piper',ok?'ok':'err');renderRealtime()};
  renderRealtime();
}

const baseUnlock=App.unlockAudio.bind(App);
App.unlockAudio=async function(...args){const out=await baseUnlock(...args);if(Piper.installed)Piper.prepare().catch(()=>{});ensureUi();return out};
const baseHealth=App.renderHealth?.bind(App);
App.renderHealth=function(...args){const out=baseHealth?.(...args);U.setText?.('health-version',VERSION);const h=$('health-audio');if(h&&this.audioUnlocked)h.textContent=`UNLOCKED · BLV RT · ${Piper.fastSession?'PIPER HOT':U47.selectedEngine()}`;document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);return out};
async function hardenServiceWorker48(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade48 SW refresh',e)}}
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild='upgrade48';try{App.renderHealth?.()}catch{}}
async function autoWarm(){try{await Piper.refresh();if(Piper.installed){Piper.phase='warmup';renderRealtime();await Piper.prepare();renderRealtime()}}catch{}}
function install(){ensureUi();stamp();setTimeout(()=>{ensureUi();stamp()},0);setTimeout(()=>{ensureUi();stamp()},900);setTimeout(autoWarm,1800);hardenServiceWorker48()}
install();window.addEventListener('focus',()=>{ensureUi();stamp();hardenServiceWorker48();if(Piper.installed&&!Piper.fastSession)Piper.prepare().catch(()=>{})},{passive:true});
window.TopkeyUpgrade48={installed:true,VERSION,CACHE_TAG,FAST_PIPER_MODULE,rtSettings,saveRt,realtimeText,compactName,fastSystemVoice};
})();
