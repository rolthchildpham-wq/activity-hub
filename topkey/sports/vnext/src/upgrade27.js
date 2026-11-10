(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,U9=window.TopkeyUpgrade9;
if(!T||!App||!U||!U9||App.__upgrade27Installed)return;
App.__upgrade27Installed=true;
const $=id=>document.getElementById(id);
const AUTH_ROOT=T.AUTH_ROOT||T.ROOT;
const BUILTIN=['ADMIN','BTC','UMPIRE','VIEWER','LIVE_ONLY'];
const MODULE_KEYS=['overview','control','teams','schedule','umpire','live','finance','announcements','audit','health','settings'];
const BUILTIN_MODULES={
 ADMIN:Object.fromEntries(MODULE_KEYS.map(k=>[k,'edit'])),
 BTC:{overview:'view',control:'edit',teams:'edit',schedule:'edit',umpire:'view',live:'edit',finance:'view',announcements:'edit',audit:'view',health:'view',settings:'view'},
 UMPIRE:{overview:'view',control:'edit',teams:'none',schedule:'view',umpire:'edit',live:'edit',finance:'none',announcements:'view',audit:'none',health:'view',settings:'none'},
 VIEWER:{overview:'view',control:'none',teams:'none',schedule:'view',umpire:'none',live:'view',finance:'none',announcements:'view',audit:'none',health:'none',settings:'none'},
 LIVE_ONLY:{overview:'none',control:'none',teams:'none',schedule:'none',umpire:'none',live:'view',finance:'none',announcements:'none',audit:'none',health:'none',settings:'none'}
};
const DETAILS={
 overview:['stats','top3'],control:['courts','assign'],teams:['add','registration','checkin','list'],schedule:['create','smart','delete','standings'],umpire:['view','score'],live:['view','configure','commentary'],finance:['view','edit','export'],announcements:['view','edit'],audit:['view'],health:['view'],settings:['config','accounts','appearance','security','finish','backup']
};
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function roleKey(v){return String(v||'').trim().replace(/Đ/g,'D').replace(/đ/g,'d').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40);}
function cleanLevel(v){return ['none','view','edit'].includes(v)?v:'none';}
function defaultPermissions(role='VIEWER'){
 role=roleKey(role)||'VIEWER';const src=BUILTIN_MODULES[role]||BUILTIN_MODULES.VIEWER,modules={},details={};
 MODULE_KEYS.forEach(m=>{modules[m]=cleanLevel(src[m]||'none');(DETAILS[m]||[]).forEach(d=>details[`${m}:${d}`]=modules[m]);});
 return{modules,details};
}
function normalizePermissions(raw,baseRole='VIEWER'){
 const out=defaultPermissions(baseRole),p=raw&&typeof raw==='object'?raw:{};
 Object.entries(p.modules||{}).forEach(([k,v])=>{if(MODULE_KEYS.includes(k))out.modules[k]=cleanLevel(v)});
 Object.entries(p.details||{}).forEach(([k,v])=>{if(k.includes(':'))out.details[k]=cleanLevel(v)});
 return out;
}
function tabsFromPermissions(perms){const p=normalizePermissions(perms,'VIEWER');return MODULE_KEYS.filter(k=>p.modules[k]!=='none');}
function registerRuntimeRole(role,perms){role=roleKey(role);if(!role)return;if(!T.ROLES[role])T.ROLES[role]=tabsFromPermissions(perms);else if(!BUILTIN.includes(role))T.ROLES[role]=tabsFromPermissions(perms);}

const Upgrade={
 roles:{},roleRef:null,editingRole:'',
 install(){this.patchAuth();this.injectRoleManager();this.patchApp();this.bind();this.renderRoleOptions();},
 patchAuth(){
   if(T.Auth.__u27Patched)return;T.Auth.__u27Patched=true;
   const baseNormalize=(T.Auth.normalizeProfile||T.Auth.normalize).bind(T.Auth);
   const patchedNormalize=(raw,user)=>{
     const requested=roleKey(raw?.role||'VIEWER')||'VIEWER';
     if(!BUILTIN.includes(requested))registerRuntimeRole(requested,raw?.permissions);
     const p=baseNormalize(raw,user);
     if(!BUILTIN.includes(requested))p.role=requested;
     registerRuntimeRole(p.role,p.permissions);
     return p;
   };
   T.Auth.normalizeProfile=patchedNormalize;T.Auth.normalize=patchedNormalize;
   T.Auth.role=()=>{
     const r=roleKey(T.Auth.profile?.role||'VIEWER')||'VIEWER';registerRuntimeRole(r,T.Auth.profile?.permissions);return r;
   };
   const baseCreate=T.Auth.createUser.bind(T.Auth);
   T.Auth.createUser=async(email,password,role,displayName)=>{
     const r=roleKey(role)||'VIEWER';
     if(!BUILTIN.includes(r)&&!this.roles[r])throw new Error('Vai trò tùy chỉnh chưa được lưu trong Firebase');
     registerRuntimeRole(r,this.roles[r]?.permissions);
     return baseCreate(email,password,r,displayName);
   };
 },
 patchApp(){
   const baseAfter=App.afterLogin?.bind(App);if(baseAfter&&!App.__u27After){App.__u27After=true;App.afterLogin=async(...args)=>{const r=await baseAfter(...args);this.startRoleListener();this.renderRoleOptions();return r;};}
   const baseSubscribe=App.subscribe?.bind(App);if(baseSubscribe&&!App.__u27Subscribe){App.__u27Subscribe=true;App.subscribe=(...args)=>{const r=baseSubscribe(...args);this.startRoleListener();return r;};}
   const baseAssign=App.assignUmpire?.bind(App);if(baseAssign&&!App.__u27Assign){App.__u27Assign=true;App.assignUmpire=async courtId=>{
     if(T.Auth.role()!=='ADMIN')return baseAssign(courtId);
     const candidates=Object.values(App.state.users||{}).filter(u=>u.active!==false&&(u.role==='UMPIRE'||u.permissions?.modules?.umpire==='edit'));
     if(!candidates.length)return U.toast('Chưa có tài khoản có quyền Chấm điểm = Chỉnh sửa','err');
     const list=candidates.map((u,i)=>`${i+1}. ${u.displayName||u.email} · ${u.role||'VIEWER'}`).join('\n'),pick=Number(prompt('Chọn trọng tài / tài khoản có quyền chấm điểm:\n'+list,'1'))-1;
     if(!candidates[pick])return;const c=App.state.courts[courtId],after={...c,umpireUid:candidates[pick].uid};await T.Data.queueSet('courts/'+courtId,after,{type:'ASSIGN_UMPIRE'});await T.Data.audit('ASSIGN_UMPIRE','court',courtId,c,after);
   };}
 },
 injectRoleManager(){
   if($('tk27-role-card'))return;const perm=$('tk9-permission-card');if(!perm)return;
   const card=document.createElement('div');card.id='tk27-role-card';card.className='card tk27-role-card';card.innerHTML=`<div class="split"><div><h2>🧩 Vai trò phân quyền tùy chỉnh</h2><p class="muted">ADMIN có thể tạo thêm vai trò và đặt bộ quyền mặc định riêng. ADMIN hệ thống luôn toàn quyền và không thể xóa.</p></div><span class="pill">Upgrade 27</span></div>
   <div class="tk27-role-create"><div class="field"><label>Tên vai trò mới</label><input id="tk27-role-name" placeholder="Ví dụ: CHECK-IN / ĐIỀU HÀNH"></div><div class="field"><label>Tạo từ mẫu</label><select id="tk27-role-base"><option value="VIEWER">VIEWER</option><option value="UMPIRE">UMPIRE</option><option value="LIVE_ONLY">LIVE_ONLY</option><option value="ADMIN">ADMIN (sao chép quyền)</option></select></div><div class="field tk27-grow"><label>Mô tả</label><input id="tk27-role-desc" placeholder="Ví dụ: Chỉ check-in VĐV"></div><button id="tk27-role-create" class="btn ok" type="button">＋ Tạo vai trò</button></div>
   <div class="tk27-manage"><div class="field tk27-grow"><label>Vai trò tùy chỉnh đã lưu</label><select id="tk27-role-select"><option value="">-- Chưa có vai trò tùy chỉnh --</option></select></div><button id="tk27-role-load" class="btn primary" type="button">Nạp quyền để chỉnh</button><button id="tk27-role-save" class="btn ok" type="button">💾 Lưu quyền hiện tại vào vai trò</button><button id="tk27-role-apply" class="btn warn" type="button">Áp dụng cho tài khoản đang dùng role</button><button id="tk27-role-delete" class="btn danger" type="button">Xóa role</button></div>
   <div id="tk27-role-status" class="tk27-status">Các quyền của vai trò được lưu tại Firebase <b>rolePresets</b>. Khi tạo tài khoản, bạn vẫn có thể chỉnh riêng từng dòng quyền trước khi bấm Tạo tài khoản.</div>`;
   perm.parentElement.insertBefore(card,perm);
 },
 bind(){
   $('tk27-role-create')?.addEventListener('click',()=>this.createRole());$('tk27-role-load')?.addEventListener('click',()=>this.loadRoleIntoEditor());$('tk27-role-save')?.addEventListener('click',()=>this.saveRolePermissions());$('tk27-role-apply')?.addEventListener('click',()=>this.applyRoleToUsers());$('tk27-role-delete')?.addEventListener('click',()=>this.deleteRole());$('tk27-role-select')?.addEventListener('change',e=>{this.editingRole=e.target.value||'';this.setStatus(this.editingRole?`Đang chọn ${this.editingRole}. Bấm “Nạp quyền để chỉnh”.`:'Chọn một vai trò tùy chỉnh.');});
   const createRole=$('user-form')?.querySelector('[name="role"]');if(createRole){const old=createRole.onchange;createRole.onchange=e=>{const r=roleKey(e.target.value);const preset=this.roles[r];if(preset){U9.renderPermissionEditor('tk9-create-permissions',normalizePermissions(preset.permissions,'VIEWER'));this.setStatus(`Đã nạp quyền mặc định của ${preset.name||r} cho tài khoản mới.`);}else old?.call(createRole,e);};}
   const editRole=$('tk9-perm-role');if(editRole){editRole.addEventListener('change',e=>{const r=roleKey(e.target.value),preset=this.roles[r];if(preset)setTimeout(()=>U9.renderPermissionEditor('tk9-edit-permissions',normalizePermissions(preset.permissions,'VIEWER')),0);});}
   $('tk9-perm-default')?.addEventListener('click',()=>{const r=roleKey($('tk9-perm-role')?.value),preset=this.roles[r];if(preset)setTimeout(()=>U9.renderPermissionEditor('tk9-edit-permissions',normalizePermissions(preset.permissions,'VIEWER')),0);});
 },
 startRoleListener(){
   if(T.Auth?.role?.()!=='ADMIN'||!T.Data?.db){this.stopRoleListener();return;}
   if(this.roleRef)return;this.roleRef=T.Data.db.ref(`${AUTH_ROOT}/rolePresets`);this.roleRef.on('value',s=>{this.roles=s.val()||{};Object.entries(this.roles).forEach(([r,p])=>registerRuntimeRole(r,p?.permissions));this.renderRoleOptions();});
 },
 stopRoleListener(){if(this.roleRef){this.roleRef.off();this.roleRef=null;}this.roles={};},
 renderRoleOptions(){
   const roles=Object.entries(this.roles||{}).sort((a,b)=>String(a[1]?.name||a[0]).localeCompare(String(b[1]?.name||b[0]),'vi'));
   const addOptions=select=>{if(!select)return;const current=select.value;select.querySelectorAll('option[data-u27-custom="1"]').forEach(o=>o.remove());roles.forEach(([id,p])=>{const o=document.createElement('option');o.value=id;o.textContent=`${p.name||id} (${id})`;o.dataset.u27Custom='1';select.appendChild(o);});if([...select.options].some(o=>o.value===current))select.value=current;};
   addOptions($('user-form')?.querySelector('[name="role"]'));addOptions($('tk9-perm-role'));
   const manage=$('tk27-role-select');if(manage){const current=manage.value||this.editingRole;manage.innerHTML='<option value="">-- Chọn vai trò tùy chỉnh --</option>'+roles.map(([id,p])=>`<option value="${esc(id)}">${esc(p.name||id)} · ${esc(id)}</option>`).join('');if(this.roles[current])manage.value=current;this.editingRole=manage.value||'';}
   this.renderRoleSummary();
 },
 renderRoleSummary(){
   let box=$('tk27-role-list');if(!box&&$('tk27-role-status')){box=document.createElement('div');box.id='tk27-role-list';box.className='tk27-role-list';$('tk27-role-status').insertAdjacentElement('afterend',box);}if(!box)return;
   const rows=Object.entries(this.roles||{});box.innerHTML=rows.length?rows.map(([id,p])=>{const mods=Object.entries(p.permissions?.modules||{}).filter(([,v])=>v!=='none').map(([k,v])=>`${k}:${v}`).join(' · ');return `<div class="tk27-role-row"><div><b>${esc(p.name||id)}</b> <span class="pill">${esc(id)}</span><div class="tk27-small">${esc(p.description||'Không có mô tả')}</div><div class="tk27-small">${esc(mods||'Không có quyền')}</div></div><button class="btn mini" type="button" data-tk27-load="${esc(id)}">Chỉnh</button></div>`;}).join(''):'<div class="muted">Chưa tạo vai trò tùy chỉnh.</div>';
   box.querySelectorAll('[data-tk27-load]').forEach(b=>b.onclick=()=>{this.editingRole=b.dataset.tk27Load;$('tk27-role-select').value=this.editingRole;this.loadRoleIntoEditor();});
 },
 setStatus(msg,state=''){const el=$('tk27-role-status');if(el){el.textContent=msg;el.dataset.state=state;}},
 async createRole(){
   if(T.Auth.role()!=='ADMIN')return U.toast('Chỉ ADMIN được tạo vai trò','err');const name=$('tk27-role-name')?.value.trim()||'',id=roleKey(name),base=roleKey($('tk27-role-base')?.value||'VIEWER'),desc=$('tk27-role-desc')?.value.trim()||'';
   if(!name||!id)return U.toast('Nhập tên vai trò','err');if(BUILTIN.includes(id))return U.toast('Tên này là vai trò hệ thống. Hãy dùng tên khác.','err');if(this.roles[id]&&!confirm(`Vai trò ${id} đã tồn tại. Ghi đè từ mẫu ${base}?`))return;
   const row={id,name,description:desc,baseRole:base,permissions:defaultPermissions(base),createdAt:this.roles[id]?.createdAt||Date.now(),updatedAt:Date.now(),updatedBy:T.Auth.user?.uid||''};
   try{await T.Data.db.ref(`${AUTH_ROOT}/rolePresets/${id}`).set(row);this.editingRole=id;registerRuntimeRole(id,row.permissions);this.setStatus(`Đã tạo vai trò ${name} (${id}). Hãy chọn role này trong form tài khoản hoặc nạp quyền để chỉnh.`,`ok`);U.toast('Đã tạo vai trò '+id,'ok');$('tk27-role-name').value='';$('tk27-role-desc').value='';}catch(e){this.setStatus('Không lưu được vai trò: '+(e?.message||e),'err');U.toast(e.message||String(e),'err');}
 },
 loadRoleIntoEditor(){
   const id=roleKey($('tk27-role-select')?.value||this.editingRole),p=this.roles[id];if(!p)return U.toast('Chọn vai trò tùy chỉnh','err');this.editingRole=id;U9.renderPermissionEditor('tk9-create-permissions',normalizePermissions(p.permissions,p.baseRole||'VIEWER'));const role=$('user-form')?.querySelector('[name="role"]');if(role)role.value=id;this.setStatus(`Đã nạp ${p.name||id}. Chỉnh các thẻ / nút / dòng bên dưới rồi bấm “Lưu quyền hiện tại vào vai trò”.`,'working');document.getElementById('tk9-permission-card')?.scrollIntoView({behavior:'smooth',block:'start'});
 },
 async saveRolePermissions(){
   const id=roleKey($('tk27-role-select')?.value||this.editingRole),p=this.roles[id];if(!p)return U.toast('Chọn vai trò cần lưu','err');const permissions=U9.collectPermissions('tk9-create-permissions'),after={...p,permissions:normalizePermissions(permissions,p.baseRole||'VIEWER'),updatedAt:Date.now(),updatedBy:T.Auth.user?.uid||''};
   try{await T.Data.db.ref(`${AUTH_ROOT}/rolePresets/${id}`).set(after);registerRuntimeRole(id,after.permissions);this.setStatus(`Đã lưu bộ quyền mặc định của ${p.name||id}. Tài khoản tạo mới sẽ dùng bộ quyền này.`,'ok');U.toast('Đã lưu quyền vai trò','ok');}catch(e){this.setStatus('Lưu quyền vai trò lỗi: '+(e?.message||e),'err');}
 },
 async applyRoleToUsers(){
   const id=roleKey($('tk27-role-select')?.value||this.editingRole),p=this.roles[id];if(!p)return U.toast('Chọn vai trò','err');const users=Object.values(App.state.users||{}).filter(u=>roleKey(u.role)===id);if(!users.length)return U.toast('Chưa có tài khoản nào dùng vai trò này','info');if(!confirm(`Áp dụng bộ quyền ${p.name||id} cho ${users.length} tài khoản đang dùng role ${id}? Quyền riêng hiện tại của các tài khoản này sẽ bị thay bằng mẫu role.`))return;
   const updates={};users.forEach(u=>updates[`${AUTH_ROOT}/users/${u.uid}/permissions`]=normalizePermissions(p.permissions,p.baseRole||'VIEWER'));
   try{await T.Data.db.ref().update(updates);this.setStatus(`Đã đồng bộ ${users.length} tài khoản đang dùng ${p.name||id}.`,'ok');U.toast(`Đã cập nhật ${users.length} tài khoản`,'ok');}catch(e){this.setStatus('Đồng bộ tài khoản lỗi: '+(e?.message||e),'err');}
 },
 async deleteRole(){
   const id=roleKey($('tk27-role-select')?.value||this.editingRole),p=this.roles[id];if(!p)return U.toast('Chọn vai trò','err');const used=Object.values(App.state.users||{}).filter(u=>roleKey(u.role)===id);if(used.length)return U.toast(`Không thể xóa: còn ${used.length} tài khoản đang dùng vai trò ${id}`,'err');if(!confirm(`Xóa vai trò ${p.name||id} (${id})?`))return;
   try{await T.Data.db.ref(`${AUTH_ROOT}/rolePresets/${id}`).remove();delete T.ROLES[id];this.editingRole='';this.setStatus('Đã xóa vai trò '+id,'ok');U.toast('Đã xóa vai trò','ok');}catch(e){this.setStatus('Xóa vai trò lỗi: '+(e?.message||e),'err');}
 }
};
Upgrade.install();
window.TopkeyUpgrade27=Upgrade;
})();
