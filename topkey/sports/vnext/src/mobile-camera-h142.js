/* H142 mobile camera selector. No Firebase writes and no mount/remount. */
(() => {
 'use strict';
 const init=()=>{
  const facing=document.getElementById('tk142-camera-facing');
  const switcher=document.getElementById('tk142-camera-switch');
  const source=document.getElementById('stream-type');
  const control=document.getElementById('tk142-camera-control');
  if(!facing||!switcher||!source||!control||switcher.dataset.tk142Ready)return;
  switcher.dataset.tk142Ready='1';
  const app=()=>window.Topkey?.App;
  const updateVisibility=()=>{control.hidden=source.value!=='CAMERA'};
  const change=()=>{
   const value=facing.value==='user'?'user':'environment';
   const previous=app()?.cameraFacing||'environment';
   if(!app())return;
   // A single button and select use the same switching implementation.
   app().switchCamera?.().catch(e=>{
    facing.value=previous;
    const status=document.getElementById('tk142-camera-status');
    if(status)status.textContent='Không đổi được camera: '+(e?.message||e);
   });
  };
  facing.value='environment';
  if(app())app().cameraFacing='environment';
  facing.addEventListener('change',change);
  switcher.addEventListener('click',()=>{
   facing.value=facing.value==='environment'?'user':'environment';
   change();
  });
  source.addEventListener('change',updateVisibility);
  updateVisibility();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
 window.addEventListener('topkey:admin-ready',init);
})();
