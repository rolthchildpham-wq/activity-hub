(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,Up9=window.TopkeyUpgrade9;
if(!T||!App||!U||!Up9||App.__upgrade21Installed)return;
App.__upgrade21Installed=true;
const $=id=>document.getElementById(id);
const fmt=v=>{const p=String(v||'').split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:String(v||'')};
let raf=0;
function range(){const from=$('auto-date')?.value||'',to=$('auto-end-date')?.value||from,includeSunday=$('auto-sunday')?.checked!==false;return{from,to,includeSunday};}
function validRange(r){return !!r.from&&!!r.to&&r.to>=r.from;}
function updateDateBounds(r){
  if(!validRange(r))return;
  ['busy-date','tk9-player-date','tk9-limit-date','tk17-limit-date','lock-date','priority-from','priority-to','limit-from','limit-to','tk20-player-window-from-date','tk20-player-window-to-date'].forEach(id=>{
    const el=$(id);if(!el||el.type!=='date')return;el.min=r.from;el.max=r.to;
  });
}
function updateRangeNotes(r){
  const dates=validRange(r)?Up9.dateRange(r.from,r.to,r.includeSunday):[];
  [['tk9-busy-dates','tk21-busy-range-note'],['tk9-player-dates','tk21-player-range-note']].forEach(([boxId,noteId])=>{
    const box=$(boxId);if(!box)return;let note=$(noteId);if(!note){note=document.createElement('small');note.id=noteId;note.className='tk21-range-note';box.parentElement?.insertBefore(note,box);}
    if(note)note.textContent=validRange(r)?`Khoảng đang chọn: ${fmt(r.from)} → ${fmt(r.to)} · ${dates.length} ngày${r.includeSunday?'':' (không tính Chủ Nhật)'}`:'Chọn Từ ngày và Đến ngày để tải danh sách ngày.';
  });
}
function refreshDatePickers(showToast=false){
  const r=range();
  if(validRange(r)){
    Up9.renderDateChecks('tk9-busy-dates');
    Up9.renderDateChecks('tk9-player-dates');
    updateDateBounds(r);
  }else{
    ['tk9-busy-dates','tk9-player-dates'].forEach(id=>{const box=$(id);if(box)box.innerHTML='<span class="muted">Khoảng ngày chưa hợp lệ.</span>';});
  }
  updateRangeNotes(r);
  window.TopkeyUpgrade20?.renderPlayerWindows?.();
  window.TopkeyUpgrade17?.renderQuickLimit?.();
  if(showToast&&validRange(r))U.toast(`Đã cập nhật ngày Smart Scheduler: ${fmt(r.from)} → ${fmt(r.to)}`,'ok');
}
function scheduleRefresh(showToast=false){cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>refreshDatePickers(showToast));}
function bindRangeInputs(){
  [['auto-date','input'],['auto-date','change'],['auto-end-date','input'],['auto-end-date','change'],['auto-sunday','change']].forEach(([id,event])=>{
    const el=$(id);if(!el)return;const key=`tk21Bound${event}`;if(el.dataset[key])return;el.dataset[key]='1';el.addEventListener(event,()=>scheduleRefresh(event==='change'));
  });
}
function patchSchedulerRender(){
  const base=App.renderSchedulerControls?.bind(App);if(!base||App.__u21SchedulerRender)return;App.__u21SchedulerRender=true;
  App.renderSchedulerControls=function(...args){const out=base(...args);bindRangeInputs();scheduleRefresh(false);return out;};
}
function install(){patchSchedulerRender();bindRangeInputs();refreshDatePickers(false);setTimeout(()=>{bindRangeInputs();refreshDatePickers(false);},0);}
install();
window.TopkeyUpgrade21={refreshDatePickers,range};
})();
