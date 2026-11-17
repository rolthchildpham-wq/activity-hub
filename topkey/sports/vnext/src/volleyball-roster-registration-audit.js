/* Read-only Firebase audit of approved volleyball registrations and linked team rosters.
   Reconciliation is never automatic; optional repair requires ADMIN/BTC teams edit,
   explicit confirmation and a fresh server-side consistency check. */
(()=>{'use strict';
const T=window.Topkey;
const $=id=>document.getElementById(id);
const count=x=>Array.isArray(x)?x.length:0;
const clean=x=>String(x??'').trim();
function auditRows(registrations,teams){
 const rows=[],matched=new Set();
 for(const reg of Object.values(registrations||{})){
  if(!reg||reg.status!=='APPROVED'||!reg.teamId)continue;
  const team=teams?.[reg.teamId];
  matched.add(reg.teamId);
  const source=count(reg.roster),saved=count(team?.roster);
  const linked=!!team&&(!team.registrationId||team.registrationId===reg.id);
  const safe=linked&&team?.registrationId===reg.id&&source>0&&saved===0;
  rows.push({id:reg.id,teamId:reg.teamId,teamName:clean(team?.name||reg.name),registrationCount:source,teamCount:saved,
   sourceFields:['players','members'].filter(k=>Array.isArray(reg[k])&&reg[k].length>0),
   status:!team?'TEAM_MISSING':!linked?'LINK_MISMATCH':saved>0?'SAVED':source>0?(safe?'RESTORABLE':'UNVERIFIED_LINK'):'MISSING_IN_REGISTRATION',
   canRestore:safe});
 }
 for(const team of Object.values(teams||{})){
  if(!team?.id||matched.has(team.id)||count(team.roster))continue;
  rows.push({id:'',teamId:team.id,teamName:clean(team.name),registrationCount:0,teamCount:0,sourceFields:[],status:'NO_APPROVED_LINK',canRestore:false});
 }
 return rows.sort((a,b)=>a.teamName.localeCompare(b.teamName,'vi'));
}
function authorized(){
 const role=T?.Auth?.role?.(),p=T?.Auth?.profile||{};
 return role==='ADMIN'||p.permissions?.modules?.teams==='edit';
}
async function getSnap(type,id){
 const ref=T.Data.db?.ref(T.Data.path(type+'/'+id));
 if(!ref)throw Error('Firebase chưa sẵn sàng');
 return (await ref.once('value')).val();
}
function btn(label){
 const b=document.createElement('button');b.type='button';b.className='btn mini';b.textContent=label;return b;
}
function cell(text){const e=document.createElement('td');e.textContent=text;return e}
function install(){
 if(T?.SPORT?.key!=='volleyball'||!authorized()||!T.Data?.path)return;
 const registrationList=$('registration-list');
 if(!registrationList||$('tk-roster-audit'))return;
 const wrap=document.createElement('div');wrap.id='tk-roster-audit';wrap.className='card';
 wrap.style.marginTop='14px';
 const h=document.createElement('h3');h.textContent='🔎 Kiểm tra dữ liệu đăng ký & đội hình';
 const desc=document.createElement('p');desc.className='note';desc.textContent='Đọc lại Firebase để so sánh đơn đã duyệt với đội chính thức. Không tự xóa, tạo hay thay thế đội/lịch đấu. Nếu Firebase không đọc được sẽ báo lỗi, không kết luận mất dữ liệu.';
 const trigger=btn('Kiểm tra dữ liệu đã lưu trên Firebase');trigger.classList.add('primary');
 const feedback=document.createElement('p');feedback.setAttribute('role','status');feedback.className='note';
 const out=document.createElement('div');out.className='table-wrap';
 wrap.append(h,desc,trigger,feedback,out);
 const teamsCard=registrationList.closest('.card');
 if(teamsCard?.parentElement?.after)teamsCard.parentElement.after(wrap);else (teamsCard?.parentElement||registrationList.parentElement).appendChild(wrap);
 let fetched={registrations:{},teams:{}};
 async function scan(){
  if(!authorized()){feedback.textContent='Không có quyền kiểm tra dữ liệu';return}
  trigger.disabled=true;feedback.textContent='Đang đối chiếu trực tiếp Firebase…';
  try{
   if(!T.Data.connected)throw Error('Firebase đang ngoại tuyến; không thể xác minh bản lưu trên máy chủ');
   const localRegs=Object.values(T.App.state.registrations||{}).filter(r=>r?.status==='APPROVED'&&r.teamId);
   const regIds=[...new Set(localRegs.map(r=>r.id).filter(Boolean))],teamIds=[...new Set([...localRegs.map(r=>r.teamId),...Object.values(T.App.state.teams||{}).map(t=>t?.id)].filter(Boolean))];
   if(regIds.length>200||teamIds.length>200)throw Error('Quá nhiều mục; cần giới hạn phạm vi kiểm tra');
   const [remoteRegs,remoteTeams]=await Promise.all([
    Promise.all(regIds.map(async id=>[id,await getSnap('registrations',id)])),
    Promise.all(teamIds.map(async id=>[id,await getSnap('teams',id)]))
   ]);
   fetched={registrations:Object.fromEntries(remoteRegs.filter(([,x])=>x)),teams:Object.fromEntries(remoteTeams.filter(([,x])=>x))};
   const rows=auditRows(fetched.registrations,fetched.teams);
   out.replaceChildren();
   const table=document.createElement('table');
   const head=document.createElement('thead'),titles=document.createElement('tr');
   for(const label of ['Đội','Đơn gốc','Đội chính thức','Kết quả đối chiếu','Thao tác'])titles.appendChild(cell(label));
   head.appendChild(titles);table.appendChild(head);
   const body=document.createElement('tbody');
   const labels={
    SAVED:'Đã lưu đội hình trong đội',RESTORABLE:'Đơn còn danh sách; đội chưa nhận',
    MISSING_IN_REGISTRATION:'Đơn đã duyệt nhưng không có roster',
    TEAM_MISSING:'Không tìm thấy đội liên kết',LINK_MISMATCH:'Liên kết đăng ký/đội không khớp',
    UNVERIFIED_LINK:'Đơn còn roster nhưng thiếu mã liên kết hai chiều',NO_APPROVED_LINK:'Đội chưa tìm thấy đơn đã duyệt'
   };
   for(const row of rows){
    const tr=document.createElement('tr');
    tr.append(cell(row.teamName),cell(String(row.registrationCount)+' cầu thủ'),cell(String(row.teamCount)+' cầu thủ'),cell(labels[row.status]||row.status));
    const actions=document.createElement('td');
    if(row.canRestore){
     const restore=btn('Khôi phục từ đơn gốc');restore.onclick=()=>restoreOne(row).catch(e=>{feedback.textContent='Không thể khôi phục: '+clean(e.message||e)});actions.appendChild(restore);
    }else if(row.sourceFields.length){actions.textContent='Có dữ liệu '+row.sourceFields.join(', ')+' cần đối chiếu thủ công';}
    else actions.textContent='—';
    tr.appendChild(actions);body.appendChild(tr);
   }
   if(!rows.length){const tr=document.createElement('tr'),td=cell('Chưa có đơn đã duyệt/đội nào trong dữ liệu đã tải.');td.colSpan=5;tr.appendChild(td);body.appendChild(tr);}
   table.appendChild(body);out.appendChild(table);
   const missing=rows.filter(x=>x.status==='MISSING_IN_REGISTRATION').length,restorable=rows.filter(x=>x.canRestore).length;
   feedback.textContent='Đã đọc Firebase: '+rows.length+' đội; '+restorable+' đội có dữ liệu nguồn có thể khôi phục; '+missing+' đơn gốc chưa có roster. '+(T.Data.pending?'Đang có '+T.Data.pending+' thay đổi chờ đồng bộ.':'Không ghi dữ liệu.');
  }catch(e){out.replaceChildren();feedback.textContent='KHÔNG XÁC MINH ĐƯỢC Firebase: '+clean(e?.message||e)+' — chưa kết luận dữ liệu đã mất.'}
  finally{trigger.disabled=false;}
 }
 async function restoreOne(row){
  if(!authorized())throw Error('Tài khoản không có quyền sửa đội hình');
  if(!T.Data.connected)throw Error('Firebase ngoại tuyến');
  const [reg,team]=await Promise.all([getSnap('registrations',row.id),getSnap('teams',row.teamId)]);
  if(!reg||!team||reg.status!=='APPROVED'||reg.teamId!==row.teamId||team.registrationId!==row.id||count(team.roster)||!count(reg.roster))
   throw Error('Dữ liệu đã thay đổi hoặc liên kết không hợp lệ; không được ghi đè');
  if(!reg.roster.every(p=>p&&clean(p.name)))throw Error('Đơn gốc có dòng cầu thủ thiếu tên; cần kiểm tra thủ công');
  const ok=await T.U.confirmDanger('Khôi phục danh sách cầu thủ',clean(team.name)+' · '+reg.roster.length+' cầu thủ từ đơn đã duyệt. Giữ nguyên đội, lịch, điểm và kết quả.','KHÔI PHỤC');
  if(!ok)return;
  const [latestReg,latestTeam]=await Promise.all([getSnap('registrations',row.id),getSnap('teams',row.teamId)]);
  if(!latestReg||!latestTeam||latestReg.teamId!==row.teamId||latestTeam.registrationId!==row.id||count(latestTeam.roster)||JSON.stringify(latestReg.roster)!==JSON.stringify(reg.roster))
   throw Error('Dữ liệu đã thay đổi; cần kiểm tra lại trước khi lưu');
  const path=T.Data.path('teams/'+row.teamId);
  await T.Data.queueMulti({[path+'/roster']:latestReg.roster,[path+'/updatedAt']:Date.now()},{type:'TEAM_UPDATE'});
  if(T.Data.connected&&!T.Data.pending){
   const confirmed=await getSnap('teams',row.teamId);
   feedback.textContent=count(confirmed?.roster)===count(latestReg.roster)?'Firebase đã xác nhận đội hình cho '+team.name:'Đã gửi cập nhật nhưng chưa xác nhận được từ Firebase. Hãy kiểm tra lại.';
  }else feedback.textContent='Đang chờ đồng bộ; không đóng trang khi còn hàng đợi.';
  await scan();
 }
 trigger.onclick=scan;
}
function boot(){if(T?.App?.state&&T?.Data?.path)install();}
window.addEventListener('topkey:admin-ready',boot);
if(window.__TOPKEY_ADMIN_READY)boot();
if(window.__TOPKEY_VNEXT_BOOT?.then)window.__TOPKEY_VNEXT_BOOT.then(boot).catch(()=>{});
else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
window.TopkeyRosterRegistrationAudit={auditRows,install};
})();