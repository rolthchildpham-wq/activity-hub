(() => {
'use strict';
const T=window.Topkey, App=T?.App, U=T?.U;
if(!T||!App||!U||window.__TOPKEY_H57_SHARE_ROLE_INSTALLED)return;
window.__TOPKEY_H57_SHARE_ROLE_INSTALLED=true;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roleKey=v=>String(v||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
function sharePermission(){
  const role=roleKey(T.Auth?.role?.()||T.Auth?.profile?.role||'');
  if(role==='ADMIN')return true;
  const p=T.Auth?.profile?.permissions||{};
  const module=String(p.modules?.publicLinks||'').toLowerCase();
  const detail=String(p.details?.['publicLinks:manage']||p.details?.['settings:publicLinks']||'').toLowerCase();
  if(['none','view','edit'].includes(module))return module==='view'||module==='edit';
  if(['none','view','edit'].includes(detail))return detail==='view'||detail==='edit';
  return role==='BTC';
}
async function copyText(text){
  try{await navigator.clipboard.writeText(text);U.toast('Đã sao chép đường link','ok');}
  catch{const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('data-allow-copy','true');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();U.toast('Đã sao chép đường link','ok');}
}
async function shareLink(row){
  if(navigator.share){try{await navigator.share({title:`TOPKEY · ${row.name}`,text:row.note,url:row.url});return U.toast('Đã mở bảng chia sẻ','ok');}catch(e){if(e?.name==='AbortError')return;}}
  await copyText(row.url);U.toast('Thiết bị không hỗ trợ Share; đã sao chép link','info');
}
function openQr(row){
  const modal=$('tk14-qr-modal'),box=$('tk14-qr-box');if(!modal||!box)return;
  $('tk14-qr-title').textContent='QR · '+row.name;
  $('tk14-qr-note').textContent=row.note;
  $('tk14-qr-url').value=row.url;
  box.innerHTML='';
  try{new QRCode(box,{text:row.url,width:260,height:260,colorDark:'#071426',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});}
  catch(e){box.textContent='Không tạo được QR: '+(e?.message||e);}
  $('tk14-qr-copy').onclick=()=>copyText(row.url);
  $('tk14-qr-share').onclick=()=>shareLink(row);
  $('tk14-qr-download').onclick=()=>{const c=box.querySelector('canvas'),img=box.querySelector('img'),a=document.createElement('a');a.download=`Topkey_${row.id}_${T.Data.tid}.png`;a.href=c?.toDataURL('image/png')||img?.src||'';if(a.href){a.click();U.toast('Đã tạo file QR PNG','ok')}};
  modal.classList.remove('hidden');
}
function ensureInjected(){
  try{window.TopkeyUpgrade14?.render?.();}catch{}
  const card=$('tk14-public-links-card');if(!card)return null;
  card.dataset.tk57='1';
  const title=card.querySelector('h2');if(title)title.textContent='🔗 Setup · Liên kết & Chia sẻ';
  const desc=card.querySelector('.muted');if(desc)desc.textContent='Quyền riêng: Liên kết & Chia sẻ. ADMIN cấp độc lập cho BTC; Umpire/Trọng tài mặc định không có quyền. Link Viewer và Đăng ký luôn trỏ đúng giải hiện tại.';
  const split=card.querySelector('.split');
  if(split&&!card.querySelector('.tk57-access-pill')){
    const pill=document.createElement('span');pill.className='pill tk57-access-pill';pill.textContent='ADMIN + BTC';split.appendChild(pill);
  }
  const page=$('page-settings'),firstGrid=page?.querySelector('.grid.g2');
  if(page&&firstGrid&&card.previousElementSibling!==firstGrid)firstGrid.insertAdjacentElement('afterend',card);
  return card;
}
function renderRows(){
  const card=ensureInjected();if(!card)return;
  const allowed=sharePermission();card.classList.toggle('hidden',!allowed);if(!allowed)return;
  const tid=$('tk14-link-tid');if(tid)tid.textContent='Giải: '+T.Data.tid;
  const body=$('tk14-public-links-body');if(!body)return;
  const rows=window.TopkeyUpgrade14?.links?.()||[];body.innerHTML='';
  rows.forEach(row=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><b>${esc(row.name)}</b><br><span class="muted tk14-small">${esc(row.note)}</span></td><td><span class="pill">${esc(row.audience)}</span></td><td><input class="tk14-link-input" data-allow-copy="true" readonly value="${esc(row.url)}"></td><td><div class="tk14-actions"><button class="btn mini ok" data-act="copy">⧉ Copy</button><button class="btn mini" data-act="share">↗ Share</button><button class="btn mini primary" data-act="open">↗ Mở</button><button class="btn mini" data-act="qr">▦ QR</button></div></td>`;
    tr.querySelector('[data-act="copy"]').onclick=()=>copyText(row.url);
    tr.querySelector('[data-act="share"]').onclick=()=>shareLink(row);
    tr.querySelector('[data-act="open"]').onclick=()=>window.open(row.url,'_blank','noopener');
    tr.querySelector('[data-act="qr"]').onclick=()=>openQr(row);
    body.appendChild(tr);
  });
}
const baseRenderAll=App.renderAll?.bind(App);
if(baseRenderAll&&!App.__h57RenderAll){App.__h57RenderAll=true;App.renderAll=function(...a){const r=baseRenderAll(...a);setTimeout(renderRows,0);return r;};}
const baseShowTab=App.showTab?.bind(App);
if(baseShowTab&&!App.__h57ShowTab){App.__h57ShowTab=true;App.showTab=function(tab,...a){const r=baseShowTab(tab,...a);if(tab==='settings')setTimeout(renderRows,0);return r;};}
const mo=new MutationObserver(()=>{const card=$('tk14-public-links-card');if(card&&card.dataset.tk57!=='1')setTimeout(renderRows,0);});
mo.observe(document.documentElement,{subtree:true,childList:true});
setTimeout(renderRows,0);
window.TopkeyUpgrade57={sharePermission,render:renderRows};
})();
