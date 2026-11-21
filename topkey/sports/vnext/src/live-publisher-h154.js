/* H154: Admin WHIP publishing and neural BLV audio mixing.
 * Existing scoring/Firebase listeners stay unchanged. Reuses VNext stream form.
 */
(() => {
 'use strict';
 if(window.__TOPKEY_PUBLIC_ROUTE)return;
 const $=id=>document.getElementById(id);
 const state={rtc:null,media:null,mixer:null,audioContext:null};
 function closeSession(){
   try{state.rtc?.close?.()}catch{}state.rtc=null;
   try{state.media?.getTracks?.().forEach(t=>t.stop())}catch{}state.media=null;
   try{state.audioContext?.close?.()}catch{}state.audioContext=null;
   state.mixer=null;
 }
 function createMixedMedia(media){
   const Ctx=window.AudioContext||window.webkitAudioContext;
   if(!Ctx||!media.getAudioTracks().length)return media;
   const context=new Ctx(),source=context.createMediaStreamSource(media),out=context.createMediaStreamDestination();
   source.connect(out);
   state.audioContext=context;state.mixer=out;
   return new MediaStream([...media.getVideoTracks(),...out.stream.getAudioTracks()]);
 }
 async function neuralSpeak(text,lang='vi'){
   const T=window.Topkey,user=T?.Data?.auth?.currentUser;
   if(!user)throw new Error('Cần đăng nhập để dùng giọng neural');
   const token=await user.getIdToken();
   const wav=await window.TopkeyWebRTCH154.tts(String(text).slice(0,400),lang,token);
   const permanent=state.audioContext && state.audioContext.state!=='closed';
   const context=permanent?state.audioContext:new (window.AudioContext||window.webkitAudioContext)();
   await context.resume();
   const decoded=await context.decodeAudioData(wav.slice(0));
   const audio=context.createBufferSource();
   audio.buffer=decoded;
   audio.connect(context.destination);
   // This track goes to the actual WHIP publisher, not Firebase.
   if(permanent && state.mixer)audio.connect(state.mixer);
   return new Promise(resolve=>{
     audio.onended=()=>{if(!permanent)void context.close();resolve(true)};
     audio.start();
   });
 }
 function install(){
   const T=window.Topkey,app=T?.App;
   if(!['football','volleyball'].includes(T?.SPORT?.key) || !app?.applyStream || app.__h154Installed)return false;
   const select=$('stream-type'),court=$('stream-court'),video=$('live-video');
   if(!select||!court||!video)return false;
   app.__h154Installed=true;
   if(![...select.options].some(opt=>opt.value==='WEBRTC')){
     const opt=document.createElement('option');opt.value='WEBRTC';opt.textContent='WEBRTC · Camera cho Viewer';select.appendChild(opt);
   }
   const container=document.createElement('div');container.id='tk154-live-controls';
   container.className='field';container.style.gridColumn='span 2';
   container.innerHTML='<p id="tk154-live-status" class="note" role="status">WebRTC cần máy chủ Live đã cấu hình. Camera ưu tiên phía sau.</p>';
   select.closest('.field')?.after(container);
   const status=message=>{const el=$('tk154-live-status');if(el)el.textContent=message};
   select.addEventListener('change',()=>{
     status(select.value==='WEBRTC'?'Bấm Áp dụng / Mở nguồn để gửi camera và micro tới Viewer.':'Nguồn không dùng WebRTC.')
   });
   const originalApply=app.applyStream.bind(app);
   app.applyStream=async function(){
     if(select.value!=='WEBRTC')return originalApply();
     const T=window.Topkey,cid=court.value,room=this.state.courts?.[cid];
     if(!room)return T.U.toast('Chọn sân trước khi phát Live','err');
     const user=T.Data?.auth?.currentUser;
     if(!user)return T.U.toast('Đăng nhập trước khi phát WebRTC','err');
     status('Đang kiểm tra máy chủ Live…');
     let media,rtc;
     try{
       await window.TopkeyWebRTCH154.loadConfig(); // fail before prompting camera
       media=await navigator.mediaDevices.getUserMedia({
         video:{width:{ideal:1280},height:{ideal:720},
           facingMode:{ideal:$('tk142-camera-facing')?.value||'environment'}},
         audio:true
       });
       closeSession();
       state.media=media;
       const mixed=createMixedMedia(media);
       video.srcObject=media;
       video.classList.remove('hidden');$('live-iframe')?.classList.add('hidden');
       await video.play().catch(()=>{});
       status('Đang kết nối camera tới máy chủ WebRTC…');
       rtc=await window.TopkeyWebRTCH154.publish({
         sport:T.SPORT.key,tid:T.Data.tid,court:cid,stream:mixed,token:await user.getIdToken()
       });
       state.rtc=rtc;
       await T.Data.queueSet('courts/'+cid,{...room,
         stream:{type:'WEBRTC',url:'',status:'LIVE',publisherUid:user.uid,startedAt:Date.now()},
         updatedAt:Date.now()},{type:'STREAM_WEBRTC'});
       this.localMedia=media;this.setLiveState('LIVE');
       status('WebRTC đã kết nối. Viewer có thể xem hình và nghe micro/BLV.');
     }catch(e){
       rtc?.close?.();closeSession();
       this.setLiveState('OFFLINE');
       status('Không thể phát WebRTC: '+e.message);
       T.U.toast('Phát WebRTC thất bại: '+e.message,'err');
     }
   };
   const stop=app.stopLive?.bind(app);
   if(stop)app.stopLive=async function(...args){try{return await stop(...args)}finally{closeSession()}};
   window.addEventListener('pagehide',closeSession);
   const commentary=$('commentary-test');
   if(commentary && !$('tk154-neural')){
     const box=document.createElement('div');box.id='tk154-neural';
     box.className='field';box.style.cssText='display:grid;gap:8px;margin:12px 0';
     box.innerHTML='<label for="tk154-voice-mode">Giọng BLV</label>'+
       '<select id="tk154-voice-mode"><option value="device">Giọng thiết bị hiện tại</option>'+
       '<option value="neural">Neural · Kokoro (máy chủ)</option></select>'+
       '<button type="button" id="tk154-voice-test" class="btn">🔊 Thử giọng neural tiếng Việt</button>'+
       '<small id="tk154-voice-status" role="status">Neural cần dịch vụ Kokoro và giọng vi-VN cấu hình trên máy chủ.</small>';
     commentary.closest('.action-bar')?.after(box);
     $('tk154-voice-test').onclick=async()=>{
       const status=$('tk154-voice-status');status.textContent='Đang tạo âm thanh neural…';
       try{await neuralSpeak('Xin chào, chào mừng đến với trận đấu TOPKEY.','vi');status.textContent='Neural đã phát.'}
       catch(e){status.textContent='Neural chưa sẵn sàng: '+e.message}
     };
     const original=app.speakCommentary?.bind(app);
     if(original)app.speakCommentary=function(row){
       if($('tk154-voice-mode')?.value!=='neural'||!row?.text)return original(row);
       if(!this.audioUnlocked||$('auto-commentary')?.checked===false||row.id===this.lastSpokenCommentId)return;
       this.lastSpokenCommentId=row.id;
       const lang=/^zh/i.test(row.lang||'')?'zh':/^en/i.test(row.lang||'')?'en':'vi';
       void neuralSpeak(row.text,lang).catch(e=>{
         const el=$('tk154-voice-status');if(el)el.textContent='Neural lỗi, quay lại giọng thiết bị: '+e.message;
         this.lastSpokenCommentId=null;original(row);
       });
     };
   }
   return true;
 }
 if(!install()){
   window.__TOPKEY_VNEXT_BOOT?.then(install).catch(()=>{});
   window.addEventListener('topkey:admin-ready',install,{once:true});
 }
 window.TopkeyLivePublisherH154={install,closeSession,neuralSpeak};
})();
