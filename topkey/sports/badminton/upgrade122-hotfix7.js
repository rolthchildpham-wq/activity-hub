(()=>{
'use strict';
const VERSION='u122h7-20261031';
let busy=false, timer=0;
const $=id=>document.getElementById(id);
function forceLayout(){
  if(busy)return; busy=true;
  try{
    // Let Hotfix6 create/refresh the control first. This is role-agnostic (ADMIN + UMPIRE).
    try{window.TopkeyUpgrade122Hotfix6?.ensureBar?.();window.TopkeyUpgrade122Hotfix6?.refreshPlayers?.()}catch{}
    const page=$('page-umpire');
    const card=page?.querySelector(':scope > .card')||page?.querySelector('.card');
    const box=$('tk122h6-funbar');
    const actions=card?.querySelector('.score-actions');
    if(!card||!box||!actions)return;
    // Always keep the bar immediately before scoring actions, even if referee render replaced nodes.
    if(box.parentElement!==card||box.nextElementSibling!==actions)card.insertBefore(box,actions);
    const focus=document.body.classList.contains('tk58-score-focus');
    if(focus){
      // Upgrade59 has a high-specificity display:none!important. Inline !important wins deterministically.
      box.style.setProperty('display','grid','important');
      box.style.setProperty('visibility','visible','important');
      box.style.setProperty('opacity','1','important');
      box.style.setProperty('grid-row','2','important');
      box.style.setProperty('min-height','0','important');
      actions.style.setProperty('grid-row','3','important');
      card.style.setProperty('grid-template-rows','minmax(0,1fr) auto auto','important');
    }else{
      box.style.removeProperty('visibility');
      box.style.removeProperty('opacity');
      box.style.removeProperty('grid-row');
      box.style.removeProperty('min-height');
      actions.style.removeProperty('grid-row');
      card.style.removeProperty('grid-template-rows');
      // Keep normal-page visibility explicit because older rules may remain in a cached stylesheet.
      box.style.setProperty('display','grid','important');
    }
  }finally{busy=false}
}
function schedule(ms=0){clearTimeout(timer);timer=setTimeout(forceLayout,ms)}
window.addEventListener('topkey:admin-ready',()=>schedule(0));
document.addEventListener('fullscreenchange',()=>schedule(30));
window.addEventListener('resize',()=>schedule(80),{passive:true});
window.addEventListener('orientationchange',()=>schedule(120),{passive:true});
document.addEventListener('click',e=>{
  if(e.target?.closest?.('#tk58-focus-exit,.tk57-referee-toolbar,[data-tab="umpire"],#umpire-start,#umpire-load'))schedule(60);
},true);
// H34: no perpetual safety poll. Lifecycle events and render hooks own layout refresh.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(0),{once:true});else schedule(0);
window.TopkeyUpgrade122Hotfix7={installed:true,VERSION,forceLayout};
})();
