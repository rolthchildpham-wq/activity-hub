/* H157 — YouTube Live channel + public embed for TOPKEY VNext.
 * Official Google OAuth is read-only and optional until the owner configures
 * an OAuth web-client ID and authorized JavaScript origin. No stream keys.
 */
(() => {
  'use strict';
  if(window.__TOPKEY_PUBLIC_ROUTE || window.TopkeyYouTubeH157)return;
  const $=id=>document.getElementById(id);
  const YT_ID=/^[A-Za-z0-9_-]{11}$/;
  const SECURE_HOSTS=new Set(['youtube.com','www.youtube.com','m.youtube.com',
    'youtube-nocookie.com','www.youtube-nocookie.com','youtu.be']);
  function parseVideoId(input) {
    const raw=String(input||'').trim();
    if(YT_ID.test(raw))return raw;
    let url;
    try{url=new URL(raw)}catch{return null}
    if(url.protocol!=='https:'||!SECURE_HOSTS.has(url.hostname.toLowerCase())||
       url.username||url.password)return null;
    const host=url.hostname.toLowerCase();
    let candidate=null;
    if(host==='youtu.be')candidate=url.pathname.split('/')[1];
    else if(url.pathname==='/watch')candidate=url.searchParams.get('v');
    else if(/^\/(?:live|embed|shorts)\//.test(url.pathname))
      candidate=url.pathname.split('/')[2];
    return YT_ID.test(candidate||'')?candidate:null;
  }
  const canonical = raw => {
    const id=parseVideoId(raw);
    return id?'https://www.youtube-nocookie.com/embed/'+id+'?playsinline=1&rel=0':null;
  };
  const STATUS={
    start:'Đăng nhập bằng Google tại YouTube Studio để xác minh và bật Live. TOPKEY không nhận mật khẩu hoặc stream key.',
    noId:'Chưa cấu hình OAuth Client ID. Vẫn có thể gắn liên kết Live công khai vào Viewer.',
    waiting:'Đang kiểm tra kênh YouTube được cấp quyền đọc...',
    connected:'Đã kết nối quyền đọc kênh YouTube. TOPKEY không có quyền đổi cài đặt hay khởi động phát.',
  };
  let tokenClient=null,oauthClientId='',channelName='',readonlyToken=null;
  function setStatus(text){const target=$('tk157-status');if(target)target.textContent=text}
  async function readConfig(){
    try{
      const response=await fetch('./youtube-oauth-h157.json',{cache:'no-store'});
      if(!response.ok)return '';
      const data=await response.json();
      return typeof data.clientId==='string'&&/^[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(data.clientId)?data.clientId:'';
    }catch{return ''}
  }
  function loadGoogle(){
    if(window.google?.accounts?.oauth2)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://accounts.google.com/gsi/client';
      s.async=true;s.onload=resolve;s.onerror=()=>reject(Error('Không tải được dịch vụ xác thực Google'));
      document.head.appendChild(s);
    });
  }
  async function connectReadOnly({switchAccount=false}={}){
    if(!oauthClientId){setStatus(STATUS.noId);return}
    try{
      await loadGoogle();
      if(switchAccount){
        // Never keep an old channel identity while selecting a new Google account.
        const previousToken=readonlyToken;
        readonlyToken=null;
        channelName='';
        if(previousToken){
          try{window.google.accounts.oauth2.revoke(previousToken,()=>{})}catch{}
        }
        setStatus('Chọn một tài khoản Google khác trong cửa sổ Google chính thức.');
      }
      if(!tokenClient)tokenClient=window.google.accounts.oauth2.initTokenClient({
        client_id:oauthClientId,scope:'https://www.googleapis.com/auth/youtube.readonly',
        callback:async(response)=>{
          if(response.error||!response.access_token){
            setStatus('Google chưa cấp quyền đọc kênh.');return;
          }
          readonlyToken=response.access_token;
          try{
            const reply=await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,status&mine=true',{
              headers:{Authorization:'Bearer '+readonlyToken},cache:'no-store'
            });
            if(!reply.ok)throw Error('YouTube Data API chưa được bật hoặc kênh chưa được xác minh.');
            const data=await reply.json();
            channelName=String(data.items?.[0]?.snippet?.title||'');
            setStatus((channelName?STATUS.connected+' Kênh: '+channelName: 'Không tìm thấy kênh YouTube.')+
              ' Tình trạng bật Live phải kiểm tra trong YouTube Studio.');
          }catch(e){setStatus('Không kiểm tra được kênh: '+e.message)}
        }
      });
      tokenClient.requestAccessToken({prompt:switchAccount?'select_account consent':'select_account'});
    }catch(e){setStatus(e.message)}
  }
  function install(){
    const T=window.Topkey,app=T?.App;
    if(!app?.applyStream||!['football','volleyball'].includes(T?.SPORT?.key)||$('tk157-youtube-panel'))return false;
    const urlInput=$('stream-url'),source=$('stream-type'),court=$('stream-court');
    if(!urlInput||!source||!court)return false;
    const wrapper=document.createElement('div');wrapper.id='tk157-youtube-panel';
    wrapper.className='tk157-panel';
    wrapper.innerHTML=`
      <h3>▶ YouTube Live → TOPKEY Viewer</h3>
      <p class="tk157-hint">Dùng Live Now trên điện thoại để quay trận, gắn logo/bảng tỷ số và phát lên YouTube. TOPKEY chỉ nhúng video YouTube; không nhúng nguyên ứng dụng Live Now.</p>
      <div class="tk157-buttons">
        <a href="https://livenow.one/" target="_blank" rel="noopener noreferrer">Mở Live Now (website chính thức)</a>
        <a href="https://livenow.one/docs/how-to/live-sports/add-a-url-overlay-to-a-live-stream/" target="_blank" rel="noopener noreferrer">Hướng dẫn đưa TOPKEY lên hình Live Now</a>
      </div>
      <p class="tk157-hint">Phát trên kênh YouTube chính thức, sau đó dán liên kết xem công khai. Không nhập mật khẩu, stream key hoặc token vào TOPKEY.</p>
      <div class="tk157-buttons">
        <a href="https://studio.youtube.com/" target="_blank" rel="noopener noreferrer">Mở YouTube Studio</a>
        <button type="button" id="tk157-connect">Kết nối Google (chỉ quyền đọc)</button>
        <button type="button" id="tk158-switch-account">⇄ Đổi tài khoản YouTube</button>
      </div>
      <label for="tk157-youtube-url">Liên kết YouTube Live (youtube.com/live/…, watch?v=…, youtu.be/…)</label>
      <input id="tk157-youtube-url" type="url" inputmode="url" placeholder="https://www.youtube.com/live/VIDEO_ID">
      <div class="tk157-buttons">
        <button type="button" id="tk157-preview">Kiểm tra liên kết</button>
        <button type="button" id="tk157-save">Gắn Live vào sân đang chọn</button>
      </div>
      <small id="tk157-status" role="status" aria-live="polite"></small>
    `;
    urlInput.closest('.field')?.after(wrapper);
    const input=$('tk157-youtube-url');
    const status=$('tk157-status');
    status.textContent=STATUS.start;
    $('tk157-connect').onclick=()=>connectReadOnly();
    $('tk158-switch-account').onclick=()=>connectReadOnly({switchAccount:true});
    void readConfig().then(id=>{oauthClientId=id;if(!id)setStatus(STATUS.noId)});
    $('tk157-preview').onclick=()=>{
      const url=canonical(input.value);
      if(!url){setStatus('Liên kết không hợp lệ. Chỉ hỗ trợ video ID hoặc URL YouTube HTTPS.');return}
      setStatus('Đã nhận diện ID video. Kiểm tra kênh đang LIVE và đã cho phép nhúng. Mở liên kết gốc để xác nhận.');
      window.open?.('https://www.youtube.com/watch?v='+parseVideoId(input.value),'_blank','noopener,noreferrer');
    };
    $('tk157-save').onclick=async()=>{
      const url=canonical(input.value);
      if(!url){setStatus('Liên kết YouTube không hợp lệ.');return}
      if(!court.value){setStatus('Cần chọn sân trước.');return}
      if(!T.Auth?.can?.('live')){setStatus('Tài khoản chưa có quyền điều hành Live.');return}
      // Reuse existing source management, the Firebase rules/role checks,
      // and the public Viewer H143 safe YouTube embed renderer.
      source.value='EMBED';urlInput.value=url;
      source.dispatchEvent(new Event('change',{bubbles:true}));
      setStatus('Đang lưu nguồn YouTube vào sân; khi đổi kênh cần dán lại URL Live của kênh mới...');
      try{
        await app.applyStream();
        setStatus('Đã gửi yêu cầu lưu nguồn YouTube. Mở Viewer ẩn danh để xác minh video và âm thanh thực tế.');
      }catch(e){setStatus('Không thể lưu nguồn: '+e.message)}
    };
    return true;
  }
  function boot(){
    if(install())return;
    window.__TOPKEY_VNEXT_BOOT?.then(install).catch(()=>{});
    window.addEventListener('topkey:admin-ready',install,{once:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.TopkeyYouTubeH157={parseVideoId,canonical,install,connectReadOnly};
})();
