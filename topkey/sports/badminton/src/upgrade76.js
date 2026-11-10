(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade76Installed)return;
App.__upgrade76Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade76-natural-crowd-applause';
const CACHE_TAG='u76-20261029';
const BUILD='upgrade76';
const SETTINGS_KEY='topkey_u76_crowd_fx';
const $=id=>document.getElementById(id);
const ASSETS={TIE:'./assets/audio/applause-tie.ogg',SET_FINISH:'./assets/audio/applause-set.ogg',MATCH_FINISH:'./assets/audio/applause-match.ogg'};
const KIND_GAIN={TIE:.62,SET_FINISH:.82,MATCH_FINISH:1};
let ctx=null,master=null,loading=null,lastKind='',lastAt=0;
const buffers=new Map(),activeSources=new Set();
const state={ready:false,loading:false,lastError:'',lastPlayed:'',lastPlayedAt:0};
function readSettings(){try{return{enabled:true,volume:.78,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{return{enabled:true,volume:.78}}}
function saveSettings(p){const next={...readSettings(),...p};try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(next))}catch{}return next}
function audioCtor(){return window.AudioContext||window.webkitAudioContext||null}
function ensureContext(){try{const C=audioCtor();if(!C)return null;if(!ctx){ctx=new C();master=ctx.createGain();master.connect(ctx.destination)}const cfg=readSettings();if(master)master.gain.value=Math.max(0,Math.min(1,Number(cfg.volume)||0));return ctx}catch(e){state.lastError=e?.message||String(e);return null}}
async function primeFromGesture(){const c=ensureContext();if(!c)return false;try{if(c.state==='suspended')await c.resume();return c.state==='running'}catch(e){state.lastError=e?.message||String(e);return false}}
async function preload(){if(state.ready)return true;if(loading)return loading;const c=ensureContext();if(!c)return false;state.loading=true;renderUi();loading=(async()=>{try{for(const [kind,url] of Object.entries(ASSETS)){if(buffers.has(kind))continue;const r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw new Error(`FX ${kind} HTTP ${r.status}`);const ab=await r.arrayBuffer();const b=await c.decodeAudioData(ab.slice(0));buffers.set(kind,b)}state.ready=true;state.lastError='';return true}catch(e){state.lastError=e?.message||String(e);console.warn('Upgrade76 applause preload',e);return false}finally{state.loading=false;loading=null;renderUi()}})();return loading}
function playBuffer(kind){const cfg=readSettings();if(!cfg.enabled||$('auto-commentary')?.checked===false||!App.audioUnlocked)return false;const c=ensureContext(),b=buffers.get(kind)||buffers.get('TIE');if(!c||!b)return false;try{if(c.state==='suspended')c.resume?.().catch?.(()=>{});const now=Date.now(),key=`${kind}|${App.currentCourt||''}`;if(key===lastKind&&now-lastAt<1200)return true;lastKind=key;lastAt=now;const src=c.createBufferSource(),g=c.createGain();src.buffer=b;g.gain.value=Math.max(0,Math.min(1,KIND_GAIN[kind]||.7));src.connect(g);g.connect(master);activeSources.add(src);src.onended=()=>activeSources.delete(src);src.start(c.currentTime+.008);state.lastPlayed=kind;state.lastPlayedAt=now;renderUi();return true}catch(e){state.lastError=e?.message||String(e);renderUi();return false}}
function stopAll(){for(const src of [...activeSources]){try{src.stop()}catch{}activeSources.delete(src)}return true}
function playApplause(kind='TIE'){
  const k=ASSETS[kind]?kind:'TIE';
  if(playBuffer(k))return true;
  // Assets normally preload at boot. If a slow first load races the event, prepare
  // them for the next event without falling back to Upgrade67's synthetic clicks.
  preload().then(()=>{if(readSettings().enabled&&App.audioUnlocked)playBuffer(k)}).catch(()=>{});
  return true;
}
function label(kind){return kind==='MATCH_FINISH'?'Hết trận':kind==='SET_FINISH'?'Hết set':'Hòa điểm'}
function ensureUi(){
  const anchor=$('tk48-realtime')||$('tk75-pinyin-card')||$('tk46-controls');if(!anchor)return;
  if(!$('tk76-crowd-fx')){const box=document.createElement('section');box.id='tk76-crowd-fx';box.className='tk76-crowd-fx';box.innerHTML=`<div class="tk76-head"><div><b>👏 FX VỖ TAY KHÁN GIẢ</b><div class="muted">Crowd FX stereo dựng nhiều lớp offline, không dùng tiếng nhiễu lạch tạch 45 ms của Upgrade67.</div></div><span id="tk76-fx-badge" class="tk76-badge">ĐANG NẠP</span></div><div class="tk76-row"><label><input id="tk76-fx-enable" type="checkbox"> Bật vỗ tay tự động</label><label class="tk76-volume">Âm lượng FX <input id="tk76-fx-volume" type="range" min="0" max="100" step="1"></label><b id="tk76-fx-volume-text">78%</b></div><div class="tk76-tests"><button type="button" class="btn mini" data-tk76-test="TIE">👏 Test ngắn</button><button type="button" class="btn mini" data-tk76-test="SET_FINISH">👏 Test hết set</button><button type="button" class="btn mini primary" data-tk76-test="MATCH_FINISH">👏👏 Test hết trận</button></div><div id="tk76-fx-status" class="tk76-status">Đang nạp mẫu vỗ tay offline…</div>`;anchor.insertAdjacentElement('afterend',box);box.querySelectorAll('[data-tk76-test]').forEach(b=>b.onclick=async()=>{App.audioUnlocked=true;await primeFromGesture();await preload();const ok=playBuffer(b.dataset.tk76Test);if(!ok)U.toast('Chưa phát được tiếng vỗ tay. Hãy chạm Bật âm thanh/BLV một lần.','err')})}
  const cfg=readSettings(),en=$('tk76-fx-enable'),vol=$('tk76-fx-volume');if(en){en.checked=cfg.enabled;en.onchange=e=>{saveSettings({enabled:e.target.checked});renderUi()}}if(vol){vol.value=Math.round((Number(cfg.volume)||.78)*100);vol.oninput=e=>{const v=Math.max(0,Math.min(1,Number(e.target.value)/100));saveSettings({volume:v});if(master)master.gain.value=v;renderUi()}}
  renderUi();
}
function renderUi(){const badge=$('tk76-fx-badge'),status=$('tk76-fx-status'),txt=$('tk76-fx-volume-text'),cfg=readSettings();if(txt)txt.textContent=`${Math.round((Number(cfg.volume)||0)*100)}%`;if(!badge||!status)return;if(!cfg.enabled){badge.dataset.state='off';badge.textContent='ĐÃ TẮT';status.textContent='FX vỗ tay đang tắt.';return}if(state.loading){badge.dataset.state='working';badge.textContent='ĐANG NẠP';status.textContent='Đang nạp 3 mẫu crowd applause offline…';return}if(state.lastError&&!state.ready){badge.dataset.state='err';badge.textContent='FX LỖI';status.textContent='Không nạp được FX: '+state.lastError;return}badge.dataset.state='ok';badge.textContent=state.ready?'CROWD READY':'CHỜ NẠP';status.textContent=state.ready?(state.lastPlayed?`✓ Crowd FX sẵn sàng · vừa phát: ${label(state.lastPlayed)}.`:'✓ Crowd FX sẵn sàng · hòa/ngắt set/kết thúc trận sẽ dùng tiếng vỗ tay mới.'):'Đang chờ tải mẫu FX.'}
// Prime the dedicated FX AudioContext on the same scoring gesture. This context is
// separate from Piper, so applause never steals Piper's <audio> src or queue.
const baseScore=App.score?.bind(App);if(baseScore)App.score=async function(...args){primeFromGesture();return baseScore(...args)};
document.addEventListener('pointerdown',()=>{if(App.audioUnlocked)primeFromGesture()},{capture:true,passive:true});
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;ensureUi();try{App.renderHealth?.()}catch{}}
const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);U.setText?.('health-version',VERSION);const h=$('health-audio');if(h&&readSettings().enabled)h.textContent+=' · CROWD FX';return out};
function install(){stamp();preload();setTimeout(stamp,0);setTimeout(preload,500)}
install();window.addEventListener('focus',()=>{stamp();preload()},{passive:true});
window.TopkeyUpgrade76={installed:true,VERSION,CACHE_TAG,BUILD,ASSETS,state,readSettings,preload,primeFromGesture,playApplause,playBuffer,stopAll};
})();
