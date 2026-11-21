/* H160: Recover on-device Vietnamese BLV when external neural TTS is offline.
 * No score, Firebase writes, login or YouTube embed changes.
 */
(() => {
 'use strict';
 if(window.__TOPKEY_PUBLIC_ROUTE||window.TopkeyAudioH160)return;
 const $=id=>document.getElementById(id);
 const state={installed:false,active:null,serial:0,testing:false};
 const status=message=>{const el=$('tk160-audio-status');if(el)el.textContent=message};
 function bestVietnameseVoice(){
   const voices=window.speechSynthesis?.getVoices?.()||[];
   return voices.filter(v=>/^vi(?:-|$)/i.test(v.lang||'')).sort((a,b)=>{
     const rank=v=>(/natural|neural|premium|google/i.test(v.name||'')?10:0)+(v.lang?.toLowerCase()==='vi-vn'?4:0);
     return rank(b)-rank(a);
   })[0]||null;
 }
 function playLocal(row,{force=false}={}){
   const T=window.Topkey,app=T?.App;
   if(!row?.text||!app)return false;
   if(!force&&(!$('auto-commentary')?.checked||!app.audioUnlocked||row.id===app.lastSpokenCommentId))return false;
   if(!window.speechSynthesis||typeof SpeechSynthesisUtterance==='undefined'){
     status('Trình duyệt không hỗ trợ giọng đọc. Vui lòng dùng Chrome/Edge hoặc bật TTS trên thiết bị.');
     return false;
   }
   const text=String(row.text||'').trim();if(!text)return false;
   const volume=Number($('blv-volume')?.value??1);
   if(volume===0){status('Âm lượng BLV đang bằng 0. Hãy tăng thanh âm lượng.');return false}
   const id=++state.serial;
   try{
     window.speechSynthesis.cancel();
     const utterance=new SpeechSynthesisUtterance(text);
     utterance.lang='vi-VN';
     utterance.rate=Math.max(.75,Math.min(1.4,Number($('blv-rate')?.value)||1.05));
     utterance.pitch=Math.max(.7,Math.min(1.3,Number($('blv-pitch')?.value)||1));
     utterance.volume=Math.max(.05,Math.min(1,volume));
     const voice=bestVietnameseVoice();
     if(voice)utterance.voice=voice;
     utterance.onstart=()=>{if(id===state.serial)status('Đang phát bình luận tiếng Việt' +(voice?' · '+voice.name:' · giọng mặc định của thiết bị'))};
     utterance.onend=()=>{if(id===state.serial)status('BLV đã phát xong, sẵn sàng cho tình huống tiếp theo.')};
     utterance.onerror=e=>{
       if(id!==state.serial)return;
       if(e.error==='canceled'||e.error==='interrupted')return;
       if(app.lastSpokenCommentId===row.id)app.lastSpokenCommentId=null;
       status('Lỗi phát giọng: '+(e.error||'không xác định')+'. Nhấn Bật BLV rồi Thử giọng.');
     };
     state.active=utterance;
     if(!force)app.lastSpokenCommentId=row.id;
     window.speechSynthesis.speak(utterance);
     if(!voice)status('Không tìm thấy giọng vi-VN riêng; đang thử giọng mặc định của thiết bị.');
     return true;
   }catch(e){
     if(app.lastSpokenCommentId===row.id)app.lastSpokenCommentId=null;
     status('Không thể phát âm thanh: '+e.message);
     return false;
   }
 }
 async function neuralAvailable(){
   try{
     const cfg=await window.TopkeyWebRTCH154?.loadConfig?.();
     return Boolean(cfg?.base);
   }catch{return false}
 }
 function install(){
   const app=window.Topkey?.App,anchor=$('commentary-test'),unlock=$('audio-unlock');
   if(state.installed||!app?.speakCommentary||!anchor||!unlock)return state.installed;
   if(!['football','volleyball'].includes(window.Topkey?.SPORT?.key))return false;
   state.installed=true;
   const panel=document.createElement('div');
   panel.id='tk160-audio-panel';panel.className='tk160-audio-panel';
   panel.innerHTML='<div class="tk160-audio-row"><button type="button" id="tk160-test" class="btn ok">🔊 Thử nghe giọng Việt</button>'+
     '<button type="button" id="tk160-stop" class="btn">■ Dừng tiếng</button></div>'+
     '<small id="tk160-audio-status" role="status" aria-live="polite">Nhấn Bật BLV để mở khóa âm thanh rồi Thử nghe. Đây là tiếng trên thiết bị điều hành, không tự truyền vào YouTube.</small>';
   anchor.closest('.action-bar')?.after(panel);
   const native=app.speakCommentary.bind(app);
   const deviceMode=()=>{
     const mode=$('tk154-voice-mode');return !mode||mode.value==='device';
   };
   app.speakCommentary=function(row){
     if(row?.lang && !/^vi(?:-|$)/i.test(row.lang))return native(row);
     if(!deviceMode())return native(row);
     // A user pressing "Đọc tỷ số hiện tại" explicitly authorizes one read,
     // even when automatic BLV is switched off.
     const manual=/^tk153_manual_/.test(String(row?.id||''));
     if(manual)app.audioUnlocked=true;
     return playLocal(row,{force:manual});
   };
   // Button clicks are a user gesture: ensure the browser permits playback.
   const enable=()=>{
     app.audioUnlocked=true;
     if($('auto-commentary'))$('auto-commentary').checked=true;
     try{localStorage.setItem('topkey_auto_blv','1')}catch{}
     status('Đã bật BLV. Đang kiểm tra âm thanh...');
     playLocal({id:'tk160_unlock_'+Date.now(),text:'Âm thanh bình luận thể thao đã sẵn sàng.'},{force:true});
   };
   // Replace the click handler because core unlockAudio may claim READY while silent.
   unlock.onclick=enable;
   const test=()=>{
     app.audioUnlocked=true;
     if($('blv-volume')&&Number($('blv-volume').value)===0)$('blv-volume').value='1';
     status('Thử phát giọng nói trực tiếp, không cần Firebase hoặc kết nối YouTube...');
     playLocal({id:'tk160_test_'+Date.now(),text:'Xin chào! Đây là bình luận viên trực tiếp của TOPKEY.'},{force:true});
   };
   $('tk160-test').onclick=test;
   // Existing Test BLV shouldn't need a Firebase write or active match.
   anchor.onclick=test;
   $('tk160-stop').onclick=()=>{
     state.serial++;window.speechSynthesis?.cancel?.();status('Đã dừng phát âm thanh.');
   };
   const volume=$('blv-volume');
   if(volume)volume.addEventListener('input',()=>{if(Number(volume.value)===0)status('Âm lượng BLV đang tắt (0%).')});
   const neural=$('tk154-voice-mode');
   if(neural){
     neuralAvailable().then(ok=>{
       if(ok)return;
       neural.value='device';
       const opt=[...neural.options].find(o=>o.value==='neural');
       if(opt){opt.disabled=true;opt.textContent='Neural · chưa có máy chủ TTS';}
       status('Giọng neural chưa hoạt động. Đã chuyển về giọng thiết bị. Nhấn Bật BLV và Thử nghe.');
     });
   }
   return true;
 }
 const boot=()=>{
   if(install())return;
   window.__TOPKEY_VNEXT_BOOT?.then(install).catch(()=>{});
   window.addEventListener('topkey:admin-ready',install,{once:true});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.TopkeyAudioH160={install,bestVietnameseVoice,playLocal};
})();
