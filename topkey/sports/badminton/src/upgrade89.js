(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade89Installed)return;
App.__upgrade89Installed=true;
const $=id=>document.getElementById(id);
function isViewer(){return ['VIEWER','LIVE_ONLY'].includes(String(T.Auth?.role?.()||'').toUpperCase())||location.hash==='#spectator'}
function unmuteViewer(){
  if(!isViewer())return;
  const v=$('live-video');
  if(v){v.muted=false;v.defaultMuted=false;v.volume=1;v.play?.().catch(()=>{});}
  const p=$('tk88-public-video');
  if(p){p.muted=false;p.defaultMuted=false;p.volume=1;p.play?.().catch(()=>{});}
}
function ensureAudioButton(){
  if(!isViewer())return;
  const host=$('video-box')||$('tk88-public-live-card')||$('page-live');if(!host||$('tk89-viewer-audio'))return;
  const b=document.createElement('button');b.id='tk89-viewer-audio';b.type='button';b.className='btn mini';
  b.textContent=App.audioUnlocked?'🔊 Âm thanh đang bật':'🔊 Bật âm thanh Live + BLV';
  b.style.cssText='position:absolute;z-index:35;right:12px;bottom:12px;box-shadow:0 3px 14px rgba(0,0,0,.28)';
  const cs=getComputedStyle(host);if(cs.position==='static')host.style.position='relative';host.appendChild(b);
  b.onclick=async()=>{
    unmuteViewer();
    try{await App.unlockAudio?.()}catch(e){console.warn('U89 viewer BLV unlock',e)}
    App.audioUnlocked=true;unmuteViewer();App.renderCommentary?.();
    b.textContent='🔊 Âm thanh đang bật';
    U.toast?.('Đã bật âm thanh Live và bình luận điểm trên Viewer.','ok');
  };
}
// Upgrade88 accidentally remutes authenticated viewers after startWebRTCViewer.
const baseViewer=App.startWebRTCViewer?.bind(App);
if(baseViewer)App.startWebRTCViewer=async function(...args){const out=await baseViewer(...args);setTimeout(()=>{unmuteViewer();ensureAudioButton()},0);setTimeout(unmuteViewer,500);return out};
const baseRender=App.renderCommentary?.bind(App);
if(baseRender)App.renderCommentary=function(...args){const out=baseRender(...args);if(isViewer()){unmuteViewer();ensureAudioButton()}return out};
window.addEventListener('hashchange',()=>setTimeout(()=>{unmuteViewer();ensureAudioButton()},50));
document.addEventListener('click',e=>{if(isViewer()&&e.target?.closest?.('#video-box,#tk88-public-live-card,#tk89-viewer-audio'))unmuteViewer()},{passive:true});
setInterval(()=>{if(isViewer()){unmuteViewer();ensureAudioButton()}},1500);
setTimeout(()=>{unmuteViewer();ensureAudioButton()},100);
})();
