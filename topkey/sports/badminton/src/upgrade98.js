(()=>{
'use strict';
const T=window.Topkey,App=T?.App;if(!T||!App||App.__upgrade98Installed)return;App.__upgrade98Installed=true;
const VERSION='2026.10.30-vnext-featureparity15-upgrade100-viewer-auto-landscape-fullscreen-cleanup',BUILD='upgrade100',CACHE_TAG='u100-20261030';
const $=id=>document.getElementById(id);
const state={fullscreen:false,rotation:null,boundVideo:null,resizeObserver:null,viewerObserver:null};
function isSpectator(){return location.hash==='#spectator'||document.documentElement.classList.contains('tk-public-spectator-boot')}
function enforceVersion(){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=$('health-version');if(h&&h.textContent!==VERSION)h.textContent=VERSION;const r=$('tk55-runtime-build');if(r&&r.textContent!==VERSION)r.textContent=VERSION}
async function checkServerBuild100(){enforceVersion();try{const u=new URL('./build.json',location.href);u.searchParams.set('__topkey_probe',Date.now()+'_'+Math.random().toString(36).slice(2));const res=await fetch(u,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});if(!res.ok)throw new Error('HTTP '+res.status);const x=await res.json();const s=$('tk55-server-build');if(s)s.textContent=x.version||x.build||'unknown';const ok=String(x.build||'')===BUILD;const st=$('tk55-update-state');if(st)st.textContent=ok?'✓ Runtime và server cùng Upgrade100.':'Runtime/server lệch build.';return ok}catch(e){const st=$('tk55-update-state');if(st)st.textContent='Không đọc được build server: '+(e?.message||e);return false}}
function player(){return $('tk88-public-live-stage')?.querySelector?.('.tk88-public-player')||null}
function video(){return $('tk88-public-video')}
function isPortraitTrack(v=video()){return !!(v&&v.videoWidth>0&&v.videoHeight>0&&v.videoHeight>v.videoWidth*1.08)}
function isWebRTCVideo(v=video()){return !!(v&&v.srcObject&&typeof v.srcObject==='object')}
function shouldAutoCorrect(v=video()){return !!(isSpectator()&&isWebRTCVideo(v)&&isPortraitTrack(v))}
function effectiveRotation(){return state.rotation==null?(shouldAutoCorrect()?90:0):state.rotation}
function setRotationClass(){
  const st=$('tk88-public-live-stage'),v=video(),p=player(),rot=effectiveRotation();
  [st,p,v].filter(Boolean).forEach(el=>{el.classList?.toggle('tk98-rot90',rot===90);el.classList?.toggle('tk98-rotm90',rot===-90);el.classList?.toggle('tk98-rot180',Math.abs(rot)===180)});
  if(p&&v&&(rot===90||rot===-90)){
    const w=Math.max(1,p.clientWidth||p.getBoundingClientRect?.().width||innerWidth||1),h=Math.max(1,p.clientHeight||p.getBoundingClientRect?.().height||Math.round(w*9/16)||1);
    v.style?.setProperty?.('--tk98-rot-w',h+'px');v.style?.setProperty?.('--tk98-rot-h',w+'px');
  }else if(v){v.style?.removeProperty?.('--tk98-rot-w');v.style?.removeProperty?.('--tk98-rot-h')}
  const rb=$('tk98-public-rotate');if(rb){const show=!!(v&&v.srcObject),txt=rot===90?'↻ Đổi chiều':rot===-90?'↺ Đổi chiều':rot===180?'↻ Để thẳng':'↻ Xoay hình';rb.hidden=!show;if(rb.textContent!==txt)rb.textContent=txt;rb.title='Chỉ dùng khi camera gửi metadata xoay ngược.'}
}
function bindVideo(){
  const v=video();if(!v){return false}
  if(state.boundVideo!==v){
    state.boundVideo=v;const sync=()=>setRotationClass();
    v.addEventListener?.('loadedmetadata',sync,{passive:true});v.addEventListener?.('resize',sync,{passive:true});v.addEventListener?.('playing',sync,{passive:true});
    try{state.resizeObserver?.disconnect?.();state.resizeObserver=window.ResizeObserver?new ResizeObserver(sync):null;state.resizeObserver?.observe?.(player()||v)}catch{}
  }
  setRotationClass();return true
}
function ensureRotateButton(){
  const full=$('tk88-public-full');if(!full)return false;let b=$('tk98-public-rotate');
  if(!b){b=document.createElement('button');b.id='tk98-public-rotate';b.type='button';b.className='btn mini tk98-public-rotate';b.textContent='↻ Xoay hình';full.parentNode?.insertBefore?.(b,full)}
  setRotationClass();return true
}
function cycleRotation(){const cur=effectiveRotation();state.rotation=cur===90?-90:cur===-90?0:cur===0?90:0;setRotationClass()}
function cleanupFullscreenState(){
  state.fullscreen=false;
  const st=$('tk88-public-live-stage');document.documentElement.classList.remove('tk98-viewer-landscape','tk98-viewer-fullscreen');document.body.classList.remove('tk98-viewer-landscape','tk98-viewer-fullscreen');st?.classList.remove('tk98-viewer-landscape','tk98-viewer-fullscreen','tk97-public-viewer-focus');
  document.documentElement.style?.removeProperty?.('overflow');document.body.style?.removeProperty?.('overflow');
  const b=$('tk88-public-full');if(b){if(b.textContent!=='⛶ Toàn màn hình')b.textContent='⛶ Toàn màn hình';b.setAttribute?.('aria-pressed','false');b.title='Phóng to video. Hướng hình đã được Viewer tự sửa theo nguồn camera.'}
  try{screen.orientation?.unlock?.()}catch{}
  setRotationClass();
}
function applyFullscreenState(){
  const st=$('tk88-public-live-stage'),active=document.fullscreenElement===st;state.fullscreen=active;
  st?.classList.toggle('tk98-viewer-fullscreen',active);document.documentElement.classList.toggle('tk98-viewer-fullscreen',active);document.body.classList.toggle('tk98-viewer-fullscreen',active);
  const b=$('tk88-public-full');if(b){const txt=active?'↙ Thoát toàn màn hình':'⛶ Toàn màn hình';if(b.textContent!==txt)b.textContent=txt;b.setAttribute?.('aria-pressed',active?'true':'false');b.title='Phóng to video; không khóa xoay màn hình.'}
  setRotationClass();
}
async function enterFullscreen(){
  if(!isSpectator())return false;const st=$('tk88-public-live-stage');if(!st)return false;bindVideo();ensureRotateButton();
  try{if(document.fullscreenElement!==st){const p=st.requestFullscreen?.({navigationUI:'hide'})||st.requestFullscreen?.();if(p?.then)await p}}catch(e){return false}
  applyFullscreenState();try{video()?.play?.().catch(()=>{})}catch{};return document.fullscreenElement===st
}
async function exitFullscreen(){
  const st=$('tk88-public-live-stage');try{if(document.fullscreenElement===st)await document.exitFullscreen?.()}catch{}cleanupFullscreenState();return true
}
async function toggleFullscreen(){return document.fullscreenElement===$('tk88-public-live-stage')?exitFullscreen():enterFullscreen()}
function patchViewer(){
  if(!isSpectator())return false;const b=$('tk88-public-full');if(!b)return false;b.dataset.tk100Viewer='1';ensureRotateButton();bindVideo();applyFullscreenState();return true
}
document.addEventListener('click',e=>{
  const full=e.target?.closest?.('#tk88-public-full'),rot=e.target?.closest?.('#tk98-public-rotate');
  if(rot&&isSpectator()){e.preventDefault();e.stopImmediatePropagation();cycleRotation();return}
  if(!full||!isSpectator())return;e.preventDefault();e.stopImmediatePropagation();toggleFullscreen().catch(()=>{});
},true);
document.addEventListener('fullscreenchange',()=>{const st=$('tk88-public-live-stage');if(document.fullscreenElement===st)applyFullscreenState();else cleanupFullscreenState()},{passive:true});
window.addEventListener('resize',()=>{if(isSpectator())setRotationClass()},{passive:true});
window.addEventListener('orientationchange',()=>{if(isSpectator())setTimeout(setRotationClass,80)},{passive:true});
window.addEventListener('hashchange',()=>{if(isSpectator()){setTimeout(armViewerPatch,0);setTimeout(armViewerPatch,300)}else{try{state.viewerObserver?.disconnect?.()}catch{}state.viewerObserver=null;exitFullscreen()}},{passive:true});
window.addEventListener('pageshow',()=>{enforceVersion();if(isSpectator()){cleanupFullscreenState();setTimeout(armViewerPatch,0);setTimeout(armViewerPatch,300)}},{passive:true});
window.addEventListener('pagehide',()=>{if(isSpectator())cleanupFullscreenState()},{passive:true});
function armViewerPatch(){
  if(!isSpectator())return false;if(patchViewer()){try{state.viewerObserver?.disconnect?.()}catch{}state.viewerObserver=null;return true}
  const host=$('public-spectator');if(!host||!window.MutationObserver||state.viewerObserver)return false;
  state.viewerObserver=new MutationObserver(()=>{if(!$('tk88-public-full'))return;const mo=state.viewerObserver;state.viewerObserver=null;try{mo?.disconnect?.()}catch{};patchViewer()});
  state.viewerObserver.observe(host,{childList:true,subtree:true});return false
}
for(const k of ['TopkeyUpgrade94','TopkeyUpgrade95','TopkeyUpgrade96','TopkeyUpgrade97']){const x=window[k];if(x){x.enforceVersion=enforceVersion;for(const n of Object.keys(x))if(/^checkServerBuild\d+$/.test(n))x[n]=checkServerBuild100}}
function install(){
  enforceVersion();setTimeout(enforceVersion,0);setTimeout(enforceVersion,700);setTimeout(enforceVersion,1700);const c=$('tk55-check-update');if(c)c.onclick=()=>checkServerBuild100();
  window.TopkeyUpgrade98={installed:true,VERSION,BUILD,CACHE_TAG,state,allowLandscapeFullscreen:true,viewerNativeFullscreen:true,enforceVersion,checkServerBuild100,patchViewer,armViewerPatch,enterFullscreen,exitFullscreen,toggleFullscreen,cleanupFullscreenState,cycleRotation,effectiveRotation,isPortraitTrack,shouldAutoCorrect,contract:'VIEWER_AUTO_LANDSCAPE_INLINE_FULLSCREEN_CLEANUP_001'};
  if(isSpectator()){setTimeout(armViewerPatch,0);setTimeout(armViewerPatch,250)}
}
install();
})();
