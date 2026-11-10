(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U77=window.TopkeyUpgrade77,U78=window.TopkeyUpgrade78,U85=window.TopkeyUpgrade85,U86=window.TopkeyUpgrade86,U87=window.TopkeyUpgrade87;
if(!T||!App||!U||!U77||!U78||!U85||!U86||!U87||App.__upgrade88Installed)return;
App.__upgrade88Installed=true;
const VERSION='2026.10.30-vnext-featureparity15-upgrade88d-cloudflare-turn-announcement';
const CACHE_TAG='u88d-20261030',BUILD='upgrade88d';
const $=id=>document.getElementById(id);
const state={broadcast:null,broadcastHeartbeatTimer:0,broadcastHealTimer:0,publicRtc:null,publicHls:null,publicCourt:'',publicKey:'',publicRetry:{},viewerConnecting:false,viewerKey:'',lastClaimCourt:'',lastClaimAt:0,publicCollapsed:false,turnConfig:null,turnProvider:'stun-only',announcementOpen:false};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function role(){return String(T.Auth?.role?.()||'').toUpperCase()}
function canBroadcast(){return ['ADMIN','UMPIRE'].includes(role())}
function isViewerRole(){return ['VIEWER','LIVE_ONLY'].includes(role())}
function configuredIceServers(){
  const fallback=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}];
  const cfg=state.turnConfig||App.state?.config?.webrtcIceServers||App.state?.config?.webrtc?.iceServers;
  return Array.isArray(cfg)&&cfg.length?cfg:fallback;
}
async function loadTurnConfig(){
  try{const r=await fetch('/api/turn-credentials?ts='+Date.now(),{cache:'no-store'});if(r.ok){const j=await r.json();if(Array.isArray(j?.iceServers)&&j.iceServers.length){state.turnConfig=j.iceServers;state.turnProvider=j.provider||'turn';return}}}catch{}
  try{const r=await fetch('./turn-config.json?v='+CACHE_TAG,{cache:'no-store'});if(!r.ok)return;const j=await r.json();if(Array.isArray(j?.iceServers)&&j.iceServers.length)state.turnConfig=j.iceServers}catch{}
}
const originalMakePC=App.makePC?.bind(App);
App.makePC=function(){
  const pc=new RTCPeerConnection({iceServers:configuredIceServers(),iceCandidatePoolSize:4});
  pc.onconnectionstatechange=()=>{const f=$('stream-fallback');if(['failed','disconnected'].includes(pc.connectionState))f?.classList.remove('hidden');if(pc.connectionState==='connected')f?.classList.add('hidden')};
  return pc;
};
function liveCourts(){return Object.entries(App.state?.activeMatches||{}).filter(([courtId,s])=>{if(!s?.matchId)return false;const m=App.state?.matches?.[s.matchId],c=App.state?.courts?.[courtId];return String(m?.status||'').toUpperCase()==='LIVE'&&String(c?.status||'').toUpperCase()==='LIVE'&&String(c?.activeMatchId||'')===String(s.matchId)}).map(([courtId,s])=>({courtId,s,match:App.state.matches?.[s.matchId]||{},court:App.state.courts?.[courtId]||{}}))}
function preferredLiveCourt(){
  const selected=$('stream-court')?.value||App.currentCourt||'';
  const streaming=Object.entries(App.state?.courts||{}).filter(([,c])=>{const st=c?.stream||{};return String(st.status||'').toUpperCase()==='LIVE'&&['CAMERA','WEBRTC','HLS','YOUTUBE'].includes(String(st.type||'').toUpperCase())});
  if(streaming.length)return streaming.find(([id])=>id===selected)?.[0]||streaming[0][0];
  const rows=liveCourts();if(!rows.length)return'';return rows.find(x=>x.courtId===selected)?.courtId||rows[0].courtId
}

// ---------- Secure shared-camera WebRTC broadcaster ----------
// CAMERA_SHARED_U88 compatibility marker; U101 keeps the same shared-camera contract while hardening signaling.
function closePeer(pc){try{pc?.close?.()}catch{}}
const HEARTBEAT_MS=4000,HEARTBEAT_STALE_MS=15000,SESSION_STALE_MS=120000;
async function touchBroadcast(courtId,stream){
  if(!courtId||!canBroadcast()||!T.Data?.db||!stream?.getVideoTracks?.().some(t=>t.readyState==='live'))return false;
  try{await T.Data.db.ref(T.Data.path(`webrtc/${courtId}/broadcast`)).update({uid:T.Auth?.user?.uid||'unknown',status:'LIVE',heartbeatAt:Date.now(),source:'CAMERA_SHARED_U101',maxP2PViewers:3});return true}catch(e){console.warn('U101 heartbeat',e);return false}
}
async function pruneStaleSessions(sessionsRef){
  try{const snap=await sessionsRef.once('value'),jobs=[],now=Date.now();snap.forEach?.(child=>{const createdAt=Number(child.val?.()?.request?.createdAt||0);if(createdAt&&now-createdAt>SESSION_STALE_MS)jobs.push(child.ref.remove().catch(()=>{}))});await Promise.all(jobs)}catch(e){console.warn('U101 prune stale sessions',e)}
}
function startBroadcastHeartbeat(courtId,stream){
  clearInterval(state.broadcastHeartbeatTimer);state.broadcastHeartbeatTimer=0;touchBroadcast(courtId,stream).catch(()=>{});
  state.broadcastHeartbeatTimer=setInterval(()=>touchBroadcast(courtId,stream).catch(()=>{}),HEARTBEAT_MS);
}
function stopSharedBroadcast({markOffline=false}={}){
  const b=state.broadcast;clearInterval(state.broadcastHeartbeatTimer);state.broadcastHeartbeatTimer=0;if(!b)return;
  try{if(b.sessionsRef&&b.childAdded)b.sessionsRef.off('child_added',b.childAdded)}catch{}
  Object.values(b.peers||{}).forEach(closePeer);
  state.broadcast=null;
  if(markOffline&&b.courtId&&T.Data?.db){try{T.Data.db.ref(T.Data.path(`webrtc/${b.courtId}/broadcast`)).set({status:'OFFLINE',stoppedAt:Date.now(),heartbeatAt:Date.now(),uid:T.Auth?.user?.uid||''})}catch{}}
}
async function publishSharedCamera(courtId,stream){
  if(!courtId||!stream?.getVideoTracks?.().some(t=>t.readyState==='live')||!canBroadcast()||!T.Data?.db)return false;
  if(state.broadcast?.courtId===courtId&&state.broadcast?.stream===stream){startBroadcastHeartbeat(courtId,stream);return true}
  stopSharedBroadcast();
  const sessionsRef=T.Data.db.ref(T.Data.path(`webrtc/${courtId}/sessions`)),peers={};
  // U101: never wipe waiting Viewer requests when BTC reloads/self-heals. Only prune truly stale sessions.
  await pruneStaleSessions(sessionsRef);
  const childAdded=async snap=>{
    const sid=snap.key,data=snap.val()||{};if(!data.request||peers[sid]||Object.keys(peers).length>=3)return;
    try{
      const pc=App.makePC?.()||new RTCPeerConnection({iceServers:configuredIceServers()});peers[sid]=pc;
      stream.getTracks().forEach(t=>pc.addTrack(t,stream));
      pc.onicecandidate=e=>{if(e.candidate)T.Data.db.ref(T.Data.path(`webrtc/${courtId}/sessions/${sid}/broadcasterCandidates`)).push(e.candidate.toJSON()).catch(()=>{})};
      T.Data.db.ref(T.Data.path(`webrtc/${courtId}/sessions/${sid}/viewerCandidates`)).on('child_added',c=>pc.addIceCandidate(new RTCIceCandidate(c.val())).catch(()=>{}));
      T.Data.db.ref(T.Data.path(`webrtc/${courtId}/sessions/${sid}/answer`)).on('value',async a=>{if(a.exists()&&!pc.currentRemoteDescription)await pc.setRemoteDescription(new RTCSessionDescription(a.val()))});
      const offer=await pc.createOffer();await pc.setLocalDescription(offer);await T.Data.db.ref(T.Data.path(`webrtc/${courtId}/sessions/${sid}/offer`)).set({type:offer.type,sdp:offer.sdp});
    }catch(e){console.warn('U88 WebRTC viewer session',e);closePeer(peers[sid]);delete peers[sid]}
  };
  sessionsRef.on('child_added',childAdded);state.broadcast={courtId,stream,sessionsRef,childAdded,peers};
  await T.Data.db.ref(T.Data.path(`webrtc/${courtId}/broadcast`)).set({uid:T.Auth?.user?.uid||'unknown',startedAt:Date.now(),heartbeatAt:Date.now(),status:'LIVE',maxP2PViewers:3,source:'CAMERA_SHARED_U101'});
  startBroadcastHeartbeat(courtId,stream);
  const c=App.state?.courts?.[courtId];if(c){const next={...c,stream:{...(c.stream||{}),type:'CAMERA',status:'LIVE',viewerType:'WEBRTC',viewerAuth:'REQUIRED',sharedCamera:true},updatedAt:Date.now()};App.state.courts[courtId]=next;T.Data.queueSet?.('courts/'+courtId,next,{type:'CAMERA_SHARED_WEBRTC_U88'}).catch?.(()=>{})}
  renderViewerHint();return true;
}

const baseStartLocal=App.startLocalCamera?.bind(App);
if(baseStartLocal)App.startLocalCamera=async function(...args){
  const out=await baseStartLocal(...args),court=$('stream-court')?.value||this.currentCourt||'',stream=$('live-video')?.srcObject;
  if(canBroadcast()&&court&&stream){publishSharedCamera(court,stream).catch(e=>console.warn('U88 camera share',e))}
  return out;
};
const baseBroadcast=App.startWebRTCBroadcast?.bind(App);
if(baseBroadcast)App.startWebRTCBroadcast=async function(...args){
  const court=$('stream-court')?.value||this.currentCourt||'',stream=$('live-video')?.srcObject;
  if(court&&stream?.getVideoTracks?.().some(t=>t.readyState==='live')){
    const ok=await publishSharedCamera(court,stream);
    if(ok){this.setLiveState?.('LIVE');U.toast('Đang chia sẻ chính Camera cục bộ qua WebRTC · Viewer sẽ tự kết nối.','ok');return true}
  }
  stopSharedBroadcast();return baseBroadcast(...args)
};
const baseStopLive=App.stopLive?.bind(App);
if(baseStopLive)App.stopLive=async function(...args){stopSharedBroadcast({markOffline:true});return baseStopLive(...args)};
async function ensureSharedBroadcast(){
  if(!canBroadcast()||!T.Data?.db)return false;
  const courtId=$('stream-court')?.value||App.currentCourt||'',stream=$('live-video')?.srcObject,court=App.state?.courts?.[courtId],type=String(court?.stream?.type||$('stream-type')?.value||'').toUpperCase(),declaredLive=String(court?.stream?.status||'').toUpperCase()==='LIVE';
  if(!courtId||!stream?.getVideoTracks?.().some(t=>t.readyState==='live')||(!declaredLive&&!['CAMERA','WEBRTC'].includes(type)))return false;
  if(state.broadcast?.courtId===courtId&&state.broadcast?.stream===stream)return touchBroadcast(courtId,stream);
  return publishSharedCamera(courtId,stream);
}
clearInterval(state.broadcastHealTimer);state.broadcastHealTimer=setInterval(()=>{if(!document.hidden)ensureSharedBroadcast().catch(()=>{})},5000);
window.addEventListener('online',()=>setTimeout(()=>ensureSharedBroadcast().catch(()=>{}),250),{passive:true});
window.addEventListener('focus',()=>setTimeout(()=>ensureSharedBroadcast().catch(()=>{}),250),{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>ensureSharedBroadcast().catch(()=>{}),250)},{passive:true});

// ---------- Viewer-first authenticated Live tab ----------
function syncViewerMode(){const page=$('page-live');if(!page)return;page.classList.toggle('tk88-viewer-mode',isViewerRole());try{U86.ensureLayout?.()}catch{}}
function quiesceViewerReplay(){if(!isViewerRole())return;try{U77.stopAnalysisLoops?.(false)}catch{}const st=U77.state;if(st){clearTimeout(st.recTimer);st.recTimer=0;const r=st.recorder;st.recorder=null;st.recording=false;st.detecting=false;if(r&&r.state!=='inactive')try{r.stop()}catch{}}}
function renderViewerHint(){
  syncViewerMode();const viewer=$('tk84-viewer-card');if(!viewer)return;
  let hint=$('tk88-viewer-hint');if(!hint){hint=document.createElement('div');hint.id='tk88-viewer-hint';hint.className='tk88-viewer-hint';const box=$('video-box');box?.insertAdjacentElement('beforebegin',hint)}
  if(!isViewerRole()){hint.classList.add('hidden');return}
  hint.classList.remove('hidden');const courtId=preferredLiveCourt(),c=App.state?.courts?.[courtId],stream=c?.stream||{};
  hint.innerHTML=courtId?`<b>👁 VIEWER · ${esc(c?.name||courtId)}</b><span>${stream.type==='CAMERA'?'Camera BTC đang chia sẻ qua WebRTC bảo mật.':stream.type==='WEBRTC'?'Đang nhận WebRTC từ BTC.':stream.type==='HLS'?'Đang xem HLS.':'Đang xem nguồn Live hiện tại.'}</span>`:'<b>👁 VIEWER</b><span>Chưa có trận LIVE để xem.</span>';
}
async function openAuthenticatedViewer(){
  if(!isViewerRole()||App.currentTab!=='live'||state.viewerConnecting)return false;
  const courtId=preferredLiveCourt();renderViewerHint();if(!courtId){if(state.viewerKey){try{App.stopRTC?.()}catch{}state.viewerKey=''}return false}
  const sel=$('stream-court');if(sel&&sel.value!==courtId)sel.value=courtId;App.currentCourt=courtId;
  const c=App.state?.courts?.[courtId]||{},s=c.stream||{},type=String(s.type||'').toUpperCase(),key=[courtId,type,String(s.url||''),String(s.viewerType||'')].join('|');
  if(state.viewerKey===key){if(type==='HLS'||type==='YOUTUBE')return true;const pc=App.rtcViewerPC;if(pc&&!['failed','closed','disconnected'].includes(String(pc.connectionState||'')))return true}
  state.viewerConnecting=true;state.viewerKey=key;
  try{
    if(type==='HLS'||type==='YOUTUBE'){App.loadStream?.(type,s.url||'');return true}
    // CAMERA is intentionally received as WebRTC on a different device; never open the viewer's own camera.
    if(type==='CAMERA'||type==='WEBRTC'||s.viewerType==='WEBRTC'){await App.startWebRTCViewer?.();const v=$('live-video');if(v)v.muted=true;setTimeout(quiesceViewerReplay,420);setTimeout(quiesceViewerReplay,900);return true}
    return false;
  }finally{setTimeout(()=>{state.viewerConnecting=false},600)}
}

// ---------- Viewer announcement: compact corner chip, open only on demand ----------
function latestAnnouncement(){return Object.values(App.state?.announcements||{}).filter(Boolean).sort((a,b)=>(Number(b.createdAt)||0)-(Number(a.createdAt)||0))[0]||null}
function closeViewerAnnouncement(){state.announcementOpen=false;$('tk88-announcement-modal')?.classList.add('hidden')}
function ensureViewerAnnouncement(){
  if(location.hash!=='#spectator')return;const ann=latestAnnouncement();let chip=$('tk88-announcement-chip'),modal=$('tk88-announcement-modal');
  if(!ann){chip?.remove();modal?.remove();return}
  if(!chip){chip=document.createElement('button');chip.id='tk88-announcement-chip';chip.type='button';chip.className='tk88-announcement-chip';document.body.appendChild(chip);chip.onclick=()=>{state.announcementOpen=true;ensureViewerAnnouncement()}}
  chip.innerHTML=`<span>📣</span><span><b>Thông báo mới</b><small>${esc(ann.title||'Thông báo mới nhất')}</small></span>`;
  if(!modal){modal=document.createElement('div');modal.id='tk88-announcement-modal';modal.className='tk88-announcement-modal hidden';modal.innerHTML=`<div class="tk88-announcement-dialog"><div class="tk88-announcement-head"><h2>📣 Thông báo mới nhất</h2><button type="button" class="btn mini" id="tk88-announcement-close">✕ Đóng</button></div><h3 id="tk88-announcement-title"></h3><div id="tk88-announcement-body" class="tk88-announcement-body"></div></div>`;document.body.appendChild(modal);$('tk88-announcement-close').onclick=closeViewerAnnouncement;modal.addEventListener('click',e=>{if(e.target===modal)closeViewerAnnouncement()})}
  $('tk88-announcement-title').textContent=ann.title||'Thông báo mới nhất';$('tk88-announcement-body').textContent=ann.body||'';modal.classList.toggle('hidden',!state.announcementOpen)
}

// ---------- Public spectator: LIVE first + actual public player when source supports it ----------
function ensurePublicLiveStage(){
  const layout=$('tk12-spectator-layout'),live=$('spectator-live');if(!layout||!live)return null;const card=live.closest('.card');if(!card)return null;
  if(layout.firstElementChild!==card)layout.insertBefore(card,layout.firstElementChild||null);card.classList.add('tk88-public-live-card');
  let stage=$('tk88-public-live-stage');if(!stage){stage=document.createElement('div');stage.id='tk88-public-live-stage';stage.className='tk88-public-live-stage';stage.innerHTML=`<div class="tk88-public-player"><video id="tk88-public-video" playsinline controls autoplay muted></video><iframe id="tk88-public-frame" class="hidden" allow="autoplay; fullscreen" allowfullscreen></iframe><div id="tk88-public-placeholder" class="tk88-public-placeholder">Chưa có nguồn Live để xem.</div></div><div class="tk88-public-toolbar"><span id="tk88-public-status">Đang dò trận LIVE…</span><button id="tk88-public-toggle" type="button" class="btn mini">▾ Thu nhỏ Live</button><button id="tk88-public-unmute" type="button" class="btn mini">🔊 Bật tiếng</button><button id="tk88-public-full" type="button" class="btn mini">⛶ Toàn màn hình</button></div>`;card.insertBefore(stage,live);$('tk88-public-unmute').onclick=()=>{const v=$('tk88-public-video');if(v){v.muted=false;v.play?.().catch(()=>{});$('tk88-public-unmute').disabled=true;$('tk88-public-unmute').textContent='✓ Đã bật tiếng'}};$('tk88-public-full').onclick=()=>stage.requestFullscreen?.().catch(()=>{});$('tk88-public-toggle').onclick=()=>{state.publicCollapsed=!state.publicCollapsed;applyPublicCollapse()}}
  return stage;
}
function applyPublicCollapse(){
  const card=$('spectator-live')?.closest('.card'),stage=$('tk88-public-live-stage'),btn=$('tk88-public-toggle');if(!card||!stage)return;
  stage.classList.toggle('tk88-live-collapsed',state.publicCollapsed);card.classList.toggle('tk88-live-collapsed-card',state.publicCollapsed);if(btn)btn.textContent=state.publicCollapsed?'▸ Hiện Live':'▾ Thu nhỏ Live';
}
function streamingCourts(){return Object.entries(App.state?.courts||{}).filter(([,c])=>String(c?.stream?.status||'').toUpperCase()==='LIVE'&&['CAMERA','WEBRTC','HLS','YOUTUBE'].includes(String(c?.stream?.type||'').toUpperCase())).map(([courtId,court])=>{const a=App.state?.activeMatches?.[courtId]||{},m=App.state?.matches?.[a.matchId]||{};return {courtId,s:a,match:m,court}})}
function stopPublicPlayback(){
  if(state.publicHls){try{state.publicHls.destroy()}catch{}state.publicHls=null}if(state.publicRtc){try{state.publicRtc.pc?.close?.()}catch{}try{state.publicRtc.baseRef?.remove?.()}catch{}state.publicRtc=null}
  const v=$('tk88-public-video'),f=$('tk88-public-frame');if(v){try{v.pause();v.srcObject=null;v.removeAttribute('src');v.load()}catch{}}if(f){f.src='about:blank';f.classList.add('hidden')}state.publicCourt='';state.publicKey='';
}
function publicStatus(text,stateName='info'){const e=$('tk88-public-status');if(e){e.textContent=text;e.dataset.state=stateName}}
async function connectPublicRtc(courtId){
  if(!T.Auth?.user||!T.Auth.can?.('live')){publicStatus('Camera/WebRTC dùng signaling bảo mật · hãy đăng nhập tài khoản VIEWER để xem trực tiếp.','need');return false}
  try{const b=(await T.Data.db.ref(T.Data.path(`webrtc/${courtId}/broadcast`)).once('value')).val()||{},hb=Number(b.heartbeatAt||0),status=String(b.status||'').toUpperCase();if(status&&status!=='LIVE'){publicStatus('Camera BTC hiện không phát WebRTC.','err');return false}if(hb&&Date.now()-hb>=HEARTBEAT_STALE_MS){publicStatus('Camera BTC đã ngắt/reload · hãy mở lại Camera/Live trên máy BTC.','err');return false}}catch{}
  const v=$('tk88-public-video');if(!v)return false;const sid=(T.Auth.user.uid||U.id('viewer'))+'_pub_'+Date.now().toString(36),base=`webrtc/${courtId}/sessions/${sid}`,pc=App.makePC?.()||new RTCPeerConnection({iceServers:configuredIceServers()});
  const baseRef=T.Data.db.ref(T.Data.path(base));state.publicRtc={pc,baseRef,courtId};v.classList.remove('hidden');v.muted=true;
  pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed')publicStatus('WebRTC ICE thất bại · hai mạng có thể cần TURN server.','err');else if(pc.connectionState==='connected'){state.publicRetry[courtId]=0;publicStatus('● WebRTC đã kết nối','ok')}};pc.ontrack=e=>{state.publicRetry[courtId]=0;v.srcObject=e.streams[0];v.play().catch(()=>{});$('tk88-public-placeholder')?.classList.add('hidden');publicStatus('● Đang xem camera LIVE qua WebRTC','ok')};
  pc.onicecandidate=e=>{if(e.candidate)T.Data.db.ref(T.Data.path(`${base}/viewerCandidates`)).push(e.candidate.toJSON()).catch(()=>{})};
  T.Data.db.ref(T.Data.path(`${base}/broadcasterCandidates`)).on('child_added',c=>pc.addIceCandidate(new RTCIceCandidate(c.val())).catch(()=>{}));
  T.Data.db.ref(T.Data.path(`${base}/offer`)).on('value',async o=>{if(!o.exists()||pc.currentRemoteDescription)return;await pc.setRemoteDescription(new RTCSessionDescription(o.val()));const ans=await pc.createAnswer();await pc.setLocalDescription(ans);await T.Data.db.ref(T.Data.path(`${base}/answer`)).set({type:ans.type,sdp:ans.sdp})});
  await T.Data.db.ref(T.Data.path(base+'/request')).set({uid:T.Auth.user.uid,createdAt:Date.now(),surface:'PUBLIC_SPECTATOR_U101'});publicStatus('Đã gửi yêu cầu Viewer · đang chờ BTC tạo WebRTC offer…','working');
  setTimeout(async()=>{
    if(state.publicRtc?.pc!==pc||pc.currentRemoteDescription)return;
    let b={};try{b=(await T.Data.db.ref(T.Data.path(`webrtc/${courtId}/broadcast`)).once('value')).val()||{}}catch{}
    const hb=Number(b.heartbeatAt||0),fresh=String(b.status||'').toUpperCase()==='LIVE'&&(!hb||Date.now()-hb<HEARTBEAT_STALE_MS),tries=Number(state.publicRetry[courtId]||0);
    if(fresh&&tries<1){state.publicRetry[courtId]=tries+1;publicStatus('BTC đang LIVE · đang thử lại signaling WebRTC…','working');stopPublicPlayback();state.publicKey='';setTimeout(()=>showPublicCourt(courtId,{force:true}).catch(()=>{}),250);return}
    publicStatus(fresh?'BTC đang LIVE nhưng signaling chưa phản hồi · bấm Xem LIVE để thử lại.':'Camera BTC đã ngắt/reload · hãy mở lại Camera/Live trên máy BTC.','err');
  },3500);return true
}
async function showPublicCourt(courtId,{force=false}={}){
  ensurePublicLiveStage();if(!courtId)return;const c=App.state?.courts?.[courtId]||{},s=c.stream||{},type=String(s.type||'').toUpperCase(),url=String(s.url||'').trim();
  const key=[courtId,type,url,String(s.viewerType||'')].join('|');if(state.publicKey===key&&!force)return true;stopPublicPlayback();state.publicCourt=courtId;state.publicKey=key;
  const v=$('tk88-public-video'),f=$('tk88-public-frame'),p=$('tk88-public-placeholder');if(v){v.classList.remove('hidden');v.muted=true}if(p){p.classList.remove('hidden');p.textContent='Đang mở nguồn Live…'}
  if(type==='CAMERA'||type==='WEBRTC'||s.viewerType==='WEBRTC'){if(p)p.textContent=T.Auth?.user?'Đang kết nối camera WebRTC…':'Camera đang phát bảo mật. Đăng nhập VIEWER để xem hình trực tiếp.';return connectPublicRtc(courtId)}
  if(type==='YOUTUBE'&&url){if(v)v.classList.add('hidden');if(f){f.classList.remove('hidden');f.src=url}if(p)p.classList.add('hidden');publicStatus(`● ${c.name||courtId} · YouTube/Embed LIVE`,'ok');return true}
  if(type==='HLS'&&url&&v){if(p)p.classList.add('hidden');if(v.canPlayType?.('application/vnd.apple.mpegurl')){v.src=url;v.play().catch(()=>{});publicStatus(`● ${c.name||courtId} · HLS LIVE`,'ok');return true}try{const H=await U85.ensureHls?.();if(H?.isSupported?.()){state.publicHls=new H({lowLatencyMode:true});state.publicHls.loadSource(url);state.publicHls.attachMedia(v);state.publicHls.on(H.Events.MANIFEST_PARSED,()=>v.play().catch(()=>{}));publicStatus(`● ${c.name||courtId} · HLS LIVE`,'ok');return true}}catch{}if(p){p.classList.remove('hidden');p.textContent='Không mở được HLS trên trình duyệt này.'}publicStatus('HLS chưa phát được','err');return false}
  if(p)p.textContent='BTC chưa cấu hình nguồn xem từ xa cho sân này.';publicStatus('Nguồn Live chưa sẵn sàng cho Viewer','need');return false
}
function renderPublicLiveFirst(){
  const stage=ensurePublicLiveStage(),live=$('spectator-live');if(!stage||!live)return;const card=live.closest('.card'),rows=streamingCourts();live.innerHTML='';
  if(!rows.length){stopPublicPlayback();if(card)card.classList.add('hidden');state.publicCollapsed=false;return}
  if(card)card.classList.remove('hidden');applyPublicCollapse();
  rows.forEach(({courtId,s,match,court})=>{const set=s?.sets?.[s?.setIndex]||{a:0,b:0},hasMatch=!!s?.matchId,d=document.createElement('button');d.type='button';d.className='tk88-live-choice'+(state.publicCourt===courtId?' active':'');d.innerHTML=`<span><b>🔴 ${esc(court.name||courtId)}</b><small>${hasMatch?`${esc(App.teamName(match.teamAId))} ${Number(set.a)||0} - ${Number(set.b)||0} ${esc(App.teamName(match.teamBId))} · Set ${Number(s.setIndex||0)+1}`:'Camera/nguồn Live đang phát'}</small></span><strong>▶ Xem LIVE</strong>`;d.onclick=()=>{state.publicRetry[courtId]=0;state.publicCollapsed=false;applyPublicCollapse();showPublicCourt(courtId,{force:true})};live.appendChild(d)});
  const chosen=rows.some(x=>x.courtId===state.publicCourt)?state.publicCourt:rows[0].courtId;if(chosen!==state.publicCourt)showPublicCourt(chosen).catch(()=>{})
}


const baseRenderSpectator=App.renderSpectator?.bind(App);
if(baseRenderSpectator)App.renderSpectator=function(...args){const out=baseRenderSpectator(...args);renderPublicLiveFirst();return out};
const baseStartSpectator=App.startSpectator?.bind(App);
if(baseStartSpectator)App.startSpectator=function(...args){const out=baseStartSpectator(...args);setTimeout(renderPublicLiveFirst,0);return out};

// ---------- UMPIRE: make scoring ownership and BLV ownership consistent ----------
async function claimUmpireIfNeeded(courtId,{silent=false}={}){
  if(role()!=='UMPIRE'||!courtId||!T.Auth?.user?.uid)return true;const c=App.state?.courts?.[courtId];if(!c)return false;const uid=String(T.Auth.user.uid),assigned=String(c.umpireUid||'');
  if(assigned&&assigned!==uid){if(!silent)U.toast('Sân đang gán cho trọng tài khác. Hãy nhờ ADMIN đổi trọng tài trước khi chấm điểm/BLV.','err');return false}
  if(assigned===uid)return true;const now=Date.now();if(state.lastClaimCourt===courtId&&now-state.lastClaimAt<1200)return true;state.lastClaimCourt=courtId;state.lastClaimAt=now;
  const after={...c,umpireUid:uid,umpireName:T.Auth.profile?.displayName||T.Auth.user?.email||'UMPIRE',updatedAt:now};App.state.courts[courtId]=after;
  await T.Data.queueSet('courts/'+courtId,after,{type:'UMPIRE_SELF_CLAIM_U88'});try{await T.Data.audit?.('ASSIGN_UMPIRE_SELF','court',courtId,c,after)}catch{}
  setTimeout(()=>{U78.evaluate?.();U87.syncAudioButtons?.()},0);if(!silent)U.toast(`Đã gán ${after.umpireName} vào ${after.name||courtId} · Auto BLV sẵn sàng khi trận LIVE.`,'ok');return true
}
const baseStartUmpire=App.startUmpire?.bind(App);
if(baseStartUmpire)App.startUmpire=async function(...args){const courtId=this.currentCourt||$('umpire-court')?.value||'';if(!(await claimUmpireIfNeeded(courtId)))return null;const out=await baseStartUmpire(...args);setTimeout(()=>{U78.evaluate?.();U87.syncAudioButtons?.()},0);setTimeout(()=>{U78.evaluate?.();U87.syncAudioButtons?.()},180);return out};
const baseScore=App.score?.bind(App);
if(baseScore)App.score=async function(...args){const courtId=this.currentCourt||$('umpire-court')?.value||'';if(role()==='UMPIRE'&&!(await claimUmpireIfNeeded(courtId,{silent:true})))return U.toast('Không phát/chấm điểm: sân đang gán trọng tài khác.','err');U78.evaluate?.();const out=await baseScore(...args);setTimeout(()=>U87.syncAudioButtons?.(),0);return out};

// Viewer account opens the actual player first; not the schedule/control form.
const baseApplyRole=App.applyRole?.bind(App);
if(baseApplyRole)App.applyRole=function(...args){const out=baseApplyRole(...args);if(isViewerRole()&&T.Auth.can?.('live')){this.currentTab='live';this.showTab?.('live')}return out};
const baseShowTab=App.showTab?.bind(App);
if(baseShowTab)App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);if(tab==='live'){setTimeout(()=>{renderViewerHint();if(isViewerRole()){openAuthenticatedViewer().catch(()=>{});setTimeout(quiesceViewerReplay,520)}},80)}else if(isViewerRole()){try{App.stopRTC?.()}catch{}state.viewerKey=''}if(tab==='umpire'&&role()==='UMPIRE'){setTimeout(()=>{U78.evaluate?.();U87.syncAudioButtons?.()},100)}return out};
const baseRenderBranch=App.renderBranch?.bind(App);
if(baseRenderBranch)App.renderBranch=function(branch,...args){const out=baseRenderBranch(branch,...args);if(['courts','activeMatches','matches','announcements'].includes(branch)){setTimeout(()=>{renderViewerHint();if(location.hash==='#spectator'){renderPublicLiveFirst();ensureViewerAnnouncement();}if(isViewerRole()&&App.currentTab==='live')openAuthenticatedViewer().catch(()=>{})},40)}return out};

function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=$('health-version');if(h)h.textContent=VERSION;syncViewerMode();renderViewerHint();if(location.hash==='#spectator')renderPublicLiveFirst()}
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade88 SW refresh',e)}}
function install(){loadTurnConfig().finally(()=>{stamp();setTimeout(stamp,0);setTimeout(stamp,700);refreshSW()})}
install();
window.addEventListener('hashchange',()=>{if(location.hash==='#spectator'){setTimeout(renderPublicLiveFirst,0);setTimeout(ensureViewerAnnouncement,0)}else{stopPublicPlayback();closeViewerAnnouncement();$('tk88-announcement-chip')?.remove();$('tk88-announcement-modal')?.remove()}},{passive:true});
window.addEventListener('focus',()=>{if(isViewerRole()){setTimeout(quiesceViewerReplay,500);if(App.currentTab==='live')setTimeout(()=>openAuthenticatedViewer().catch(()=>{}),650)}},{passive:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&isViewerRole())setTimeout(quiesceViewerReplay,500)},{passive:true});window.addEventListener('beforeunload',()=>{stopSharedBroadcast();stopPublicPlayback()});
window.TopkeyUpgrade88={installed:true,VERSION,CACHE_TAG,BUILD,state,liveCourts,preferredLiveCourt,publishSharedCamera,stopSharedBroadcast,ensureSharedBroadcast,touchBroadcast,connectPublicRtc,ensurePublicLiveStage,renderPublicLiveFirst,showPublicCourt,ensureViewerAnnouncement,openAuthenticatedViewer,claimUmpireIfNeeded,syncViewerMode,quiesceViewerReplay,contracts:['VIEWER_LIVE_PLAYER_001','UMPIRE_AUDIO_OWNERSHIP_001','WEBRTC_SIGNALING_RESILIENCE_001']};
})();
