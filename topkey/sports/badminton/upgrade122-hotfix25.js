(()=>{
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade122Hotfix25Installed)return;
App.__upgrade122Hotfix25Installed=true;
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const CACHE_TAG='u122h47-20261104';
const BUILD='upgrade122';
const $=id=>document.getElementById(id);
const AUDIO_FILES=[
 './assets/audio/applause-tie.ogg',
 './assets/audio/applause-set.ogg',
 './assets/audio/applause-match.ogg'
];
let manualAudio=null,mountTimer=0,preloadStarted=false;

function role(){try{return String(T.Auth?.role?.()||T.Auth?.user?.role||'').toUpperCase()}catch{return''}}
function allowed(){const r=role();return r==='ADMIN'||r==='UMPIRE'}
function isFocus(){return document.body.classList.contains('tk58-score-focus')}

function hideLegacyUi(){
 const box=$('tk76-crowd-fx');
 if(box){box.hidden=true;box.style.setProperty('display','none','important');box.setAttribute('aria-hidden','true')}
}

async function warmOfflineFiles(){
 if(preloadStarted)return; preloadStarted=true;
 try{
   // These files are already in the SW precache. The explicit fetch also warms normal
   // HTTP/browser cache on the first online visit before the referee goes offline.
   await Promise.allSettled(AUDIO_FILES.map(u=>fetch(u,{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.arrayBuffer()})));
 }catch{}finally{preloadStarted=false}
}

function ensureAudio(){
 if(manualAudio)return manualAudio;
 const a=document.createElement('audio');
 a.id='tk122h25-applause-audio';
 a.preload='auto';
 a.playsInline=true;
 a.src='./assets/audio/applause-match.ogg';
 a.style.display='none';
 a.volume=.55;
 document.body.appendChild(a);
 try{a.load()}catch{}
 manualAudio=a;
 return a;
}

async function playManual(){
 const b=$('tk122h25-applause');
 if(b){b.disabled=true;b.classList.add('tk122h25-playing')}
 try{
   const a=ensureAudio();
   try{a.pause()}catch{}
   try{a.currentTime=0}catch{}
   a.volume=.55;
   const p=a.play();
   if(p&&typeof p.then==='function')await p;
   return true;
 }catch(e){
   // Last fallback uses the existing decoded local crowd engine, never a network URL.
   try{
     const fx=window.TopkeyUpgrade76;
     if(fx){App.audioUnlocked=true;await fx.primeFromGesture?.();await fx.preload?.();if(fx.playBuffer?.('MATCH_FINISH'))return true}
   }catch{}
   try{U.toast?.('Chưa phát được tiếng vỗ tay. Hãy chạm lại nút 👏 một lần.','err')}catch{}
   return false;
 }finally{
   setTimeout(()=>{if(b){b.disabled=false;b.classList.remove('tk122h25-playing')}},180)
 }
}

function makeButton(){
 let b=$('tk122h25-applause');
 if(b)return b;
 b=document.createElement('button');
 b.type='button';b.id='tk122h25-applause';b.className='btn tk122h25-applause';
 b.title='Vỗ tay khán giả · hoạt động offline';b.setAttribute('aria-label','Phát tiếng vỗ tay khán giả');
 b.textContent='👏';
 b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();playManual()});
 return b;
}

function mount(){
 hideLegacyUi();
 const old=$('tk122h25-applause');
 if(!allowed()||!isFocus()){
   if(old)old.style.setProperty('display','none','important');
   return false;
 }
 const page=$('page-umpire'),card=page?.querySelector(':scope > .card')||page?.querySelector('.card');
 if(!card)return false;
 const bar=$('tk122h6-funbar');
 const actions=card.querySelector('.score-actions');
 const b=makeButton();
 if(bar){
   const speak=$('tk122h6-fun-speak');
   if(b.parentElement!==bar){if(speak&&speak.parentElement===bar)bar.insertBefore(b,speak);else bar.appendChild(b)}
 }else if(actions){
   if(b.parentElement!==card)card.insertBefore(b,actions);
 }
 b.style.setProperty('display','inline-flex','important');
 return true;
}
function schedule(ms=0){clearTimeout(mountTimer);mountTimer=setTimeout(mount,ms)}

// Hide the old settings panel even when older upgrades recreate it after render.
const obs=new MutationObserver(()=>schedule(20));
function observe(){const root=$('page-umpire')||document.body;try{obs.observe(root,{childList:true,subtree:true})}catch{}}

// Prime/download automatically on first site visit while online. Playback still requires
// a user gesture, but the file bytes themselves are already local before match time.
function boot(){
 hideLegacyUi();ensureAudio();warmOfflineFiles();observe();schedule(0);
 setTimeout(()=>{warmOfflineFiles();schedule(0)},700);
}
document.addEventListener('fullscreenchange',()=>schedule(25));
window.addEventListener('topkey:admin-ready',()=>schedule(0));
window.addEventListener('online',()=>warmOfflineFiles(),{passive:true});
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-tab="umpire"],#tk58-focus-enter,#tk58-focus-exit,#umpire-load,#umpire-start'))schedule(50)},true);
window.addEventListener('resize',()=>schedule(80),{passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

// Keep Health/version authority aligned with the latest deployment.
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;try{U.setText?.('health-version',VERSION)}catch{}}
stamp();setTimeout(stamp,0);setTimeout(stamp,1000);
window.TopkeyUpgrade122Hotfix25={installed:true,VERSION,CACHE_TAG,BUILD,mount,playManual,warmOfflineFiles};
})();
