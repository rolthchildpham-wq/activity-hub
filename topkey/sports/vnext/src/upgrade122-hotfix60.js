(() => {
'use strict';
const T=window.Topkey, App=T?.App, U9=window.TopkeyUpgrade9;
if(!T||!App||!U9||window.__TOPKEY_H60_PUBLIC_LINK_PERMISSION__)return;
window.__TOPKEY_H60_PUBLIC_LINK_PERMISSION__=true;
const VERSION='2026.11.06-vnext-upgrade122-hotfix60-public-links-permission-card';
const CACHE_TAG='u122h60-20261106';
T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;window.__TOPKEY_BOOT_VERSION=VERSION;window.__TOPKEY_BOOT_CACHE=CACHE_TAG;
const $=id=>document.getElementById(id);
const roleKey=v=>String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]+/g,'_');
function roleForEditor(id){
  if(id==='tk9-edit-permissions')return roleKey($('tk9-perm-role')?.value||T.Auth?.profile?.role||'VIEWER');
  return roleKey($('user-form')?.querySelector('[name="role"]')?.value||'VIEWER');
}
function explicitMode(p){
  const m=String(p?.modules?.publicLinks||'').toLowerCase();
  if(['none','view','edit'].includes(m))return m;
  const d=String(p?.details?.['publicLinks:manage']||p?.details?.['settings:publicLinks']||'').toLowerCase();
  return ['none','view','edit'].includes(d)?d:'';
}
function defaultMode(role,p){
  const ex=explicitMode(p);if(ex)return ex;
  role=roleKey(role);if(role==='ADMIN')return'edit';if(role==='BTC')return'edit';return'none';
}
function appendCard(id,p){
  const box=$(id);if(!box||box.querySelector('[data-perm-module="publicLinks"]'))return;
  const role=roleForEditor(id),current=defaultMode(role,p);
  const d=document.createElement('details');d.className='tk9-perm-module tk60-public-links-permission';d.open=true;
  d.innerHTML=`<summary><span class="tk9-perm-head"><span>🔗 Liên kết & Chia sẻ</span><select data-perm-module="publicLinks"><option value="none" ${current==='none'?'selected':''}>Ẩn</option><option value="view" ${current==='view'?'selected':''}>Chỉ xem</option><option value="edit" ${current==='edit'?'selected':''}>Chỉnh sửa</option></select></span></summary><div class="tk9-perm-details"><label class="tk9-perm-detail"><span>Viewer / Đăng ký / Sports Hub · Copy / Share / Mở / QR</span><select data-perm-detail="publicLinks:manage"><option value="none" ${current==='none'?'selected':''}>Ẩn</option><option value="view" ${current==='view'?'selected':''}>Xem</option><option value="edit" ${current==='edit'?'selected':''}>Sửa</option></select></label></div>`;
  const mod=d.querySelector('[data-perm-module]'),detail=d.querySelector('[data-perm-detail]');mod.onchange=()=>{detail.value=mod.value};
  box.appendChild(d);
}
const baseRender=U9.renderPermissionEditor.bind(U9);
U9.renderPermissionEditor=function(id,p){const r=baseRender(id,p);appendCard(id,p);return r};
// Add to editors already on screen.
setTimeout(()=>{appendCard('tk9-create-permissions',null);appendCard('tk9-edit-permissions',T.Auth?.profile?.permissions)},0);
function accessMode(){
  const role=roleKey(T.Auth?.role?.()||T.Auth?.profile?.role||'VIEWER');if(role==='ADMIN')return'edit';
  const p=T.Auth?.profile?.permissions||{};const ex=explicitMode(p);if(ex)return ex;
  return role==='BTC'?'edit':'none'; // legacy BTC migration default until ADMIN saves the new card
}
function apply(){
  const card=$('tk14-public-links-card');if(!card)return;const mode=accessMode();
  card.classList.toggle('hidden',mode==='none');card.classList.toggle('tk9-readonly',mode==='view');
  const pill=card.querySelector('.tk57-access-pill');if(pill)pill.textContent=mode==='edit'?'Quyền: Chỉnh sửa':mode==='view'?'Quyền: Chỉ xem':'Không quyền';
  const desc=card.querySelector('.muted');if(desc)desc.textContent='Quyền riêng: Liên kết & Chia sẻ. ADMIN cấp độc lập cho BTC; không phụ thuộc quyền Cài đặt.';
}
const baseAll=App.renderAll?.bind(App);if(baseAll&&!App.__h60All){App.__h60All=true;App.renderAll=function(...a){const r=baseAll(...a);setTimeout(apply,0);return r}};
const baseTab=App.showTab?.bind(App);if(baseTab&&!App.__h60Tab){App.__h60Tab=true;App.showTab=function(tab,...a){const r=baseTab(tab,...a);if(tab==='settings')setTimeout(apply,0);return r}};
window.TopkeyLifecycle?.bind(apply,{settleTicks:8,settleEvery:300,debounceMs:50});setTimeout(apply,0);
window.TopkeyUpgrade122Hotfix60={VERSION,CACHE_TAG,accessMode,appendCard,apply};
})();
