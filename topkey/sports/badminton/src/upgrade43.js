(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,Up36=window.TopkeyUpgrade36,Up39=window.TopkeyUpgrade39,Up40=window.TopkeyUpgrade40,Up41=window.TopkeyUpgrade41;
if(!T||!App||!U||!Up36||!Up39||!Up40||!Up41||App.__upgrade43Installed)return;
App.__upgrade43Installed=true;
const VERSION='2026.10.28-vnext-featureparity15-upgrade43';
T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;
const $=id=>document.getElementById(id);
const tr=(vi,en,zh)=>{const l=window.TopkeyI18n?.language||'vi';return l==='en'?en:l==='zh'?zh:vi;};
const fmtDate=d=>{if(!d)return'';const[a,b,c]=String(d).split('-');return c&&b?`${c}/${b}/${a}`:d;};
const teamName=id=>App.teamName?.(id)||App.state.teams?.[id]?.name||id||'';
const courtName=id=>Up36.resolveCourt?.(id)?.name||App.state.courts?.[id]?.name||id||'';
const hardTypes=new Set(['LOCKED_DATE','PLAYER_BUSY','TEAM_BUSY','TIME_WINDOW']);
const baseRenderHealth=App.renderHealth?.bind(App);
function rangeDates(result){return typeof App.dateRange==='function'?App.dateRange(result.input.from,result.input.to,result.input.includeSunday):[];}
function diagnosticRows(result){
  const ctx=Up40.createContext(result),locked=new Set(result.lockedDates||[]),dates=rangeDates(result);
  return(result.unplaced||[]).map(match=>{
    const days=dates.map(date=>{
      if(locked.has(date))return{date,ok:false,status:'locked',placement:null,blockers:[{type:'LOCKED_DATE',text:tr('Ngày đã khóa — Smart Scheduler không được thay đổi','Locked date — Smart Scheduler cannot change it','日期已锁定 — 智能排程不可修改')} ]};
      const chk=Up40.checkDate(match,date,ctx),blockers=chk.blockers||[],hard=blockers.some(b=>hardTypes.has(b.type));
      return{date,ok:!!chk.ok,status:chk.ok?'direct':(hard?'blocked':'rebalance'),placement:chk.placement||null,blockers};
    });
    return{match,days,suggestions:days.filter(x=>x.ok).map(x=>x.placement),byDate:days.filter(x=>!x.ok)};
  });
}
function shortReason(day){const xs=(day.blockers||[]).map(x=>x.text).filter(Boolean);return xs.slice(0,2).join('; ')||tr('Cần kiểm tra lại lịch trong ngày','Needs schedule recheck','需要重新检查当天赛程');}
function reasonSummary(row){
  const parts=[];for(const d of row.days.filter(x=>!x.ok)){const txt=shortReason(d);if(txt)parts.push(`${fmtDate(d.date)}: ${txt}`);if(parts.length>=4)break;}
  if(!parts.length)return tr('Có ngày có thể xếp trực tiếp.','At least one date can be scheduled directly.','至少有一个日期可直接排程。');
  return parts.join(' · ')+(row.days.filter(x=>!x.ok).length>4?tr(' · … xem chi tiết',' · … see details',' · … 查看详情'):'');
}
function makeAfter(m,p,extra={}){return{...m,date:p.date,time:p.time,courtId:p.courtId,status:'SCHEDULED',scheduledAt:Date.now(),schedulerVersion:VERSION,updatedAt:Date.now(),...extra};}
function workingResult(result,plan){return{...result,plan};}
function checkAgainstPlan(result,plan,m,date){return Up40.checkDate(m,date,Up40.createContext(workingResult(result,plan)));}
function finalMatches(result,plan){const targetIds=new Set(result.targetIds||[]);return Object.values(App.state.matches||{}).filter(m=>!targetIds.has(m.id)&&m.status!=='CANCELLED').concat(plan.map(x=>x.after)).filter(m=>m.status!=='CANCELLED');}
function validatePlan(result,plan){
  const matches=finalMatches(result,plan),c=typeof window.TopkeyUpgrade33?.cfg==='function'?window.TopkeyUpgrade33.cfg():(App.schedulerConfig?.()||{}),plannedIds=new Set(plan.map(x=>x.after.id));
  const validation=Up36.validateMatches(matches,{plannedIds,c,onlyRelevant:true}),required=Up39.requiredRules?.(c,result.input)||[],requiredReport=Up39.exactRuleReport?.(matches,required)||[],badRequired=requiredReport.filter(x=>!x.ok);
  return{ok:validation.ok&&!badRequired.length,validation,requiredReport,badRequired,matches};
}
function dateDistance(a,b){return Math.abs(Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'));}
function relocationOptions(result,plan,item,selectedDate){
  const dates=rangeDates(result).filter(d=>d!==selectedDate&&!(result.lockedDates||[]).includes(d)).sort((a,b)=>dateDistance(a,selectedDate)-dateDistance(b,selectedDate)||a.localeCompare(b)),out=[];
  for(const date of dates){const chk=checkAgainstPlan(result,plan,item.before||item.after,date);if(chk.ok)out.push({date,placement:chk.placement});}
  return out;
}
function relocateEvicted(result,startPlan,evicted,selectedDate,nodeLimit=5000){
  let nodes=0;
  function dfs(plan,left,moves){
    if(++nodes>nodeLimit)return null;if(!left.length)return{plan,moves};
    let bestIndex=-1,bestOptions=null;
    for(let i=0;i<left.length;i++){
      const opts=relocationOptions(result,plan,left[i],selectedDate);if(!opts.length)return null;
      if(!bestOptions||opts.length<bestOptions.length){bestIndex=i;bestOptions=opts;if(opts.length===1)break;}
    }
    const item=left[bestIndex],rest=left.filter((_,i)=>i!==bestIndex),source=item.before||item.after;
    for(const opt of bestOptions){
      const after=makeAfter(source,opt.placement,{manualRebalanced:true,rebalancedFrom:item.after?.date||source.date||''}),next=[...plan,{...item,after,manualRebalanced:true}];
      const hit=dfs(next,rest,[...moves,{matchId:after.id,code:after.code,from:item.after?.date||source.date||'',to:after.date,time:after.time,courtId:after.courtId}]);if(hit)return hit;
    }
    return null;
  }
  return dfs(startPlan,evicted,[]);
}
function combinations(arr,size,limit=1200){const out=[];function walk(start,chosen){if(out.length>=limit)return;if(chosen.length===size){out.push([...chosen]);return;}for(let i=start;i<arr.length;i++){chosen.push(arr[i]);walk(i+1,chosen);chosen.pop();if(out.length>=limit)return;}}walk(0,[]);return out;}
function sharesParticipant(a,b){if(!a||!b)return false;const idsA=new Set([a.teamAId,a.teamBId].filter(Boolean));if([b.teamAId,b.teamBId].some(x=>idsA.has(x)))return true;const peopleA=new Set((Up36.matchPeople?.(a)||[]).map(x=>String(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()));return(Up36.matchPeople?.(b)||[]).some(x=>peopleA.has(String(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()));}
function placeOnChosenDate(result,plan,match,date,pinnedIds){
  let chk=checkAgainstPlan(result,plan,match,date);if(chk.ok){const after=makeAfter(match,chk.placement,{manualChosenDate:true});return{ok:true,plan:[...plan,{before:match,after,manualChosenDate:true}],after,moved:[],mode:'direct'};}
  if((chk.blockers||[]).some(b=>hardTypes.has(b.type)))return{ok:false,reasons:chk.blockers.map(x=>x.text),mode:'blocked'};
  let candidates=plan.filter(x=>x.after?.date===date&&!pinnedIds.has(x.after.id));
  candidates.sort((a,b)=>(sharesParticipant(match,b.after)?1:0)-(sharesParticipant(match,a.after)?1:0)||String(a.after.code||a.after.id).localeCompare(String(b.after.code||b.after.id)));
  if(candidates.length>12)candidates=candidates.slice(0,12);
  const maxEvict=Math.min(3,candidates.length);
  for(let size=1;size<=maxEvict;size++){
    for(const subset of combinations(candidates,size)){
      const ids=new Set(subset.map(x=>x.after.id)),base=plan.filter(x=>!ids.has(x.after.id));chk=checkAgainstPlan(result,base,match,date);if(!chk.ok)continue;
      const selectedAfter=makeAfter(match,chk.placement,{manualChosenDate:true,rebalanced:true}),withSelected=[...base,{before:match,after:selectedAfter,manualChosenDate:true,rebalanced:true}],relocated=relocateEvicted(result,withSelected,subset,date);
      if(!relocated)continue;const valid=validatePlan(result,relocated.plan);if(!valid.ok)continue;
      return{ok:true,plan:relocated.plan,after:selectedAfter,moved:relocated.moves,mode:'rebalanced'};
    }
  }
  return{ok:false,reasons:(chk.blockers||[]).map(x=>x.text).concat(tr('Không tìm được cách dời các trận khác trong cùng khoảng ngày mà vẫn giữ đủ ngày bận/quota/nghỉ/sân.','Could not move other matches within the selected range while preserving busy-day/quota/rest/court rules.','无法在所选日期范围内移动其他比赛并同时满足忙碌日/配额/休息/场地规则。')),mode:'rebalance_failed'};
}
function resolveSelections43(result,diagnostics,selections){
  let plan=[...(result.plan||[])],actions=[],errors=[];const pinnedIds=new Set(),rows=diagnostics.filter(r=>selections[r.match.id]);
  for(const row of rows){const date=selections[row.match.id],day=row.days.find(x=>x.date===date);if(!day){errors.push({match:row.match,date,reasons:[tr('Ngày đã chọn nằm ngoài khoảng Smart Scheduler.','Selected date is outside the Smart Scheduler range.','所选日期不在智能排程范围内。')]});continue;}if(day.status==='locked'){errors.push({match:row.match,date,reasons:day.blockers.map(x=>x.text)});continue;}
    const placed=placeOnChosenDate(result,plan,row.match,date,pinnedIds);if(!placed.ok){errors.push({match:row.match,date,reasons:placed.reasons||[]});continue;}plan=placed.plan;pinnedIds.add(row.match.id);actions.push({matchId:row.match.id,code:row.match.code,date,mode:placed.mode,after:placed.after,moved:placed.moved});
  }
  if(errors.length)return{ok:false,errors,plan,actions};const valid=validatePlan(result,plan);if(!valid.ok){const issues=(valid.validation?.issues||[]).map(x=>x.message),req=(valid.badRequired||[]).map(x=>`${x.name} ${fmtDate(x.date)} ${x.count}/${x.max}`);return{ok:false,errors:[{match:null,date:'',reasons:[...issues,...req]}],plan,actions,validation:valid.validation,badRequired:valid.badRequired};}
  return{ok:true,plan,actions,validation:valid.validation,requiredReport:valid.requiredReport};
}
function ensureModal(){let modal=$('tk43-unplaced-modal');if(modal)return modal;modal=document.createElement('div');modal.id='tk43-unplaced-modal';modal.className='modal hidden';modal.innerHTML=`<div class="modal-box tk40-modal-box tk43-modal-box"><div class="split tk40-head"><div><h2>${tr('🧩 Xử lý các trận CHƯA XẾP','🧩 Resolve UNSCHEDULED matches','🧩 处理未排程比赛')}</h2><p class="muted" id="tk43-summary"></p></div><button type="button" class="btn mini" id="tk43-close">${tr('Đóng','Close','关闭')}</button></div><div id="tk43-alert" class="tk40-alert hidden"></div><div id="tk43-unplaced-list" class="tk40-list"></div><div class="tk40-foot"><span class="muted" id="tk43-foot-note"></span><div class="action-bar"><button type="button" class="btn" id="tk43-cancel">${tr('Hủy','Cancel','取消')}</button><button type="button" class="btn ok" id="tk43-save">${tr('✓ Lưu & sắp lịch','✓ Save & schedule','✓ 保存并排程')}</button></div></div></div>`;document.body.appendChild(modal);return modal;}
function optionLabel(day){
  if(day.status==='locked')return `🔒 ${fmtDate(day.date)} · ${tr('NGÀY ĐÃ KHÓA','LOCKED DATE','日期已锁定')}`;
  if(day.ok)return `✓ ${fmtDate(day.date)} · ${day.placement.time} · ${courtName(day.placement.courtId)} · ${tr('XẾP NGAY','READY','可直接排程')}`;
  const reason=shortReason(day);if(day.status==='rebalance')return `↻ ${fmtDate(day.date)} · ${tr('CẦN TÁI CÂN BẰNG','REBALANCE','需要重新平衡')} · ${reason}`;
  return `⚠ ${fmtDate(day.date)} · ${reason}`;
}
function updateChoiceHint(card,row,date){const hint=card.querySelector('.tk43-choice-hint');if(!hint)return;const day=row.days.find(x=>x.date===date);hint.className='tk43-choice-hint';if(!day){hint.textContent=tr('Giữ CHƯA XẾP.','Keep UNSCHEDULED.','保持未排程。');return;}if(day.ok){hint.classList.add('ok');hint.textContent=tr(`Có thể xếp trực tiếp ${day.placement.time} · ${courtName(day.placement.courtId)}.`,`Can schedule directly at ${day.placement.time} · ${courtName(day.placement.courtId)}.`,`可直接排在 ${day.placement.time} · ${courtName(day.placement.courtId)}。`);return;}if(day.status==='rebalance'){hint.classList.add('rebalance');hint.textContent=tr('Bạn có thể chọn ngày này. Khi lưu, hệ thống sẽ thử dời các trận chưa đấu khác trong cùng khoảng để tạo chỗ, rồi kiểm tra lại toàn bộ rule.','You may choose this date. On save, the system will try moving other unplayed matches within the range, then revalidate all rules.','可选择此日期。保存时系统会尝试移动范围内其他未赛比赛以腾出位置，然后重新验证全部规则。');return;}hint.classList.add('blocked');hint.textContent=tr(`Ngày này đang bị rule cứng chặn: ${shortReason(day)}. Có thể chọn để xem kiểm tra khi lưu, nhưng hệ thống sẽ không ép lịch sai.`,`This date is blocked by a hard rule: ${shortReason(day)}. You may select it for validation, but an invalid schedule will not be forced.`,`该日期被硬性规则阻止：${shortReason(day)}。可以选择进行保存校验，但不会强制生成错误赛程。`);}
function showUnplacedModal43(result,diagnostics){
  const modal=ensureModal(),list=$('tk43-unplaced-list'),summary=$('tk43-summary'),alert=$('tk43-alert'),save=$('tk43-save'),cancel=$('tk43-cancel'),close=$('tk43-close');alert.classList.add('hidden');alert.textContent='';summary.textContent=tr(`${diagnostics.length} trận chưa xếp. Danh sách ngày bên dưới luôn lấy toàn bộ khoảng ${fmtDate(result.input.from)} → ${fmtDate(result.input.to)}${result.input.includeSunday?'':' (không tính Chủ Nhật)'}.`,` ${diagnostics.length} matches are unscheduled. Date choices always cover the full ${fmtDate(result.input.from)} → ${fmtDate(result.input.to)} range${result.input.includeSunday?'':' (excluding Sunday)'}.`.trim(),`${diagnostics.length} 场未排程。下方日期始终覆盖完整范围 ${fmtDate(result.input.from)} → ${fmtDate(result.input.to)}${result.input.includeSunday?'':'（不含周日）'}。`);list.replaceChildren();
  diagnostics.forEach(row=>{const m=row.match,card=document.createElement('div');card.className='tk40-row tk43-row';const direct=row.days.filter(x=>x.ok).length,rebalance=row.days.filter(x=>x.status==='rebalance').length,blocked=row.days.filter(x=>x.status==='blocked').length;
    const head=document.createElement('div');head.className='tk40-row-head';const title=document.createElement('div');title.innerHTML=`<b>${String(m.code||m.id)}</b><span>${teamName(m.teamAId)} <em>vs</em> ${teamName(m.teamBId)}</span>`;const badge=document.createElement('span');badge.className='tk40-badge '+(direct?'ok':rebalance?'warn':'bad');badge.textContent=direct?tr(`${direct} ngày xếp ngay`,`${direct} ready date(s)`,`${direct} 个可直接排程日期`):rebalance?tr(`${rebalance} ngày có thể tái cân bằng`,`${rebalance} rebalancing date(s)`,`${rebalance} 个可重新平衡日期`):tr(`${row.days.length-blocked} ngày khả dụng · cần kiểm tra`,`${row.days.length-blocked} usable date(s) · needs validation`,`${row.days.length-blocked} 个可用日期 · 需校验`);head.append(title,badge);card.appendChild(head);
    const reason=document.createElement('div');reason.className='tk40-reason';reason.innerHTML=`<b>${tr('Lý do chưa xếp:','Why unscheduled:','未排程原因：')}</b> <span></span>`;reason.querySelector('span').textContent=reasonSummary(row);card.appendChild(reason);
    const controls=document.createElement('div');controls.className='tk40-controls';const label=document.createElement('label');label.textContent=tr('Chọn ngày trong khoảng','Choose a date in range','选择范围内日期');const sel=document.createElement('select');sel.className='tk40-date-select tk43-date-select';sel.dataset.matchId=m.id;const keep=document.createElement('option');keep.value='';keep.textContent=tr('— Giữ CHƯA XẾP —','— Keep UNSCHEDULED —','— 保持未排程 —');sel.appendChild(keep);row.days.forEach(day=>{const o=document.createElement('option');o.value=day.date;o.textContent=optionLabel(day);if(day.status==='locked')o.disabled=true;sel.appendChild(o)});const preferred=row.days.find(x=>x.ok)||row.days.find(x=>x.status==='rebalance')||row.days.find(x=>x.status==='blocked');if(preferred)sel.value=preferred.date;controls.append(label,sel);card.appendChild(controls);
    const hint=document.createElement('div');hint.className='tk43-choice-hint';card.appendChild(hint);sel.addEventListener('change',()=>updateChoiceHint(card,row,sel.value));updateChoiceHint(card,row,sel.value);
    const details=document.createElement('details');details.className='tk40-details';const ds=document.createElement('summary');ds.textContent=tr('Xem trạng thái tất cả ngày trong khoảng','See every date in the selected range','查看范围内所有日期状态');details.appendChild(ds);const db=document.createElement('div');db.className='tk40-date-reasons';row.days.forEach(day=>{const line=document.createElement('div');line.className='tk43-day-line '+day.status;line.innerHTML=`<b>${fmtDate(day.date)}</b><span></span>`;line.querySelector('span').textContent=day.ok?tr(`✓ Xếp ngay ${day.placement.time} · ${courtName(day.placement.courtId)}`,`✓ Ready ${day.placement.time} · ${courtName(day.placement.courtId)}`,`✓ 可直接排程 ${day.placement.time} · ${courtName(day.placement.courtId)}`):(day.status==='rebalance'?tr('↻ Có thể thử tái cân bằng · ','↻ Rebalancing can be attempted · ','↻ 可尝试重新平衡 · '):day.status==='locked'?'🔒 ':'⚠ ')+shortReason(day);db.appendChild(line)});details.appendChild(db);card.appendChild(details);list.appendChild(card);});
  $('tk43-foot-note').textContent=tr('Ngày 5/5 vẫn được phép chọn: hệ thống sẽ thử dời trận khác trong cùng khoảng. Ngày bận/ngày khóa/rule cứng không bị phá. Trước khi ghi Firebase luôn chạy Preflight và rule BẮT BUỘC.','A 5/5 day can still be selected: the system will try moving another match within the range. Busy/locked/hard rules are never broken. Final Preflight and REQUIRED rules run before Firebase is written.','即使当天已 5/5 仍可选择：系统会尝试在范围内移动其他比赛。忙碌日/锁定日/硬性规则不会被破坏。写入 Firebase 前始终执行最终预检和必须规则校验。');
  modal.classList.remove('hidden');return new Promise(resolve=>{let busy=false;const done=v=>{if(busy)return;modal.classList.add('hidden');save.onclick=cancel.onclick=close.onclick=null;resolve(v)};cancel.onclick=()=>done(null);close.onclick=()=>done(null);save.onclick=async()=>{if(busy)return;const selections={};list.querySelectorAll('.tk43-date-select').forEach(s=>{if(s.value)selections[s.dataset.matchId]=s.value});const resolved=resolveSelections43(result,diagnostics,selections);if(!resolved.ok){const msgs=(resolved.errors||[]).slice(0,6).map(e=>`${e.match?.code||''}${e.date?' · '+fmtDate(e.date):''}: ${(e.reasons||[]).join('; ')}`).filter(Boolean);alert.textContent=tr('Chưa thể lưu: ','Cannot save: ','无法保存：')+msgs.join(' | ');alert.classList.remove('hidden');return;}alert.classList.add('hidden');busy=true;save.disabled=cancel.disabled=close.disabled=true;save.textContent=tr('Đang ghi Firebase…','Saving to Firebase…','正在写入 Firebase…');try{await applyResolved43(result,resolved,diagnostics,selections);modal.classList.add('hidden');resolve({resolved,selections});}catch(e){busy=false;save.disabled=cancel.disabled=close.disabled=false;save.textContent=tr('✓ Lưu & sắp lịch','✓ Save & schedule','✓ 保存并排程');alert.textContent=tr('Firebase chưa ghi được: ','Firebase write failed: ','Firebase 写入失败：')+(e?.message||e);alert.classList.remove('hidden');}};});
}
async function applyResolved43(result,resolved,diagnostics,selections){
  const scheduledIds=new Set(resolved.plan.map(x=>x.after.id)),remaining=(result.unplaced||[]).filter(m=>!scheduledIds.has(m.id)),clearRows=result.input.reschedule?remaining.filter(m=>m.date||m.time||m.courtId):[],updates={};
  resolved.plan.forEach(x=>updates[T.Data.path('matches/'+x.after.id)]={...x.after,schedulerVersion:VERSION});clearRows.forEach(m=>updates[T.Data.path('matches/'+m.id)]={...m,date:'',time:'',courtId:'',scheduledAt:null,schedulerVersion:VERSION,updatedAt:Date.now()});
  await T.Data.queueMulti(updates,{type:'SMART_SCHEDULE_V43_MANUAL_DATE_REBALANCE'});
  await T.Data.audit('SMART_SCHEDULE','tournament',T.Data.tid,null,{scheduled:resolved.plan.length,manualDateChoices:resolved.actions,remainingUnplaced:remaining.length,clearedUnplaced:clearRows.length,settings:result.input,unplacedDiagnostics:diagnostics.map(r=>({matchId:r.match.id,code:r.match.code,selectedDate:selections[r.match.id]||'',days:r.days.map(d=>({date:d.date,status:d.status,reasons:(d.blockers||[]).map(b=>b.type)}))})),validation:{issues:0}});
  const moved=resolved.actions.reduce((n,x)=>n+(x.moved?.length||0),0);U.toast(tr(`Đã lưu ${resolved.plan.length} trận${moved?` · tái cân bằng ${moved} trận`:''}${remaining.length?` · còn ${remaining.length} CHƯA XẾP`:''}`,`Saved ${resolved.plan.length} matches${moved?` · rebalanced ${moved}`:''}${remaining.length?` · ${remaining.length} remain UNSCHEDULED`:''}`,`已保存 ${resolved.plan.length} 场${moved?` · 重新平衡 ${moved} 场`:''}${remaining.length?` · 仍有 ${remaining.length} 场未排程`:''}`),'ok');
}
async function autoSchedule43(){
  try{try{window.TopkeyUpgrade32?.saveDraft?.();}catch{}const result=Up41.buildSchedulePlan41();App.renderSchedulePreview?.(result);if(!result.plan.length&&!result.unplaced.length)return U.toast(tr('Không có trận nào cần xếp','No matches need scheduling','没有需要排程的比赛'),'info');if(result.unplaced.length){const diagnostics=diagnosticRows(result);await showUnplacedModal43(result,diagnostics);return;}
    const full=(result.daySummary||[]).filter(x=>x.full).length,partial=(result.daySummary||[]).filter(x=>!x.full).length,required=result.requiredReport||[],detail=tr(`Sẽ xếp ${result.plan.length} trận. ${required.length?`${required.length} rule BẮT BUỘC đã đủ đúng số trận. `:''}${full} ngày đạt đủ ${result.input.maxDay}; ${partial} ngày thấp hơn do ràng buộc thông minh.`,`Will schedule ${result.plan.length} matches. ${required.length?`${required.length} REQUIRED rules are satisfied exactly. `:''}${full} days reach ${result.input.maxDay}; ${partial} days are lower due to smart constraints.`,`将排定 ${result.plan.length} 场。${required.length?`${required.length} 条必须规则已精确满足。`:''}${full} 天达到 ${result.input.maxDay} 场；${partial} 天因智能约束较低。`),ok=await U.confirmDanger(tr('Áp dụng Smart Scheduler','Apply Smart Scheduler','应用智能排程'),detail,tr('XẾP LỊCH','SCHEDULE','排程'));if(!ok)return;const updates={};result.plan.forEach(x=>updates[T.Data.path('matches/'+x.after.id)]={...x.after,schedulerVersion:VERSION});await T.Data.queueMulti(updates,{type:'SMART_SCHEDULE_V43'});await T.Data.audit('SMART_SCHEDULE','tournament',T.Data.tid,null,{scheduled:result.plan.length,unplaced:0,settings:result.input,requiredRules:result.requiredReport,validation:{issues:0}});U.toast(tr(`Đã xếp ${result.plan.length} trận`,`Scheduled ${result.plan.length} matches`,`已排定 ${result.plan.length} 场`),'ok');
  }catch(e){U.toast('Smart Scheduler: '+(e?.message||e),'err');}
}
function renderHealth43(...args){const out=baseRenderHealth?.(...args);U.setText?.('health-version',VERSION);document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);return out;}
async function hardenServiceWorker43(){if(!('serviceWorker' in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register('./sw.js?v=u43-20261028',{updateViaCache:'none'});try{await reg.update();}catch{}}catch(e){console.warn('Upgrade43 SW refresh',e);}}
function stamp(){T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild='upgrade43';try{renderHealth43();}catch{}}
function install(){App.renderHealth=renderHealth43;stamp();App.autoSchedule=autoSchedule43;setTimeout(stamp,0);setTimeout(stamp,800);hardenServiceWorker43();}
install();window.addEventListener('focus',()=>{stamp();hardenServiceWorker43();},{passive:true});
window.TopkeyUpgrade43={installed:true,VERSION,diagnosticRows,resolveSelections43,placeOnChosenDate,autoSchedule43};
})();
