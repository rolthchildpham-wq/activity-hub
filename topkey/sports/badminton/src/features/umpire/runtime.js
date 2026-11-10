(()=>{
'use strict';
const T=window.Topkey,App=T?.App;if(!T||!App||window.TopkeyUmpireRuntime)return;
const $=id=>document.getElementById(id);
function hardScrollTop(){
  try{if('scrollRestoration' in history)history.scrollRestoration='manual'}catch{}
  const run=()=>{const page=$('page-umpire');try{page?.scrollIntoView({block:'start',inline:'nearest',behavior:'auto'})}catch{};try{window.scrollTo(0,0)}catch{};try{document.documentElement.scrollTop=0}catch{};try{document.body.scrollTop=0}catch{}};
  run();requestAnimationFrame(()=>{run();requestAnimationFrame(run)});setTimeout(run,0);setTimeout(run,80);setTimeout(run,240);
}
function onTab({tab}={}){if(tab==='umpire')hardScrollTop()}
window.TopkeyUIBoundary?.onTab?.(onTab,'u116:umpire:scroll-top');
addEventListener('pageshow',()=>{if(App.currentTab==='umpire'&&!$('page-umpire')?.classList.contains('hidden'))hardScrollTop()},{passive:true});
window.TopkeyUmpireRuntime={installed:true,hardScrollTop,onTab,contract:'UMPIRE_FEATURE_BOUNDARY_001'};
})();
