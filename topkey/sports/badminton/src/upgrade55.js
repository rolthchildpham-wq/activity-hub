(()=>{'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;if(!T||!App||App.__upgrade55Installed)return;
App.__upgrade55Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade55';
const CACHE_TAG='u55-20261029';
const BUILD='upgrade55';
const RUNTIME_CACHE='topkey-piper-runtime-ort122-phonemize100';
const $=id=>document.getElementById(id);
const upgradeNo=v=>{const m=String(v||'').match(/upgrade(\d+)/i);return m?Number(m[1]):-1};

// From U55 onward, a delayed timer/focus handler from an older upgrade is not allowed
// to downgrade the visible/runtime version. Future upgrades (56+) are still allowed.
function lockVersionField(key){
  let value=VERSION;
  try{
    const d=Object.getOwnPropertyDescriptor(T,key);
    if(d&&!d.configurable){T[key]=VERSION;return}
    Object.defineProperty(T,key,{configurable:true,enumerable:true,get(){return value},set(next){const n=String(next||'');if(upgradeNo(n)>=upgradeNo(value))value=n}});
  }catch{try{T[key]=VERSION}catch{}}
}
['VERSION','CONFIG_VERSION','RUNTIME_BUILD'].forEach(lockVersionField);

function forceLocalDefault(){
  const sel=$('stream-type');if(!sel)return;
  // Default is always the camera on each fresh page load. The operator may switch
  // to WebRTC/HLS/YouTube afterwards during the same page session.
  if(!window.__topkeyU55LiveSourceTouched)sel.value='CAMERA';
  if(!sel.__topkeyU55Bound){sel.__topkeyU55Bound=true;sel.addEventListener('change',()=>{window.__topkeyU55LiveSourceTouched=true},{passive:true})}
}

function ensureHealthUi(){
  const page=$('page-health');if(!page||$('tk55-build-health'))return;
  const card=document.createElement('div');card.id='tk55-build-health';card.className='card';card.style.marginTop='14px';
  card.innerHTML='<div class="split"><div><h3>🔄 TOPKEY Auto Update</h3><p class="muted">So sánh bản đang chạy với build thật trên EdgeOne.</p></div><button id="tk55-check-update" type="button" class="btn mini">↻ Kiểm tra bản mới</button></div><div class="grid g2"><div class="subcard"><b>Build đang chạy</b><div id="tk55-runtime-build" class="note"></div></div><div class="subcard"><b>Build trên server</b><div id="tk55-server-build" class="note">Đang kiểm tra…</div></div></div><p id="tk55-update-state" class="note" style="margin-top:10px">Tự kiểm tra khi mở ứng dụng và khi quay lại tab.</p>';
  page.appendChild(card);$('tk55-check-update').onclick=()=>checkServerBuild({manual:true,repair:true});
}

function setHealth(runtime=VERSION,server='',state=''){
  const h=$('health-version');if(h)h.textContent=runtime;
  const r=$('tk55-runtime-build');if(r)r.textContent=runtime;
  const s=$('tk55-server-build');if(s&&server)s.textContent=server;
  const st=$('tk55-update-state');if(st&&state)st.textContent=state;
  document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=runtime);
}

async function purgeClientShell(){
  try{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==RUNTIME_CACHE&&(k.startsWith('topkey-vnext-')||k.startsWith('topkey-sports-hub-'))).map(k=>caches.delete(k)))}catch{}
  try{const regs=await navigator.serviceWorker?.getRegistrations?.()||[];await Promise.all(regs.filter(r=>String(r.scope||'').includes('/sports/badminton/')).map(r=>r.unregister().catch(()=>false)))}catch{}
}

async function fetchBuild(){
  const url=new URL('./build.json',location.href);url.searchParams.set('__topkey_probe',`${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
  const res=await fetch(url.href,{cache:'no-store',headers:{'Cache-Control':'no-cache','Pragma':'no-cache'}});
  if(!res.ok)throw new Error(`HTTP ${res.status}`);
  const data=await res.json();if(!data?.version||!data?.build)throw new Error('build.json không hợp lệ');return data;
}

async function repairToBuild(data,manual=false){
  const guard=String(data.cacheTag||data.version||data.build||'server');
  const guardKey='topkey_u55_reload_guard_'+guard;
  let state={n:0,t:0};try{state=JSON.parse(sessionStorage.getItem(guardKey)||'{"n":0,"t":0}')}catch{}
  if(state.n>=4&&Date.now()-Number(state.t||0)<60000){setHealth(T.VERSION||VERSION,data.version,'Đã thử cập nhật 4 lần trong 60 giây. Hãy đóng/mở lại ứng dụng nếu EdgeOne còn trả HTML cũ.');return false}
  sessionStorage.setItem(guardKey,JSON.stringify({n:Number(state.n||0)+1,t:Date.now()}));
  setHealth(T.VERSION||VERSION,data.version,'Phát hiện version/cacheTag mới · đang kích hoạt Service Worker mới và xóa shell cache cũ…');
  try{
    if('serviceWorker'in navigator&&location.protocol.startsWith('http')){
      const reg=await navigator.serviceWorker.register(`./sw.js?v=${encodeURIComponent(String(data.cacheTag||Date.now()))}&_=${Date.now()}`,{updateViaCache:'none'});
      try{await reg.update()}catch{}
      if(reg.waiting)try{reg.waiting.postMessage({type:'SKIP_WAITING'})}catch{}
      if(reg.installing)try{reg.installing.postMessage({type:'SKIP_WAITING'})}catch{}
    }
  }catch{}
  await purgeClientShell();
  const keepHash=location.hash;const next=new URL('./index.html',location.href);
  next.search='';next.searchParams.set('v',String(data.cacheTag||data.version||data.build));next.searchParams.set('__topkey_reload',String(Date.now()));next.hash=keepHash;
  location.replace(next.href);return true;
}

function loginIdle(){const login=$('login-screen'),app=$('app-shell');return !location.hash.startsWith('#spectator')&&!T.Auth?.user&&!!login&&!login.classList.contains('hidden')&&(!app||app.classList.contains('hidden'))}

async function checkServerBuild({manual=false,repair=false}={}){
  ensureHealthUi();setHealth(T.VERSION||VERSION,'Đang kiểm tra…',manual?'Đang hỏi trực tiếp build.json trên EdgeOne…':'Đang kiểm tra phiên bản server…');
  try{
    const data=await fetchBuild();
    const runtimeVersion=String(window.__TOPKEY_BOOT_VERSION||T.VERSION||VERSION||'');
    const runtimeTag=String(window.__TOPKEY_BOOT_CACHE||'');
    const serverVersion=String(data.version||'');
    const serverTag=String(data.cacheTag||'');
    const sameVersion=runtimeVersion===serverVersion;
    const sameTag=!serverTag||!runtimeTag||runtimeTag===serverTag;
    if(!sameVersion||!sameTag){
      try{sessionStorage.setItem('topkey_pending_build_update',JSON.stringify({version:serverVersion,cacheTag:serverTag,at:Date.now()}))}catch{}
      if(!manual){setHealth(runtimeVersion||T.VERSION||VERSION,serverVersion,'Có bản mới trên server · KHÔNG tự reload để bảo toàn phiên đăng nhập. Bấm “Kiểm tra bản mới” nếu muốn cập nhật thủ công.');return false}
      setHealth(runtimeVersion||T.VERSION||VERSION,serverVersion,'Có bản mới trên server. Chỉ thao tác thủ công này mới được phép reload runtime.');
      if(repair)return repairToBuild(data,true);
      return false
    }
    for(let i=sessionStorage.length-1;i>=0;i--){const k=sessionStorage.key(i);if(k&&k.startsWith('topkey_u55_reload_guard_'))sessionStorage.removeItem(k)}
    setHealth(runtimeVersion||T.VERSION||VERSION,serverVersion,'✓ Runtime, version và cacheTag đều khớp server.');return true;
  }catch(e){setHealth(T.VERSION||VERSION,'Không đọc được','Không kiểm tra được build server: '+(e?.message||e));return false}
}

const baseHealth=App.renderHealth?.bind(App);if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);ensureHealthUi();setHealth(T.VERSION||VERSION);return out};
const baseShowTab=App.showTab?.bind(App);if(baseShowTab)App.showTab=function(tab,...args){const out=baseShowTab(tab,...args);if(tab==='live')setTimeout(forceLocalDefault,0);if(tab==='health')setTimeout(()=>checkServerBuild({manual:false,repair:false}),0);return out};

async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade55 SW',e)}}
function stamp(){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;ensureHealthUi();setHealth(T.VERSION||VERSION);forceLocalDefault()}
function install(){stamp();refreshSW();setTimeout(stamp,0);setTimeout(stamp,1250);setTimeout(()=>checkServerBuild({manual:false,repair:false}),1500)}
install();
window.addEventListener('focus',()=>{stamp();refreshSW();setTimeout(()=>checkServerBuild({manual:false,repair:false}),150)},{passive:true});
window.addEventListener('pageshow',()=>setTimeout(()=>{stamp();checkServerBuild({manual:false,repair:false})},250),{passive:true});
window.TopkeyUpgrade55={installed:true,VERSION,CACHE_TAG,BUILD,forceLocalDefault,checkServerBuild,fetchBuild,purgeClientShell,upgradeNo};
})();
