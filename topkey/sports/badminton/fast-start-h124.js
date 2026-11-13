/* TOPKEY Badminton fast-start H124.
 * Only background the housekeeping reads invoked by App.afterLogin.
 * NEVER skip Firebase Auth, profile validation or permission gates.
 * Intentionally do not change subscriptions, scoring, navigation, or sign-in persistence.
 */
(()=>{'use strict';
const T=window.Topkey,app=T?.App;
if(!app||!T?.Auth||window.TopkeyBadmintonFastStart124?.installed)return;
const jobs=new Map();
let epoch=0;
const delay=callback=>{
  if(typeof requestIdleCallback==='function')return requestIdleCallback(callback,{timeout:1500});
  return setTimeout(callback,120);
};
function deferredMethod(name){
 const original=app[name];
 if(typeof original!=='function')return;
 app[name]=function(...args){
  const uid=T.Auth?.user?.uid||T.Data?.auth?.currentUser?.uid||'';
  // Only after the server profile has been verified. No cached permission shortcuts.
  if(!uid||T.Auth?._profileVerifiedUid!==uid)return original.apply(this,args);
  const key=uid+'|'+name;
  if(jobs.has(key))return Promise.resolve();
  const token=epoch;
  jobs.set(key,'scheduled');
  delay(()=>{
   if(token!==epoch||T.Auth?._profileVerifiedUid!==uid||T.Data?.auth?.currentUser?.uid!==uid){
    jobs.delete(key);return;
   }
   Promise.resolve().then(()=>original.apply(app,args)).then(()=>{
    jobs.set(key,'done');
   }).catch(error=>{
    jobs.delete(key);
    console.warn('TOPKEY background '+name+' deferred:',error?.message||error);
   });
  });
  return Promise.resolve();
 };
}
deferredMethod('ensureSchema');
deferredMethod('seedIfEmpty');
const originalLogout=T.Auth.logout?.bind(T.Auth);
if(originalLogout&&!T.Auth.__fastStartLogoutWrapped){
 T.Auth.__fastStartLogoutWrapped=true;
 T.Auth.logout=async function(...args){epoch++;jobs.clear();return originalLogout(...args)};
}
window.TopkeyBadmintonFastStart124=Object.freeze({installed:true,contract:'AFTER_LOGIN_HOUSEKEEPING_NONBLOCKING',get pending(){return [...jobs.entries()].filter(([,v])=>v==='scheduled').length}});
})();