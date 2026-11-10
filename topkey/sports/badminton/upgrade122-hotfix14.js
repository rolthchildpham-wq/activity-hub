(()=>{
'use strict';
const TAG='u122h47-20261104';
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const T=window.Topkey;
const App=T?.App,U=T?.U,Up36=window.TopkeyUpgrade36,Up41=window.TopkeyUpgrade41,Up43=window.TopkeyUpgrade43;
if(!T||!App||!U||!Up36||!Up41||!Up43)return;
if(App.__u122h14AdminForceOverride)return;
App.__u122h14AdminForceOverride=true;
const tr=(vi,en,zh)=>{const l=window.TopkeyI18n?.language||'vi';return l==='en'?en:l==='zh'?zh:vi;};
const toMin=t=>{const[a,b]=String(t||'00:00').split(':').map(Number);return(a||0)*60+(b||0)};
const minToTime=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
const overlap=(a,b,c,d)=>a<d&&c<b;
const statusCounts=m=>m&&m.status!=='CANCELLED';
function cfg(){return typeof window.TopkeyUpgrade33?.cfg==='function'?window.TopkeyUpgrade33.cfg():(App.schedulerConfig?.()||{});}
function courts(){const rows=Up36.uniqueCourts?.().courts||Object.values(App.state.courts||{});return rows.map((c,i)=>({id:c.id||c.courtId||String(i+1),key:c.__physicalKey||Up36.canonicalCourtKey?.(c.id||c.courtId)||c.id||c.courtId||String(i+1)}));}
function baseMatches(result){const target=new Set(result.targetIds||[]);return Object.values(App.state.matches||{}).filter(m=>!target.has(m.id)&&statusCounts(m)).concat((result.plan||[]).map(x=>x.after).filter(statusCounts));}
function occupiedIndex(result){const c=cfg(),rules={...(T.DEFAULT_RULES||{}),...(App.state.config?.rules||{})};const dur=Math.max(5,Number(rules.estimatedMatchMinutes)||Number(result.input?.interval)||20);const occ=new Map();const add=m=>{if(!m?.date||!m?.time||!m?.courtId)return;const k=`${m.date}|${Up36.canonicalCourtKey?.(m.courtId)||m.courtId}`;const st=toMin(m.time);if(!occ.has(k))occ.set(k,[]);occ.get(k).push([st,st+dur,m.id]);};baseMatches(result).forEach(add);return{occ,dur,add};}
function forcePlacement(result,match,date,index){
  const cs=courts();if(!cs.length)throw new Error(tr('Không có sân để ép lịch.','No court is configured for forced scheduling.','没有场地可用于强制排程。'));
  const start=Math.max(0,toMin(result.input?.start||'08:00')),step=Math.max(5,Number(result.input?.interval)||20);
  for(let slot=0;slot<Math.ceil((1440-start)/step);slot++){
    const st=start+slot*step,en=st+index.dur;if(en>1440)break;
    for(const c of cs){const arr=index.occ.get(`${date}|${c.key}`)||[];if(!arr.some(([a,b])=>overlap(st,en,a,b))){return{date,time:minToTime(st),courtId:c.id};}}
  }
  // Absolute admin override: if the configured day is physically full, extend after the latest match on the least-loaded court.
  let best=null;for(const c of cs){const arr=index.occ.get(`${date}|${c.key}`)||[];const last=arr.reduce((n,x)=>Math.max(n,x[1]),start-step);const candidate=Math.max(start,last);if(!best||candidate<best.st)best={c,st:candidate};}
  const safe=Math.min(1439,Math.max(start,best?.st||start));return{date,time:minToTime(safe),courtId:best?.c?.id||cs[0].id};
}
function patchModal(){
  const modal=document.getElementById('tk43-unplaced-modal');if(!modal)return;
  modal.querySelectorAll('.tk43-date-select option').forEach(o=>{if(o.value)o.disabled=false;});
  const foot=document.getElementById('tk43-foot-note');if(foot)foot.textContent=tr('ADMIN OVERRIDE: ngày bạn chọn sẽ được lưu dù vi phạm quota/ngày bận/nghỉ/VĐV/rule bắt buộc. Hệ thống chỉ tránh đè cùng sân-cùng giờ nếu còn cách và ghi Audit FORCE OVERRIDE.','ADMIN OVERRIDE: a selected date will be saved even if quota/busy/rest/player/required rules fail. Only exact physical court overlap is avoided where possible; an FORCE OVERRIDE audit is written.','管理员强制：所选日期即使违反配额/忙碌/休息/运动员/必须规则也会保存；系统仅尽量避免同场地同时间冲突，并写入强制覆盖审计。');
  const save=document.getElementById('tk43-save');if(save&&!save.dataset.h14){save.dataset.h14='1';save.textContent=tr('⚠ Lưu & ÉP lịch','⚠ Save & FORCE schedule','⚠ 保存并强制排程');}
  modal.querySelectorAll('.tk43-choice-hint').forEach(h=>{if(!h.dataset.h14){h.dataset.h14='1';h.classList.add('rebalance');h.textContent=tr('ADMIN chọn ngày này = bỏ qua toàn bộ rule nghiệp vụ khi lưu.','ADMIN selection = ignore all business scheduling rules on save.','管理员选择此日期 = 保存时忽略全部业务排程规则。');}});
}
async function forceSave(){
  const save=document.getElementById('tk43-save'),list=document.getElementById('tk43-unplaced-list');if(!save||!list)return;
  const selections={};list.querySelectorAll('.tk43-date-select').forEach(s=>{if(s.value)selections[s.dataset.matchId]=s.value});
  const ids=Object.keys(selections);if(!ids.length){U.toast(tr('Chưa chọn ngày nào để ép lịch.','No date selected for force scheduling.','尚未选择强制排程日期。'),'info');return;}
  const result=Up41.buildSchedulePlan41();const byId=new Map((result.unplaced||[]).map(m=>[m.id,m]));const index=occupiedIndex(result),forced=[];
  for(const id of ids){const m=byId.get(id)||App.state.matches?.[id];if(!m)continue;const p=forcePlacement(result,m,selections[id],index);const after={...m,...p,status:'SCHEDULED',scheduledAt:Date.now(),updatedAt:Date.now(),schedulerVersion:VERSION,adminForceOverride:true,forceOverrideAt:Date.now(),forceOverrideBy:App.state?.user?.email||App.state?.user?.username||'ADMIN'};forced.push({before:m,after});index.add(after);}
  if(!forced.length)throw new Error(tr('Không tìm thấy trận đã chọn để ép lịch.','Selected matches could not be found.','找不到所选比赛。'));
  const updates={};(result.plan||[]).forEach(x=>updates[T.Data.path('matches/'+x.after.id)]={...x.after,schedulerVersion:VERSION});forced.forEach(x=>updates[T.Data.path('matches/'+x.after.id)]=x.after);
  await T.Data.queueMulti(updates,{type:'SMART_SCHEDULE_ADMIN_FORCE_OVERRIDE'});
  await T.Data.audit('SMART_SCHEDULE_FORCE_OVERRIDE','tournament',T.Data.tid,null,{forceOverride:true,ignoredRules:'ALL_BUSINESS_SCHEDULING_RULES',physicalCourtOverlapAvoidedWherePossible:true,forced:forced.map(x=>({matchId:x.after.id,code:x.after.code,date:x.after.date,time:x.after.time,courtId:x.after.courtId})),settings:result.input,version:VERSION});
  U.toast(tr(`Đã ÉP lịch ${forced.length} trận theo ngày ADMIN chọn.`,`Force-scheduled ${forced.length} match(es) on ADMIN-selected dates.`,`已按管理员选择日期强制排程 ${forced.length} 场。`),'ok');
  try{document.getElementById('tk43-cancel')?.click();}catch{}
  setTimeout(()=>{try{App.renderMatches?.();App.renderSchedulePreview?.(Up41.buildSchedulePlan41());}catch{}},80);
}
document.addEventListener('click',e=>{
  const btn=e.target?.closest?.('#tk43-save');if(!btn)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  if(btn.disabled)return;btn.disabled=true;const old=btn.textContent;btn.textContent=tr('Đang ÉP lịch…','Force scheduling…','正在强制排程…');
  forceSave().catch(err=>{console.error('Hotfix14 force schedule',err);U.toast(tr('Ép lịch thất bại: ','Force schedule failed: ','强制排程失败：')+(err?.message||err),'err');}).finally(()=>{btn.disabled=false;btn.textContent=old;});
},true);
document.addEventListener('change',e=>{if(e.target?.classList?.contains('tk43-date-select'))setTimeout(patchModal,0)},true);
const mo=new MutationObserver(()=>patchModal());mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
patchModal();
T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;T.CONFIG_VERSION=VERSION;
window.TopkeyUpgrade122Hotfix14={installed:true,TAG,VERSION,forceSave};
})();
