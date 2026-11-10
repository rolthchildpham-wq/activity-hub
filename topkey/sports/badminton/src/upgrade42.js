(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade42Installed)return;
const configuredVersion=String(T.CONFIG_VERSION||T.VERSION||'');
if(configuredVersion.includes('upgrade43')){App.__upgrade42Installed=true;window.TopkeyUpgrade42={installed:true,VERSION:configuredVersion,compat:true};return;}
App.__upgrade42Installed=true;
const VERSION='2026.10.28-vnext-featureparity15-upgrade42';
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
const baseRenderHealth=App.renderHealth?.bind(App);
App.renderHealth=function(...args){
  const out=baseRenderHealth?.(...args);
  U.setText('health-version',VERSION);
  const badge=document.querySelector('#tk19-repair-card .pill, #page-health .health-upgrade-badge, #page-health [data-version-badge]');
  if(badge)badge.textContent=VERSION;
  document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version').forEach(el=>el.textContent=VERSION);
  return out;
};
async function hardenServiceWorker(){
  if(!('serviceWorker' in navigator)||!location.protocol.startsWith('http'))return;
  try{
    const regs=await navigator.serviceWorker.getRegistrations();
    for(const r of regs){try{await r.update();}catch{}}
    const reg=await navigator.serviceWorker.register('./sw.js?v=u42-20261028',{updateViaCache:'none'});
    try{await reg.update();}catch{}
  }catch(e){console.warn('Upgrade42 SW refresh',e);}
}
function stamp(){
  T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
  try{App.renderHealth?.();}catch{}
  document.documentElement.dataset.topkeyBuild='upgrade42';
}
stamp();setTimeout(stamp,0);setTimeout(stamp,1000);hardenServiceWorker();
window.addEventListener('focus',()=>{stamp();hardenServiceWorker();},{passive:true});
window.TopkeyUpgrade42={installed:true,VERSION};
})();
