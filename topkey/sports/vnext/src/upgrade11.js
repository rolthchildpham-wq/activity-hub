(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,S=T?.SPORT;
if(!T||!App||!U||!S)return;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TEAM_ROSTER=['football','volleyball'].includes(S.key);
const ACTION_TEXT={
 TEAM_CREATE:'Đã lưu đội',TEAM_UPDATE:'Đã lưu chỉnh sửa đội',TEAM_DELETE:'Đã xóa đội',WITHDRAW:'Đã cập nhật trạng thái đội',WITHDRAW_BULK:'Đã cập nhật các đội',CHECKIN:'Đã cập nhật check-in',
 MATCH_CREATE:'Đã lưu lịch thi đấu',MATCH_STATUS:'Đã cập nhật trạng thái trận',GENERATE_SCHEDULE:'Đã tạo lịch còn thiếu',SMART_SCHEDULE:'Đã lưu lịch thông minh',DELETE_SCHEDULE:'Đã xóa lịch theo phạm vi',
 COURT_CREATE:'Đã lưu sân / khu thi đấu',ASSIGN_OFFICIAL:'Đã lưu phân công',START_EVENT:'Đã bắt đầu phiên',SCORE:'Đã lưu điểm',NEXT_SET:'Đã chuyển set',RESET:'Đã reset kết quả',UNDO:'Đã hoàn tác',FINISH_EVENT:'Đã kết thúc phiên',SAVE_RESULT:'Đã lưu kết quả',
 CONFIG:'Đã lưu cấu hình',ANNOUNCEMENT:'Đã đăng thông báo',FINANCE_CREATE:'Đã lưu khoản tài chính',FINANCE_STATUS:'Đã cập nhật tài chính',PUBLIC_REGISTRATION:'Đã gửi đăng ký',REG_APPROVE:'Đã duyệt đăng ký',REG_REJECT:'Đã từ chối đăng ký',REG_SEED:'Đã lưu nhóm hạt giống',
 APPEARANCE:'Đã lưu giao diện',APPEARANCE_REMOVE_BG:'Đã xóa hình nền',SECURITY_CONFIG:'Đã lưu bảo mật',TOURNAMENT_CLOSE:'Đã đóng giải',IMPORT_TEAMS:'Đã nhập danh sách',IMPORT_MATCHES:'Đã nhập lịch',IMPORT_BACKUP:'Đã nhập backup'
};
function installFeedback(){
  if(T.Data.__upgrade11Feedback)return;T.Data.__upgrade11Feedback=true;
  const base=T.Data.queueMulti.bind(T.Data);
  T.Data.queueMulti=async(updates,meta={})=>{
    try{
      const item=await base(updates,meta);
      const type=String(meta.type||'');
      if(type&&!['AUDIT','EVENT_LOG','COMMENTARY','CAMERA','FINANCE_RECEIPT'].includes(type)){
        const msg=ACTION_TEXT[type];
        if(msg)U.toast(T.Data.connected?`✓ ${msg}`:`⏳ ${msg} vào hàng chờ đồng bộ`,T.Data.connected?'ok':'info');
      }
      return item;
    }catch(e){U.toast(`Lỗi lưu dữ liệu: ${e?.message||e}`,'err');throw e;}
  };
  addEventListener('unhandledrejection',e=>{const m=e?.reason?.message||String(e?.reason||'Lỗi không xác định');if(!/permission|firebase|network|queue|denied/i.test(m))return;U.toast('Thao tác chưa hoàn tất: '+m,'err')});
}
function rosterRow(data={}){
  const d=document.createElement('div');d.className='tk11-roster-row';
  d.innerHTML=`<input data-r="name" placeholder="Họ tên cầu thủ" value="${esc(data.name||'')}"><input data-r="jersey" inputmode="numeric" placeholder="Số áo" value="${esc(data.jersey||'')}"><input data-r="employeeId" placeholder="Mã số nhân viên" value="${esc(data.employeeId||'')}"><select data-r="shirtSize"><option value="">Size áo</option>${['XS','S','M','L','XL','2XL','3XL','4XL'].map(x=>`<option ${data.shirtSize===x?'selected':''}>${x}</option>`).join('')}</select><button type="button" class="btn mini danger" data-remove>×</button>`;
  d.querySelector('[data-remove]').onclick=()=>d.remove();return d;
}
function mountRoster(box,rows=[]){if(!box)return;box.innerHTML='';(rows.length?rows:[{},{}]).forEach(r=>box.appendChild(rosterRow(r)));}
function collectRoster(box){return [...(box?.querySelectorAll('.tk11-roster-row')||[])].map(r=>({name:r.querySelector('[data-r="name"]').value.trim(),jersey:r.querySelector('[data-r="jersey"]').value.trim(),employeeId:r.querySelector('[data-r="employeeId"]').value.trim(),shirtSize:r.querySelector('[data-r="shirtSize"]').value})).filter(x=>x.name||x.jersey||x.employeeId||x.shirtSize);}
function validateRoster(roster){if(!roster.length)throw new Error('Vui lòng nhập ít nhất 1 cầu thủ');if(roster.some(x=>!x.name))throw new Error('Mỗi dòng cầu thủ phải có họ tên');const dup=(key,label)=>{const vals=roster.map(x=>String(x[key]||'').trim().toLowerCase()).filter(Boolean);if(new Set(vals).size!==vals.length)throw new Error(label+' đang bị trùng trong cùng đội')};dup('jersey','Số áo');dup('employeeId','Mã số nhân viên');return roster;}
function injectRosterUI(){
  if(!TEAM_ROSTER)return;
  const form=$('team-form');if(form&&!$('tk11-team-roster-wrap')){const w=document.createElement('div');w.id='tk11-team-roster-wrap';w.className='tk11-roster-wrap';w.innerHTML=`<div class="split"><div><b>👕 Danh sách cầu thủ</b><div class="note">Họ tên · số áo · mã số nhân viên · size áo.</div></div><button type="button" id="tk11-team-roster-add" class="btn mini primary">+ Cầu thủ</button></div><div id="tk11-team-roster" class="tk11-roster-list"></div>`;form.insertBefore(w,form.lastElementChild);$('tk11-team-roster-add').onclick=()=>$('tk11-team-roster').appendChild(rosterRow());mountRoster($('tk11-team-roster'));}
  const pub=$('registration-public-form');if(pub&&!$('tk11-public-roster-wrap')){const w=document.createElement('div');w.id='tk11-public-roster-wrap';w.className='tk11-roster-wrap';w.innerHTML=`<div class="split"><div><b>👕 Danh sách cầu thủ</b><div class="note">Nhập đội hình đăng ký. Có thể thêm nhiều cầu thủ.</div></div><button type="button" id="tk11-public-roster-add" class="btn mini primary">+ Cầu thủ</button></div><div id="tk11-public-roster" class="tk11-roster-list"></div>`;pub.insertBefore(w,pub.lastElementChild);$('tk11-public-roster-add').onclick=()=>$('tk11-public-roster').appendChild(rosterRow());mountRoster($('tk11-public-roster'));}
  if(!$('tk11-roster-modal')){const m=document.createElement('div');m.id='tk11-roster-modal';m.className='modal hidden';m.innerHTML=`<div class="modal-box wide tk11-scroll-modal"><div class="split"><div><h2>👕 Chỉnh đội hình</h2><p id="tk11-roster-team-name" class="muted"></p></div><button id="tk11-roster-close" class="btn mini">Đóng</button></div><input id="tk11-roster-team-id" type="hidden"><div id="tk11-edit-roster" class="tk11-roster-list"></div><div class="split" style="margin-top:12px"><button id="tk11-edit-roster-add" class="btn primary">+ Cầu thủ</button><button id="tk11-edit-roster-save" class="btn ok">💾 Lưu đội hình</button></div></div>`;document.body.appendChild(m);$('tk11-roster-close').onclick=()=>m.classList.add('hidden');$('tk11-edit-roster-add').onclick=()=>$('tk11-edit-roster').appendChild(rosterRow());$('tk11-edit-roster-save').onclick=saveRosterEdit;}
}
async function saveRosterEdit(){const id=$('tk11-roster-team-id').value,t=App.state.teams?.[id];if(!t)return;const roster=collectRoster($('tk11-edit-roster'));try{validateRoster(roster)}catch(e){return U.toast(e.message,'err')}const after={...t,roster,updatedAt:Date.now()};await T.Data.queueSet('teams/'+id,after,{type:'TEAM_UPDATE'});await T.Data.audit('UPDATE_ROSTER','participant',id,t,after);$('tk11-roster-modal').classList.add('hidden');}
function rosterForEdit(team,registrations){
 const own=Array.isArray(team?.roster)?team.roster.filter(x=>x&&String(x.name||'').trim()):[];
 if(own.length)return{rows:own,source:'team'};
 const reg=team?.registrationId&&registrations?.[team.registrationId];
 const linked=reg&&reg.status==='APPROVED'&&(!reg.teamId||reg.teamId===team.id);
 const previous=linked&&Array.isArray(reg.roster)?reg.roster.filter(x=>x&&String(x.name||'').trim()):[];
 return previous.length?{rows:previous,source:'registration'}:{rows:[],source:'missing'};
}
function openRoster(id){
 const t=App.state.teams?.[id];if(!t)return;
 $('tk11-roster-team-id').value=id;$('tk11-roster-team-name').textContent=`${t.name||''} · ${t.category||''}`;
 const resolved=rosterForEdit(t,App.state.registrations);
 let hint=$('tk11-roster-hint');
 if(!hint){hint=document.createElement('p');hint.id='tk11-roster-hint';hint.className='note';hint.setAttribute('role','status');$('tk11-edit-roster').parentNode.insertBefore(hint,$('tk11-edit-roster'));}
 hint.textContent=resolved.source==='registration'
  ?`Tìm thấy ${resolved.rows.length} cầu thủ trong phiếu đăng ký đã duyệt. Kiểm tra và bấm “Lưu đội hình” để liên kết vào đội; lịch thi đấu giữ nguyên.`
  :resolved.source==='missing'
  ?'Đội đã đăng ký nhưng chưa có danh sách cầu thủ được lưu. Lịch thi đấu không tự tạo đội hình. Hãy nhập danh sách hoặc import CSV đúng mẫu; không cần tạo lại đội và lịch.'
  :`Đã lưu ${resolved.rows.length} cầu thủ trong đội hình.`;
 mountRoster($('tk11-edit-roster'),resolved.rows);$('tk11-roster-modal').classList.remove('hidden');
}
function patchRosterMethods(){
  if(!TEAM_ROSTER)return;
  App.addTeam=async e=>{e.preventDefault();const f=new FormData(e.target),id=U.id('team'),roster=collectRoster($('tk11-team-roster')),row={id,code:App.nextCode('T',App.state.teams),name:String(f.get('name')||'').trim(),p1:String(f.get('p1')||'').trim(),p2:String(f.get('p2')||'').trim(),dept:String(f.get('dept')||'').trim(),category:f.get('category'),roster,checkedIn:false,withdrawn:false,createdAt:Date.now()};if(!row.name||!row.p1)return U.toast('Thiếu tên đội / đội trưởng','err');try{validateRoster(roster)}catch(err){return U.toast(err.message,'err')}await T.Data.queueSet('teams/'+id,row,{type:'TEAM_CREATE'});await T.Data.audit('CREATE','participant',id,null,row);e.target.reset();mountRoster($('tk11-team-roster'));};
  App.publicRegister=async e=>{e.preventDefault();const up9=window.TopkeyUpgrade9,c=up9?.registrationConfig?.()||App.state.config?.registration||{},token=new URLSearchParams(location.search).get('reg')||'';if(c.enabled===false)return U.toast('Đăng ký đang tạm khóa','err');if(c.token&&token!==c.token)return U.toast('Link đăng ký không còn hiệu lực','err');if(c.deadline&&Date.now()>new Date(c.deadline).getTime())return U.toast('Đã hết hạn đăng ký','err');const f=new FormData(e.target),roster=collectRoster($('tk11-public-roster')),p1=String(f.get('p1')||'').trim();if(!p1)return U.toast('Thiếu đội trưởng','err');try{validateRoster(roster)}catch(err){return U.toast(err.message,'err')}const id=U.id('reg'),r={id,name:String(f.get('name')||'').trim(),p1,p2:String(f.get('p2')||'').trim(),dept:String(f.get('dept')||'').trim(),contact:String(f.get('contact')||'').trim(),category:String(f.get('category')||S.categories?.[0]||'OPEN'),registrationType:'PAIR',roster,createdAt:Date.now(),status:'PENDING',source:'PUBLIC_QR'};if(!r.name)return U.toast('Thiếu tên đội','err');await T.Data.queueSet('registrations/'+id,r,{type:'PUBLIC_REGISTRATION'});e.target.reset();mountRoster($('tk11-public-roster'));U.toast('Đã gửi đăng ký đội và danh sách cầu thủ. BTC sẽ duyệt một lần.','ok');};
  App.approveRegistration=async id=>{const can=T.Auth?.role?.()==='ADMIN'||T.Auth?.profile?.permissions?.modules?.teams==='edit';if(!can)return U.toast('Không có quyền duyệt đăng ký','err');const r=App.state.registrations?.[id];if(!r||r.status!=='PENDING'||r.teamId)return U.toast('Đăng ký này đã được xử lý','info');const teamId=U.id('team'),team={id:teamId,code:App.nextCode('T',App.state.teams),name:r.name,p1:r.p1,p2:r.p2,dept:r.dept,category:r.category,roster:Array.isArray(r.roster)?r.roster:[],checkedIn:false,withdrawn:false,createdAt:Date.now(),registrationId:id,registrationSource:'PUBLIC_QR'},after={...r,status:'APPROVED',teamId,reviewedAt:Date.now(),reviewedBy:T.Auth.user?.uid||''},up={};up[T.Data.path('teams/'+teamId)]=team;up[T.Data.path('registrations/'+id)]=after;await T.Data.queueMulti(up,{type:'REG_APPROVE'});await T.Data.audit('APPROVE','registration',id,r,team);U.toast('Đã duyệt. Đội và danh sách cầu thủ đã chuyển sang Check-in.','ok');};
  App.renderCheckin=function(){const q=String($('checkin-search')?.value||'').toLowerCase(),box=$('checkin-list');if(!box)return;box.replaceChildren();Object.values(this.state.teams||{}).filter(t=>[t.name,t.p1,t.p2,t.code,...(t.roster||[]).flatMap(x=>[x.name,x.employeeId,x.jersey])].join(' ').toLowerCase().includes(q)).forEach(t=>{const d=document.createElement('div');d.className='checkin-row';const s=document.createElement('span');s.textContent=`${t.code} · ${t.name} · ${t.roster?.length||0} cầu thủ${t.withdrawn?' · BỎ CUỘC':''}`;const b=document.createElement('button');b.className='btn '+(t.checkedIn?'ok':'');b.textContent=t.checkedIn?'Đã check-in':'Check-in';b.disabled=!!t.withdrawn;b.onclick=()=>this.toggleCheckin(t.id);d.append(s,b);box.appendChild(d)});};
  const baseRender=App.renderTeams.bind(App);App.renderTeams=function(){baseRender();const teams=Object.values(this.state.teams||{}).sort((a,b)=>(a.code||'').localeCompare(b.code||''));const rows=[...document.querySelectorAll('#teams-list tr')];rows.forEach((tr,i)=>{const t=teams[i];if(!t)return;const td=tr.lastElementChild;if(!td||td.querySelector('.tk11-roster-btn'))return;const b=document.createElement('button');b.className='btn mini primary tk11-roster-btn';b.textContent=`Đội hình (${t.roster?.length||0})`;b.onclick=()=>openRoster(t.id);td.prepend(b)});};
  App.downloadTeamTemplate=function(){const sample=JSON.stringify([{name:'Nguyễn Văn A',jersey:'10',employeeId:'NV001',shirtSize:'L'}]);const csv='\uFEFFMa,Ten,DoiTruong,HLV,DonVi,NoiDung,DanhSachCauThu_JSON\nT001,Topkey A,Nguyen Van A,Tran Van B,Topkey,'+S.categories[0]+',"'+sample.replaceAll('\"','\"\"')+'"\n';U.download(`Topkey_${S.key}_Mau_Danh_Sach.csv`,new Blob([csv],{type:'text/csv;charset=utf-8'}));};
  App.importTeamsCSV=async function(file,input){
   if(!file)return;
   try{
    const rows=U.parseCsv(await file.text()),existing=Object.values(this.state.teams||{}),updates={};
    let created=0,recovered=0,unchanged=0;const importedNames=new Set();
    const clean=v=>String(v||'').trim(),norm=v=>clean(v).toLocaleLowerCase('vi-VN');
    for(const r of rows){
     const name=clean(r.Ten||r.TenDoi||r.Name),code=clean(r.Ma||r.Code);
     if(!name)continue;
     const key=norm(name)+'|'+code;if(importedNames.has(key))throw new Error('Đội trùng trong CSV: '+name);
     importedNames.add(key);
     let roster=[];const raw=clean(r.DanhSachCauThu_JSON||r.Roster_JSON||'');
     if(raw){
      let parsed;try{parsed=JSON.parse(raw)}catch{throw new Error('DanhSachCauThu_JSON không hợp lệ cho '+name)}
      if(!Array.isArray(parsed))throw new Error('DanhSachCauThu_JSON phải là mảng cho '+name);
      roster=parsed.map(x=>({name:clean(x?.name),jersey:clean(x?.jersey),employeeId:clean(x?.employeeId),shirtSize:clean(x?.shirtSize)}));
      if(roster.length)validateRoster(roster);
     }
     const codeTeam=code?existing.find(t=>clean(t.code)===code):null;
     if(codeTeam&&norm(codeTeam.name)!==norm(name))throw new Error('Mã đội '+code+' đã thuộc đội khác');
     const nameMatches=existing.filter(t=>norm(t.name)===norm(name));
     if(!codeTeam&&nameMatches.length>1)throw new Error('Nhiều đội trùng tên: '+name+'; cần mã đội chính xác');
     const team=codeTeam||nameMatches[0];
     if(team){
      if(!Array.isArray(team.roster)||!team.roster.some(x=>clean(x?.name))){
       if(roster.length){updates[T.Data.path('teams/'+team.id)]={...team,roster,updatedAt:Date.now()};recovered++}
       else unchanged++;
      }else unchanged++;
      continue;
     }
     const p1=clean(r.DoiTruong||r.ThanhVien1||r.VDV1||r.Member1);
     if(!p1)throw new Error('Thiếu cột DoiTruong/ThanhVien1 cho '+name);
     const id=U.id('team');
     const reserved=new Set([...existing.map(x=>clean(x.code)),...Object.values(updates).map(x=>clean(x.code))]);
     const newCode=code||('T'+String(existing.length+created+1).padStart(3,'0'));
     if(reserved.has(newCode))throw new Error('Mã đội bị trùng: '+newCode);
     updates[T.Data.path('teams/'+id)]={id,code:newCode,name,p1,p2:clean(r.HLV||r.ThanhVien2||r.VDV2),dept:clean(r.DonVi||r.BoPhan),category:clean(r.NoiDung||S.categories[0]),roster,checkedIn:false,withdrawn:false,createdAt:Date.now()};
     created++;
    }
    if(Object.keys(updates).length)await T.Data.queueMulti(updates,{type:'IMPORT_TEAMS'});
    U.toast(`CSV: ${created} đội mới · ${recovered} đội được bổ sung cầu thủ · ${unchanged} đội giữ nguyên. Không thay đổi lịch.`,'ok');
   }catch(e){U.toast('Chưa nhập CSV: '+e.message,'err')}finally{if(input)input.value=''}
  };
  App.exportTeamsCSV=function(){const rows=Object.values(this.state.teams||{}).map(t=>({Ma:t.code,Ten:t.name,DoiTruong:t.p1,HLV:t.p2,DonVi:t.dept,NoiDung:t.category,DanhSachCauThu_JSON:JSON.stringify(t.roster||[]),CheckIn:t.checkedIn?1:0,BoCuoc:t.withdrawn?1:0}));U.download(`Topkey_${S.key}_Danh_Sach.csv`,new Blob(['\uFEFF'+U.csv(rows)],{type:'text/csv;charset=utf-8'}));};
}
function installLocalFeedback(){const baseLoad=App.loadOfficial?.bind(App);if(baseLoad)App.loadOfficial=function(){const r=baseLoad();if(this.selectedMatch&&this.currentCourt)U.toast('Đã nạp lịch vào màn hình điều hành','ok');return r};}
function installPermissionScroll(){const modal=$('tk9-permission-modal');if(modal){const box=modal.querySelector('.modal-box');box?.classList.add('tk11-permission-box');}}
function installSchedulerRoster(){if(!TEAM_ROSTER||!window.TopkeyUpgrade9)return;const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();window.TopkeyUpgrade9.teamPeople=function(teamId){const t=App.state.teams?.[teamId];if(!t)return[];return [...new Set([t.p1,t.p2,...(Array.isArray(t.roster)?t.roster.map(x=>x.name):[])].filter(Boolean).map(norm).filter(Boolean))];};}
function install(){installFeedback();injectRosterUI();patchRosterMethods();installLocalFeedback();installPermissionScroll();installSchedulerRoster();setTimeout(()=>{injectRosterUI();installPermissionScroll();installSchedulerRoster();App.renderTeams?.()},0);}
install();
window.TopkeyUpgrade11={openRoster,collectRoster};
})();
