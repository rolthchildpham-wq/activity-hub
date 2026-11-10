(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||App.__upgrade53Installed)return;
App.__upgrade53Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade53';
const CACHE_TAG='u58-20261029';
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
let installPrompt=null;
const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
function ensureViewport(){let m=document.querySelector('meta[name="viewport"]');if(!m){m=document.createElement('meta');m.name='viewport';document.head.appendChild(m)}m.content='width=device-width,initial-scale=1,maximum-scale=5,viewport-fit=cover';document.documentElement.style.setProperty('--tk53-vw',`${window.visualViewport?.width||innerWidth}px`)}
function setInstallText(text,disabled=false){const b=document.getElementById('tk53-install');if(b){b.textContent=text;b.disabled=disabled}}
function installButton(){const host=document.querySelector('.top-actions');if(!host||document.getElementById('tk53-install'))return;const b=document.createElement('button');b.id='tk53-install';b.type='button';b.className='btn mini tk53-install';b.textContent=isStandalone()?'✓ TOPKEY đang chạy dạng ứng dụng':'📲 Cài TOPKEY trên máy';if(isStandalone())b.disabled=true;b.onclick=async()=>{if(isStandalone())return;if(installPrompt){const p=installPrompt;installPrompt=null;try{await p.prompt();const choice=await p.userChoice;if(choice?.outcome==='accepted'){setInstallText('⏳ Đang cài TOPKEY…',true);try{U?.toast?.('Android đang cài TOPKEY. Chờ thông báo hoàn tất.','info')}catch{};setTimeout(()=>{if(!isStandalone()){setInstallText('📲 Kiểm tra TOPKEY trong danh sách ứng dụng',false)}},7000)}else{setInstallText('📲 Cài TOPKEY trên máy',false)}}catch{setInstallText('📲 Cài TOPKEY trên máy',false)}return}const android=/Android/i.test(navigator.userAgent);alert(android?'TOPKEY bản web cài theo chuẩn PWA. Mở menu trình duyệt (⋮) → “Cài ứng dụng”. Sau khi Android báo hoàn tất, tìm “TOPKEY Badminton” trong danh sách ứng dụng; launcher có thể không tự đặt icon ra màn hình chính.':'Trình duyệt này chưa phát sự kiện cài PWA. Hãy dùng menu trình duyệt → Cài ứng dụng / Add to Home Screen.');};host.appendChild(b)}
function tableHints(){if(innerWidth>900)return;document.querySelectorAll('.table-wrap').forEach(w=>{if(w.nextElementSibling?.classList?.contains('tk53-mobile-table-note'))return;const n=document.createElement('div');n.className='tk53-mobile-table-note';n.textContent='↔ Vuốt ngang để xem đủ các cột';w.insertAdjacentElement('afterend',n)})}
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild='upgrade53';try{App.renderHealth?.()}catch{}const h=document.getElementById('health-version');if(h)h.textContent=VERSION}
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const r=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await r.update()}catch{}}catch(e){console.warn('Upgrade53 SW',e)}}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;installButton();if(!isStandalone())setInstallText('📲 Cài TOPKEY trên máy',false)});
window.addEventListener('appinstalled',()=>{installPrompt=null;setInstallText('✓ TOPKEY đã cài',true);try{U?.toast?.('Đã cài TOPKEY Badminton. Tìm ứng dụng trong danh sách app Android.','ok')}catch{}});
function install(){ensureViewport();installButton();tableHints();stamp();refreshSW();setTimeout(()=>{installButton();tableHints();stamp()},0);setTimeout(()=>{tableHints();stamp()},1000)}
install();window.addEventListener('resize',()=>{ensureViewport();tableHints()},{passive:true});window.visualViewport?.addEventListener('resize',ensureViewport,{passive:true});window.addEventListener('focus',()=>{stamp();refreshSW();if(isStandalone())setInstallText('✓ TOPKEY đang chạy dạng ứng dụng',true)},{passive:true});
window.TopkeyUpgrade53={installed:true,VERSION,CACHE_TAG,isStandalone};
})();
