/* H161: mobile-only free streaming from official Twitch app to TOPKEY Viewer.
 * No YouTube subscriber requirement, no streaming secret in TOPKEY.
 * This integrates the public Twitch embed, not the phone's WebRTC MediaStream.
 */
(() => {
 'use strict';
 if(window.__TOPKEY_PUBLIC_ROUTE||window.TopkeyTwitchH161)return;
 const $=id=>document.getElementById(id);
 function channelFrom(input){
   const raw=String(input||'').trim();
   let name=raw;
   if(/^https?:\/\//i.test(raw)){
     let url;
     try{url=new URL(raw)}catch{return null}
     if(url.protocol!=='https:'||!['twitch.tv','www.twitch.tv','m.twitch.tv'].includes(url.hostname.toLowerCase())
       ||url.username||url.password||url.search||url.hash)return null;
     const parts=url.pathname.split('/').filter(Boolean);
     if(parts.length!==1)return null;
     name=parts[0];
   }
   name=name.toLowerCase();
   if(!/^[a-z0-9_]{4,25}$/.test(name))return null;
   if(['videos','directory','settings','downloads','search','subscriptions','login','signup','p'].includes(name))return null;
   return name;
 }
 function embedFor(input,hostname){
   const name=channelFrom(input);
   if(!name||!hostname||!/^[a-z0-9.-]+$/i.test(hostname))return null;
   return 'https://player.twitch.tv/?channel='+encodeURIComponent(name)+
     '&parent='+encodeURIComponent(hostname)+'&autoplay=false';
 }
 function install(){
   const T=window.Topkey,app=T?.App;
   if(!['volleyball','football'].includes(T?.SPORT?.key)||!app?.applyStream||$('tk161-panel'))return false;
   const source=$('stream-type'),url=$('stream-url'),court=$('stream-court');
   if(!source||!url||!court)return false;
   const container=document.createElement('div');
   container.id='tk161-panel';container.className='tk161-panel';
   container.innerHTML=`<h3>📱 Camera điện thoại → Twitch Live → TOPKEY Viewer</h3>
     <p>Miễn phí và không cần 50 người đăng ký YouTube. Mở ứng dụng Twitch chính thức trên điện thoại, đăng nhập và chọn Go Live / IRL để phát camera và micro.</p>
     <div class="tk161-actions"><a href="https://www.twitch.tv/" target="_blank" rel="noopener noreferrer">Mở Twitch chính thức</a></div>
     <label for="tk161-channel">Tên kênh Twitch hoặc URL kênh công khai</label>
     <input id="tk161-channel" placeholder="https://www.twitch.tv/tenkenh" autocapitalize="none" autocomplete="off">
     <div class="tk161-actions">
       <button type="button" id="tk161-open" class="btn">Kiểm tra kênh</button>
       <button type="button" id="tk161-apply" class="btn ok">Gắn Twitch Live vào sân</button>
     </div>
     <small id="tk161-status" role="status" aria-live="polite">Phát trên ứng dụng Twitch trước. Chỉ gắn kênh vào TOPKEY sau khi video đang LIVE.</small>
     <small>Viewer xem video/âm thanh từ Twitch; bảng tỷ số Firebase vẫn độc lập. Giọng BLV TOPKEY không tự truyền vào Twitch.</small>`;
   const target=url.closest('.field');
   if(target)target.after(container);else return false;
   const channel=$('tk161-channel'),status=$('tk161-status');
   $('tk161-open').onclick=()=>{
     const name=channelFrom(channel.value);
     if(!name){status.textContent='Tên hoặc URL kênh Twitch không hợp lệ.';return}
     window.open('https://www.twitch.tv/'+encodeURIComponent(name),'_blank','noopener,noreferrer');
     status.textContent='Kiểm tra kênh Twitch có nhãn LIVE và âm thanh trước khi lưu.';
   };
   $('tk161-apply').onclick=async()=>{
     const address=embedFor(channel.value,location.hostname);
     if(!address){status.textContent='Tên/URL Twitch không hợp lệ.';return}
     if(!court.value){status.textContent='Chọn sân trước khi gắn livestream.';return}
     if(!T.Auth?.can?.('live')){status.textContent='Tài khoản không có quyền điều hành Live.';return}
     const room=app.state?.courts?.[court.value];
     if(!room){status.textContent='Không tìm thấy sân được chọn.';return}
     source.value='EMBED';url.value=address;
     source.dispatchEvent(new Event('change',{bubbles:true}));
     status.textContent='Đang gửi yêu cầu lưu nguồn Twitch qua quyền Live hiện có…';
     try{
       await app.applyStream();
       status.textContent='Đã gửi lệnh lưu. Mở Viewer trên thiết bị khác để xác minh hình và tiếng. TOPKEY không tự phát camera qua trình duyệt.';
     }catch(error){status.textContent='Không lưu được nguồn: '+error.message}
   };
   return true;
 }
 const boot=()=>{
   if(install())return;
   window.__TOPKEY_VNEXT_BOOT?.then(install).catch(()=>{});
   window.addEventListener('topkey:admin-ready',install,{once:true});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.TopkeyTwitchH161={channelFrom,embedFor,install};
})();
