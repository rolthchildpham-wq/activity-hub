/* TOPKEY VNext roster CSV recovery: existing teams keep IDs/matches. No automatic writes. */
(()=>{'use strict';
const normalize=value=>String(value??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
const str=value=>String(value??'').trim();
function parseRoster(value,label){
 if(!str(value))return [];
 let data;try{data=JSON.parse(value)}catch{throw new Error('Danh sách cầu thủ JSON không hợp lệ tại '+label)}
 if(!Array.isArray(data)||data.length>100)throw new Error('Danh sách cầu thủ phải là mảng tối đa 100 người tại '+label);
 const roster=data.map((raw,i)=>{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Cầu thủ '+(i+1)+' tại '+label+' không hợp lệ');
  const player={name:str(raw.name),jersey:str(raw.jersey),employeeId:str(raw.employeeId),shirtSize:str(raw.shirtSize)};
  if(!player.name)throw new Error('Thiếu họ tên cầu thủ '+(i+1)+' tại '+label);
  return player;
 });
 for(const key of ['jersey','employeeId']){
  const vals=roster.map(p=>normalize(p[key])).filter(Boolean);
  if(new Set(vals).size!==vals.length)throw new Error('Trùng '+(key==='jersey'?'số áo':'mã nhân viên')+' tại '+label);
 }
 return roster;
}
function plan(rows,teams,nextCode,newId,defaultCategory){
 if(!Array.isArray(rows)||rows.length>500)throw new Error('File CSV vượt giới hạn 500 đội');
 const existing=Object.values(teams||{}),updates={},created=[],seen=new Set(),codes=new Set(existing.map(t=>str(t.code)).filter(Boolean));
 let recovered=0,skipped=0,missingRoster=0;
 for(const [index,raw] of rows.entries()){
  const r=Object.fromEntries(Object.entries(raw||{}).map(([k,v])=>[k.replace(/^\uFEFF/,'').trim(),v]));
  const name=str(r.Ten||r.TenDoi||r.Name),leader=str(r.DoiTruong||r.ThanhVien1||r.VDV1||r.Member1),code=str(r.Ma||r.Code);
  const category=str(r.NoiDung||r.Category||defaultCategory);
  const label='dòng '+(index+2)+(name?' ('+name+')':'');
  if(!name){skipped++;continue}
  const key=code?'code:'+code:'name:'+normalize(name)+'|'+category;
  if(seen.has(key))throw new Error('Đội trùng trong CSV: '+label);
  seen.add(key);
  const roster=parseRoster(r.DanhSachCauThu_JSON||r.Roster_JSON||r.DanhSachCauThu||'',label);
  const byCode=code?existing.find(t=>str(t.code)===code):null;
  if(byCode&&normalize(byCode.name)!==normalize(name))throw new Error('Mã '+code+' đang thuộc đội khác. Hủy import để bảo vệ lịch.');
  const matched=byCode||existing.find(t=>normalize(t.name)===normalize(name)&&(!category||str(t.category)===category));
  if(matched){
   if(category&&str(matched.category)&&str(matched.category)!==category)throw new Error('Sai nội dung thi của '+name+'. Hủy import.');
   if(roster.length&&(!Array.isArray(matched.roster)||!matched.roster.length)){
    updates['teams/'+matched.id+'/roster']=roster;
    updates['teams/'+matched.id+'/updatedAt']=Date.now();
    recovered++;
   }else skipped++;
   continue;
  }
  if(!leader){skipped++;continue}
  const id=newId();
  const allocated=code&&!codes.has(code)?code:nextCode({...teams,...Object.fromEntries(created.map(t=>[t.id,t]))});
  codes.add(allocated);
  const row={id,code:allocated,name,p1:leader,p2:str(r.HLV||r.ThanhVien2||r.VDV2),dept:str(r.DonVi||r.BoPhan),category,roster,checkedIn:str(r.CheckIn)==='1',withdrawn:str(r.BoCuoc)==='1',createdAt:Date.now()};
  created.push(row);updates['teams/'+id]=row;
  if(!roster.length)missingRoster++;
 }
 return {updates,created:created.length,recovered,skipped,missingRoster};
}
function install(){
 const T=window.Topkey,App=T?.App,U=T?.U;
 if(!T||!App||!U||!['football','volleyball'].includes(T.SPORT?.key)||App.__rosterCsvRecoveryInstalled)return;
 App.__rosterCsvRecoveryInstalled=true;
 App.importTeamsCSV=async (file,input)=>{
  if(!file)return;
  try{
   const csv=U.parseCsv(await file.text());
   const changes=plan(csv,App.state.teams||{},items=>App.nextCode('T',items),()=>U.id('team'),T.SPORT.categories?.[0]||'');
   const count=changes.created+changes.recovered;
   if(!count){U.toast('Không có đội hình mới để nhập. Đội cũ không bị thay đổi.','info');return}
   const reason='Tạo '+changes.created+' đội; khôi phục đội hình cho '+changes.recovered+' đội đã có; bỏ qua '+changes.skipped+' dòng. '+(changes.missingRoster?'Có '+changes.missingRoster+' đội mới chưa có danh sách cầu thủ.':'')+' Giữ nguyên ID đội và lịch đấu đã có.';
   if(!await U.confirmDanger('Nhập / khôi phục danh sách đội',reason,'XÁC NHẬN NHẬP'))return;
   const paths={};for(const [relative,value] of Object.entries(changes.updates))paths[T.Data.path(relative)]=value;
   await T.Data.queueMulti(paths,{type:'IMPORT_TEAMS'});
   U.toast(T.Data.connected?'Đã nhập '+changes.created+' đội và khôi phục '+changes.recovered+' đội hình.':'Đã xếp hàng chờ đồng bộ. Không đóng trình duyệt trước khi đồng bộ.',T.Data.connected?'ok':'info');
  }catch(err){U.toast('Không nhập CSV: '+(err?.message||err),'err')}
  finally{if(input)input.value=''}
 };
 const modal=document.getElementById('tk11-roster-modal'),list=document.getElementById('tk11-edit-roster');
 if(modal&&list&&!document.getElementById('tk-roster-missing-note')){
  const note=document.createElement('p');note.id='tk-roster-missing-note';note.className='note';
  note.textContent='Đội có 0 cầu thủ: tạo lịch chỉ xếp đội, không tạo đội hình. Hãy nhập cầu thủ và bấm Lưu đội hình, hoặc import CSV có cột DanhSachCauThu_JSON để khôi phục danh sách cũ.';
  list.before(note);
 }
}
if(window.__TOPKEY_VNEXT_BOOT&&typeof window.__TOPKEY_VNEXT_BOOT.then==='function'){
 window.__TOPKEY_VNEXT_BOOT.then(install).catch(()=>{});
}else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
window.TopkeyRosterCsvRecovery={plan,parseRoster,install};
})();