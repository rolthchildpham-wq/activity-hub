(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U46=window.TopkeyUpgrade46,U47=window.TopkeyUpgrade47,U48=window.TopkeyUpgrade48,U49=window.TopkeyUpgrade49,U50=window.TopkeyUpgrade50;
if(!T||!App||!U||!U46||!U47||!U48||!U49||!U50||App.__upgrade51Installed)return;
App.__upgrade51Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade51';
const CACHE_TAG='u51-20261029';
const FIXED_PIPER_MODULE='https://cdn.jsdelivr.net/npm/@realtimex/piper-tts-web@1.1.1/+esm';
const ORT_BASE='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
const PHONEMIZE_BASE='https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize';
const PIPER_VOICE=U47.PIPER_VOICE||'vi_VN-vais1000-medium';
const $=id=>document.getElementById(id),Piper=U47.Piper,Engine=U46.Engine;
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;

// U50 exposed the real failure: the Mintplex build hard-coded Cloudflare ORT 1.18,
// while its current ESM dependency can request an .mjs runtime that is not available
// at that path. U51 uses the RealTimeX fork which pins ORT 1.22 and fixes the runtime
// base to jsDelivr. The already downloaded Vietnamese model remains in the same OPFS.
Piper.runtimeHealthy=false;Piper.runtimeError='';Piper.runtimeName='RealTimeX Piper 1.1.1 · ORT 1.22';
Piper.fastModule=null;Piper.fastModulePromise=null;Piper.fastSession=null;Piper.fastReadyPromise=null;Piper.phase=Piper.installed?'cold':'idle';
Piper.load=async function(){
  if(this.fastModule)return this.fastModule;
  if(!this.fastModulePromise)this.fastModulePromise=import(FIXED_PIPER_MODULE).then(m=>{this.fastModule=m;this.module=m;return m}).catch(e=>{this.fastModulePromise=null;this.runtimeHealthy=false;this.runtimeError=e?.message||String(e);throw e});
  return this.fastModulePromise;
};
Piper.prepare=async function(force=false){
  if(!this.installed)return false;
  if(this.fastSession&&this.runtimeHealthy&&!force)return true;
  if(this.fastReadyPromise)return this.fastReadyPromise;
  this.phase='warmup';this.runtimeError='';renderRuntime();try{U48.renderRealtime?.()}catch{}
  this.fastReadyPromise=(async()=>{
    const m=await this.load();
    // A failed TtsSession is cached by the library singleton. Clear it before a real retry.
    try{if(force&&m.TtsSession&&'_instance' in m.TtsSession)m.TtsSession._instance=null}catch{}
    const opts={
      voiceId:PIPER_VOICE,
      allowLocalModels:true,
      // "local" here means "use the paths supplied below". They are pinned jsDelivr
      // URLs, avoiding the broken cdnjs/1.18 path seen in Upgrade50.
      fallbackStrategy:'local',
      wasmPaths:{onnxWasm:ORT_BASE,piperData:`${PHONEMIZE_BASE}.data`,piperWasm:`${PHONEMIZE_BASE}.wasm`},
      logger:msg=>{if(/failed|error/i.test(String(msg||'')))console.warn('TOPKEY Piper:',msg)}
    };
    let session;
    try{session=m.TtsSession?.create?await m.TtsSession.create(opts):new m.TtsSession(opts)}
    catch(e){try{if(m.TtsSession&&'_instance' in m.TtsSession)m.TtsSession._instance=null}catch{}throw e}
    if(!session?.predict)throw new Error('Piper runtime không tạo được InferenceSession.');
    this.fastSession=session;this.runtimeHealthy=true;this.runtimeError='';this.phase='ready';renderRuntime();try{U48.renderRealtime?.()}catch{}return true;
  })().catch(e=>{
    this.fastSession=null;this.runtimeHealthy=false;this.runtimeError=cleanError(e);this.lastError=this.runtimeError;this.phase='error';renderRuntime();try{U48.renderRealtime?.()}catch{}return false;
  }).finally(()=>{this.fastReadyPromise=null});
  return this.fastReadyPromise;
};

function cleanError(e){
  const s=String(e?.message||e||'Lỗi Piper không xác định');
  if(/cdnjs\.cloudflare\.com/i.test(s))return 'Runtime cũ Cloudflare vẫn còn trong cache. Hãy Purge EdgeOne và tải lại trang.';
  if(/Failed to fetch|fetch dynamically imported module|network/i.test(s))return 'Không tải được runtime giọng. Kiểm tra mạng tới jsDelivr rồi thử lại.';
  if(/backend/i.test(s))return 'ONNX backend chưa khởi tạo được trên trình duyệt này.';
  return s.slice(0,360);
}
function localVoice(){return U49.localSystemVoices?.()[0]||null}
function runtimeEngine(){if(localVoice())return'SYSTEM';if(Piper.installed)return'PIPER';return'NONE'}

// If Piper fails, never leave a green "ready" state. A real local system voice can
// take over automatically; otherwise keep the model installed and show Retry Runtime.
const originalSelected=U47.selectedEngine?.bind(U47);
U47.selectedEngine=function(){
  const sys=localVoice();
  if(sys)return'SYSTEM';
  const old=originalSelected?originalSelected():'NONE';
  if(old==='PIPER'&&Piper.installed)return'PIPER';
  return Piper.installed?'PIPER':old;
};

function ensureRuntimeUi(){
  const targets=[];
  const rt=$('tk48-realtime');if(rt)targets.push(rt);
  for(const tab of ['umpire','live']){const c=$(`tk49-auto-voice-${tab}`);if(c)targets.push(c)}
  for(const host of targets){
    if(host.querySelector('.tk51-runtime'))continue;
    const row=document.createElement('div');row.className='tk51-runtime';row.innerHTML='<span class="tk51-runtime-badge" data-state="checking">RUNTIME · ĐANG KIỂM TRA</span><span class="tk51-runtime-text">Đang kiểm tra Piper/ONNX…</span><button type="button" class="btn mini tk51-retry">↻ Thử lại runtime</button>';
    host.appendChild(row);row.querySelector('.tk51-retry').onclick=async()=>{Piper.fastSession=null;Piper.runtimeHealthy=false;Piper.runtimeError='';Piper.phase='warmup';renderRuntime();const ok=await Piper.prepare(true);if(ok){U.toast('Piper/ONNX đã sẵn sàng','ok');try{await U50.verifyFromGesture?.()}catch{}}else U.toast('Runtime giọng vẫn chưa khởi tạo được','err');renderRuntime()};
  }
  renderRuntime();
}
function renderRuntime(){
  const engine=runtimeEngine();
  document.querySelectorAll('.tk51-runtime').forEach(row=>{
    const b=row.querySelector('.tk51-runtime-badge'),txt=row.querySelector('.tk51-runtime-text'),retry=row.querySelector('.tk51-retry');
    if(engine==='SYSTEM'){
      b.dataset.state='ok';b.textContent='LOCAL VOICE · SẴN SÀNG';txt.textContent='Đang ưu tiên giọng vi-VN local của máy; Piper không cần khởi tạo.';retry.classList.add('hidden');return;
    }
    if(!Piper.installed){b.dataset.state='need';b.textContent='PIPER · CHƯA CÓ MODEL';txt.textContent='Hãy tải giọng TOPKEY trước.';retry.classList.add('hidden');return}
    retry.classList.remove('hidden');
    if(Piper.runtimeHealthy&&Piper.fastSession){b.dataset.state='ok';b.textContent='PIPER/ONNX · READY';txt.textContent=`${Piper.runtimeName} · model TOPKEY đã tải được tái sử dụng.`;return}
    if(Piper.phase==='warmup'){b.dataset.state='working';b.textContent='PIPER/ONNX · ĐANG KHỞI TẠO';txt.textContent='Đang tạo InferenceSession…';return}
    if(Piper.runtimeError){b.dataset.state='err';b.textContent='PIPER/ONNX · LỖI';txt.textContent=Piper.runtimeError;return}
    b.dataset.state='info';b.textContent='PIPER/ONNX · COLD';txt.textContent='Model đã có; runtime sẽ tự khởi tạo khi vào Trọng tài/Live.';
  });
  // Correct the older green badges if runtime is not actually usable.
  if(Piper.installed&&!localVoice()&&!Piper.runtimeHealthy&&Piper.runtimeError){
    document.querySelectorAll('.tk49-auto-voice .tk49-badge').forEach(b=>{b.dataset.state='need';b.textContent='GIỌNG · CẦN SỬA RUNTIME'});
    document.querySelectorAll('.tk49-auto-voice .tk49-message').forEach(m=>m.textContent='Model TOPKEY vẫn còn trên máy, nhưng Piper/ONNX chưa khởi tạo. Bấm “Thử lại runtime”.');
  }
}

// Warm only after availability is known. This is the real readiness check.
async function warm51(){
  try{await Piper.refresh()}catch{}
  ensureRuntimeUi();
  if(Piper.installed&&!localVoice()){
    const ok=await Piper.prepare(false);renderRuntime();
    if(ok&&U49.targetTab?.()){try{await U49.activate?.(App.currentTab,'u51-runtime')}catch{}}
  }
}

const baseShowTab=App.showTab.bind(App);
App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);if(['umpire','live'].includes(tab)){setTimeout(()=>{ensureRuntimeUi();if(Piper.installed&&!localVoice()&&!Piper.runtimeHealthy)Piper.prepare(true).then(renderRuntime)},0)}return out};
const baseAfterLogin=App.afterLogin.bind(App);
App.afterLogin=async function(...args){const out=await baseAfterLogin(...args);ensureRuntimeUi();setTimeout(warm51,250);return out};
const baseHealth=App.renderHealth?.bind(App);
App.renderHealth=function(...args){const out=baseHealth?.(...args);U.setText?.('health-version',VERSION);const h=$('health-audio');if(h&&U49.eligible?.()){const e=runtimeEngine();h.textContent=e==='SYSTEM'?'AUTO BLV · LOCAL SYSTEM':e==='PIPER'?(Piper.runtimeHealthy?'AUTO BLV · PIPER/ONNX READY':'AUTO BLV · PIPER RUNTIME CHECK'):'AUTO BLV · CẦN TẢI GIỌNG'}document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);return out};
async function hardenServiceWorker51(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade51 SW refresh',e)}}
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild='upgrade51';try{App.renderHealth?.()}catch{}}
function install(){ensureRuntimeUi();stamp();setTimeout(()=>{ensureRuntimeUi();stamp()},0);setTimeout(warm51,900);hardenServiceWorker51()}
install();window.addEventListener('focus',()=>{ensureRuntimeUi();stamp();hardenServiceWorker51();if(Piper.installed&&!localVoice()&&!Piper.runtimeHealthy)Piper.prepare(true).then(renderRuntime)},{passive:true});
window.TopkeyUpgrade51={installed:true,VERSION,CACHE_TAG,FIXED_PIPER_MODULE,ORT_BASE,PHONEMIZE_BASE,warm51,renderRuntime,cleanError};
})();
