(() => {
'use strict';
const T=window.Topkey,App=T?.App,U77=window.TopkeyUpgrade77,U80=window.TopkeyUpgrade80,U81=window.TopkeyUpgrade81;
if(!T||!App||!U77||!U80||!U81||App.__upgrade82Installed)return;
App.__upgrade82Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade82-replay-orientation-fit';
const CACHE_TAG='u82-20261029',BUILD='upgrade82';
const $=id=>document.getElementById(id);
const manualRotation=new Map();
function normDeg(n){n=Number(n)||0;return ((n%360)+360)%360}
function desiredOrientation(rec,v){const c=rec?.capture||{};if(c.orientation==='landscape'||c.orientation==='portrait')return c.orientation;if(String(c.screenType||'').startsWith('landscape'))return'landscape';if(String(c.screenType||'').startsWith('portrait'))return'portrait';if(Number(c.viewportWidth)>0&&Number(c.viewportHeight)>0)return Number(c.viewportWidth)>=Number(c.viewportHeight)?'landscape':'portrait';if(v?.videoWidth&&v?.videoHeight)return v.videoWidth<v.videoHeight?'landscape':'landscape';return'landscape'}
function baseQuarterTurn(rec,v){if(!v?.videoWidth||!v?.videoHeight)return 0;const desired=desiredOrientation(rec,v),intrinsic=v.videoWidth>=v.videoHeight?'landscape':'portrait';if(desired===intrinsic)return 0;const a=normDeg(rec?.capture?.screenAngle);return a===270?270:90}
function ensurePlayerUi(){const v=$('tk77-replay-video');if(!v)return null;let stage=$('tk82-replay-stage');if(!stage){stage=document.createElement('div');stage.id='tk82-replay-stage';stage.className='tk82-replay-stage';v.parentNode.insertBefore(stage,v);stage.appendChild(v);const tools=document.createElement('div');tools.id='tk82-replay-tools';tools.className='tk82-replay-tools';tools.innerHTML='<span id="tk82-orientation-status">📱 Đang nhận hướng replay…</span><button id="tk82-rotate" type="button" class="btn mini">↻ Xoay 90°</button><button id="tk82-fill" type="button" class="btn mini">▣ Kín khung</button><button id="tk82-fullscreen" type="button" class="btn mini">⛶ Toàn màn hình</button>';stage.insertAdjacentElement('afterend',tools);$('tk82-rotate').onclick=()=>{const rec=U77.state?.currentReplay;if(!rec)return;manualRotation.set(rec.id,normDeg((manualRotation.get(rec.id)||0)+90));applyOrientation('manual')};$('tk82-fill').onclick=()=>{stage.classList.toggle('tk82-fill');$('tk82-fill').textContent=stage.classList.contains('tk82-fill')?'▣ Vừa khung':'▣ Kín khung';applyOrientation('fit')};$('tk82-fullscreen').onclick=async()=>{try{if(!document.fullscreenElement){await stage.requestFullscreen?.();const rec=U77.state?.currentReplay;if(desiredOrientation(rec,v)==='landscape')try{await screen.orientation?.lock?.('landscape')}catch{}}else await document.exitFullscreen?.()}catch{}setTimeout(()=>applyOrientation('fullscreen'),80)}}
 if(!v.dataset.tk82Bound){v.dataset.tk82Bound='1';v.addEventListener('loadedmetadata',()=>requestAnimationFrame(()=>applyOrientation('metadata')));v.addEventListener('resize',()=>requestAnimationFrame(()=>applyOrientation('video-resize')))}return stage}
function applyOrientation(reason='update'){
 const v=$('tk77-replay-video'),stage=ensurePlayerUi(),rec=U77.state?.currentReplay;if(!v||!stage||!rec)return;
 const desired=desiredOrientation(rec,v),base=baseQuarterTurn(rec,v),extra=manualRotation.get(rec.id)||0,rotation=normDeg(base+extra),quarter=rotation===90||rotation===270;
 stage.dataset.captureOrientation=desired;stage.dataset.rotation=String(rotation);stage.style.aspectRatio=desired==='portrait'?'9 / 16':'16 / 9';
 v.classList.add('tk82-oriented-player');v.style.objectFit=stage.classList.contains('tk82-fill')?'cover':'contain';
 const r=stage.getBoundingClientRect();if(quarter&&r.width&&r.height){v.style.width=`${Math.round(r.height)}px`;v.style.height=`${Math.round(r.width)}px`;v.style.transform=`translate(-50%,-50%) rotate(${rotation}deg)`}else{v.style.width='100%';v.style.height='100%';v.style.transform=`translate(-50%,-50%) rotate(${rotation}deg)`}
 const c=rec.capture||{},legacy=!rec.capture,st=$('tk82-orientation-status');if(st){const dims=v.videoWidth&&v.videoHeight?`${v.videoWidth}×${v.videoHeight}`:'đang đọc kích thước';const source=legacy?'clip cũ · tự nhận':`lúc quay ${desired==='landscape'?'ngang':'dọc'}${c.screenAngle!==undefined?' · '+normDeg(c.screenAngle)+'°':''}`;st.textContent=`${desired==='landscape'?'↔️':'↕️'} ${source} · video ${dims}${rotation?` · xoay ${rotation}°`:''}`}
}
function onReplayClick(e){const b=e.target?.closest?.('[data-tk77-play]');if(!b)return;setTimeout(()=>{ensurePlayerUi();applyOrientation('open')},0);setTimeout(()=>applyOrientation('open-late'),180)}
function onModalMutation(){const m=$('tk77-replay-modal');if(m&&!m.classList.contains('hidden')){ensurePlayerUi();applyOrientation('modal')}}
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=$('health-version');if(h)h.textContent=VERSION;ensurePlayerUi()}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out};
document.addEventListener('click',onReplayClick,true);window.addEventListener('resize',()=>requestAnimationFrame(()=>applyOrientation('window-resize')),{passive:true});window.addEventListener('orientationchange',()=>setTimeout(()=>applyOrientation('orientationchange'),120),{passive:true});document.addEventListener('fullscreenchange',()=>setTimeout(()=>applyOrientation('fullscreenchange'),80));screen.orientation?.addEventListener?.('change',()=>setTimeout(()=>applyOrientation('screen-orientation'),120));window.visualViewport?.addEventListener?.('resize',()=>requestAnimationFrame(()=>applyOrientation('viewport-resize')),{passive:true});
stamp();setTimeout(stamp,0);setTimeout(stamp,700);
try{navigator.serviceWorker?.getRegistration?.('./').then(r=>r?.update?.()).catch(()=>{})}catch{}
window.TopkeyUpgrade82={installed:true,VERSION,CACHE_TAG,BUILD,applyOrientation,desiredOrientation,baseQuarterTurn,contract:'REPLAY_ORIENTATION_001'};
})();
