(() => {
'use strict';
if(window.__TOPKEY_U73_PREBOOT)return;
window.__TOPKEY_U73_PREBOOT=true;
window.__TOPKEY_AUDIO_SESSION_PRIMED=false;

// Older upgrade layers all ask the same Service Worker to register/update. Coalesce
// those calls before app.js loads so one page load/focus cannot trigger dozens of
// redundant SW network checks.
const sw=navigator.serviceWorker;
if(!sw||typeof sw.register!=='function')return;
try{
  const nativeRegister=sw.register.bind(sw);
  let registerPromise=null,updatePromise=null,lastUpdateAt=0,registerCalls=0,updateCalls=0;
  const latestUrl=()=>{const u=new URL('./sw.js',location.href);u.searchParams.set('v',window.__TOPKEY_BOOT_CACHE||'u88-20261030');return u.href;};
  const wrap=reg=>new Proxy(reg,{get(target,prop){
    if(prop==='update')return async()=>{
      const now=Date.now();
      if(updatePromise)return updatePromise;
      if(lastUpdateAt&&now-lastUpdateAt<15000)return target;
      updateCalls++;
      updatePromise=Promise.resolve(target.update()).then(()=>{lastUpdateAt=Date.now();return target}).finally(()=>{updatePromise=null});
      return updatePromise;
    };
    const value=Reflect.get(target,prop,target);return typeof value==='function'?value.bind(target):value;
  }});
  sw.register=function(url,options){
    const u=new URL(String(url||''),location.href);
    if(!/\/sports\/badminton\/sw\.js$/i.test(u.pathname))return nativeRegister(url,options);
    registerCalls++;
    if(!registerPromise)registerPromise=nativeRegister(latestUrl(),{...(options||{}),updateViaCache:'none'}).then(wrap).catch(e=>{registerPromise=null;throw e});
    return registerPromise;
  };
  window.__TOPKEY_SW_COALESCER={get registerCalls(){return registerCalls},get updateCalls(){return updateCalls},get lastUpdateAt(){return lastUpdateAt}};
}catch(e){console.warn('Upgrade73 preboot SW coalescer unavailable',e)}
})();
