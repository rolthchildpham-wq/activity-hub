(()=>{'use strict';
const AUTH_ROOT='topkey_badminton_vnext_2026';
const SPORTS={badminton:'🏸 Cầu lông',football:'⚽ Bóng đá',volleyball:'🏐 Bóng chuyền',running:'🏃 Chạy bộ',handmade:'🧶 DIY / Handmade',shuttle:'🪶 Đá cầu',cooking:'👨‍🍳 Nấu ăn'};
function sportFromLink(a){const h=a.getAttribute('href')||'';if(h.includes('/badminton/'))return'badminton';try{return new URL(h,location.href).searchParams.get('sport')||''}catch{return''}}
function apply(profile){const role=String(profile?.role||'').toUpperCase(),scope=String(profile?.sportScope||'').toLowerCase();let banner=document.getElementById('btc-scope-hub-banner');if(role!=='BTC'){banner?.remove();return}if(!banner){banner=document.createElement('section');banner.id='btc-scope-hub-banner';banner.className='panel';banner.style.cssText='margin-bottom:18px;border-color:#0ea5e9';document.querySelector('main.wrap')?.prepend(banner)}banner.innerHTML=`<b>🔒 BTC phụ trách cố định: ${SPORTS[scope]||'Chưa gán môn'}</b><div class="muted" style="margin-top:5px">Tài khoản BTC chỉ được vận hành môn đã được ADMIN gán. Dashboard lãnh đạo chỉ đọc; cấu hình xã đoàn chỉ ADMIN.</div>`;document.querySelectorAll('a.sport').forEach(a=>{a.style.display=''});}
function boot(){if(!window.firebase)return;const db=firebase.database(),auth=firebase.auth();auth.onAuthStateChanged(async u=>{if(!u)return;try{const p=(await db.ref(`${AUTH_ROOT}/users/${u.uid}`).once('value')).val()||{};apply(p)}catch(e){console.warn('BTC scope hub',e)}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
