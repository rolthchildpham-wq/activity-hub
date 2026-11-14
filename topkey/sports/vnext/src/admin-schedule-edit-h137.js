/* TOPKEY H137: shared ADMIN date editor for every VNext sport. */
(()=>{'use strict';
 const T=window.Topkey, A=T?.App, U=T?.U;
 if(!A||!T?.Data||A.__h137Dates)return;
 A.__h137Dates=true;
 const $=id=>document.getElementById(id);
 const role=()=>String(T.Auth?.role?.()||'').toUpperCase();
 const isAdmin=()=>role()==='ADMIN';
 const blocked=new Set(['LIVE','FINISHED','WALKOVER','RETIRED','DISQUALIFIED','CANCELLED']);
 const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T12:00:00'))&&new Date(v+'T12:00:00').toISOString().slice(0,10)===v;
 const validTime=v=>/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
 let editing=null, busy=false;
 function matchFor(row){
  const id=row.dataset.matchId;
  if(id&&A.state.matches?.[id])return A.state.matches[id];
  const code=String(row.cells?.[0]?.textContent||'').trim().match(/M\d+/i)?.[0]||String(row.cells?.[0]?.textContent||'').trim();
  return Object.values(A.state.matches||{}).find(m=>String(m.code||m.id||'').toUpperCase()===code.toUpperCase());
 }
 function ensureUI(){
  if($('tk137-date-modal'))return;
  const style=document.createElement('style');
  style.textContent='.tk137-day-edit{margin-left:auto!important;white-space:nowrap}.tk137-row-edit{margin-left:7px!important;white-space:nowrap}.tk137-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin-top:14px}.tk137-form label{display:block;margin-bottom:6px}.tk137-form input,.tk137-form select{width:100%;min-height:44px}.tk137-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.tk137-day-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.tk137-message{margin-top:10px}';
  document.head.appendChild(style);
  const root=document.createElement('div');root.id='tk137-date-modal';root.className='modal hidden';
  root.innerHTML='<div class="modal-box wide" role="dialog" aria-modal="true" aria-labelledby="tk137-title"><div class="split"><div><h2 id="tk137-title">✎ Chỉnh sửa lịch</h2><p id="tk137-hint" class="muted"></p></div><button type="button" class="btn mini" id="tk137-close">Đóng</button></div><form id="tk137-form"><div class="tk137-form"><div class="field"><label for="tk137-date">Ngày thi đấu</label><input type="date" id="tk137-date" required></div><div class="field" id="tk137-time-wrap"><label for="tk137-time">Giờ bắt đầu</label><input type="time" id="tk137-time"></div><div class="field" id="tk137-court-wrap"><label for="tk137-court">Sân / khu vực</label><select id="tk137-court"></select></div></div><p id="tk137-message" class="muted tk137-message" aria-live="polite"></p><div class="tk137-actions"><button type="button" class="btn" id="tk137-cancel">Hủy</button><button class="btn primary" type="submit" id="tk137-save">Lưu thay đổi</button></div></form></div>';
  document.body.appendChild(root);
  const close=()=>{if(busy)return;root.classList.add('hidden');editing=null;};
  $('tk137-close').onclick=close;$('tk137-cancel').onclick=close;
  $('tk137-form').addEventListener('submit',e=>{e.preventDefault();save().catch(err=>{setMessage(err?.message||String(err));U.toast(err?.message||'Không thể lưu lịch','err')})});
 }
 function setMessage(s){$('tk137-message').textContent=s||'';}
 function openMatch(id){
  if(!isAdmin())return U.toast('Chỉ Admin được sửa ngày thi đấu','err');
  const m=A.state.matches?.[id];if(!m)return;
  if(blocked.has(String(m.status||'').toUpperCase())||active(m))return U.toast('Không sửa lịch trận đang diễn ra, đã có kết quả hoặc bị khóa','err');
  ensureUI();editing={type:'match',ids:[id]};
  $('tk137-title').textContent='✎ Sửa lịch · '+(m.code||id);
  $('tk137-hint').textContent=A.matchLabel?.(m)||'Chỉnh ngày, giờ và sân';
  $('tk137-date').value=m.date||'';$('tk137-time').value=m.time||'';
  $('tk137-time-wrap').hidden=false;$('tk137-court-wrap').hidden=false;
  const sel=$('tk137-court');sel.replaceChildren();sel.add(new Option('Chưa gán sân',''));
  Object.values(A.state.courts||{}).forEach(c=>sel.add(new Option(c.name||c.id,c.id)));
  sel.value=m.courtId||'';setMessage('');$('tk137-date-modal').classList.remove('hidden');
 }
 function active(m){return Object.values(A.state.activeMatches||{}).some(x=>x?.matchId===m.id);}
 function openDay(ids,day){
  if(!isAdmin())return U.toast('Chỉ Admin được sửa ngày thi đấu','err');
  const selected=ids.map(id=>A.state.matches?.[id]).filter(Boolean);
  if(!selected.length)return;
  if(selected.some(m=>blocked.has(String(m.status||'').toUpperCase())||active(m)))return U.toast('Ngày có trận đang diễn ra/đã kết thúc. Hãy sửa riêng các trận còn được phép.','err');
  ensureUI();editing={type:'day',ids};
  $('tk137-title').textContent='📅 Đổi ngày nhóm lịch';
  $('tk137-hint').textContent='Đổi ngày cho '+selected.length+' trận/lượt; giữ nguyên giờ, sân, kết quả và thứ tự.';
  $('tk137-date').value=day||'';$('tk137-time-wrap').hidden=true;$('tk137-court-wrap').hidden=true;
  setMessage('');$('tk137-date-modal').classList.remove('hidden');
 }
 function conflicts(rows,all){
  const conflicts=[];
  for(const m of rows){
   for(const other of all){
    if(m.id===other.id||!m.date||!m.time||m.date!==other.date||m.time!==other.time||String(other.status).toUpperCase()==='CANCELLED')continue;
    const court=m.courtId&&other.courtId&&m.courtId===other.courtId;
    const team=[m.teamAId,m.teamBId].filter(Boolean).some(id=>id===other.teamAId||id===other.teamBId);
    if(court||team)conflicts.push((m.code||m.id)+' ↔ '+(other.code||other.id)+(court?' (trùng sân)':' (trùng đội/VĐV)'));
   }
  }
  return [...new Set(conflicts)];
 }
 async function save(){
  if(busy||!editing)return;
  if(!isAdmin())throw new Error('Không có quyền Admin.');
  const date=$('tk137-date').value;
  if(!validDate(date))throw new Error('Ngày không hợp lệ.');
  const ids=new Set(editing.ids), originals=editing.ids.map(id=>A.state.matches?.[id]);
  if(originals.some(m=>!m||blocked.has(String(m.status||'').toUpperCase())||active(m)))throw new Error('Lịch đã thay đổi hoặc có trận đã bắt đầu. Vui lòng kiểm tra lại.');
  const time=editing.type==='match'?$('tk137-time').value:null;
  if(editing.type==='match'&&time&&!validTime(time))throw new Error('Giờ phải theo định dạng HH:MM.');
  const candidates=originals.map(m=>({...m,date,...(editing.type==='match'?{time,courtId:$('tk137-court').value}:{}),updatedAt:Date.now()}));
  const all=[...Object.values(A.state.matches||{}).filter(m=>!ids.has(m.id)),...candidates];
  const errors=conflicts(candidates,all);
  if(errors.length)throw new Error('Trùng lịch: '+errors.slice(0,3).join('; '));
  if(candidates.every((m,i)=>m.date===originals[i].date&&m.time===originals[i].time&&m.courtId===originals[i].courtId)){ $('tk137-date-modal').classList.add('hidden');editing=null;return;}
  busy=true;$('tk137-save').disabled=true;setMessage('Đang lưu lịch...');
  try{
   if(candidates.length===1)await T.Data.queueSet('matches/'+candidates[0].id,candidates[0],{type:'MATCH_EDIT_SCHEDULE'});
   else {const updates={};candidates.forEach(m=>updates[T.Data.path('matches/'+m.id)]=m);await T.Data.queueMulti(updates,{type:'MATCH_EDIT_DAY'});}
   await T.Data.audit?.('UPDATE_SCHEDULE',editing.type==='day'?'match_day':'match',editing.ids.join(','),originals,candidates);
   $('tk137-date-modal').classList.add('hidden');editing=null;
   A.renderMatches?.();U.toast('Đã lưu lịch thi đấu','ok');
  }finally{busy=false;$('tk137-save').disabled=false;setMessage('');}
 }
 function enhance(){
  if(!isAdmin())return;
  const box=$('matches-list');if(!box)return;
  let day='',ids=[],header=null;
  const flush=()=>{if(!header||!ids.length)return;const target=header.querySelector('.tk12-day-head')||header.querySelector('td');if(!target||target.querySelector('.tk137-day-edit'))return;
    target.classList.add('tk137-day-head');const b=document.createElement('button');b.type='button';b.className='btn mini tk137-day-edit';b.textContent='✎ Sửa ngày';const copy=ids.slice(),date=day;b.onclick=()=>openDay(copy,date);target.appendChild(b);
  };
  [...box.querySelectorAll('tr')].forEach(tr=>{
   if(tr.classList.contains('tk12-day-row')){flush();header=tr;ids=[];day='';return;}
   if(!tr.classList.contains('tk12-match-row'))return;
   const m=matchFor(tr);if(!m)return;
   if(header){ids.push(m.id);day=m.date||'';}
   if(blocked.has(String(m.status||'').toUpperCase())||active(m))return;
   const cell=tr.cells?.[7]||tr.lastElementChild;if(!cell||cell.querySelector('.tk137-row-edit'))return;
   const b=document.createElement('button');b.type='button';b.className='btn mini tk137-row-edit';b.textContent='✎ Sửa lịch';b.onclick=()=>openMatch(m.id);cell.appendChild(b);
  });flush();
 }
 const base=A.renderMatches.bind(A);
 A.renderMatches=function(...args){const result=base(...args);enhance();return result;};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{ensureUI();enhance();},{once:true});else{ensureUI();enhance();}
 window.TopkeyAdminScheduleEdit={openMatch,openDay};
})();
