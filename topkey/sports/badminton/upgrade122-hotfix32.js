(()=>{
'use strict';
const VERSION='2026.11.03-vnext-upgrade122-hotfix33-stable-runtime',CACHE_TAG='u122h33-20261103';
const state={authWaits:0,lastReadyAt:0};
function stamp(){const T=window.Topkey;if(T){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION}const h=document.getElementById('health-version');if(h)h.textContent=VERSION}
async function waitAuth(ms=8000){state.authWaits++;const end=Date.now()+ms;while(Date.now()<end){if(window.Topkey?.Data?.auth){state.lastReadyAt=Date.now();return window.Topkey.Data.auth}try{if(window.firebase?.auth&&window.firebase?.database){if(!firebase.apps.length)firebase.initializeApp(window.Topkey?.FIREBASE_CONFIG);const a=firebase.auth();if(window.Topkey?.Data){window.Topkey.Data.app=window.Topkey.Data.app||firebase.app();window.Topkey.Data.db=window.Topkey.Data.db||firebase.database();window.Topkey.Data.auth=a;window.Topkey.Data.ready=!!window.Topkey.Data.db}state.lastReadyAt=Date.now();return a}}catch{}await new Promise(r=>setTimeout(r,100))}return null}
function install(){stamp();window.addEventListener('topkey:admin-ready',stamp,{passive:true});window.TopkeyUpgrade122Hotfix32={VERSION,CACHE_TAG,state,waitAuth,stamp,contract:'AUTH_READINESS_001'}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
