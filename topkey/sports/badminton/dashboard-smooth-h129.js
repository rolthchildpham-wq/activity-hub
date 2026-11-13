/* TOPKEY H129 Smooth Admin - stable dashboard frame and single active tab commit.
 * Does not initialize Firebase or change authentication, rules, score writes.
 * Legacy UI contains two render paths (activateTab -> renderBranch, then
 * renderTabFromCache) which can recreate the same panel during one click.
 */
(()=>{'use strict';
if(window.TopkeySmoothAdmin129?.installed)return;
const T=window.Topkey,app=T?.App,core=window.TopkeyCoreDataRuntime115;
if(!T||!app||!T.Auth)return;
document.body.classList.add('tk-smooth-admin');
const metrics={tabRequests:0,tabPaints:0,mergedBranchUpdates:0,suppressedSameTab:0};
let pendingFrame=0,pendingTab='',currentToken=0,firstTabPainted=false;
const raf=window.requestAnimationFrame?.bind(window)||((fn)=>setTimeout(fn,16));
const authorized=()=>Boolean(T.Auth?._profileVerifiedUid&&T.Auth?._profileVerifiedUid===T.Data?.auth?.currentUser?.uid);
function intro(){
 const page=document.getElementById('page-overview');
 if(!page||document.getElementById('tk-smooth-intro'))return;
 const header=document.createElement('div');header.className='tk-smooth-intro';header.id='tk-smooth-intro';
 const left=document.createElement('div'),heading=document.createElement('h2'),desc=document.createElement('p'),chip=document.createElement('span');
 heading.textContent='Tổng quan giải đấu';desc.textContent='Bảng điều khiển · Dữ liệu giải cập nhật trực tiếp từ Firebase';
 chip.className='tk-smooth-chip';chip.textContent='Đang kết nối dữ liệu';
 left.append(heading,desc);header.append(left,chip);page.prepend(header);
 window.addEventListener('topkey:auth-state',event=>{
  if(event?.detail?.state==='AUTHENTICATED'&&event?.detail?.verified)chip.textContent='Đã xác minh quyền';
  else if(event?.detail?.state==='REVALIDATING')chip.textContent='Đang kiểm tra kết nối';
  else if(['SIGNED_OUT','DENIED'].includes(event?.detail?.state))chip.textContent='Chưa đăng nhập';
 },{passive:true});
 if(authorized())chip.textContent='Đã xác minh quyền';
}
intro();
// Defer content paints to one requestAnimationFrame; the header/sidebar/hero
// never get re-created by Firebase child_added/child_changed bursts.
function schedulePaint(tab){
 tab=String(tab||app.currentTab||'overview');
 metrics.tabRequests++;
 if(pendingFrame){metrics.mergedBranchUpdates++;pendingTab=tab;return}
 pendingTab=tab;const token=++currentToken;pendingFrame=1;
 raf(()=>{
  if(token!==currentToken)return;
  pendingFrame=0;
  const active=String(app.currentTab||'overview');
  if(!authorized()||active!==pendingTab)return;
  try{
   if(typeof core?.renderTabFromCache==='function')core.renderTabFromCache(active);
   else if(active==='overview')app.renderOverview?.();
   else legacyRenderBranch?.(active==='schedule'?'matches':active);
   metrics.tabPaints++;firstTabPainted=true;
  }catch(error){console.warn('TOPKEY smooth tab paint',error)}
 });
}
const legacyRenderBranch=typeof app.renderBranch==='function'?app.renderBranch.bind(app):null;
if(legacyRenderBranch&&!app.__tk129BranchCoalesced){
 app.__tk129BranchCoalesced=true;
 app.renderBranch=function(branch){
  if(!authorized())return legacyRenderBranch(branch);
  // Core RTDB model has already synchronized the in-memory branch. Only
  // refresh the visible tab; the panel/layout and other tabs remain untouched.
  schedulePaint(this.currentTab||'overview');
 };
}
const previousShowTab=typeof app.showTab==='function'?app.showTab.bind(app):null;
if(previousShowTab&&!app.__tk129TabStable){
 app.__tk129TabStable=true;
 app.showTab=function(tab,...args){
  if(!authorized())return previousShowTab(tab,...args);
  const name=String(tab||'overview');
  if(!T.Auth.can?.(name))return;
  const old=String(this.currentTab||'overview');
  const page=document.getElementById('page-'+name);
  if(old===name&&page&&!page.classList.contains('hidden')){
   metrics.suppressedSameTab++;return;
  }
  // This is one stable route commit. No page reload, no re-binding auth.
  this.currentTab=name;
  document.querySelectorAll('#app-shell .page').forEach(node=>{
   node.classList.toggle('hidden',node.id!=='page-'+name);
  });
  document.querySelectorAll('#app-shell .nav [data-tab]').forEach(button=>{
   const selected=button.dataset.tab===name;
   button.classList.toggle('active',selected);
   button.setAttribute('aria-current',selected?'page':'false');
  });
  if(name==='live')this.ensureAudioOverlay?.();
  try{core?.activateTab?.(name)}catch(error){console.warn('TOPKEY tab scope',error)}
  schedulePaint(name);
 };
}
// Optional metrics accessible in the existing health tool without rewriting it.
window.TopkeySmoothAdmin129=Object.freeze({
 installed:true,
 contract:'PERSISTENT_SHELL_SINGLE_VISIBLE_TAB_PAINT',
 get metrics(){return Object.freeze({...metrics,firstTabPainted})}
});
})();