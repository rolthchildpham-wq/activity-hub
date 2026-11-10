(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U)return;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sportName=()=>T.SPORT?.name||'Cầu lông';
const canManagePublicLinks=()=>{const r=String(T.Auth?.role?.()||T.Auth?.profile?.role||'').toUpperCase();if(r==='ADMIN'||['BTC','ORGANIZER','BAN_TO_CHUC','BAN_TO_CHUC_GIAI'].includes(r))return true;const p=T.Auth?.profile?.permissions||{},m=String(p.modules?.settings||'').toLowerCase();return m==='view'||m==='edit';};

function withTournament(hash,extra={}){
  const u=new URL(location.href);
  u.hash='';
  u.searchParams.set('tid',T.Data.tid);
  Object.entries(extra).forEach(([k,v])=>{if(v===undefined||v===null||v==='')u.searchParams.delete(k);else u.searchParams.set(k,String(v));});
  u.hash=hash;
  return u.toString();
}
function spectatorUrl(){return withTournament('spectator',{reg:null});}
function registrationUrl(){
  const cfg=window.TopkeyUpgrade9?.registrationConfig?.()||App.state.config?.registration||{};
  return withTournament('register',{reg:cfg.token||''});
}
function hubUrl(){return new URL('../../index.html',location.href).toString();}
function links(){return[
  {id:'viewer',name:'Khán giả / Viewer công khai',audience:'Không cần đăng nhập',url:spectatorUrl(),note:'Lịch thi đấu · Kết quả · BXH · Live realtime'},
  {id:'register',name:'Đăng ký công khai',audience:'Không cần đăng nhập',url:registrationUrl(),note:'Form đăng ký của giải hiện tại'},
  {id:'hub',name:'TOPKEY Sports Hub',audience:'Công khai',url:hubUrl(),note:'Màn hình chọn tất cả môn thể thao'}
];}
function inject(){
  if($('tk14-public-links-card'))return;
  const page=$('page-settings');if(!page)return;
  const card=document.createElement('div');card.id='tk14-public-links-card';card.className='card tk14-public-links';card.innerHTML=`<div class="split"><div><h2>🔗 Liên kết công khai / Chia sẻ</h2><p class="muted">Dành cho ADMIN và BTC/Organizer có quyền Setup. Umpire/Trọng tài không hiển thị mục này. Link Viewer và Đăng ký luôn trỏ đúng giải hiện tại.</p></div><span class="pill" id="tk14-link-tid"></span></div><div class="table-wrap"><table><thead><tr><th>Màn hình</th><th>Đối tượng</th><th>Đường link</th><th>Thao tác</th></tr></thead><tbody id="tk14-public-links-body"></tbody></table></div>`;
  const firstGrid=page.querySelector('.grid.g2');
  if(firstGrid)firstGrid.insertAdjacentElement('afterend',card);else page.prepend(card);

  const modal=document.createElement('div');modal.id='tk14-qr-modal';modal.className='modal hidden';modal.innerHTML=`<div class="modal-box"><div class="split"><div><h2 id="tk14-qr-title">QR chia sẻ</h2><p class="muted" id="tk14-qr-note"></p></div><button id="tk14-qr-close" class="btn mini">Đóng</button></div><div id="tk14-qr-box" class="tk14-qr-box"></div><div class="field"><label>Đường link</label><input id="tk14-qr-url" data-allow-copy="true" readonly></div><div class="action-bar"><button id="tk14-qr-copy" class="btn ok">⧉ Sao chép</button><button id="tk14-qr-share" class="btn primary">↗ Chia sẻ</button><button id="tk14-qr-download" class="btn">⬇ Tải QR PNG</button></div></div>`;
  document.body.appendChild(modal);
  $('tk14-qr-close').onclick=()=>modal.classList.add('hidden');
  modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden')});
}
async function copyText(text){
  try{await navigator.clipboard.writeText(text);U.toast('Đã sao chép đường link','ok');}
  catch{const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('data-allow-copy','true');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();U.toast('Đã sao chép đường link','ok');}
}
async function shareLink(row){
  if(navigator.share){try{await navigator.share({title:`TOPKEY · ${row.name}`,text:row.note,url:row.url});return U.toast('Đã mở bảng chia sẻ','ok');}catch(e){if(e?.name==='AbortError')return;}}
  await copyText(row.url);U.toast('Thiết bị không hỗ trợ Share; đã sao chép link','info');
}
function qrCanvas(){return $('tk14-qr-box')?.querySelector('canvas')||null;}
function openQr(row){
  const m=$('tk14-qr-modal'),box=$('tk14-qr-box');if(!m||!box)return;
  $('tk14-qr-title').textContent='QR · '+row.name;$('tk14-qr-note').textContent=row.note;$('tk14-qr-url').value=row.url;box.innerHTML='';
  try{new QRCode(box,{text:row.url,width:260,height:260,colorDark:'#071426',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});}catch(e){box.textContent='Không tạo được QR: '+e.message;}
  $('tk14-qr-copy').onclick=()=>copyText(row.url);$('tk14-qr-share').onclick=()=>shareLink(row);$('tk14-qr-download').onclick=()=>{const c=qrCanvas(),img=box.querySelector('img'),a=document.createElement('a');a.download=`Topkey_${row.id}_${T.Data.tid}.png`;a.href=c?.toDataURL('image/png')||img?.src||'';if(a.href){a.click();U.toast('Đã tạo file QR PNG','ok')}};m.classList.remove('hidden');
}
function render(){
  inject();const card=$('tk14-public-links-card');if(!card)return;
  card.classList.toggle('hidden',!canManagePublicLinks());if(!canManagePublicLinks())return;
  $('tk14-link-tid').textContent='Giải: '+T.Data.tid;
  const body=$('tk14-public-links-body');body.innerHTML='';
  links().forEach(row=>{const tr=document.createElement('tr');tr.innerHTML=`<td><b>${esc(row.name)}</b><br><span class="muted tk14-small">${esc(row.note)}</span></td><td><span class="pill">${esc(row.audience)}</span></td><td><input class="tk14-link-input" data-allow-copy="true" readonly value="${esc(row.url)}"></td><td><div class="tk14-actions"><button class="btn mini ok" data-act="copy">⧉ Copy</button><button class="btn mini" data-act="share">↗ Share</button><button class="btn mini primary" data-act="open">↗ Mở</button><button class="btn mini" data-act="qr">▦ QR</button></div></td>`;
    tr.querySelector('[data-act="copy"]').onclick=()=>copyText(row.url);tr.querySelector('[data-act="share"]').onclick=()=>shareLink(row);tr.querySelector('[data-act="open"]').onclick=()=>window.open(row.url,'_blank','noopener');tr.querySelector('[data-act="qr"]').onclick=()=>openQr(row);body.appendChild(tr);});
}

// Registration URLs must also carry the tournament id, so a new device opens the same tournament.
if(window.TopkeyUpgrade9){window.TopkeyUpgrade9.registrationUrl=registrationUrl;}
const baseRenderAll=App.renderAll?.bind(App);if(baseRenderAll)App.renderAll=function(){const r=baseRenderAll();render();return r;};
const baseShowTab=App.showTab?.bind(App);if(baseShowTab)App.showTab=function(tab){const r=baseShowTab(tab);if(tab==='settings')setTimeout(render,0);return r;};
setTimeout(()=>{render();window.TopkeyUpgrade9?.renderRegistrationQR?.();},0);
window.TopkeyUpgrade14={render,links,spectatorUrl,registrationUrl,hubUrl};
})();
