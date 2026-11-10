(function(){
'use strict';
const TAG='u122h47-20261104';
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const FIREBASE_CACHE='topkey-firebase-sdk-9.23.0';
const FIREBASE_URLS=[
 'https://cdnjs.cloudflare.com/ajax/libs/firebase/9.23.0/firebase-app-compat.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/firebase/9.23.0/firebase-auth-compat.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/firebase/9.23.0/firebase-database-compat.min.js'
];
const ADMIN_ASSETS=['./assets/u122/admin-core.01369a4334cb.js','./assets/u122/admin-core.11cda5bc98f3.css'];
const RUNTIME_ASSETS=['./testlab122.js','./upgrade121.js','./upgrade122-hotfix5.js','./upgrade122-hotfix6.css','./upgrade122-hotfix6.js','./upgrade122-hotfix7.css','./upgrade122-hotfix7.js','./upgrade122-hotfix10.css','./upgrade122-hotfix10.js','./upgrade122-hotfix11.js','./upgrade122-hotfix14.js','./upgrade122-hotfix15.js','./upgrade122-hotfix18.css','./upgrade122-hotfix18.js','./upgrade122-hotfix20.js','./upgrade122-hotfix21.js','./upgrade122-hotfix22.js','./upgrade122-hotfix25.css','./upgrade122-hotfix25.js','./upgrade122-hotfix26.js','./upgrade122-hotfix27.js','./upgrade122-hotfix28.css','./upgrade122-hotfix28.js','./upgrade122-hotfix29.js','./upgrade122-hotfix30.css','./upgrade122-hotfix30.js'];

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let checking=false;
function T(){return window.Topkey}
function role(){return String(T()?.Auth?.role?.()||'').toUpperCase()}
async function cacheHas(url){try{const hit=await caches.match(url,{ignoreSearch:true});return !!hit}catch{return false}}
async function cacheNameHas(name){try{return (await caches.keys()).includes(name)}catch{return false}}
async function countDayButtons(){const rows=[...document.querySelectorAll('#matches-list tr.tk12-day-row')];const buttons=rows.filter(r=>r.querySelector('.tk-h17-day-btn')).length;return {rows:rows.length,buttons}}
async function piperState(){const P=window.TopkeyUpgrade47?.Piper;let installed=!!P?.installed;if(P?.refresh&&(navigator.onLine!==false||P.module))try{installed=await P.refresh()}catch{};return {installed,hot:!!P?.fastSession||P?.phase==='ready'||P?.phase==='play'}}
function item(label,state,detail){return {label,state,detail}}
async function inspect(){
 const app=T()?.App,data=T()?.Data;
 const adminJs=await cacheHas(ADMIN_ASSETS[0]),adminCss=await cacheHas(ADMIN_ASSETS[1]);
 const fb=[];for(const u of FIREBASE_URLS)fb.push(await cacheHas(u));
 const p=await piperState(),day=await countDayButtons(),r=role();
 const user=data?.auth?.currentUser||null,authOk=!!user;
 const dataOk=!!(app?.state?.config&&Object.keys(app?.state?.matches||{}).length);
 const sw=!!navigator.serviceWorker?.controller;
 const audio=!!app?.audioUnlocked;
 const items=[
  item('Service Worker đang kiểm soát',sw,sw?'OK':'Mở lại app một lần sau khi deploy để SW nhận quyền kiểm soát.'),
  item('Admin bundle offline',adminJs&&adminCss,`${adminJs?'JS ✓':'JS ✗'} · ${adminCss?'CSS ✓':'CSS ✗'}`),
  item('Firebase SDK offline cache',fb.every(Boolean),`App ${fb[0]?'✓':'✗'} · Auth ${fb[1]?'✓':'✗'} · Database ${fb[2]?'✓':'✗'}`),
  item('Phiên đăng nhập đã lưu',authOk,authOk?`${user.email||user.uid||'Firebase user'} · role ${role()||'—'}`:'Cần đăng nhập UMPIRE/ADMIN khi còn mạng ít nhất một lần.'),
  item('Dữ liệu giải đã có trên máy',dataOk,dataOk?`${Object.keys(app.state.matches||{}).length} trận · ${Object.keys(app.state.teams||{}).length} đội`:'Chưa thấy config/matches trong state hiện tại.'),
  item('TOPKEY Offline Voice',p.installed,p.installed?(p.hot?'Piper HOT/READY':'Piper đã cài; sẽ warm khi vào Trọng tài'):'Chưa cài model giọng Việt (~63 MB).'),
  item('Audio đã unlock',audio,audio?'Sẵn sàng phát BLV':'Bấm Chuẩn bị Offline/Trọng tài để mở audio bằng thao tác người dùng.'),
  item('Nút Sắp time theo ngày',r!=='ADMIN'||(day.rows>0&&day.buttons===day.rows),r==='ADMIN'?(day.rows?`${day.buttons}/${day.rows} header ngày có nút`:'Chưa mở/render bảng lịch'):'Không áp dụng cho UMPIRE/VIEWER · chỉ ADMIN được sắp lịch')
 ];
 return {items,pass:items.every(x=>x.state),day};
}
function renderReport(rep){const box=$('tk-h18-results');if(!box)return;box.innerHTML=rep.items.map(x=>`<div class="tk-h18-check ${x.state?'ok':'bad'}"><b>${x.state?'✓':'✗'} ${esc(x.label)}</b><span>${esc(x.detail)}</span></div>`).join('')+`<div class="tk-h18-summary ${rep.pass?'ok':'bad'}">${rep.pass?'✓ MÁY ĐÃ SẴN SÀNG OFFLINE UMPIRE':'⚠ CÒN HẠNG MỤC CHƯA SẴN SÀNG'}</div>`}
async function runCheck(showToast=true){if(checking)return;checking=true;const btn=$('tk-h18-check');if(btn){btn.disabled=true;btn.textContent='Đang kiểm tra…'}try{window.TopkeyUpgrade122Hotfix17?.mount?.();const r=await inspect();renderReport(r);if(showToast)T()?.U?.toast?.(r.pass?'Offline UMPIRE: PASS':'Offline UMPIRE: còn mục chưa sẵn sàng',r.pass?'ok':'err');return r}finally{checking=false;if(btn){btn.disabled=false;btn.textContent='🧪 Kiểm tra Offline UMPIRE'}}}
async function warmUrl(url,cacheName){const c=await caches.open(cacheName);const hit=await c.match(url,{ignoreSearch:true});if(hit)return true;const r=await fetch(url,{cache:'no-store'});if(!r||!(r.ok||r.type==='opaque'))throw new Error('Không tải được '+url);await c.put(url,r.clone());return true}
async function prepareOffline(){
 const btn=$('tk-h18-prepare');if(btn){btn.disabled=true;btn.textContent='Đang chuẩn bị…'}
 const status=$('tk-h18-status');const set=s=>{if(status)status.textContent=s};
 try{
  set('1/4 · Cache app/runtime…');for(const u of [...ADMIN_ASSETS,...RUNTIME_ASSETS])await warmUrl(new URL(u,location.href).href,'topkey-vnext-2026-upgrade122-hotfix42-missing-withdrawal-fixtures');
  set('2/4 · Cache Firebase SDK…');for(const u of FIREBASE_URLS)await warmUrl(u,FIREBASE_CACHE);
  set('3/4 · Kiểm tra TOPKEY Offline Voice…');const P=window.TopkeyUpgrade47?.Piper;if(P?.refresh)await P.refresh();if(P&&!P.installed&&navigator.onLine!==false&&P.install)await P.install();
  set('4/4 · Mở audio và phục hồi nút time…');try{await T()?.App?.unlockAudio?.()}catch{};window.TopkeyUpgrade122Hotfix17?.mount?.();
  set('Đã chuẩn bị xong. Đang kiểm tra lại…');await runCheck(false);T()?.U?.toast?.('Đã chuẩn bị Offline UMPIRE','ok');
 }catch(e){set('Lỗi chuẩn bị offline: '+(e?.message||e));T()?.U?.toast?.('Chuẩn bị Offline chưa hoàn tất','err')}finally{if(btn){btn.disabled=false;btn.textContent='📦 Chuẩn bị Offline'}}
}
function mount(){
 const page=$('page-health');if(!page)return false;
 let card=$('tk-h18-offline-card');if(card)return true;
 card=document.createElement('section');card.id='tk-h18-offline-card';card.className='card tk-h18-card';
 card.innerHTML=`<div class="tk-h18-head"><div><h3>🛡 Offline UMPIRE Readiness</h3><p class="muted">Kiểm tra trước khi ra sân: cache app/Firebase, phiên Auth, dữ liệu giải, Piper, audio và nút Sắp time theo ngày.</p></div><div class="tk-h18-actions"><button id="tk-h18-check" class="btn" type="button">🧪 Kiểm tra Offline UMPIRE</button><button id="tk-h18-prepare" class="btn primary" type="button">📦 Chuẩn bị Offline</button></div></div><div id="tk-h18-status" class="muted"></div><div id="tk-h18-results" class="tk-h18-results"></div>`;
 page.appendChild(card);$('tk-h18-check').onclick=()=>runCheck(true);$('tk-h18-prepare').onclick=prepareOffline;setTimeout(()=>runCheck(false),700);return true;
}
function install(){
 const t=T();if(t){t.CONFIG_VERSION=VERSION;t.VERSION=VERSION;t.RUNTIME_BUILD=VERSION}
 document.documentElement.dataset.topkeyBuild='upgrade122-hotfix36';
 const App=t?.App;if(App&&!App.__u122h18HealthWrap){App.__u122h18HealthWrap=true;const base=App.renderHealth?.bind(App);App.renderHealth=function(...a){const out=base?.(...a);const hv=$('health-version');if(hv)hv.textContent=VERSION;mount();return out}}
 mount();window.addEventListener('topkey:admin-ready',()=>setTimeout(()=>{mount();runCheck(false)},250),{passive:true});window.addEventListener('topkey:tab-change',()=>setTimeout(mount,80),{passive:true});window.TopkeyUpgrade122Hotfix18={TAG,VERSION,inspect,runCheck,prepareOffline,mount};
}
let n=0;const iv=setInterval(()=>{if(T()?.App){clearInterval(iv);install()}else if(++n>180)clearInterval(iv)},100);if(document.readyState!=='loading'&&T()?.App){clearInterval(iv);install()}
})();
