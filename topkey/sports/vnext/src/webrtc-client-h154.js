/* H154 shared WHIP/WHEP signaling client. No Firebase writes, no public secrets. */
(() => {
 'use strict';
 if(window.TopkeyWebRTCH154)return;
 let configPromise=null;
 const error=message=>new Error(message);
 const loadConfig=()=>configPromise||(configPromise=fetch('./live-services-h154.json',{cache:'no-store'})
   .then(r=>{if(!r.ok)throw error('Thiếu cấu hình máy chủ Live');return r.json()})
   .then(c=>{
     if(!c.enabled||!c.apiBase)throw error('Máy chủ WebRTC/TTS chưa được kích hoạt trên TOPKEY');
     const url=new URL(c.apiBase);
     if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)
       throw error('Đường dẫn API Live phải dùng HTTPS');
     return {base:url.origin+url.pathname.replace(/\/$/,'')};
   }).catch(e=>{configPromise=null;throw e}));
 const waitIce=pc=>new Promise((resolve,reject)=>{
   if(pc.iceGatheringState==='complete')return resolve();
   let timer;const finish=()=>{clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',onchange)};
   const onchange=()=>{if(pc.iceGatheringState==='complete'){finish();resolve()}};
   pc.addEventListener('icegatheringstatechange',onchange);
   timer=setTimeout(()=>{finish();reject(error('ICE gathering timeout'))},10000);
 });
 const waitConnect=pc=>new Promise((resolve,reject)=>{
   if(pc.connectionState==='connected')return resolve();
   let timer;
   const finish=()=>{clearTimeout(timer);pc.removeEventListener('connectionstatechange',onchange)};
   const onchange=()=>{
     if(pc.connectionState==='connected'){finish();resolve()}
     if(['failed','closed','disconnected'].includes(pc.connectionState)){finish();reject(error('Kết nối WebRTC bị gián đoạn'))}
   };
   pc.addEventListener('connectionstatechange',onchange);
   timer=setTimeout(()=>{finish();reject(error('WebRTC không kết nối được, kiểm tra UDP/TURN'))},20000);
 });
 async function offer({sport,tid,court,mode,stream,token,ontrack}){
   const {base}=await loadConfig();
   if(!['football','volleyball'].includes(sport))throw error('Môn chưa hỗ trợ WebRTC');
   if(!/^[\w-]{1,80}$/.test(tid)||!/^[\w-]{1,80}$/.test(court))
     throw error('Mã giải đấu hoặc sân không hợp lệ');
   const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.cloudflare.com:3478'}]});
   let closed=false;
   try{
     if(mode==='publish'){
       if(!stream?.getTracks?.().length)throw error('Camera và micro chưa được cấp phép');
       stream.getTracks().forEach(track=>pc.addTrack(track,stream));
     }else {
       pc.addTransceiver('video',{direction:'recvonly'});
       pc.addTransceiver('audio',{direction:'recvonly'});
       pc.ontrack=ontrack;
     }
     await pc.setLocalDescription(await pc.createOffer());
     await waitIce(pc);
     const response=await fetch(base+'/api/rtc/offer',{
       method:'POST',headers:{'Content-Type':'application/json',
         ...(token?{'Authorization':'Bearer '+token}:{})},
       body:JSON.stringify({sport,tid,court,mode,sdp:pc.localDescription.sdp})
     });
     const data=await response.json().catch(()=>({}));
     if(!response.ok||typeof data.answer!=='string')
       throw error(data.error||'Máy chủ truyền hình từ chối kết nối');
     await pc.setRemoteDescription({type:'answer',sdp:data.answer});
     await waitConnect(pc);
     return {pc,close(){if(closed)return;closed=true;pc.close()},status(){return pc.connectionState}};
   }catch(e){pc.close();throw e}
 }
 const api={
   loadConfig,
   publish:args=>offer({...args,mode:'publish'}),
   play:args=>offer({...args,mode:'play'}),
   async tts(text,language,token){
     const {base}=await loadConfig();
     const response=await fetch(base+'/api/tts/speak',{
       method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
       body:JSON.stringify({text,language})
     });
     if(!response.ok){const data=await response.json().catch(()=>({}));throw error(data.error||'Neural TTS chưa sẵn sàng')}
     return await response.arrayBuffer();
   }
 };
 window.TopkeyWebRTCH154=Object.freeze(api);
})();
