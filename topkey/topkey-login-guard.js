/* TOPKEY H139 - one early login submit guard for badminton and all VNEXT sports. */
(()=>{'use strict';
 if(window.__TOPKEY_SHARED_LOGIN_GUARD)return;
 window.__TOPKEY_SHARED_LOGIN_GUARD='H139';
 document.addEventListener('submit',event=>{
  if(event.target?.id!=='login-form')return;
  // Always block native GET submission, including slow Firebase/cache/old phones.
  event.preventDefault();
  if(window.TopkeyPlatform?.state?.loginBound)return;
  const hint=document.getElementById('topkey-auth-hint');
  if(hint)hint.textContent='Đang tải hệ thống đăng nhập. Nếu không tiếp tục, kiểm tra kết nối và thử lại.';
 },true);
})();
