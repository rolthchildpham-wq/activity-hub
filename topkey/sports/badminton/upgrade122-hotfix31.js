(()=>{
'use strict';
const VERSION='2026.11.03-vnext-upgrade122-hotfix33-stable-runtime';
const CACHE_TAG='u122h33-20261103';
const $=id=>document.getElementById(id);
const state={installed:true,bootRecovered:0,lastCheck:0,warnings:[],checks:0};
function T(){return window.Topkey||null}
function authority(){
 const t=T();if(t){t.VERSION=VERSION;t.CONFIG_VERSION=VERSION;t.RUNTIME_BUILD=VERSION}
 document.documentElement.dataset.topkeyBuild='upgrade122-hotfix33';
 const h=$('health-version');if(h&&h.textContent!==VERSION)h.textContent=VERSION;
 const r=$('tk55-runtime-build');if(r&&r.textContent!==VERSION)r.textContent=VERSION;
}
function loginWatchdog(){
 if(window.__TOPKEY_ADMIN_READY)return;
 const f=$('login-form'),b=f?.querySelector('button[type="submit"],button:not([type])');
 if(!f||!b)return;
 if(b.disabled&&String(b.textContent||'').match(/Đang (tải|xác thực)/i)){
   b.disabled=false;b.textContent=b.dataset.h31Text||b.dataset.u110Text||'Đăng nhập an toàn';
   window.__TOPKEY_PENDING_LOGIN=false;state.bootRecovered++;
 }
}
function snapshot(){
 const t=T(),d=t?.Data,a=t?.Auth,app=t?.App;
 const out={
   version:VERSION,adminReady:!!window.__TOPKEY_ADMIN_READY,
   firebaseReady:!!d?.ready,authReady:!!d?.auth,dbReady:!!d?.db,
   signedIn:!!d?.auth?.currentUser,role:a?.role?.()||a?.profile?.role||'',
   queuePending:Number(d?.pending||0),queueBlocked:Number(d?.blocked||0),
   currentTab:app?.currentTab||'',dataConnected:!!d?.connected,
   productionHardening:!!window.TopkeyProductionHardening117?.installed,
   runtimeAuthority:!!window.TopkeyRuntime117?.installed,
   at:Date.now()
 };
 state.lastCheck=out.at;state.checks++;state.warnings=[];
 if(!out.firebaseReady)state.warnings.push('Firebase/Data chưa ready');
 if(!out.authReady)state.warnings.push('Auth chưa ready');
 return out;
}
function renderHealth(){
 authority();const host=$('tk103-runtime-health');if(!host)return;let line=$('tk-h31-stability');
 if(!line){line=document.createElement('div');line.id='tk-h31-stability';line.className='muted';line.style.marginTop='6px';host.appendChild(line)}
 const x=snapshot();line.innerHTML=`Hotfix31 Stability: <b>${state.warnings.length?'DEGRADED':'OK'}</b> · Admin ready <b>${x.adminReady?'YES':'NO'}</b> · Firebase/Auth <b>${x.firebaseReady?'ON':'WAIT'}/${x.authReady?'ON':'WAIT'}</b> · queue <b>${x.queuePending}/${x.queueBlocked}</b> · boot recoveries <b>${state.bootRecovered}</b>`;
}
function patchHealth(){const app=T()?.App;if(!app||app.__h31Health)return false;app.__h31Health=true;const base=app.renderHealth?.bind(app);app.renderHealth=function(...a){const r=base?.(...a);queueMicrotask(renderHealth);return r};return true}
function install(){authority();patchHealth();renderHealth();setTimeout(loginWatchdog,8000);window.addEventListener('topkey:admin-ready',()=>{authority();patchHealth();renderHealth()},{passive:true});window.addEventListener('topkey:admin-boot-error',()=>setTimeout(loginWatchdog,0),{passive:true});window.addEventListener('pageshow',()=>{authority();patchHealth()},{passive:true});window.TopkeyUpgrade122Hotfix31={VERSION,CACHE_TAG,state,snapshot,authority,renderHealth,loginWatchdog,contract:'STABILITY_CONSOLIDATION_001'};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
