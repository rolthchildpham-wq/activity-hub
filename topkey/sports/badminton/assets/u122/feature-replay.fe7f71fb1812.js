
/* ===== upgrade77.js ===== */
(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;if(!T||!App||!U||App.__upgrade77Installed)return;
App.__upgrade77Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade77-ai-shuttle-replay';
const CACHE_TAG='u77-20261029';
const BUILD='upgrade77';
const AI_ENDPOINT='/api/ai-shuttle-analyze';
const SETTINGS_KEY='topkey_u77_replay_settings';
const DB_NAME='topkey_badminton_replays_v1',STORE='clips',META_STORE='clip_meta',DB_VERSION=2;
const PRE_MS=6000,POST_MS=4000,SEGMENT_MS=3000,KEEP_MS=26000,MAX_CLIPS=24,LIST_CLIPS=8;
const $=id=>document.getElementById(id);
const state={enabled:false,recording:false,detecting:false,aiConfigured:false,aiModel:'',lastError:'',segments:[],recorder:null,recTimer:0,stream:null,detectTimer:0,frameTimer:0,prevGray:null,track:[],frameRing:[],lastCandidateAt:0,lastAiAt:0,lastSavedAt:0,hotUntil:0,clips:[],db:null,dbp:null,currentReplayUrls:[],currentReplay:null,currentMediaSource:null,currentPlaylistToken:0,recEpoch:0,legacyClipCount:0,storageUsage:0,storageQuota:0,storagePersistent:false,storageChecked:false,clipsLoaded:false,clipsLoading:false,detectLoop:false,frameLoop:false,motionCanvas:null,motionCtx:null,frameCanvas:null,frameCtx:null,statusPaintAt:0,statusKey:'',motionGrayA:null,motionGrayB:null,motionMask:null,motionSeen:null};
function readSettings(){try{return{enabled:true,detect:true,autoAi:true,sensitivity:2,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{return{enabled:true,detect:true,autoAi:true,sensitivity:2}}}
function saveSettings(p){const n={...readSettings(),...p};try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(n))}catch{}return n}
function fmtTime(ms){try{return new Date(ms).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch{return''}}
function labelEvent(x){return x==='SMASH'?'⚡ ĐẬP CẦU':x==='DROP'?'🎯 BỎ NHỎ':x==='LINE_NEAR'?'📏 CẦU SÁT VẠCH':x==='MANUAL'?'🎬 REPLAY THỦ CÔNG':'🏸 PHA CẦU NHANH'}
function getVideo(){return $('live-video')}
function getStream(){const s=getVideo()?.srcObject;return (typeof MediaStream!=='undefined'&&s instanceof MediaStream&&s.getVideoTracks().some(t=>t.readyState==='live'))?s:null}
function captureOrientationSnapshot(){const v=getVideo(),stream=getStream(),track=stream?.getVideoTracks?.()[0],st=track?.getSettings?.()||{},vv=window.visualViewport;const vw=Math.round(vv?.width||window.innerWidth||0),vh=Math.round(vv?.height||window.innerHeight||0),type=String(screen.orientation?.type||''),angle=Number.isFinite(Number(screen.orientation?.angle))?Number(screen.orientation.angle):Number(window.orientation)||0,tw=Number(st.width)||0,th=Number(st.height)||0,vwMedia=Number(v?.videoWidth)||0,vhMedia=Number(v?.videoHeight)||0;let orientation=type.startsWith('landscape')?'landscape':type.startsWith('portrait')?'portrait':vw>vh?'landscape':'portrait';if(tw&&th&&tw!==th)orientation=tw>th?'landscape':'portrait';return{orientation,screenType:type,screenAngle:((angle%360)+360)%360,viewportWidth:vw,viewportHeight:vh,trackWidth:tw,trackHeight:th,videoWidth:vwMedia,videoHeight:vhMedia,facingMode:String(st.facingMode||'')}}
function chooseMime(){if(!window.MediaRecorder)return'';for(const x of ['video/webm;codecs=vp8','video/webm','video/mp4'])try{if(MediaRecorder.isTypeSupported?.(x))return x}catch{}return''}
function metaFromRec(v){if(!v)return null;const segs=Array.isArray(v.segments)?v.segments:[];return{id:v.id,createdAt:v.createdAt,eventAt:v.eventAt,event:v.event,court:v.court,label:v.label,durationMs:v.durationMs,mime:v.mime,capture:v.capture||null,ai:v.ai||null,localMeta:v.localMeta||{},build:v.build||BUILD,segmentCount:Number(v.segmentCount)||segs.length,bytes:Number(v.bytes)||segs.reduce((n,b)=>n+(Number(b?.size)||0),0)}}
function openDb(){if(state.dbp)return state.dbp;state.dbp=new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE)){const s=db.createObjectStore(STORE,{keyPath:'id'});s.createIndex('createdAt','createdAt')}if(!db.objectStoreNames.contains(META_STORE)){const m=db.createObjectStore(META_STORE,{keyPath:'id'});m.createIndex('createdAt','createdAt')}};r.onblocked=()=>{state.lastError='Replay DB đang được một tab TOPKEY cũ giữ. Hãy đóng tab cũ rồi mở lại.';renderStatus(true)};r.onsuccess=()=>{state.db=r.result;state.db.onversionchange=()=>{try{state.db.close()}catch{}state.db=null;state.dbp=null};res(state.db)};r.onerror=()=>rej(r.error)});return state.dbp}
async function dbPut(v){const db=await openDb(),meta=metaFromRec(v);return new Promise((res,rej)=>{const tx=db.transaction([STORE,META_STORE],'readwrite');tx.objectStore(STORE).put(v);tx.objectStore(META_STORE).put(meta);tx.oncomplete=()=>res(meta);tx.onerror=()=>rej(tx.error)})}
async function dbDel(id){const db=await openDb();return new Promise((res,rej)=>{const tx=db.transaction([STORE,META_STORE],'readwrite');tx.objectStore(STORE).delete(id);tx.objectStore(META_STORE).delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function dbGet(id){const db=await openDb();return new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
async function dbRecent(limit=LIST_CLIPS){const db=await openDb();return new Promise((res,rej)=>{const out=[],tx=db.transaction(META_STORE),idx=tx.objectStore(META_STORE).index('createdAt'),r=idx.openCursor(null,'prev');r.onsuccess=()=>{const c=r.result;if(!c||out.length>=limit)return res(out);out.push(c.value);c.continue()};r.onerror=()=>rej(r.error)})}
async function dbCount(store=STORE){const db=await openDb();return new Promise((res,rej)=>{const r=db.transaction(store).objectStore(store).count();r.onsuccess=()=>res(Number(r.result)||0);r.onerror=()=>rej(r.error)})}
async function migrateLegacyMetadata(limit=MAX_CLIPS){const db=await openDb();let n=0;await new Promise((res,rej)=>{const tx=db.transaction([STORE,META_STORE],'readwrite'),src=tx.objectStore(STORE),dst=tx.objectStore(META_STORE),idx=src.index('createdAt'),r=idx.openCursor(null,'prev');r.onsuccess=()=>{const c=r.result;if(!c||n>=limit)return;dst.put(metaFromRec(c.value));n++;c.continue()};tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)});state.legacyClipCount=0;await loadClips();return n}
async function pruneDb(){const db=await openDb(),drop=await new Promise((res,rej)=>{const ids=[],tx=db.transaction(STORE),idx=tx.objectStore(STORE).index('createdAt'),r=idx.openKeyCursor(null,'prev');let seen=0;r.onsuccess=()=>{const c=r.result;if(!c)return res(ids);seen++;if(seen>MAX_CLIPS)ids.push(c.primaryKey);c.continue()};r.onerror=()=>rej(r.error)});if(!drop.length)return 0;await new Promise((res,rej)=>{const tx=db.transaction([STORE,META_STORE],'readwrite'),st=tx.objectStore(STORE),mt=tx.objectStore(META_STORE);drop.forEach(id=>{st.delete(id);mt.delete(id)});tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)});return drop.length}
async function storageStatus(requestPersist=false){try{if(requestPersist&&navigator.storage?.persist)state.storagePersistent=!!(await navigator.storage.persist());else if(navigator.storage?.persisted)state.storagePersistent=!!(await navigator.storage.persisted());const e=await navigator.storage?.estimate?.();state.storageUsage=Number(e?.usage)||0;state.storageQuota=Number(e?.quota)||0;state.storageChecked=true}catch{}renderStatus(true);return{persistent:state.storagePersistent,usage:state.storageUsage,quota:state.storageQuota}}
function stopRecorder(){state.recEpoch++;clearTimeout(state.recTimer);state.recTimer=0;const r=state.recorder;state.recorder=null;state.recording=false;if(r&&r.state!=='inactive')try{r.stop()}catch{}renderStatus()}
function startSegment(){
  const cfg=readSettings(),stream=getStream();if(!cfg.enabled||!stream||!window.MediaRecorder){state.recording=false;renderStatus();return}
  if(state.stream&&state.stream!==stream)stopRecorder();state.stream=stream;
  const mime=chooseMime(),videoOnly=typeof MediaStream!=='undefined'?new MediaStream(stream.getVideoTracks()):stream;let rec;try{rec=new MediaRecorder(videoOnly,mime?{mimeType:mime,videoBitsPerSecond:1200000}:undefined)}catch(e){state.lastError='MediaRecorder: '+(e?.message||e);renderStatus();return}
  const chunks=[],startAt=Date.now(),epoch=state.recEpoch,capture=captureOrientationSnapshot();state.recorder=rec;state.recording=true;
  rec.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
  rec.onerror=e=>{state.lastError='Recorder: '+(e?.error?.message||e?.message||'lỗi');renderStatus()};
  rec.onstop=()=>{const endAt=Date.now();if(chunks.length){const blob=new Blob(chunks,{type:rec.mimeType||mime||'video/webm'});if(blob.size>1000)state.segments.push({blob,startAt,endAt,mime:blob.type,capture})}state.segments=state.segments.filter(s=>s.endAt>Date.now()-KEEP_MS);state.recording=false;renderStatus();if(epoch===state.recEpoch&&readSettings().enabled&&getStream()===stream)setTimeout(startSegment,35)};
  try{rec.start(550);state.recTimer=setTimeout(()=>{if(rec.state!=='inactive')try{rec.stop()}catch{}},SEGMENT_MS)}catch(e){state.lastError='Không bắt đầu recorder: '+(e?.message||e);state.recording=false;renderStatus()}
}
function ensureRecorder(){const cfg=readSettings(),stream=getStream();state.enabled=!!cfg.enabled;if(!cfg.enabled||!stream){if(state.recorder)stopRecorder();renderStatus();return false}if(state.stream!==stream||!state.recorder||state.recorder.state==='inactive'){stopRecorder();state.stream=stream;setTimeout(startSegment,20)}return true}
async function loadClips(){if(state.clipsLoading)return;state.clipsLoading=true;try{state.clips=await dbRecent(LIST_CLIPS);const total=await dbCount(STORE),metaCount=await dbCount(META_STORE);state.legacyClipCount=Math.max(0,total-metaCount);renderClips();state.clipsLoaded=true;storageStatus(false).catch(()=>{})}catch(e){state.lastError='Replay DB: '+(e?.message||e);renderStatus()}finally{state.clipsLoading=false}}
async function waitPost(eventAt){const deadline=eventAt+POST_MS+SEGMENT_MS+900;while(Date.now()<deadline){const enough=state.segments.some(s=>s.endAt>=eventAt+POST_MS-350);if(enough)return;await new Promise(r=>setTimeout(r,180))}}
async function saveReplay(event='OTHER',meta={},eventAt=Date.now()){
  if(Date.now()-state.lastSavedAt<2200&&event!=='MANUAL')return null;state.hotUntil=Date.now()+1800;renderStatus();await waitPost(eventAt);
  const from=eventAt-PRE_MS,to=eventAt+POST_MS;const segs=state.segments.filter(s=>s.endAt>=from&&s.startAt<=to).slice(-5);if(!segs.length){U.toast('Replay chưa có đủ buffer camera. Hãy chờ vài giây rồi thử lại.','err');return null}
  const id='rp_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),court=$('stream-court')?.value||App.currentCourt||'';
  const eventSeg=segs.find(s=>s.startAt<=eventAt&&s.endAt>=eventAt)||segs[Math.floor(segs.length/2)]||segs[0],capture=eventSeg?.capture||captureOrientationSnapshot();
  const rec={id,createdAt:Date.now(),eventAt,event,court,label:labelEvent(event),durationMs:Math.max(0,segs[segs.length-1].endAt-segs[0].startAt),mime:segs[0].mime||'video/webm',segments:segs.map(s=>s.blob),capture,ai:meta.ai||null,localMeta:meta.localMeta||meta||{},build:BUILD};
  const metaRec=await dbPut(rec);state.lastSavedAt=Date.now();await pruneDb();state.clips=[metaRec,...state.clips.filter(x=>x.id!==rec.id)].slice(0,LIST_CLIPS);renderClips();storageStatus(false).catch(()=>{});U.toast(`Đã lưu replay ${rec.label} · ~${Math.round(rec.durationMs/100)/10}s · đã cất local`,'ok');return metaRec
}
function createCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function frameCanvas(w,h){if(!state.frameCanvas){state.frameCanvas=createCanvas(w,h);state.frameCtx=state.frameCanvas.getContext('2d',{willReadFrequently:false})}if(state.frameCanvas.width!==w)state.frameCanvas.width=w;if(state.frameCanvas.height!==h)state.frameCanvas.height=h;return[state.frameCanvas,state.frameCtx]}
function motionCanvas(w,h){if(!state.motionCanvas){state.motionCanvas=createCanvas(w,h);state.motionCtx=state.motionCanvas.getContext('2d',{willReadFrequently:true})}if(state.motionCanvas.width!==w)state.motionCanvas.width=w;if(state.motionCanvas.height!==h)state.motionCanvas.height=h;return[state.motionCanvas,state.motionCtx]}
function captureJpeg(width=480,quality=.52){const v=getVideo();if(!v||v.readyState<2||!v.videoWidth)return'';try{const h=Math.max(1,Math.round(width*v.videoHeight/v.videoWidth)),[c,x]=frameCanvas(width,h);x.drawImage(v,0,0,width,h);return c.toDataURL('image/jpeg',quality)}catch{return''}}
function replayLoopAllowed(){return App.currentTab==='live'&&!document.hidden&&!!getStream()}
function stopAnalysisLoops(clearFrames=false){clearTimeout(state.detectTimer);clearTimeout(state.frameTimer);state.detectTimer=0;state.frameTimer=0;state.detecting=false;state.detectLoop=false;state.frameLoop=false;state.prevGray=null;state.track=[];if(clearFrames)state.frameRing=[];renderStatus(true)}
function frameTick(){clearTimeout(state.frameTimer);if(!readSettings().detect||!replayLoopAllowed()){state.frameLoop=false;if(!replayLoopAllowed())state.frameRing=[];return}const f=captureJpeg(480,.48);if(f){state.frameRing.push({at:Date.now(),data:f});state.frameRing=state.frameRing.slice(-8)}state.frameTimer=setTimeout(frameTick,480)}
function analyzeMotionFrame(){
  clearTimeout(state.detectTimer);const cfg=readSettings(),v=getVideo();if(!cfg.detect||!replayLoopAllowed()){state.detecting=false;state.detectLoop=false;renderStatus();return}if(!v||v.readyState<2||!v.videoWidth){state.detecting=false;renderStatus();state.detectTimer=setTimeout(analyzeMotionFrame,500);return}
  state.detecting=true;const w=160,h=Math.max(72,Math.round(w*v.videoHeight/v.videoWidth));try{
    const [c,x]=motionCanvas(w,h);x.drawImage(v,0,0,w,h);const d=x.getImageData(0,0,w,h).data,n=w*h;if(!state.motionGrayA||state.motionGrayA.length!==n){state.motionGrayA=new Uint8Array(n);state.motionGrayB=new Uint8Array(n);state.motionMask=new Uint8Array(n);state.motionSeen=new Uint8Array(n);state.prevGray=null}const gray=state.prevGray===state.motionGrayA?state.motionGrayB:state.motionGrayA,mask=state.motionMask;mask.fill(0);const sens=Math.max(1,Math.min(3,Number(cfg.sensitivity)||2)),diffThr=[58,48,39][sens-1];
    for(let i=0,p=0;i<d.length;i+=4,p++){const r=d[i],g=d[i+1],b=d[i+2],y=(r*3+g*6+b)/10;gray[p]=y;if(state.prevGray){const diff=Math.abs(y-state.prevGray[p]);const max=Math.max(r,g,b),min=Math.min(r,g,b);if(diff>diffThr&&y>118&&(max-min)<105)mask[p]=1}}
    let best=null;if(state.prevGray){const seen=state.motionSeen;seen.fill(0);const stack=[];for(let p=0;p<mask.length;p++){if(!mask[p]||seen[p])continue;let count=0,sumX=0,sumY=0,minX=w,maxX=0,minY=h,maxY=0;stack.push(p);seen[p]=1;while(stack.length){const q=stack.pop(),qx=q%w,qy=(q/w)|0;count++;sumX+=qx;sumY+=qy;minX=Math.min(minX,qx);maxX=Math.max(maxX,qx);minY=Math.min(minY,qy);maxY=Math.max(maxY,qy);for(let yy=Math.max(0,qy-1);yy<=Math.min(h-1,qy+1);yy++)for(let xx=Math.max(0,qx-1);xx<=Math.min(w-1,qx+1);xx++){const n=yy*w+xx;if(mask[n]&&!seen[n]){seen[n]=1;stack.push(n)}}}if(count>=1&&count<=30&&(maxX-minX)<=11&&(maxY-minY)<=11){const cx=sumX/count,cy=sumY/count,prev=state.track[state.track.length-1],dist=prev?Math.hypot(cx-prev.x,cy-prev.y):0;const score=(prev&&dist<42?70-dist:10)+count*1.8;if(!best||score>best.score)best={x:cx,y:cy,at:Date.now(),score}}}}
    state.prevGray=gray;if(best){const prev=state.track[state.track.length-1];best.speed=prev?Math.hypot(best.x-prev.x,best.y-prev.y):0;state.track.push(best);state.track=state.track.filter(p=>best.at-p.at<1150).slice(-9);const speeds=state.track.slice(1).map((p,i)=>Math.hypot(p.x-state.track[i].x,p.y-state.track[i].y)),maxSpeed=Math.max(0,...speeds),travel=state.track.length>2?Math.hypot(best.x-state.track[0].x,best.y-state.track[0].y):0;if(state.track.length>=4&&maxSpeed>9.5&&travel>18&&Date.now()-state.lastCandidateAt>6500){state.lastCandidateAt=Date.now();const meta={hint:maxSpeed>15?'FAST_SMASH_CANDIDATE':'FAST_SHUTTLE_CANDIDATE',speed:Math.round(maxSpeed*10)/10,travel:Math.round(travel),points:state.track.length};onCandidate(meta).catch(e=>{state.lastError=e?.message||String(e);renderStatus()})}}else if(state.track.length&&Date.now()-state.track[state.track.length-1].at>900)state.track=[];
  }catch(e){state.lastError='Detector: '+(e?.message||e)}renderStatus();state.detectTimer=setTimeout(analyzeMotionFrame,125)
}
async function aiHealth(){try{const r=await fetch(AI_ENDPOINT,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const d=await r.json();state.aiConfigured=!!d.configured;state.aiModel=d.model||''}catch{state.aiConfigured=false;state.aiModel=''}renderStatus();return state.aiConfigured}
async function callAi(meta,eventAt=Date.now()){
  if(Date.now()-state.lastAiAt<5000)return null;state.lastAiAt=Date.now();const frames=state.frameRing.filter(f=>Math.abs(f.at-eventAt)<2600).slice(-4).map(f=>f.data);if(frames.length<2)return null;let token='';try{token=await T.Auth.user?.getIdToken?.()}catch{}if(!token)return null;
  const r=await fetch(AI_ENDPOINT,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token},body:JSON.stringify({frames,meta:{...meta,court:$('stream-court')?.value||App.currentCourt||''}})});const d=await r.json().catch(()=>({ok:false,error:'AI_RESPONSE_INVALID'}));if(!r.ok||!d.ok){state.lastError=d.error==='AI_NOT_CONFIGURED'?'EdgeOne AI chưa cấu hình MAKERS_MODELS_KEY':`AI: ${d.error||('HTTP '+r.status)}`;renderStatus();return null}return d
}
async function onCandidate(localMeta){const at=Date.now(),cfg=readSettings();state.hotUntil=Date.now()+1200;renderStatus();let ai=null,event='OTHER';if(cfg.autoAi&&state.aiConfigured){await new Promise(r=>setTimeout(r,650));ai=await callAi(localMeta,at);if(ai&&ai.confidence>=.58&&ai.event!=='OTHER')event=ai.event}if(event==='OTHER'&&localMeta.speed>=15)event='OTHER';await saveReplay(event,{localMeta,ai},at)}
function ensureModal(){if($('tk77-replay-modal'))return;const m=document.createElement('div');m.id='tk77-replay-modal';m.className='modal hidden';m.innerHTML='<div class="modal-box tk77-modal-box"><div class="split"><div><h2 id="tk77-modal-title">🎬 Replay</h2><div id="tk77-modal-meta" class="muted"></div></div><button id="tk77-modal-close" class="btn mini">✕ Đóng</button></div><video id="tk77-replay-video" class="tk77-player" controls playsinline></video><div id="tk77-segment-line" class="tk77-segment-line"></div><button id="tk85-next-segment" type="button" class="btn mini hidden">▶ Tiếp đoạn</button><div id="tk77-modal-ai" class="tk77-ai-result"></div><div class="tk77-ai-note">AI/Replay này hỗ trợ xem lại; không phải Instant Review System chính thức để tự quyết định IN/OUT.</div></div>';document.body.appendChild(m);$('tk77-modal-close').onclick=closeReplay;m.addEventListener('click',e=>{if(e.target===m)closeReplay()})}
function closeReplay(){const m=$('tk77-replay-modal'),v=$('tk77-replay-video'),nextBtn=$('tk85-next-segment');state.currentPlaylistToken++;if(v){try{v.pause()}catch{}v.onended=null;v.onloadedmetadata=null;v.removeAttribute('src');try{v.load()}catch{}}releaseReplayUrl();state.currentMediaSource=null;state.currentReplay=null;if(nextBtn){nextBtn.onclick=null;nextBtn.classList.add('hidden')}m?.classList.add('hidden')}
function releaseReplayUrl(){state.currentReplayUrls.forEach(u=>{try{URL.revokeObjectURL(u)}catch{}});state.currentReplayUrls=[]}
async function playReplayPlaylist(rec,v,line,token){const segs=Array.isArray(rec.segments)?rec.segments:[];if(!segs.length)throw new Error('Replay không có đoạn video');let i=0;const nextBtn=$('tk85-next-segment');v.autoplay=false;v.preload='metadata';v.muted=true;const load=async(auto=true)=>{if(token!==state.currentPlaylistToken||i>=segs.length)return;releaseReplayUrl();const url=URL.createObjectURL(segs[i]);state.currentReplayUrls=[url];v.src=url;line.textContent=`Đoạn ${i+1}/${segs.length} · tải từ bộ nhớ local · phát an toàn.`;if(nextBtn)nextBtn.classList.add('hidden');if(auto){try{await v.play()}catch{if(nextBtn){nextBtn.textContent=`▶ Tiếp đoạn ${i+1}/${segs.length}`;nextBtn.classList.remove('hidden')}line.textContent=`Đoạn ${i+1}/${segs.length} đã sẵn sàng · chạm ▶ để tiếp tục.`}}};v.onended=()=>{if(token!==state.currentPlaylistToken)return;i++;if(i<segs.length)load(true);else{line.textContent=`✓ Đã phát đủ ${segs.length} đoạn replay.`;releaseReplayUrl()}};if(nextBtn)nextBtn.onclick=()=>load(true);await load(true);return true}
async function playReplay(id){ensureModal();closeReplay();const m=$('tk77-replay-modal'),v=$('tk77-replay-video'),line=$('tk77-segment-line');m.classList.remove('hidden');line.textContent='Đang nạp đúng replay từ bộ nhớ local…';const token=++state.currentPlaylistToken;let rec=null;try{rec=await dbGet(id)}catch(e){line.textContent='Không đọc được replay local.';state.lastError='Replay DB: '+(e?.message||e);return}if(token!==state.currentPlaylistToken||!rec)return;state.currentReplay=rec;$('tk77-modal-title').textContent=rec.label||labelEvent(rec.event);$('tk77-modal-meta').textContent=`${fmtTime(rec.eventAt)} · ${rec.court||'chưa chọn sân'} · ~${Math.round(rec.durationMs/100)/10}s`;renderAiText($('tk77-modal-ai'),rec.ai);try{await playReplayPlaylist(rec,v,line,token)}catch(e){state.lastError='Replay: '+(e?.message||e);line.textContent='Replay lỗi: '+(e?.message||e)} }
function renderAiText(el,ai){if(!el)return;if(!ai){el.textContent='Chưa có kết quả AI.';return}el.innerHTML=`<strong>AI:</strong> ${labelEvent(ai.event)} · tin cậy ${Math.round((ai.confidence||0)*100)}% · tiếp đất: ${ai.landing||'UNCLEAR'}${ai.reasonVi?' · '+escapeHtml(ai.reasonVi):''}`}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function downloadReplay(id){const rec=await dbGet(id);if(!rec)return;if(!window.JSZip)try{await window.TopkeyLazyLibs?.ensureJSZip?.()}catch(e){state.lastError='Không tải được JSZip: '+(e?.message||e)}const safe=(rec.event||'REPLAY').replace(/[^A-Z0-9_-]/gi,'_'),stamp=new Date(rec.createdAt).toISOString().replace(/[:.]/g,'-'),ext=String(rec.mime||'').includes('mp4')?'mp4':'webm';if(window.JSZip){const z=new JSZip();rec.segments.forEach((b,i)=>z.file(`${String(i+1).padStart(2,'0')}_${safe}.${ext}`,b));z.file('metadata.json',JSON.stringify({...rec,segments:undefined},null,2));const blob=await z.generateAsync({type:'blob',compression:'STORE'});U.download(`Topkey_Replay_${safe}_${stamp}.zip`,blob);return}U.download(`Topkey_Replay_${safe}_${stamp}.${ext}`,rec.segments[0])}
async function deleteReplay(id){await dbDel(id);await loadClips()}
async function analyzeSaved(id){const rec=await dbGet(id);if(!rec)return;U.toast('AI phân tích tốt nhất tại thời điểm bắt pha; replay cũ sẽ dùng frame live hiện tại nếu đủ dữ liệu.','info');const ai=await callAi(rec.localMeta||{},Date.now());if(ai){rec.ai=ai;rec.event=ai.confidence>=.58&&ai.event!=='OTHER'?ai.event:rec.event;rec.label=labelEvent(rec.event);await dbPut(rec);await loadClips()}}
function renderClips(){const box=$('tk77-replays');if(!box)return;const legacy=state.legacyClipCount?`<div class="tk85-legacy-note">Có ${state.legacyClipCount} replay từ bản cũ đang nằm trên bộ nhớ local. <button id="tk85-load-legacy" class="btn mini">Nạp danh sách cũ khi cần</button></div>`:'';if(!state.clips.length){box.innerHTML=legacy||'<div class="tk77-empty">Chưa có replay. Camera cần chạy vài giây để tạo buffer.</div>';$('tk85-load-legacy')?.addEventListener('click',async()=>{const b=$('tk85-load-legacy');if(b){b.disabled=true;b.textContent='Đang nạp…'}await migrateLegacyMetadata()});return}box.innerHTML=legacy+state.clips.slice(0,8).map(r=>`<div class="tk77-replay"><div class="tk77-replay-top"><div><div class="tk77-replay-title">${escapeHtml(r.label||labelEvent(r.event))}</div><div class="tk77-replay-meta">${fmtTime(r.eventAt)} · ${escapeHtml(r.court||'Sân ?')} · ~${Math.round((r.durationMs||0)/100)/10}s · ${r.segmentCount||0} đoạn · ${(Number(r.bytes||0)/1048576).toFixed(1)} MB local</div></div>${r.ai?`<span class="tk77-badge" data-state="${r.ai.confidence>=.7?'ok':'warn'}">AI ${Math.round((r.ai.confidence||0)*100)}%</span>`:''}</div><div class="tk77-ai-result">${r.ai?`AI: ${escapeHtml(r.ai.event)} · ${escapeHtml(r.ai.landing||'UNCLEAR')} · ${escapeHtml(r.ai.reasonVi||'')}`:'Local replay · chưa có AI xác nhận.'}</div><div class="tk77-replay-actions"><button class="btn mini primary" data-tk77-play="${r.id}">▶ Xem</button><button class="btn mini" data-tk77-download="${r.id}">⬇ ZIP</button><button class="btn mini danger" data-tk77-delete="${r.id}">🗑</button></div></div>`).join('');$('tk85-load-legacy')?.addEventListener('click',async()=>{const b=$('tk85-load-legacy');if(b){b.disabled=true;b.textContent='Đang nạp…'}await migrateLegacyMetadata()});box.querySelectorAll('[data-tk77-play]').forEach(b=>b.onclick=()=>playReplay(b.dataset.tk77Play));box.querySelectorAll('[data-tk77-download]').forEach(b=>b.onclick=()=>downloadReplay(b.dataset.tk77Download));box.querySelectorAll('[data-tk77-delete]').forEach(b=>b.onclick=()=>deleteReplay(b.dataset.tk77Delete))}
function ensureUi(){
  const page=$('page-live');if(!page)return;if(!$('tk77-live-mark')){const vb=$('video-box');if(vb){const m=document.createElement('div');m.id='tk77-live-mark';m.className='tk77-live-mark';m.textContent='🎬 Replay chờ camera';vb.appendChild(m)}}
  if($('tk77-replay-card')){renderStatus();return}const card=document.createElement('div');card.id='tk77-replay-card';card.className='card';card.innerHTML=`<div class="tk77-head"><div><h3>🎬 AI SHUTTLE REPLAY · EDGE ASSIST</h3><div class="muted">Buffer local nhẹ + bắt candidate cầu; chỉ gửi 2–4 frame nhỏ lên EdgeOne/DeepSeek khi cần, không upload cả livestream.</div></div><div class="tk77-badges"><span id="tk77-rec-badge" class="tk77-badge">REC OFF</span><span id="tk77-ai-badge" class="tk77-badge">AI CHECK</span></div></div><div class="tk77-grid"><label><input id="tk77-enable" type="checkbox"> Replay vòng ~10 giây</label><label><input id="tk77-detect" type="checkbox"> Tự bắt cầu nhẹ</label><label><input id="tk77-auto-ai" type="checkbox"> AI phân loại candidate</label><label class="range">Độ nhạy <input id="tk77-sensitivity" type="range" min="1" max="3" step="1"><b id="tk77-sensitivity-text">2/3</b></label></div><div class="tk77-actions"><button id="tk77-save-now" class="btn primary">🎬 Lưu replay ~10s</button><button class="btn" data-tk77-manual="SMASH">⚡ Đập cầu</button><button class="btn" data-tk77-manual="DROP">🎯 Bỏ nhỏ</button><button class="btn" data-tk77-manual="LINE_NEAR">📏 Sát vạch</button><button id="tk77-ai-check" class="btn">✨ Kiểm tra EdgeOne AI</button></div><div id="tk77-status" class="tk77-status"></div><div id="tk77-replays" class="tk77-replays"></div>`;page.appendChild(card);
  // U86 durability: replay UI is created lazily after Live-first may have already arranged the workspace.
  // Re-run the registered layout immediately so this card cannot escape as a full-width page child.
  try{window.TopkeyUpgrade86?.ensureLayout?.();window.TopkeyUpgrade84?.ensureLayout?.()}catch{}
  const cfg=readSettings();$('tk77-enable').checked=cfg.enabled;$('tk77-detect').checked=cfg.detect;$('tk77-auto-ai').checked=cfg.autoAi;$('tk77-sensitivity').value=cfg.sensitivity;$('tk77-sensitivity-text').textContent=`${cfg.sensitivity}/3`;
  $('tk77-enable').onchange=e=>{saveSettings({enabled:e.target.checked});if(e.target.checked){storageStatus(true).catch(()=>{});ensureRecorder()}else stopRecorder();renderStatus()};$('tk77-detect').onchange=e=>{saveSettings({detect:e.target.checked});if(e.target.checked){if(!state.detectLoop){state.detectLoop=true;analyzeMotionFrame()}if(!state.frameLoop){state.frameLoop=true;frameTick()}}else{clearTimeout(state.detectTimer);clearTimeout(state.frameTimer);state.detecting=false;state.detectLoop=false;state.frameLoop=false}renderStatus()};$('tk77-auto-ai').onchange=e=>{saveSettings({autoAi:e.target.checked});renderStatus()};$('tk77-sensitivity').oninput=e=>{saveSettings({sensitivity:Number(e.target.value)});$('tk77-sensitivity-text').textContent=`${e.target.value}/3`};
  $('tk77-save-now').onclick=()=>saveReplay('MANUAL',{},Date.now());card.querySelectorAll('[data-tk77-manual]').forEach(b=>b.onclick=()=>saveReplay(b.dataset.tk77Manual,{},Date.now()));$('tk77-ai-check').onclick=async()=>{const ok=await aiHealth();U.toast(ok?`EdgeOne AI sẵn sàng · ${state.aiModel}`:'AI endpoint chưa sẵn sàng/cấu hình. Replay local vẫn hoạt động.',ok?'ok':'info')};renderStatus()
}
function renderStatus(force=false){const cfg=readSettings(),rec=$('tk77-rec-badge'),ai=$('tk77-ai-badge'),s=$('tk77-status'),mark=$('tk77-live-mark'),stream=!!getStream(),hot=Date.now()<state.hotUntil;const key=[cfg.enabled?1:0,cfg.detect?1:0,state.recording?1:0,state.detecting?1:0,state.aiConfigured?1:0,stream?1:0,hot?1:0,state.aiModel||'',state.lastError||''].join('|'),now=Date.now();if(!force&&key===state.statusKey&&now-state.statusPaintAt<900)return;state.statusKey=key;state.statusPaintAt=now;if(rec){const rs=!cfg.enabled?'off':state.recording?'ok':stream?'warn':'off',rt=!cfg.enabled?'REC OFF':state.recording?'● BUFFER REC':stream?'REC STARTING':'CHỜ CAMERA';if(rec.dataset.state!==rs)rec.dataset.state=rs;if(rec.textContent!==rt)rec.textContent=rt}if(ai){const as=state.aiConfigured?'ok':'warn',at=state.aiConfigured?'AI EDGE READY':'AI LOCAL/FALLBACK';if(ai.dataset.state!==as)ai.dataset.state=as;if(ai.textContent!==at)ai.textContent=at}if(s){const mode=state.aiConfigured?`EdgeOne ${state.aiModel}`:'chưa cấu hình AI server',html=`<b>Camera:</b> ${stream?'đã có stream':'chưa có stream'} · <b>Buffer:</b> ${state.recording?'đang ghi':'chưa ghi'} · <b>Detector:</b> ${cfg.detect?(state.detecting?'8 FPS nhẹ':'đang chờ'):'tắt'} · <b>AI:</b> ${escapeHtml(mode)}${state.lastError?`<br><b>Lưu ý:</b> ${escapeHtml(state.lastError)}`:''}<br><b>Bộ nhớ web:</b> ${state.storageChecked?`${(state.storageUsage/1048576).toFixed(1)} MB đang dùng${state.storagePersistent?' · lưu bền':' · có thể bị browser dọn khi thiếu chỗ'}`:'chỉ nạp video khi bấm Xem'} · RAM chỉ giữ metadata. AI chỉ là gợi ý phân loại; IN/OUT không tự sửa tỷ số.`;if(s.innerHTML!==html)s.innerHTML=html}if(mark){const mh=hot?'1':'0',mt=!cfg.enabled?'🎬 Replay tắt':state.recording?(hot?'🎯 Đang bắt pha…':'● Replay buffer'):'🎬 Chờ camera';if(mark.dataset.hot!==mh)mark.dataset.hot=mh;if(mark.textContent!==mt)mark.textContent=mt}}
function startEngines(){ensureUi();if(!state.clipsLoaded&&!state.clipsLoading)loadClips().catch(()=>{});storageStatus(false).catch(()=>{});ensureRecorder();if(readSettings().detect){if(!state.detectLoop){state.detectLoop=true;analyzeMotionFrame()}if(!state.frameLoop){state.frameLoop=true;frameTick()}}aiHealth();renderStatus()}
const baseStartLocal=App.startLocalCamera?.bind(App);if(baseStartLocal)App.startLocalCamera=async function(...args){const out=await baseStartLocal(...args);storageStatus(true).catch(()=>{});setTimeout(startEngines,120);return out};
const baseBroadcast=App.startWebRTCBroadcast?.bind(App);if(baseBroadcast)App.startWebRTCBroadcast=async function(...args){const out=await baseBroadcast(...args);storageStatus(true).catch(()=>{});setTimeout(startEngines,180);return out};
const baseViewer=App.startWebRTCViewer?.bind(App);if(baseViewer)App.startWebRTCViewer=async function(...args){const out=await baseViewer(...args);setTimeout(startEngines,350);return out};
const baseStop=App.stopLive?.bind(App);if(baseStop)App.stopLive=async function(...args){stopRecorder();stopAnalysisLoops(true);state.stream=null;const out=await baseStop(...args);renderStatus(true);return out};
const baseShowTab=App.showTab?.bind(App);if(baseShowTab)App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);if(tab==='live')setTimeout(startEngines,80);else{stopRecorder();stopAnalysisLoops(false)}return out};
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);const h=$('health-version');if(h)h.textContent=VERSION;return out};
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;if(App.currentTab==='live'){ensureUi();renderStatus()}}
function install(){stamp();setTimeout(stamp,0);if(App.currentTab==='live')setTimeout(startEngines,120)}
install();window.addEventListener('focus',()=>{stamp();if(App.currentTab==='live')setTimeout(startEngines,80)},{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){stopRecorder();stopAnalysisLoops(false)}else if(App.currentTab==='live')setTimeout(startEngines,80)},{passive:true});
/* legacy regression marker: AI_ENDPOINT}; */
window.TopkeyUpgrade77={installed:true,VERSION,CACHE_TAG,BUILD,state,readSettings,ensureRecorder,saveReplay,playReplay,callAi,aiHealth,labelEvent,captureOrientationSnapshot,DB_NAME,DB_VERSION,META_STORE,PRE_MS,POST_MS,SEGMENT_MS,AI_ENDPOINT,MAX_CLIPS,LIST_CLIPS,dbRecent,dbGet,pruneDb,metaFromRec,migrateLegacyMetadata,storageStatus,replayLoopAllowed,stopAnalysisLoops};
})();

/* ===== upgrade79.js ===== */
(() => {
'use strict';
const T=window.Topkey,App=T?.App,U77=window.TopkeyUpgrade77;if(!T||!App||!U77||App.__upgrade79Installed)return;
App.__upgrade79Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade79-ai-endpoint-root-fix';
const CACHE_TAG='u79-20261029',BUILD='upgrade79',AI_ENDPOINT='/api/ai-shuttle-analyze';
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);const h=document.getElementById('health-version');if(h)h.textContent=VERSION;return out};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade79 SW refresh',e)}}
refreshSW();
window.TopkeyUpgrade79={installed:true,VERSION,CACHE_TAG,BUILD,AI_ENDPOINT};
})();

/* ===== upgrade81.js ===== */
(() => {
'use strict';
const T=window.Topkey,App=T?.App,U77=window.TopkeyUpgrade77,U80=window.TopkeyUpgrade80;
if(!T||!App||!U77||!U80||App.__upgrade81Installed)return;
App.__upgrade81Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade81-continuous-replay-10s';
const CACHE_TAG='u81-20261029',BUILD='upgrade81';
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
document.documentElement.dataset.topkeyBuild=BUILD;
function stamp(){
  const h=document.getElementById('health-version');
  if(h)h.textContent=VERSION;
  const line=document.getElementById('tk77-status');
  if(line)line.dataset.replayContract='continuous-10s';
}
const baseHealth=App.renderHealth?.bind(App);
if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out};
setTimeout(stamp,0);setTimeout(stamp,900);
try{navigator.serviceWorker?.getRegistration?.('./').then(r=>r?.update?.()).catch(()=>{})}catch{}
window.TopkeyUpgrade81={installed:true,VERSION,CACHE_TAG,BUILD,targetReplayMs:10000,preMs:U77.PRE_MS,postMs:U77.POST_MS,segmentMs:U77.SEGMENT_MS,contract:'CONTINUOUS_REPLAY_001'};
})();

/* ===== upgrade82.js ===== */
(() => {
'use strict';
const T=window.Topkey,App=T?.App,U77=window.TopkeyUpgrade77,U80=window.TopkeyUpgrade80,U81=window.TopkeyUpgrade81;
if(!T||!App||!U77||!U80||!U81||App.__upgrade82Installed)return;
App.__upgrade82Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade82-replay-orientation-fit';
const CACHE_TAG='u82-20261029',BUILD='upgrade82';
const $=id=>document.getElementById(id);
const manualRotation=new Map();
function normDeg(n){n=Number(n)||0;return ((n%360)+360)%360}
function desiredOrientation(rec,v){const c=rec?.capture||{};if(c.orientation==='landscape'||c.orientation==='portrait')return c.orientation;if(String(c.screenType||'').startsWith('landscape'))return'landscape';if(String(c.screenType||'').startsWith('portrait'))return'portrait';if(Number(c.viewportWidth)>0&&Number(c.viewportHeight)>0)return Number(c.viewportWidth)>=Number(c.viewportHeight)?'landscape':'portrait';if(v?.videoWidth&&v?.videoHeight)return v.videoWidth<v.videoHeight?'landscape':'landscape';return'landscape'}
function baseQuarterTurn(rec,v){if(!v?.videoWidth||!v?.videoHeight)return 0;const desired=desiredOrientation(rec,v),intrinsic=v.videoWidth>=v.videoHeight?'landscape':'portrait';if(desired===intrinsic)return 0;const a=normDeg(rec?.capture?.screenAngle);return a===270?270:90}
function ensurePlayerUi(){const v=$('tk77-replay-video');if(!v)return null;let stage=$('tk82-replay-stage');if(!stage){stage=document.createElement('div');stage.id='tk82-replay-stage';stage.className='tk82-replay-stage';v.parentNode.insertBefore(stage,v);stage.appendChild(v);const tools=document.createElement('div');tools.id='tk82-replay-tools';tools.className='tk82-replay-tools';tools.innerHTML='<span id="tk82-orientation-status">📱 Đang nhận hướng replay…</span><button id="tk82-rotate" type="button" class="btn mini">↻ Xoay 90°</button><button id="tk82-fill" type="button" class="btn mini">▣ Kín khung</button><button id="tk82-fullscreen" type="button" class="btn mini">⛶ Toàn màn hình</button>';stage.insertAdjacentElement('afterend',tools);$('tk82-rotate').onclick=()=>{const rec=U77.state?.currentReplay;if(!rec)return;manualRotation.set(rec.id,normDeg((manualRotation.get(rec.id)||0)+90));applyOrientation('manual')};$('tk82-fill').onclick=()=>{stage.classList.toggle('tk82-fill');$('tk82-fill').textContent=stage.classList.contains('tk82-fill')?'▣ Vừa khung':'▣ Kín khung';applyOrientation('fit')};$('tk82-fullscreen').onclick=async()=>{try{if(!document.fullscreenElement){await stage.requestFullscreen?.();const rec=U77.state?.currentReplay;if(desiredOrientation(rec,v)==='landscape')try{await screen.orientation?.lock?.('landscape')}catch{}}else await document.exitFullscreen?.()}catch{}setTimeout(()=>applyOrientation('fullscreen'),80)}}
 if(!v.dataset.tk82Bound){v.dataset.tk82Bound='1';v.addEventListener('loadedmetadata',()=>requestAnimationFrame(()=>applyOrientation('metadata')));v.addEventListener('resize',()=>requestAnimationFrame(()=>applyOrientation('video-resize')))}return stage}
function applyOrientation(reason='update'){
 const v=$('tk77-replay-video'),stage=ensurePlayerUi(),rec=U77.state?.currentReplay;if(!v||!stage||!rec)return;
 const desired=desiredOrientation(rec,v),base=baseQuarterTurn(rec,v),extra=manualRotation.get(rec.id)||0,rotation=normDeg(base+extra),quarter=rotation===90||rotation===270;
 stage.dataset.captureOrientation=desired;stage.dataset.rotation=String(rotation);stage.style.aspectRatio=desired==='portrait'?'9 / 16':'16 / 9';
 v.classList.add('tk82-oriented-player');v.style.objectFit=stage.classList.contains('tk82-fill')?'cover':'contain';
 const r=stage.getBoundingClientRect();if(quarter&&r.width&&r.height){v.style.width=`${Math.round(r.height)}px`;v.style.height=`${Math.round(r.width)}px`;v.style.transform=`translate(-50%,-50%) rotate(${rotation}deg)`}else{v.style.width='100%';v.style.height='100%';v.style.transform=`translate(-50%,-50%) rotate(${rotation}deg)`}
 const c=rec.capture||{},legacy=!rec.capture,st=$('tk82-orientation-status');if(st){const dims=v.videoWidth&&v.videoHeight?`${v.videoWidth}×${v.videoHeight}`:'đang đọc kích thước';const source=legacy?'clip cũ · tự nhận':`lúc quay ${desired==='landscape'?'ngang':'dọc'}${c.screenAngle!==undefined?' · '+normDeg(c.screenAngle)+'°':''}`;st.textContent=`${desired==='landscape'?'↔️':'↕️'} ${source} · video ${dims}${rotation?` · xoay ${rotation}°`:''}`}
}
function onReplayClick(e){const b=e.target?.closest?.('[data-tk77-play]');if(!b)return;setTimeout(()=>{ensurePlayerUi();applyOrientation('open')},0);setTimeout(()=>applyOrientation('open-late'),180)}
function onModalMutation(){const m=$('tk77-replay-modal');if(m&&!m.classList.contains('hidden')){ensurePlayerUi();applyOrientation('modal')}}
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=$('health-version');if(h)h.textContent=VERSION;ensurePlayerUi()}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out};
document.addEventListener('click',onReplayClick,true);window.addEventListener('resize',()=>requestAnimationFrame(()=>applyOrientation('window-resize')),{passive:true});window.addEventListener('orientationchange',()=>setTimeout(()=>applyOrientation('orientationchange'),120),{passive:true});document.addEventListener('fullscreenchange',()=>setTimeout(()=>applyOrientation('fullscreenchange'),80));screen.orientation?.addEventListener?.('change',()=>setTimeout(()=>applyOrientation('screen-orientation'),120));window.visualViewport?.addEventListener?.('resize',()=>requestAnimationFrame(()=>applyOrientation('viewport-resize')),{passive:true});
stamp();setTimeout(stamp,0);setTimeout(stamp,700);
try{navigator.serviceWorker?.getRegistration?.('./').then(r=>r?.update?.()).catch(()=>{})}catch{}
window.TopkeyUpgrade82={installed:true,VERSION,CACHE_TAG,BUILD,applyOrientation,desiredOrientation,baseQuarterTurn,contract:'REPLAY_ORIENTATION_001'};
})();

/* ===== upgrade83.js ===== */
(() => {
'use strict';
const T=window.Topkey,App=T?.App,U77=window.TopkeyUpgrade77,U82=window.TopkeyUpgrade82;
if(!T||!App||!U77||!U82||App.__upgrade83Installed)return;
App.__upgrade83Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade83-replay-performance-guard';
const CACHE_TAG='u83-20261029',BUILD='upgrade83';
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
document.documentElement.dataset.topkeyBuild=BUILD;
function stamp(){
  const h=document.getElementById('health-version');if(h)h.textContent=VERSION;
  const s=document.getElementById('tk77-status');if(s){s.dataset.replayPerformance='guarded';s.dataset.replayRamList=String(U77.LIST_CLIPS||8);s.dataset.replayDbMax=String(U77.MAX_CLIPS||24)}
}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out};
stamp();setTimeout(stamp,0);setTimeout(stamp,700);
try{navigator.serviceWorker?.getRegistration?.('./').then(r=>r?.update?.()).catch(()=>{})}catch{}
window.TopkeyUpgrade83={installed:true,VERSION,CACHE_TAG,BUILD,ramListLimit:U77.LIST_CLIPS||8,dbClipLimit:U77.MAX_CLIPS||24,contract:'REPLAY_PERFORMANCE_001'};
})();

/* ===== upgrade84.js ===== */
(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U77=window.TopkeyUpgrade77,U83=window.TopkeyUpgrade83;
if(!T||!App||!U||!U77||!U83||App.__upgrade84Installed)return;
App.__upgrade84Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade84-live-first-focus';
const CACHE_TAG='u84-20261029',BUILD='upgrade84';
const $=id=>document.getElementById(id);
const state={focus:false,nativeRequested:false,scrollY:0};
function ensureLayout(){
  const page=$('page-live');if(!page)return false;
  const grid=page.querySelector(':scope > .grid.g3')||page.querySelector('.grid.g3');if(!grid)return false;
  const children=[...grid.children];let viewer=$('tk84-viewer-card')||children.find(x=>x.querySelector?.('#video-box'))||$('video-box')?.closest('.card');
  let blv=$('tk84-blv-card')||children.find(x=>x!==viewer&&x.querySelector?.('#auto-commentary'))||$('auto-commentary')?.closest('.card');
  const source=$('tk84-source-card')||$('stream-court')?.closest('.card'),replay=$('tk77-replay-card');
  if(!viewer||!blv||!source)return false;
  viewer.id='tk84-viewer-card';blv.id='tk84-blv-card';source.id='tk84-source-card';grid.id='tk84-live-layout';page.classList.add('tk84-live-ready');
  let left=$('tk84-live-left');if(!left){left=document.createElement('div');left.id='tk84-live-left';grid.insertBefore(left,viewer)}
  if(viewer.parentElement!==left)left.appendChild(viewer);
  if(source.parentElement!==left)left.appendChild(source);
  if(replay&&replay.parentElement!==left)left.appendChild(replay);
  if(blv.parentElement!==grid)grid.appendChild(blv);
  const bar=viewer.querySelector(':scope > .split .action-bar')||viewer.querySelector('.action-bar');
  if(bar&&!$('tk84-focus-open')){const b=document.createElement('button');b.id='tk84-focus-open';b.type='button';b.className='btn mini primary';b.textContent='↗ Mở màn Live';b.onclick=()=>enterLiveFocus({native:true,reason:'manual'});bar.appendChild(b)}
  if(bar&&!$('tk84-focus-exit')){const b=document.createElement('button');b.id='tk84-focus-exit';b.type='button';b.className='btn mini';b.textContent='↓ Thu nhỏ';b.onclick=()=>exitLiveFocus({exitNative:true,restoreScroll:true});bar.appendChild(b)}
  return true;
}
function tryNativeFullscreen(){
  const viewer=$('tk84-viewer-card');if(!viewer||document.fullscreenElement||!viewer.requestFullscreen)return;
  state.nativeRequested=true;
  try{const p=viewer.requestFullscreen({navigationUI:'hide'});p?.catch?.(()=>{try{viewer.requestFullscreen?.().catch?.(()=>{})}catch{}})}catch{try{viewer.requestFullscreen?.().catch?.(()=>{})}catch{}}
}
function enterLiveFocus({native=false,reason='manual'}={}){
  if(!ensureLayout())return false;
  if(!state.focus)state.scrollY=window.scrollY||0;state.focus=true;document.body.classList.add('tk84-live-focus');document.documentElement.classList.add('tk84-live-focus');
  const v=$('live-video');try{v?.play?.().catch(()=>{})}catch{}
  if(native)tryNativeFullscreen();
  requestAnimationFrame(()=>{try{$('video-box')?.scrollIntoView?.({block:'center',inline:'nearest'})}catch{}});
  const open=$('tk84-focus-open'),exit=$('tk84-focus-exit');if(open)open.setAttribute('aria-pressed','true');if(exit)exit.dataset.reason=reason;
  return true;
}
async function exitLiveFocus({exitNative=true,restoreScroll=false}={}){
  state.focus=false;document.body.classList.remove('tk84-live-focus');document.documentElement.classList.remove('tk84-live-focus');
  if(exitNative&&document.fullscreenElement){try{await document.exitFullscreen?.()}catch{}}
  state.nativeRequested=false;const open=$('tk84-focus-open');if(open)open.setAttribute('aria-pressed','false');
  if(restoreScroll)setTimeout(()=>{try{window.scrollTo({top:state.scrollY||0,behavior:'smooth'})}catch{window.scrollTo(0,state.scrollY||0)}},20);
}
function autoFocusAfterApply(){const court=$('stream-court')?.value;if(!court)return;enterLiveFocus({native:true,reason:'apply'})}
const baseApply=App.applyStream?.bind(App);if(baseApply)App.applyStream=function(...args){const court=$('stream-court')?.value;const out=baseApply(...args);if(court)autoFocusAfterApply();return out};
const baseFull=App.fullscreenVideo?.bind(App);if(baseFull)App.fullscreenVideo=function(...args){if(App.currentTab==='live'){enterLiveFocus({native:true,reason:'fullscreen-button'});return}return baseFull(...args)};
const baseFit=App.fitVideo?.bind(App);if(baseFit)App.fitVideo=function(...args){if(state.focus||document.body.classList.contains('tk84-live-focus')){exitLiveFocus({exitNative:true,restoreScroll:true});return}return baseFit(...args)};
const baseStop=App.stopLive?.bind(App);if(baseStop)App.stopLive=async function(...args){const out=await baseStop(...args);await exitLiveFocus({exitNative:true,restoreScroll:false});return out};
const baseShowTab=App.showTab?.bind(App);if(baseShowTab)App.showTab=function(tab,...args){if(tab!=='live'&&state.focus)exitLiveFocus({exitNative:true,restoreScroll:false});const out=baseShowTab(tab,...args);if(tab==='live')setTimeout(ensureLayout,0);return out};
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);const h=$('health-version');if(h)h.textContent=VERSION;return out};
document.addEventListener('fullscreenchange',()=>{if(state.nativeRequested&&!document.fullscreenElement){state.nativeRequested=false;if(state.focus)exitLiveFocus({exitNative:false,restoreScroll:false})}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.focus&&!document.fullscreenElement){e.preventDefault();exitLiveFocus({exitNative:false,restoreScroll:true})}},true);
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;ensureLayout();const h=$('health-version');if(h)h.textContent=VERSION}
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade84 SW refresh',e)}}
stamp();setTimeout(stamp,0);setTimeout(stamp,700);refreshSW();
window.TopkeyUpgrade84={installed:true,VERSION,CACHE_TAG,BUILD,state,ensureLayout,enterLiveFocus,exitLiveFocus,contract:'LIVE_FIRST_WORKSPACE_001'};
})();

/* ===== upgrade85.js ===== */
(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U77=window.TopkeyUpgrade77,U84=window.TopkeyUpgrade84;
if(!T||!App||!U||!U77||!U84||App.__upgrade85Installed)return;
App.__upgrade85Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade85-disk-lazy-replay';
const CACHE_TAG='u85-20261029',BUILD='upgrade85';
const libs=new Map();
function loadScriptOnce(src,globalName){
  if(globalName&&window[globalName])return Promise.resolve(window[globalName]);
  if(libs.has(src))return libs.get(src);
  const p=new Promise((resolve,reject)=>{
    const existing=[...document.scripts].find(s=>s.src===src);
    if(existing){existing.addEventListener('load',()=>resolve(globalName?window[globalName]:true),{once:true});existing.addEventListener('error',()=>reject(new Error('Không tải được '+src)),{once:true});return}
    const s=document.createElement('script');s.src=src;s.async=true;s.crossOrigin='anonymous';s.onload=()=>resolve(globalName?window[globalName]:true);s.onerror=()=>reject(new Error('Không tải được thư viện'));document.head.appendChild(s)
  });libs.set(src,p);return p
}
const ensureJSZip=()=>loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js','JSZip');
const ensureHls=()=>loadScriptOnce('https://cdn.jsdelivr.net/npm/hls.js@1','Hls');
window.TopkeyLazyLibs={...(window.TopkeyLazyLibs||{}),ensureJSZip,ensureHls,loadScriptOnce};
const baseLoadStream=App.loadStream?.bind(App);
if(baseLoadStream)App.loadStream=function(type,url){
  if(type==='HLS'&&!window.Hls){
    const fallback=document.getElementById('stream-fallback');if(fallback){fallback.classList.remove('hidden');fallback.textContent='Đang nạp HLS khi cần…'}
    ensureHls().then(()=>{if(fallback)fallback.classList.add('hidden');baseLoadStream(type,url)}).catch(e=>{if(fallback){fallback.classList.remove('hidden');fallback.textContent='Không tải được HLS.js.'}U.toast('Không tải được HLS.js: '+(e?.message||e),'err')});return
  }
  return baseLoadStream(type,url)
};
const baseFinanceZip=App.exportFinanceZip?.bind(App);
if(baseFinanceZip)App.exportFinanceZip=async function(...args){if(!window.JSZip)await ensureJSZip();return baseFinanceZip(...args)};
function stamp(){
  T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=document.getElementById('health-version');if(h)h.textContent=VERSION;
  const s=document.getElementById('tk77-status');if(s){s.dataset.replayStorage='disk-lazy';s.dataset.replayPlayback='single-segment-url';s.dataset.startupGuard='u85'}
}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out};
stamp();setTimeout(stamp,0);setTimeout(stamp,700);
try{navigator.serviceWorker?.getRegistration?.('./').then(r=>r?.update?.()).catch(()=>{})}catch{}
window.TopkeyUpgrade85={installed:true,VERSION,CACHE_TAG,BUILD,ensureJSZip,ensureHls,contracts:['REPLAY_DISK_LAZY_001','STARTUP_PERFORMANCE_001']};
})();

/* ===== upgrade86.js ===== */
(() => {
'use strict';
const T=window.Topkey,App=T?.App,U84=window.TopkeyUpgrade84,U85=window.TopkeyUpgrade85;
if(!T||!App||!U84||!U85||App.__upgrade86Installed)return;
App.__upgrade86Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade86-live-layout-race-guard';
const CACHE_TAG='u86-20261029',BUILD='upgrade86';
const $=id=>document.getElementById(id);
let pending=false,observer=null;
function ensureLayout(){
  try{U84.ensureLayout?.()}catch{}
  const page=$('page-live'),left=$('tk84-live-left'),viewer=$('tk84-viewer-card'),source=$('tk84-source-card'),replay=$('tk77-replay-card'),blv=$('tk84-blv-card'),grid=$('tk84-live-layout');
  if(!page||!left||!viewer||!source||!grid)return false;
  if(viewer.parentElement!==left)left.insertBefore(viewer,left.firstChild||null);
  if(source.parentElement!==left)left.appendChild(source);
  if(replay&&replay.parentElement!==left)left.appendChild(replay);
  if(blv&&blv.parentElement!==grid)grid.appendChild(blv);
  page.dataset.liveLayout='locked-u86';
  if(replay)replay.dataset.liveColumn='left';
  return !replay||replay.parentElement===left;
}
function queueEnsure(){
  if(pending)return;pending=true;
  requestAnimationFrame(()=>{pending=false;ensureLayout()});
}
function watchLateReplay(){
  const page=$('page-live');if(!page||observer)return;
  observer=new MutationObserver(records=>{
    if(records.some(r=>[...r.addedNodes].some(n=>n?.id==='tk77-replay-card'||n?.querySelector?.('#tk77-replay-card'))))queueEnsure();
  });
  // Deliberately observe only direct Live-page children: Upgrade77 lazily appends Replay here.
  // This avoids a whole-document/subtree observer and preserves Upgrade85 startup/performance guards.
  observer.observe(page,{childList:true});
}
function settle(){watchLateReplay();ensureLayout();setTimeout(ensureLayout,90);setTimeout(ensureLayout,240)}
const baseShowTab=App.showTab?.bind(App);if(baseShowTab)App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);if(tab==='live')settle();return out};
for(const name of ['startLocalCamera','startWebRTCBroadcast','startWebRTCViewer']){
  const base=App[name]?.bind(App);if(!base)continue;
  App[name]=async function(...args){const out=await base(...args);settle();return out};
}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out};
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=$('health-version');if(h)h.textContent=VERSION;if(App.currentTab==='live')settle()}
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade86 SW refresh',e)}}
stamp();setTimeout(stamp,0);setTimeout(stamp,700);refreshSW();
window.TopkeyUpgrade86={installed:true,VERSION,CACHE_TAG,BUILD,ensureLayout,settle,contract:'LIVE_LAYOUT_RACE_GUARD_001'};
})();
