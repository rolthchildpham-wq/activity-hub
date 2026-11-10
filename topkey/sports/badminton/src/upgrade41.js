(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,Up39=window.TopkeyUpgrade39,Up40=window.TopkeyUpgrade40;
if(!T||!App||!U||!Up39||!Up40||App.__upgrade41Installed)return;
App.__upgrade41Installed=true;
const VERSION=T.CONFIG_VERSION||T.VERSION;
const $=id=>document.getElementById(id);
const tr=(vi,en,zh)=>{const l=window.TopkeyI18n?.language||'vi';return l==='en'?en:l==='zh'?zh:vi;};
const protectedStatuses=new Set(['LIVE','FINISHED','WALKOVER','RETIRED','DISQUALIFIED','SUSPENDED']);
const baseBuildSchedulePlan=Up39.buildSchedulePlan;
const baseAutoSchedule40=Up40.autoSchedule40;

function deleteMode(){return document.querySelector('input[name="tk41-delete-mode"]:checked')?.value||'clear';}
function isProtectedMatch(m,activeIds){return activeIds.has(m.id)||protectedStatuses.has(m.status)||(m.sets||[]).length>0||!!m.startedAt||!!m.finishedAt;}
function matchFilter(m,category,stage){return(category==='ALL'||App.normalizeCategory(m.category)===category)&&(stage==='ALL'||String(m.stage||'').toUpperCase()===stage);}
function clearScheduleFields(m){
  const pending=new Set(['SCHEDULED','CHECK_IN','READY','CALLED_TO_COURT','WARM_UP']);
  return{...m,date:'',time:'',courtId:'',scheduledAt:null,status:pending.has(m.status)?'SCHEDULED':m.status,updatedAt:Date.now(),schedulerVersion:VERSION};
}
function ensureDeleteModeUI(){
  const modal=$('schedule-delete-modal'),box=modal?.querySelector('.schedule-delete-box');if(!box)return;
  let wrap=$('tk41-delete-mode-wrap');
  if(!wrap){
    wrap=document.createElement('div');wrap.id='tk41-delete-mode-wrap';wrap.className='tk41-delete-mode-wrap';
    wrap.innerHTML=`<div class="tk41-delete-mode-title">${tr('Chọn thao tác','Choose action','选择操作')}</div>
      <label class="tk41-mode-card"><input type="radio" name="tk41-delete-mode" value="clear" checked><span><b>${tr('1. Chỉ xóa lịch phân ngày / giờ / sân','1. Clear date / time / court assignment only','1. 仅清除日期 / 时间 / 场地安排')}</b><small>${tr('Giữ nguyên trận, mã trận, đội A/B, nội dung và vòng đấu để Smart Scheduler xếp lại.','Keep match IDs, teams, category and stage so Smart Scheduler can reschedule them.','保留比赛、编号、双方、项目和轮次，供智能排程重新安排。')}</small></span></label>
      <label class="tk41-mode-card danger"><input type="radio" name="tk41-delete-mode" value="delete"><span><b>${tr('2. Xóa các trận / vòng đấu để tạo lại','2. Delete matches / stages to regenerate','2. 删除比赛 / 轮次后重新生成')}</b><small>${tr('Xóa đối tượng trận theo Nội dung + Vòng đấu, kể cả trận CHƯA CÓ NGÀY. Giữ danh sách đội và cài đặt giải.','Delete match objects by Category + Stage, including UNSCHEDULED matches. Teams and tournament settings are kept.','按项目 + 轮次删除比赛对象，包括未排日期的比赛；保留队伍和赛事设置。')}</small></span></label>`;
    const options=box.querySelector('.delete-options');box.insertBefore(wrap,options||box.children[1]);
    wrap.querySelectorAll('input[name="tk41-delete-mode"]').forEach(r=>r.addEventListener('change',()=>App.updateDeleteScopeUI()));
  }
  return wrap;
}
function syncDeleteModeUI(){
  ensureDeleteModeUI();const mode=deleteMode(),rangeRad=document.querySelector('input[name="delete-scope"][value="range"]'),allRad=document.querySelector('input[name="delete-scope"][value="all"]'),options=$('schedule-delete-modal')?.querySelector('.delete-options'),from=$('delete-from'),to=$('delete-to'),protectedCheck=$('delete-protected'),dangerLabel=protectedCheck?.closest('.danger-check'),run=$('schedule-delete-run');
  if(mode==='delete'){
    if(allRad)allRad.checked=true;if(options)options.classList.add('tk41-scope-disabled');if(rangeRad)rangeRad.disabled=true;if(allRad)allRad.disabled=true;if(from)from.disabled=true;if(to)to.disabled=true;
    if(dangerLabel){const b=dangerLabel.querySelector('b'),s=dangerLabel.querySelector('small');if(b)b.textContent=tr('Cho phép xóa cả trận đã có tỷ số / đã bắt đầu','Allow deletion of started/scored matches','允许删除已开始/已有比分的比赛');if(s)s.textContent=tr('Mặc định tắt để bảo vệ kết quả. Khi bật, các trận này cũng bị xóa khỏi cấu trúc giải và sân LIVE liên quan được giải phóng.','Off by default to protect results. If enabled, these matches are also deleted and related LIVE courts are released.','默认关闭以保护结果。开启后这些比赛也会被删除，并释放相关直播场地。');}
    if(run)run.textContent=tr('Tiếp tục xóa trận / vòng đấu','Continue deleting matches / stages','继续删除比赛 / 轮次');
  }else{
    if(options)options.classList.remove('tk41-scope-disabled');if(rangeRad)rangeRad.disabled=false;if(allRad)allRad.disabled=false;const range=(document.querySelector('input[name="delete-scope"]:checked')?.value||'range')!=='all';if(from)from.disabled=!range;if(to)to.disabled=!range;
    if(dangerLabel){const b=dangerLabel.querySelector('b'),s=dangerLabel.querySelector('small');if(b)b.textContent=tr('Cho phép bỏ lịch cả trận đã có tỷ số / đã bắt đầu','Allow clearing schedule of started/scored matches','允许清除已开始/已有比分比赛的排程');if(s)s.textContent=tr('Mặc định tắt để bảo vệ lịch sử thi đấu. Chế độ này chỉ bỏ ngày/giờ/sân, không xóa kết quả.','Off by default to protect match history. This only clears date/time/court; results are not deleted.','默认关闭以保护比赛历史；此模式只清除日期/时间/场地，不删除结果。');}
    if(run)run.textContent=tr('Tiếp tục xóa lịch an toàn','Continue safe schedule clearing','继续安全清除赛程');
  }
}
function openScheduleDelete41(){
  ensureDeleteModeUI();const clear=document.querySelector('input[name="tk41-delete-mode"][value="clear"]');if(clear)clear.checked=true;
  const modal=$('schedule-delete-modal'),from=$('delete-from'),to=$('delete-to');from.value=$('auto-date')?.value||App.localDateISO();to.value=$('auto-end-date')?.value||from.value;$('delete-category').value=$('adv-category')?.value||'ALL';$('delete-stage').value='ALL';$('delete-protected').checked=false;const range=document.querySelector('input[name="delete-scope"][value="range"]');if(range)range.checked=true;syncDeleteModeUI();modal.classList.remove('hidden');App.previewScheduleDelete(false);
}
function updateDeleteScopeUI41(){syncDeleteModeUI();App.previewScheduleDelete(false);}
function scheduleDeletePlan41(){
  const mode=deleteMode(),scope=document.querySelector('input[name="delete-scope"]:checked')?.value||'range',from=$('delete-from').value,to=$('delete-to').value,category=$('delete-category').value||'ALL',stage=$('delete-stage').value||'ALL',allowProtected=$('delete-protected').checked;
  if(mode==='clear'&&scope==='range'&&(!from||!to||to<from))throw new Error(tr('Vui lòng chọn khoảng ngày hợp lệ','Choose a valid date range','请选择有效日期范围'));
  const all=Object.values(App.state.matches||{}),activeIds=new Set(Object.values(App.state.activeMatches||{}).filter(Boolean).map(x=>x.matchId));
  const filtered=all.filter(m=>matchFilter(m,category,stage));
  const candidates=mode==='delete'?filtered:filtered.filter(m=>!!m.date&&(scope==='all'||(m.date>=from&&m.date<=to)));
  const protectedMatches=candidates.filter(m=>isProtectedMatch(m,activeIds)),deletable=candidates.filter(m=>allowProtected||!isProtectedMatch(m,activeIds)),skipped=allowProtected?[]:protectedMatches;
  return{mode,scope,from,to,category,stage,allowProtected,candidates,protectedMatches,deletable,skipped,activeIds,unscheduled:candidates.filter(m=>!m.date),scheduled:candidates.filter(m=>!!m.date)};
}
function previewScheduleDelete41(showToast=true){
  try{const p=scheduleDeletePlan41(),box=$('delete-preview');if(p.mode==='clear')box.innerHTML=`<b>${tr('Phạm vi có lịch:','Scheduled matches in scope:','范围内已有排程：')} ${p.candidates.length} ${tr('trận','matches','场')}</b><span class="delete-good">${tr('Sẽ bỏ ngày/giờ/sân:','Will clear date/time/court:','将清除日期/时间/场地：')} ${p.deletable.length}</span><span class="delete-protect">${tr('Được bảo vệ/bỏ qua:','Protected/skipped:','受保护/跳过：')} ${p.skipped.length}</span><span class="tk41-keep-structure">${tr('Trận/vòng đấu được GIỮ NGUYÊN.','Match/stage structure is KEPT.','比赛/轮次结构将保留。')}</span>`;
    else box.innerHTML=`<b>${tr('Phạm vi cấu trúc giải:','Tournament structure scope:','赛事结构范围：')} ${p.candidates.length} ${tr('trận','matches','场')}</b><span class="delete-danger">${tr('Sẽ XÓA đối tượng trận:','Match objects to DELETE:','将删除比赛对象：')} ${p.deletable.length}</span><span class="delete-protect">${tr('Được bảo vệ/bỏ qua:','Protected/skipped:','受保护/跳过：')} ${p.skipped.length}</span><span class="tk41-unscheduled-count">${tr('Trong đó CHƯA CÓ NGÀY:','Including UNSCHEDULED:','其中未排日期：')} ${p.unscheduled.length}</span><span>${tr('Giữ đội & cài đặt giải; sau đó có thể tạo lại vòng tròn/knockout.','Teams & tournament settings are kept; round-robin/knockout can then be regenerated.','保留队伍和赛事设置；之后可重新生成循环赛/淘汰赛。')}</span>`;
    if(showToast)U.toast(p.mode==='clear'?tr(`Sẽ bỏ lịch ${p.deletable.length} trận`,`Will clear ${p.deletable.length} schedule assignments`,`将清除 ${p.deletable.length} 场排程`):tr(`Sẽ xóa ${p.deletable.length} trận, gồm ${p.unscheduled.length} trận chưa có ngày`,`Will delete ${p.deletable.length} matches, including ${p.unscheduled.length} unscheduled`,`将删除 ${p.deletable.length} 场，其中 ${p.unscheduled.length} 场未排日期`),'info');return p;
  }catch(e){$('delete-preview').textContent=e.message;if(showToast)U.toast(e.message,'err');return null;}
}
function releaseActiveMatches(updates,rows){
  const ids=new Set(rows.map(m=>m.id));for(const [courtId,active] of Object.entries(App.state.activeMatches||{})){if(active&&ids.has(active.matchId)){updates[T.Data.path('activeMatches/'+courtId)]=null;const c=App.state.courts?.[courtId];if(c)updates[T.Data.path('courts/'+courtId)]={...c,status:'AVAILABLE',activeMatchId:'',updatedAt:Date.now()};}}
}
async function executeScheduleDelete41(){
  const p=previewScheduleDelete41(false);if(!p||!p.deletable.length)return U.toast(tr('Không có trận phù hợp để xử lý','No matching matches to process','没有符合条件的比赛'),'info');
  const backup={type:p.mode==='clear'?'TOPKEY_SCHEDULE_CLEAR_BACKUP':'TOPKEY_MATCH_STRUCTURE_DELETE_BACKUP',version:T.VERSION,exportedAt:new Date().toISOString(),tournamentId:T.Data.tid,operation:p.mode,scope:{mode:p.scope,from:p.from,to:p.to,category:p.category,stage:p.stage,allowProtected:p.allowProtected},matches:p.deletable,activeMatches:Object.fromEntries(Object.entries(App.state.activeMatches||{}).filter(([,x])=>x&&p.deletable.some(m=>m.id===x.matchId))),courts:App.state.courts};
  U.download(`${p.mode==='clear'?'Topkey_Backup_Lich_Truoc_BoGan':'Topkey_Backup_Tran_VongDau_Truoc_Xoa'}_${App.localDateISO()}.json`,new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));
  const hasProtected=p.protectedMatches.some(m=>p.deletable.includes(m));let title,detail,phrase;
  if(p.mode==='clear'){title=tr('Chỉ xóa lịch phân ngày / giờ / sân','Clear date / time / court assignments only','仅清除日期 / 时间 / 场地安排');detail=tr(`Sẽ bỏ ngày/giờ/sân của ${p.deletable.length} trận nhưng GIỮ nguyên trận/vòng đấu. ${p.skipped.length} trận được bảo vệ. Bản sao JSON đã tải trước khi xử lý.${hasProtected?' Có trận đã bắt đầu/có kết quả; kết quả vẫn được giữ.':''}`,`Will clear date/time/court for ${p.deletable.length} matches while KEEPING match/stage structure. ${p.skipped.length} protected matches remain. A JSON backup was downloaded first.${hasProtected?' Some matches have started/results; results are kept.':''}`,`将清除 ${p.deletable.length} 场的日期/时间/场地，同时保留比赛/轮次结构。${p.skipped.length} 场受保护。已先下载 JSON 备份。${hasProtected?' 部分比赛已开始/有结果；结果仍保留。':''}`);phrase=tr('BỎ LỊCH','CLEAR SCHEDULE','清除排程');}
  else{title=tr('Xóa các trận / vòng đấu để tạo lại','Delete matches / stages to regenerate','删除比赛 / 轮次后重新生成');detail=tr(`Sẽ XÓA ${p.deletable.length} đối tượng trận theo Nội dung/Vòng đã chọn, gồm ${p.unscheduled.filter(m=>p.deletable.includes(m)).length} trận chưa có ngày. Danh sách đội và cài đặt giải được giữ. ${p.skipped.length} trận được bảo vệ.`,`Will DELETE ${p.deletable.length} match objects in the selected Category/Stage, including ${p.unscheduled.filter(m=>p.deletable.includes(m)).length} unscheduled matches. Teams and tournament settings are kept. ${p.skipped.length} protected matches remain.`,`将删除所选项目/轮次中的 ${p.deletable.length} 个比赛对象，其中 ${p.unscheduled.filter(m=>p.deletable.includes(m)).length} 场未排日期。保留队伍和赛事设置。${p.skipped.length} 场受保护。`);phrase=hasProtected?tr('XÓA CẢ KẾT QUẢ','DELETE RESULTS TOO','连结果一起删除'):tr('XÓA TRẬN','DELETE MATCHES','删除比赛');}
  const ok=await U.confirmDanger(title,detail,phrase);if(!ok)return;
  const updates={};if(p.mode==='clear')p.deletable.forEach(m=>updates[T.Data.path('matches/'+m.id)]=clearScheduleFields(m));else p.deletable.forEach(m=>updates[T.Data.path('matches/'+m.id)]=null);releaseActiveMatches(updates,p.deletable);
  await T.Data.queueMulti(updates,{type:p.mode==='clear'?'SCHEDULE_ASSIGNMENT_CLEAR_V41':'MATCH_STRUCTURE_DELETE_V41'});
  await T.Data.audit(p.mode==='clear'?'CLEAR_SCHEDULE_ASSIGNMENTS':'DELETE_MATCH_STRUCTURE','matches','bulk',null,{count:p.deletable.length,protectedSkipped:p.skipped.length,unscheduledIncluded:p.unscheduled.filter(m=>p.deletable.includes(m)).length,scope:{mode:p.scope,from:p.from,to:p.to,category:p.category,stage:p.stage},affectedIds:p.deletable.map(m=>m.id)});
  $('schedule-delete-modal').classList.add('hidden');U.toast(p.mode==='clear'?tr(`Đã bỏ lịch ${p.deletable.length} trận; trận/vòng đấu vẫn còn để xếp lại`,`Cleared schedule for ${p.deletable.length} matches; match/stage structure is kept`,`已清除 ${p.deletable.length} 场排程；比赛/轮次结构保留`):tr(`Đã xóa ${p.deletable.length} trận/vòng đấu; đã xử lý cả trận chưa có ngày`,`Deleted ${p.deletable.length} match/stage records, including unscheduled matches`,`已删除 ${p.deletable.length} 个比赛/轮次记录，包括未排日期比赛`),'ok');
}

/* Upgrade 41 scheduling invariant: every Smart Scheduler run rebuilds all eligible
   matches already dated inside the selected range PLUS every eligible match with no date.
   Dated matches outside the range and locked dates remain fixed. */
function buildSchedulePlan41(){
  const cb=$('auto-reschedule');if(cb)cb.checked=true;try{const r=baseBuildSchedulePlan();if(r?.input){r.input.reschedule=true;r.input.selectionPolicy='IN_RANGE_PLUS_UNSCHEDULED';}return r;}finally{if(cb)cb.checked=true;}
}
async function autoSchedule41(){
  const cb=$('auto-reschedule'),old=cb?.checked;if(cb)cb.checked=true;try{return await baseAutoSchedule40();}finally{if(cb)cb.checked=true;}
}
function enforceSchedulerUI(){
  const cb=$('auto-reschedule');if(!cb)return;cb.checked=true;cb.disabled=true;const label=cb.closest('label');if(label){for(const node of [...label.childNodes])if(node.nodeType===Node.TEXT_NODE)node.remove();label.append(document.createTextNode(' '+tr('Luôn tạo lại: trận trong khoảng ngày + tất cả trận CHƯA CÓ NGÀY','Always rebuild: matches in date range + all UNSCHEDULED matches','始终重排：日期范围内比赛 + 所有未排日期比赛')));label.title=tr('Trận có lịch ngoài khoảng ngày và ngày đã khóa vẫn được giữ nguyên.','Dated matches outside the range and locked dates remain unchanged.','日期范围外及锁定日期的比赛保持不变。');}
}
function install(){
  if(VERSION&&T.VERSION!==VERSION)T.VERSION=VERSION;ensureDeleteModeUI();App.openScheduleDelete=openScheduleDelete41;App.updateDeleteScopeUI=updateDeleteScopeUI41;App.scheduleDeletePlan=scheduleDeletePlan41;App.previewScheduleDelete=previewScheduleDelete41;App.executeScheduleDelete=executeScheduleDelete41;
  Up39.buildSchedulePlan=buildSchedulePlan41;App.buildSchedulePlan=buildSchedulePlan41;if(window.TopkeyUpgrade9)window.TopkeyUpgrade9.buildSchedulePlan=buildSchedulePlan41;App.autoSchedule=autoSchedule41;
  const renderControls=App.renderSchedulerControls?.bind(App);if(renderControls&&!App.__u41SchedulerRender){App.__u41SchedulerRender=true;App.renderSchedulerControls=function(...args){const out=renderControls(...args);setTimeout(enforceSchedulerUI,0);return out;};}
  enforceSchedulerUI();syncDeleteModeUI();setTimeout(enforceSchedulerUI,0);
}
install();
window.addEventListener('topkey:languagechange',()=>setTimeout(()=>{ensureDeleteModeUI();enforceSchedulerUI();syncDeleteModeUI();},20));
window.TopkeyUpgrade41={installed:true,VERSION,deleteMode,scheduleDeletePlan41,clearScheduleFields,buildSchedulePlan41};
})();
