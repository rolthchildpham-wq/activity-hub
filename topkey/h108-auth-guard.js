/* H119 login adapter. The shared platform core owns the only submit handler. */
(()=>{'use strict';
const platform=window.TopkeyPlatform;
if(!platform){console.error('TOPKEY platform core is unavailable');return}
async function ensureCore(){
 const gate=await window.entryGuardReady;
 if(!gate?.ok||!window.__TOPKEY_HUB_ENTRY_VALID)throw new Error('Chưa xác minh phiên vào môn. Hãy quay lại Hub và chọn môn một lần nữa.');
 if(!window.__TOPKEY_SPORT_BOOT)throw new Error('Bộ khởi động môn thể thao chưa sẵn sàng.');
 await window.__TOPKEY_SPORT_BOOT;
 const T=window.Topkey;
 if(!T?.Auth?.login)throw new Error('Module đăng nhập chưa sẵn sàng.');
 return T;
}

ensureCore.afterAuthenticated=()=>window.__TOPKEY_ENSURE_CORE?.();
platform.bindLogin({ensureCore});
window.TopkeyAuthCache=Object.freeze({
 get attempts(){return platform.state.loginBusy?1:0},
 get busy(){return platform.state.loginBusy}
});
})();
