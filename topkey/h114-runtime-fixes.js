/* H114 - Tournament close integrity, finance ADMIN editor and fast login.
   Shared by Badminton and all six VNext sports. Does not bypass Firebase authorization. */
(()=>{'use strict';
if(window.TopkeyH114) return;
const terminal=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED','CANCELLED']);
const state={installed:false,finInstalled:false,closeInstalled:false,closure:null,closureAt:0,closurePromise:null,editing:null,processing:false};
const val=x=>String(x==null?'':x);
const escape=s=>val(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const show=(msg,type='info')=>{try{window.Topkey?.U?.toast?.(msg,type)}catch{};};
const admin=()=>{const t=window.Topkey;return t?.Auth?.role?.()==='ADMIN'&&!!t.Auth.user?.uid&&t.Auth.profile?.active!==false&&t.Auth._profileVerifiedUid===t.Auth.user.uid;};
function fullPath(branch,id=''){const t=window.Topkey;return t.Data.path(branch+(id?'/'+id:''));}
function dataReady(){const d=window.Topkey?.Data;if(!d?.db||!d.ready||!navigator.onLine)throw Error('Firebase chưa sẵn sàng hoặc đang ngoại tuyến. Không dùng dữ liệu chưa đồng bộ.');return d;}
const matchText=(m,id)=>`${m.code||id} · ${m.category||''} · ${m.date||''} ${m.time||''}`;
function analyseMatches(obj){const rows=Object.entries(obj||{}).filter(([,r])=>r&&typeof r==='object');const unfinished=rows.filter(([,m])=>!terminal.has(val(m.status).toUpperCase())).map(([id,m])=>({id,status:val(m.status||'UNKNOWN'),label:matchText(m,id),hasResult:!!m.finishedAt&&(!!m.winnerId||m.scoreA!=null&&m.scoreB!=null||m.resultMs!=null||m.judgeScore!=null||(Array.isArray(m.sets)&&m.sets.some(s=>s?.finished)))}));return {total:rows.length,finished:rows.length-unfinished.length,unfinished};}
async function auditClose(force=false){
 const T=window.Topkey,app=T?.App,d=dataReady();if(!app)return null;
 if(!force&&state.closure&&Date.now()-state.closureAt<8000)return state.closure;
 if(state.closurePromise)return state.closurePromise;
 state.closurePromise=(async()=>{const snap=await d.db.ref(fullPath('matches')).once('value');const all=snap.val()||{};const check=analyseMatches(all);state.closure={...check,all,at:Date.now()};state.closureAt=Date.now();updateCloseUI();return state.closure;})();
 try{return await state.closurePromise}finally{state.closurePromise=null}
}
function updateCloseUI(){const status=document.getElementById('tk9-lifecycle-status'),button=document.getElementById('tk9-finish-tournament'),c=window.Topkey?.App?.state?.config||{};if(!status||!button)return;const a=state.closure; if(c.tournamentStatus==='CLOSED')return;
 if(!a){status.textContent='Đang chờ đối chiếu toàn bộ lịch với Firebase...';button.disabled=true;return}
 const labels=a.unfinished.slice(0,8).map(m=>m.label+' ['+m.status+']');status.textContent=a.unfinished.length?`Firebase xác nhận ${a.finished}/${a.total} trận hoàn tất. Còn ${a.unfinished.length} trận: ${labels.join(' · ')}${a.unfinished.length>8?' ...':''}`:`Đã đối chiếu Firebase: ${a.finished}/${a.total} trận hoàn tất. Có thể đóng giải (sẽ xác minh lại trước khi lưu).`;
 button.disabled=a.unfinished.length>0;
}
async function finalizeTournament(){
 const T=window.Topkey,A=T?.App,d=dataReady();if(!admin()||!A)return show('Chỉ ADMIN đã xác minh được đóng giải.','err');
 if(window.TopkeyH104?.requireFull)await window.TopkeyH104.requireFull(['teams','matches','finance'],'đóng giải / báo cáo đầy đủ');const check=await auditClose(true);if(check.unfinished.length){show(`Còn ${check.unfinished.length} trận chưa hoàn tất. Xem danh sách ở Cài đặt.`, 'err');return}
 if(!check.total&&!confirm('Giải chưa có trận. Vẫn muốn đóng giải?'))return;
 if(!await T.U.confirmDanger('Đóng giải đã đối chiếu','Đã kiểm tra '+check.total+' trận trên Firebase. Dữ liệu sẽ chuyển sang chế độ chỉ đọc.','ĐÓNG GIẢI'))return;
 const again=await auditClose(true);if(again.unfinished.length||again.total!==check.total||Object.keys(again.all).some(id=>val(again.all[id]?.status)!==val(check.all[id]?.status))){show('Dữ liệu trận vừa thay đổi. Vui lòng kiểm tra lại.','err');return}
 const teams=(await d.db.ref(fullPath('teams')).once('value')).val()||{};
 const prevM=A.state.matches,prevT=A.state.teams;let top3={};
 try{A.state.matches=again.all;A.state.teams=teams;for(const cat of new Set(Object.values(teams).map(x=>x?.category).filter(Boolean))){top3[cat]=(A.ranking?.()||[]).filter(r=>teams[r.id]?.category===cat).slice(0,3)}}finally{A.state.matches=prevM;A.state.teams=prevT}
 const configSnap=await d.db.ref(fullPath('config')).once('value'),original=configSnap.val()||{};if(original.tournamentStatus==='CLOSED')return show('Giải đã được đóng từ thiết bị khác.','info');
 const now=Date.now(),cfg={...original,tournamentStatus:'CLOSED',closedAt:now,closedBy:T.Auth.user.uid,finalTop3:top3,updatedAt:now};const AUTH_ROOT=T.AUTH_ROOT||'topkey_badminton_vnext_2026',sport=T.SPORT?.key||'badminton';
 const idx={tid:d.tid,title:cfg.title||T.SPORT?.title||'TOPKEY',status:'CLOSED',closedAt:now,sport,top3};
 // Data consistency: revalidate before committing; multi-location Firebase write is atomic.
 const latest=(await d.db.ref(fullPath('matches')).once('value')).val()||{};const final=analyseMatches(latest);
 if(final.unfinished.length||final.total!==again.total)throw Error('Lịch thi đấu thay đổi trong lúc chốt, thao tác bị hủy.');
 const changes={};changes[fullPath('config')]=cfg;changes[`${AUTH_ROOT}/tournamentIndex/${sport}/${d.tid}`]=idx;
 await d.db.ref().update(changes);await d.audit?.('CLOSE_VERIFIED','tournament',d.tid,{matches:final.total},{closedAt:now,top3});A.state.config=cfg;window.TopkeyUpgrade9?.renderSettings?.();window.TopkeyUpgrade9?.loadArchives?.().catch?.(()=>{});try{await window.TopkeyUpgrade122Hotfix65?.ensureReport?.(true)}catch(e){console.warn('Final report generation deferred',e)}show('Đã đóng giải. Toàn bộ lịch được xác minh từ Firebase.','ok');
}
function installClose(app){if(!document.getElementById('tk9-lifecycle-card'))return;const controller=window.TopkeyUpgrade9||app;const oldRender=controller.renderSettings?.bind(controller);if(oldRender&&!oldRender.__h114){controller.renderSettings=function(...args){const result=oldRender(...args);updateCloseUI();return result}}
 controller.finishTournament=async()=>{try{await finalizeTournament()}catch(e){show('Không thể đóng giải: '+(e?.message||e),'err')}};
 const card=document.getElementById('tk9-lifecycle-card');if(!document.getElementById('h114-audit-close')){const audit=document.createElement('button');audit.id='h114-audit-close';audit.className='btn mini';audit.textContent='🔎 Đối chiếu toàn bộ lịch trên Firebase';audit.type='button';audit.onclick=async()=>{audit.disabled=true;try{await auditClose(true)}catch(e){show(e.message,'err')}finally{audit.disabled=false}};card.querySelector('.tk9-actions')?.before(audit)}
 const oldShow=app.showTab?.bind(app);if(oldShow){app.showTab=function(tab,...args){const r=oldShow(tab,...args);if(tab==='settings'){updateCloseUI();auditClose(true).catch(e=>{const s=document.getElementById('tk9-lifecycle-status');if(s)s.textContent='Không thể xác minh dữ liệu: '+e.message;document.getElementById('tk9-finish-tournament')?.setAttribute('disabled','')})}return r}}
}
function improveReceiptCompression(T){
 if(!T?.U||T.U.__h114ReceiptCompression)return;
 T.U.__h114ReceiptCompression=true;
 const legacy=T.U.compressReceipt;
 T.U.compressReceipt=async function(file){
  if(!file||!file.type?.startsWith('image/'))return file; // PDF and XLSX already compressed container formats; retain original printable fidelity.
  if(file.size<450000||typeof createImageBitmap!=='function')return file;
  try{
   const bmp=await createImageBitmap(file),scale=Math.min(1,2400/Math.max(bmp.width,bmp.height));
   const c=document.createElement('canvas');c.width=Math.max(1,Math.round(bmp.width*scale));c.height=Math.max(1,Math.round(bmp.height*scale));
   c.getContext('2d',{alpha:false}).drawImage(bmp,0,0,c.width,c.height);
   const blob=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',.86));bmp.close?.();
   if(!blob||blob.size>=file.size)return file;
   return new File([blob],file.name.replace(/\.[^.]+$/,'.jpg'),{type:'image/jpeg',lastModified:file.lastModified});
  }catch(e){return legacy?legacy.call(this,file):file}
 };
}
function fileValid(f){const ext=(val(f.name).split('.').pop()||'').toLowerCase();return ['png','jpg','jpeg','webp','pdf','xlsx'].includes(ext)&&f.size<=25*1024*1024}
function installFinance(app){const form=document.getElementById('finance-form'),list=document.getElementById('finance-list');if(!form||!list)return;
 const fileInput=form.querySelector('input[name=receipt]');if(fileInput){fileInput.accept='image/jpeg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx';const label=fileInput.closest('.field')?.querySelector('label');if(label)label.textContent='Chứng từ (ảnh, PDF, Excel .xlsx; tối đa 25 MB)'}
 const save=form.querySelector('#finance-save-btn'),actions=document.createElement('div');actions.id='h114-finance-edit-actions';actions.style.cssText='display:none;align-items:center;gap:8px;grid-column:1/-1';actions.innerHTML='<span style="font-size:12px">Đang chỉnh giao dịch <b id="h114-edit-code"></b></span><button type="button" class="btn mini" id="h114-cancel-edit">Hủy sửa</button>';save?.after(actions);
 const reset=()=>{state.editing=null;state.processing=false;actions.style.display='none';form.reset();if(save)save.textContent='Lưu khoản';};actions.querySelector('button').onclick=reset;
 // Only intercept edit submissions; creation still follows the existing verified pipeline.
 form.addEventListener('submit',async e=>{const f=fileInput?.files?.[0];if(f&&!fileValid(f)){e.preventDefault();e.stopImmediatePropagation();show('Chỉ nhận ảnh, PDF hoặc Excel .xlsx ≤ 25 MB.','err');return}if(!state.editing)return;e.preventDefault();e.stopImmediatePropagation();if(state.processing)return;state.processing=true;
 try{const T=window.Topkey;if(!admin())throw Error('Chỉ ADMIN đã xác minh mới được sửa tài chính.');const id=state.editing.id,before=state.editing.row,fd=new FormData(form),file=fd.get('receipt'),d=dataReady();const fields={date:val(fd.get('date')),type:val(fd.get('type')),category:val(fd.get('category')).trim(),amount:Number(fd.get('amount')),invoice:val(fd.get('invoice')),note:val(fd.get('note'))};if(!fields.date||!fields.category||!Number.isFinite(fields.amount)||fields.amount<0)throw Error('Ngày, hạng mục hoặc số tiền không hợp lệ.');
 let attachment={};if(file?.size){const comp=await T.U.compressReceipt(file);const url=await d.uploadReceipt(comp,id+'_edit_'+Date.now());attachment={receiptName:comp.name,receiptUrl:url,receiptState:url?'CLOUD':'UPLOAD_ERROR',receiptMime:comp.type};if(!url)throw Error('Chứng từ chưa tải được lên Storage, giữ nguyên giao dịch.');}
 const ref=d.db.ref(fullPath('finance',id)),stamp=Number(before.updatedAt||before.createdAt||0);const result=await ref.transaction(curr=>{if(!curr||Number(curr.updatedAt||curr.createdAt||0)!==stamp)return;return {...curr,...fields,...attachment,updatedAt:Date.now(),updatedBy:T.Auth.user.uid}},undefined,false);
 if(!result.committed)throw Error('Giao dịch đã bị thiết bị khác sửa/xóa. Tải lại trước khi lưu.');await d.audit?.('FINANCE_EDIT','finance',id,before,result.snapshot.val());reset();show('Đã cập nhật giao dịch và ghi Audit.','ok');
 }catch(err){show('Lỗi sửa tài chính: '+err.message,'err')}finally{state.processing=false}},true);
 const oldRender=app.renderFinance?.bind(app);if(oldRender){app.renderFinance=function(...args){const r=oldRender(...args);if(!admin())return r;const rows=Object.values(app.state.finance||{}).filter(Boolean).sort(list.tagName==='TBODY'?(a,b)=>Number(a.seq||0)-Number(b.seq||0):(a,b)=>(Number(b.createdAt||0)-Number(a.createdAt||0)));const nodes=[...list.children];nodes.forEach((node,i)=>{const row=rows[i];if(!row||node.querySelector('[data-h114-action]'))return;const host=list.tagName==='TBODY'?(node.lastElementChild||node):node;
 for(const [name,label] of [['edit','✎ Sửa'],['delete','🗑 Xóa']]){const b=document.createElement('button');b.type='button';b.className='btn mini '+(name==='delete'?'danger':'');b.dataset.h114Action=name;b.dataset.id=row.id;b.textContent=label;b.style.margin='2px';host.appendChild(b)}});return r}}
 list.addEventListener('click',async e=>{const T=window.Topkey;const b=e.target.closest('[data-h114-action]');if(!b)return;e.preventDefault();if(!admin())return show('Không có quyền ADMIN','err');const id=b.dataset.id,row=app.state.finance?.[id];if(!row)return show('Không tìm thấy giao dịch','err');if(b.dataset.h114Action==='edit'){
 state.editing={id,row:{...row}};for(const name of ['date','type','category','amount','invoice','note']){const field=form.elements.namedItem(name);if(field)field.value=row[name]??''}if(fileInput)fileInput.value='';if(save)save.textContent='💾 Cập nhật giao dịch';actions.style.display='flex';actions.querySelector('b').textContent=row.invoice||row.id;form.scrollIntoView?.({behavior:'smooth',block:'nearest'});return}
 if(state.processing)return;const ok=await T.U.confirmDanger('Xóa giao dịch',`Xóa ${row.invoice||row.id} · ${row.category} · ${row.amount} VNĐ? Thao tác ghi nhật ký và không thể hoàn tác trên giao diện.`, 'XÓA');if(!ok)return;state.processing=true;try{const d=dataReady();const ref=d.db.ref(fullPath('finance',id));const expected=Number(row.updatedAt||row.createdAt||0);
 const result=await ref.transaction(current=>{if(!current||Number(current.updatedAt||current.createdAt||0)!==expected)return;return null},undefined,false);
 if(!result.committed)throw Error('Giao dịch đã thay đổi từ thiết bị khác. Vui lòng tải lại.');await d.audit?.('FINANCE_DELETE','finance',id,row,{deletedAt:Date.now(),deletedBy:T.Auth.user.uid});if(state.editing?.id===id)reset();show('Đã xóa khoản thu/chi; Audit giữ lịch sử.','ok');
 }catch(err){show('Không thể xóa: '+err.message,'err')}finally{state.processing=false}},false);
}
function speed(app){if(app.__h114Speed||typeof app.afterLogin!=='function')return;app.__h114Speed=true;
 const original=app.afterLogin.bind(app);app.afterLogin=function(...args){if(this.__h114Starting)return this.__h114Starting;
 this.__h114Starting=Promise.resolve().then(()=>original(...args)).finally(()=>{this.__h114Starting=null});return this.__h114Starting};
}
function install(){const T=window.Topkey,app=T?.App;if(!app||!T?.Data||!T?.Auth)return false;try{
 speed(app);improveReceiptCompression(T);
 if(!state.finInstalled&&document.getElementById('finance-form')&&document.getElementById('finance-list')){installFinance(app);state.finInstalled=true}
 if(!state.closeInstalled&&document.getElementById('tk9-lifecycle-card')&&window.TopkeyUpgrade9){installClose(app);state.closeInstalled=true}
 state.installed=state.finInstalled&&state.closeInstalled;
 return state.installed;
 }catch(e){console.error('H114 install failed',e);return false}}

let tries=0;function boot(){if(install())return;if(++tries<50)setTimeout(boot,200)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.addEventListener('topkey:admin-ready',boot);
window.TopkeyH114={analyseMatches,auditClose,finalizeTournament,install,state,fileValid};
})();
