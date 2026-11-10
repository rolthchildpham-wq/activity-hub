(() => {
'use strict';
const T=window.Topkey,App=T?.App;
if(!T||!App||App.__upgrade35Installed)return;
App.__upgrade35Installed=true;
const VERSION=T.CONFIG_VERSION||T.VERSION;
const $=id=>document.getElementById(id);
const isVisible=el=>!!el&&!el.classList.contains('hidden')&&!el.classList.contains('tk28-hidden');
const overlaySelector=[
  '.modal:not(.hidden)',
  '.tk28-language-modal:not(.tk28-hidden)',
  '.tk9-draw-modal:not(.hidden)',
  '.public-register:not(.hidden)',
  '.audio-overlay:not(.hidden)',
  '.video-box.pseudo-full',
  '.tk9-unlock-pop:not(.hidden)'
].join(',');
function visibleOverlay(){
  return Array.from(document.querySelectorAll(overlaySelector)).find(isVisible)||null;
}
function syncOverlayState(){
  const open=!!visibleOverlay();
  document.body.classList.toggle('tk35-overlay-open',open);
  return open;
}
function repairVersion(){
  if(VERSION&&T.VERSION!==VERSION)T.VERSION=VERSION;
  const h=$('health-version');if(h&&VERSION)h.textContent=VERSION;
  const p=$('tk19-repair-card')?.querySelector('.pill');if(p&&VERSION)p.textContent=VERSION;
}
// Observe dynamic dialogs created by older upgrades. CSS handles the stacking;
// this marker is useful for accessibility/regression checks and future overlays.
let overlaySyncPending=false;const observer=new MutationObserver(()=>{if(overlaySyncPending)return;overlaySyncPending=true;requestAnimationFrame(()=>{overlaySyncPending=false;syncOverlayState()})});
observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','open']});

// Upgrade 34 owns the workspace maximize/restore behavior. Keep its controls,
// but never close the workspace as a side effect of opening/closing a dialog.
function install(){
  repairVersion();syncOverlayState();
  try{window.TopkeyUpgrade34?.ensurePaneControls?.();}catch{}
}
window.addEventListener('topkey:languagechange',()=>{repairVersion();syncOverlayState();});
window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
install();
window.TopkeyUpgrade35={installed:true,VERSION,visibleOverlay,syncOverlayState};
})();
