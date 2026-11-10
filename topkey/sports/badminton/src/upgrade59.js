(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade59Installed)return;
App.__upgrade59Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade59-focus-webapk';
const CACHE_TAG='u59-20261029';
const BUILD='upgrade59';
const $=id=>document.getElementById(id);
let installPrompt59=null;

function stamp(){
  T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
  document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;
}
function isStandalone(){return matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true}
function uaInfo(){
  const ua=navigator.userAgent||'',android=/Android/i.test(ua),samsung=/SamsungBrowser/i.test(ua),edge=/EdgA|EdgiOS/i.test(ua),opera=/OPR\//i.test(ua),firefox=/Firefox|FxiOS/i.test(ua),vendor=/VivoBrowser|HeyTapBrowser|OppoBrowser|MiuiBrowser|HuaweiBrowser|UCBrowser|Quark|AlohaBrowser/i.test(ua),chrome=/Chrome\//i.test(ua)&&!edge&&!opera&&!samsung&&!vendor;
  return {ua,android,samsung,edge,opera,firefox,vendor,chrome,webApkCandidate:android&&(chrome||samsung)};
}
function note(text,kind=''){
  const host=document.querySelector('.top-actions');if(!host)return;
  let n=$('tk59-install-note');if(!n){n=document.createElement('small');n.id='tk59-install-note';host.appendChild(n)}
  n.className='tk59-install-note'+(kind?' '+kind:'');n.textContent=text;
}
function chromeIntent(){
  const clean=new URL(location.href);clean.searchParams.delete('source');clean.searchParams.set('install','chrome');
  const noScheme=clean.href.replace(/^https?:\/\//,'');
  return `intent://${noScheme}#Intent;scheme=${clean.protocol.replace(':','')};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(clean.href)};end`;
}
function openInChrome(){
  try{location.href=chromeIntent()}catch{window.open(location.href,'_blank')}
}
function ensureSecondary(){
  const host=document.querySelector('.top-actions');if(!host)return null;
  let b=$('tk59-open-chrome');if(b)return b;
  b=document.createElement('button');b.id='tk59-open-chrome';b.type='button';b.className='btn mini tk53-install tk59-install-secondary hidden';b.textContent='🌐 Mở bằng Chrome để cài App';b.onclick=openInChrome;host.appendChild(b);return b;
}
function patchInstallButton(){
  const b=$('tk53-install');if(!b)return;
  const info=uaInfo(),secondary=ensureSecondary();
  if(isStandalone()){
    b.textContent='✓ TOPKEY đang chạy dạng ứng dụng';b.disabled=true;secondary?.classList.add('hidden');note('Đang chạy standalone: đây là bản ứng dụng đã cài.','ok');return;
  }
  // Chrome Android (or Samsung Internet on Samsung) is the path that can create a real
  // launcher-integrated WebAPK. Other Android browsers often create only a browser shortcut.
  if(info.android&&!info.webApkCandidate){
    b.textContent='🌐 Mở bằng Chrome để cài App';b.disabled=false;b.onclick=openInChrome;secondary?.classList.add('hidden');
    note('Trình duyệt hiện tại có thể chỉ tạo shortcut nên không xuất hiện trong danh sách ứng dụng. Mở bằng Chrome rồi cài lại để Android tạo app launcher khi thiết bị hỗ trợ WebAPK.','warn');return;
  }
  secondary?.classList.add('hidden');
  b.disabled=false;
  b.textContent=installPrompt59?'📲 Cài TOPKEY Badminton':'📲 Cài TOPKEY Badminton';
  b.onclick=async()=>{
    if(isStandalone())return;
    if(!installPrompt59){
      note(info.android?'Mở menu Chrome (⋮) → Cài ứng dụng. Nếu Chrome vẫn chỉ tạo shortcut, thiết bị không hỗ trợ WebAPK và cần APK Android thật.':'Dùng menu trình duyệt → Cài ứng dụng / Add to Home Screen.','warn');return;
    }
    const p=installPrompt59;installPrompt59=null;
    try{
      await p.prompt();const choice=await p.userChoice;
      if(choice?.outcome==='accepted'){
        b.textContent='⏳ Android đang hoàn tất cài đặt…';b.disabled=true;
        note('Đã chấp nhận cài. Chỉ xác nhận thành công khi app chạy ở chế độ standalone; nếu không thấy trong launcher, mở lại bằng Chrome và kiểm tra Cài ứng dụng.','warn');
        setTimeout(()=>{if(!isStandalone()){b.textContent='▶ Mở/kiểm tra TOPKEY';b.disabled=false}},5000);
      }else{b.textContent='📲 Cài TOPKEY Badminton';b.disabled=false;note('Bạn đã hủy cài đặt.','warn')}
    }catch(e){b.textContent='📲 Cài TOPKEY Badminton';b.disabled=false;note('Không mở được trình cài PWA: '+String(e?.message||e),'bad')}
  };
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt59=e;setTimeout(patchInstallButton,0)});
window.addEventListener('appinstalled',()=>{
  installPrompt59=null;
  const b=$('tk53-install');if(b){b.textContent='✓ Trình duyệt đã cài TOPKEY';b.disabled=false}
  // appinstalled proves the browser completed its install flow, but not every Android browser
  // creates a launcher-visible WebAPK. Do not claim that the launcher icon exists.
  const info=uaInfo();
  note(info.webApkCandidate?'Trình duyệt đã hoàn tất cài. Hãy mở TOPKEY từ icon vừa tạo; khi chạy standalone nút này sẽ đổi thành “đang chạy dạng ứng dụng”.':'Trình duyệt đã hoàn tất kiểu cài của nó, nhưng kiểu này có thể chỉ là shortcut và không hiện trong danh sách ứng dụng. Hãy mở bằng Chrome để cài dạng app launcher.','warn');
  setTimeout(patchInstallButton,300);
});

// Upgrade58 already owns Start Match -> score focus. Upgrade59 makes the viewport strict and
// always scrolls the scoring board to the top after focus is entered/rendered.
function normalizeScoreFocus(){
  if(!document.body.classList.contains('tk58-score-focus'))return;
  const page=$('page-umpire'),card=page?.querySelector(':scope > .card'),board=$('umpire-board');
  if(card){try{card.scrollTop=0}catch{}}
  if(board){try{board.scrollIntoView({block:'start',inline:'nearest'})}catch{}}
}
const baseRender=App.renderUmpire?.bind(App);
if(baseRender)App.renderUmpire=function(...args){const out=baseRender(...args);if(document.body.classList.contains('tk58-score-focus'))setTimeout(normalizeScoreFocus,0);return out};
const U58=window.TopkeyUpgrade58;
if(U58?.enterScoreFocus){const baseEnter=U58.enterScoreFocus;U58.enterScoreFocus=async function(...args){const out=await baseEnter(...args);setTimeout(normalizeScoreFocus,0);return out}}

const baseHealth=App.renderHealth?.bind(App);
if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade59 SW',e)}}
function install(){stamp();ensureSecondary();patchInstallButton();normalizeScoreFocus();setTimeout(()=>{stamp();patchInstallButton();normalizeScoreFocus()},0);setTimeout(()=>{patchInstallButton();normalizeScoreFocus()},900);refreshSW()}
install();
window.addEventListener('focus',()=>{stamp();patchInstallButton();normalizeScoreFocus();refreshSW()},{passive:true});
window.addEventListener('pageshow',()=>{patchInstallButton();normalizeScoreFocus()},{passive:true});
window.TopkeyUpgrade59={installed:true,VERSION,CACHE_TAG,BUILD,isStandalone,uaInfo,openInChrome,normalizeScoreFocus};
})();
