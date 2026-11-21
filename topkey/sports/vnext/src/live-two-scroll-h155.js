/* H155: Live Studio independent scroll and direct internal camera entrypoint.
 * Does not touch Firebase records or scoring. Uses H154 WHIP when configured.
 */
(() => {
 'use strict';
 if(window.__TOPKEY_PUBLIC_ROUTE||window.TopkeyLiveH155)return;
 const $=id=>document.getElementById(id);
 let installed=false;
 function install(){
   if(installed)return true;
   const T=window.Topkey,app=T?.App,studio=$('tk144-live-studio');
   if(!studio||!app?.applyStream)return false;
   if(!['football','volleyball'].includes(T?.SPORT?.key))return false;
   const camera=studio.querySelector('.tk144-video-pane');
   const umpire=studio.querySelector('.tk144-official-pane');
   if(!camera||!umpire)return false;
   installed=true;
   for(const [pane,title] of [[camera,'Camera Live'],[umpire,'Bảng trọng tài']]){
     pane.tabIndex=0;
     pane.setAttribute('role','region');
     pane.setAttribute('aria-label',title+' — cuộn độc lập');
   }
   const form=$('stream-type')?.closest('.card');
   const parent=form?.querySelector('.form-grid');
   if(!parent)return true;
   const controls=document.createElement('div');
   controls.className='tk155-camera-actions';
   controls.style.gridColumn='1 / -1';
   const button=document.createElement('button');
   button.type='button';button.id='tk155-camera-direct';
   button.textContent='📹 Phát camera nội bộ đến Viewer';
   const state=document.createElement('span');
   state.className='tk155-camera-state';state.id='tk155-camera-state';
   state.setAttribute('role','status');state.setAttribute('aria-live','polite');
   state.textContent='WebRTC phát trực tiếp hình/micro; cần máy chủ Live đang hoạt động.';
   controls.append(button,state);parent.appendChild(controls);
   button.addEventListener('click',async()=>{
     button.disabled=true;
     try{
       if(!window.TopkeyWebRTCH154)throw new Error('Trình duyệt chưa nạp WebRTC');
       await window.TopkeyWebRTCH154.loadConfig();
       const select=$('stream-type');
       const choice=[...select?.options||[]].find(opt=>opt.value==='WEBRTC');
       if(!choice)throw new Error('Nguồn WEBRTC chưa sẵn sàng');
       select.value='WEBRTC';
       select.dispatchEvent(new Event('change',{bubbles:true}));
       state.textContent='Đang mở camera và kết nối máy chủ…';
       await app.applyStream();
       const live=$('stream-state')?.textContent||'';
       state.textContent=live==='LIVE'?
         'Đã yêu cầu phát Live; hãy kiểm tra Viewer thực tế để xác nhận hình/tiếng.':
         'Chưa xác nhận phát Live. Xem trạng thái kết nối trong khung camera.';
     }catch(error){
       state.textContent='Không phát được camera nội bộ: '+error.message;
     }finally{button.disabled=false}
   });
   return true;
 }
 const ready=()=>{
   if(install())return;
   window.__TOPKEY_VNEXT_BOOT?.then(install).catch(()=>{});
   window.addEventListener('topkey:admin-ready',install,{once:true});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});
 else ready();
 window.TopkeyLiveH155={install,get installed(){return installed}};
})();
