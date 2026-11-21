/* H143 runtime compatibility: VNext production loads prebuilt h97-vnext.bundle.js.
 * Correct camera publication even when src/app.js is not loaded directly. */
(() => {
 'use strict';
 if(window.__TOPKEY_PUBLIC_ROUTE)return;
 const install=()=>{
  const T=window.Topkey,app=T?.App;
  if(!app?.applyStream || app.__h143LivePatch)return !!app?.__h143LivePatch;
  app.__h143LivePatch=true;
  const original=app.applyStream.bind(app);
  app.applyStream=async function(){
   const cid=document.getElementById('stream-court')?.value;
   const kind=document.getElementById('stream-type')?.value;
   const url=document.getElementById('stream-url')?.value?.trim()||'';
   const court=this.state.courts?.[cid];
   if(!court)return T.U.toast('Chọn khu trước khi phát Live','err');
   if(kind==='CAMERA'){
    let media;
    try{
     const mode=document.getElementById('tk142-camera-facing')?.value||'environment';
     media=await navigator.mediaDevices.getUserMedia({
      video:{facingMode:{ideal:mode},width:{ideal:1280},height:{ideal:720}},audio:true
     });
    }catch(error){this.setLiveState('OFFLINE');return T.U.toast('Không thể mở camera: '+error.message,'err')}
    this.localMedia?.getTracks?.().forEach(track=>track.stop());
    this.localMedia=media;
    const player=document.getElementById('live-video'),frame=document.getElementById('live-iframe');
    if(frame)frame.classList.add('hidden');
    if(player){player.classList.remove('hidden');player.srcObject=media;await player.play().catch(()=>{})}
    try{
     await T.Data.queueSet('courts/'+cid,{...court,
      stream:{type:'CAMERA',url:'',status:'LOCAL_ONLY'},updatedAt:Date.now()},
     {type:'STREAM_LOCAL_PREVIEW'});
     this.setLiveState('LOCAL_ONLY');
     T.U.toast('Camera chỉ đang xem trên thiết bị phát. Viewer cần HLS/Embed hoặc WebRTC.','info');
    }catch(error){media.getTracks().forEach(track=>track.stop());this.localMedia=null;this.setLiveState('OFFLINE');T.U.toast('Không thể cập nhật camera: '+error.message,'err')}
    return;
   }
   if(!/^https:\/\//i.test(url)||(kind==='HLS'&&!/\.m3u8(?:$|[?#])/i.test(url)))
    return T.U.toast('Viewer yêu cầu URL HTTPS; HLS phải có đuôi .m3u8','err');
   if(kind==='EMBED'){
    let hostname='';
    try{hostname=new URL(url).hostname}catch{}
    if(!/(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be|player\.vimeo\.com)$/.test(hostname))
     return T.U.toast('Viewer hỗ trợ Embed YouTube hoặc Vimeo HTTPS','err');
   }
   return original();
  };
  return true;
 };
 if(!install()){
  window.__TOPKEY_VNEXT_BOOT?.then(install).catch(()=>{});
  window.addEventListener('topkey:admin-ready',install,{once:true});
 }
})();
