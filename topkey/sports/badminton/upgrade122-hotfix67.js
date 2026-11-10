(()=>{'use strict';
const T=window.Topkey,U9=window.TopkeyUpgrade9,App=T?.App,U=T?.U;
if(!T||!U9||!App||!U||window.__TOPKEY_H67_BTC_SCOPE_SAVE__)return;
window.__TOPKEY_H67_BTC_SCOPE_SAVE__=true;
const VERSION='2026.11.06-vnext-upgrade122-hotfix67-btc-scope-save-autoclose';
const SPORTS=(window.TopkeyUpgrade122Hotfix66?.SPORTS||window.TopkeyUpgrade122Hotfix64?.SPORTS||[
 {key:'badminton',name:'Cầu lông',icon:'🏸'},{key:'football',name:'Bóng đá',icon:'⚽'},{key:'volleyball',name:'Bóng chuyền',icon:'🏐'},{key:'running',name:'Chạy bộ',icon:'🏃'},{key:'handmade',name:'DIY / Handmade',icon:'🧶'},{key:'shuttle',name:'Đá cầu',icon:'🪶'},{key:'cooking',name:'Nấu ăn',icon:'👨‍🍳'}
]);
const $=id=>document.getElementById(id);
const rk=v=>String(v||'').trim().toUpperCase();
const sk=v=>String(v||'').trim().toLowerCase();
const validScope=v=>SPORTS.some(s=>s.key===sk(v));
const sportName=k=>{const s=SPORTS.find(x=>x.key===sk(k));return s?`${s.icon||''} ${s.name}`.trim():String(k||'')};
function selectedScope(){
 const el=$('tk64-edit-scope-select')||document.querySelector('#tk64-edit-scope select')||document.querySelector('select[name="sportScope"]');
 const v=sk(el?.value||el?.dataset?.lastValue||'');
 return v;
}
function rememberScope(){
 const el=$('tk64-edit-scope-select');
 if(!el||el.dataset.h67Bound==='1')return;
 el.dataset.h67Bound='1';
 const save=()=>{if(el.value)el.dataset.lastValue=el.value};
 el.addEventListener('change',save);el.addEventListener('input',save);save();
}
function clampExecutive(perms,role){if(rk(role)!=='BTC'||!perms)return perms;perms.modules=perms.modules||{};perms.details=perms.details||{};if(perms.modules.executiveDashboard==='edit')perms.modules.executiveDashboard='view';if(perms.details['executiveDashboard:view']==='edit')perms.details['executiveDashboard:view']='view';return perms}
U9.saveEditedUser=async function(){
 const uid=$('tk9-perm-uid')?.value,u=App.state.users?.[uid];if(!uid||!u)return;
 const role=rk($('tk9-perm-role')?.value||u.role);
 rememberScope();
 let scope=selectedScope();
 if(role==='BTC'&&!validScope(scope)){
   const el=$('tk64-edit-scope-select');
   if(el?.selectedIndex>0)scope=sk(el.options[el.selectedIndex]?.value||'');
 }
 if(role==='BTC'&&!validScope(scope))return U.toast('Vui lòng chọn môn BTC phụ trách trước khi lưu','err');
 const permissions=clampExecutive(this.collectPermissions('tk9-edit-permissions'),role);
 const after={...u,role,active:$('tk9-perm-active')?.checked!==false,permissions,sportScope:role==='BTC'?scope:'',assignedSport:role==='BTC'?scope:'',updatedAt:Date.now()};
 const btn=$('tk9-perm-save');if(btn){btn.disabled=true;btn.dataset.oldText=btn.textContent;btn.textContent='Đang lưu...'}
 try{
   const root=T.AUTH_ROOT||'topkey_badminton_vnext_2026';
   await T.Data.db.ref(`${root}/users/${uid}`).set(after);
   App.state.users=App.state.users||{};App.state.users[uid]=after;
   try{this.renderUsers?.()}catch{};try{App.renderUsers?.()}catch{}
   const modal=$('tk9-permission-modal');if(modal)modal.classList.add('hidden');
   U.toast(role==='BTC'?`Đã lưu BTC phụ trách ${sportName(scope)} và đóng cửa sổ`:'Đã lưu quyền tài khoản','ok');
 }catch(err){U.toast(err?.message||'Không lưu được quyền','err')}
 finally{if(btn){btn.disabled=false;btn.textContent=btn.dataset.oldText||'💾 Lưu quyền'}}
};
const mo=new MutationObserver(()=>rememberScope());
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{rememberScope();mo.observe(document.documentElement,{childList:true,subtree:true})},{once:true});else{rememberScope();mo.observe(document.documentElement,{childList:true,subtree:true})}
T.VERSION=VERSION;window.TopkeyUpgrade122Hotfix67={VERSION};
})();
