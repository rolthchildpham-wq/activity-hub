(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,Up20=window.TopkeyUpgrade20,Up33=window.TopkeyUpgrade33,Up36=window.TopkeyUpgrade36;
if(!T||!App||!U||!Up36||App.__upgrade37Installed)return;
App.__upgrade37Installed=true;
const VERSION=T.CONFIG_VERSION||T.VERSION;
const $=id=>document.getElementById(id);
const tr=(vi,en,zh)=>{const l=window.TopkeyI18n?.language||'vi';return l==='en'?en:l==='zh'?zh:vi;};
const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const samePlayer=(a,b)=>!!fold(a)&&fold(a)===fold(b);
const toMin=t=>{const[a,b]=String(t||'00:00').split(':').map(Number);return(a||0)*60+(b||0)};
const minToTime=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
const key=(d,id)=>`${d}|${id}`;
const participants=m=>[m?.teamAId,m?.teamBId].filter(Boolean);
const teamPeople=id=>{const t=App.state.teams?.[id]||{};return[t.p1,t.p2].map(x=>String(x||'').trim()).filter(Boolean)};
const matchPeople=m=>Up36.matchPeople?.(m)||(()=>{const seen=new Set(),out=[];participants(m).flatMap(teamPeople).forEach(n=>{const k=fold(n);if(k&&!seen.has(k)){seen.add(k);out.push(n)}});return out})();
const overlap=(arr,st,en,gap=0)=>(arr||[]).some(([a,b])=>st<b+gap&&en+gap>a);
function cfg(){return typeof Up33?.cfg==='function'?Up33.cfg():(typeof App.schedulerConfig==='function'?App.schedulerConfig():{});}
function dateRange(from,to,includeSunday=true){if(typeof App.dateRange==='function')return App.dateRange(from,to,includeSunday);const out=[],d=new Date(from+'T12:00:00'),end=new Date(to+'T12:00:00');for(let i=0;d<=end&&i<370;i++,d.setDate(d.getDate()+1)){if(includeSunday||d.getDay()!==0)out.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)}return out;}
function scheduleInput(){return{category:$('adv-category')?.value||'ALL',from:$('auto-date')?.value,to:$('auto-end-date')?.value,start:$('auto-time')?.value||'08:00',interval:Math.max(5,Number($('auto-interval')?.value)||35),maxDay:Math.max(1,Number($('auto-max-day')?.value)||24),includeSunday:$('auto-sunday')?.checked!==false,reschedule:$('auto-reschedule')?.checked!==false};}
function playerRuleLimit(name,date,c){return Up36.playerRuleLimit?.(name,date,c)??Infinity;}
function teamDailyLimit(id,date,c){return Up36.teamDailyLimit?.(id,date,c)??1;}
function playerPriorityWeight(m,date,c){if(typeof Up33?.playerPriorityWeight==='function')return Up33.playerPriorityWeight(m,date,c);return matchPeople(m).reduce((n,p)=>n+((c.playerPriority||[]).some(r=>r?.date===date&&samePlayer(r.name,p))?1:0),0);}
function teamLegacyPriority(m,date,c){return participants(m).reduce((n,id)=>n+((c.priority||[]).some(r=>r.teamId===id&&date>=r.from&&date<=r.to)?1:0),0);}
function specialOrder(m,date,c){const orders=[];participants(m).forEach(id=>(c.limits||[]).forEach((r,idx)=>{if(r.teamId===id&&r.from===date&&r.to===date&&Number(r.max)>1)orders.push(Number(r.priorityOrder)||idx+1)}));return orders.length?Math.min(...orders):Infinity;}
function busyPerson(m,date,c){const ps=matchPeople(m);return(c.playerBusy||[]).some(r=>r?.date===date&&ps.some(p=>samePlayer(p,r.name)));}
function statusCountsForQuota(m){return m&&m.status!=='CANCELLED';}
function fmtDate(d){if(!d)return'';const[a,b,c]=String(d).split('-');return c&&b?`${c}/${b}/${a}`:d;}
function finalMatchesForResult(result){const replaced=new Set(result.input?.reschedule?(result.targetIds||[]):(result.plan||[]).map(x=>x.after.id));return Object.values(App.state.matches||{}).filter(m=>!replaced.has(m.id)).concat((result.plan||[]).map(x=>x.after));}

/* Upgrade 37 scheduling invariant:
   - The selected max matches/day is a packing TARGET and a hard upper bound.
   - Fill the earliest day as much as safely possible before moving to the next day.
   - Smart constraints may leave a day below target; later days still try to reach target again.
   - Once no matches remain, later empty dates are not materialized or rendered. */
function buildSchedulePlan(){
  const input=scheduleInput();
  if(!input.from||!input.to||input.to<input.from)throw new Error(tr('Khoảng ngày không hợp lệ','Invalid date range','日期范围无效'));
  const c=cfg(),locked=new Set(c.lockedDates||[]),dates=dateRange(input.from,input.to,input.includeSunday).filter(d=>!locked.has(d)),courtInfo=Up36.uniqueCourts(),courts=courtInfo.courts;
  if(!dates.length||!courts.length)throw new Error(tr('Không có ngày hoặc sân/khu khả dụng','No available dates or courts','没有可用日期或场地'));
  const rules={...T.DEFAULT_RULES,...App.state.config?.rules},dur=Math.max(5,Number(rules.estimatedMatchMinutes)||input.interval),rest=Math.max(0,Number(rules.minRestMinutes)||0),athleteRest=Math.max(rest,input.interval),start=toMin(input.start),matches=Object.values(App.state.matches||{}),protectedStatus=new Set(['LIVE','FINISHED','WALKOVER','RETIRED','DISQUALIFIED','SUSPENDED','CANCELLED']),activeIds=new Set(Object.values(App.state.activeMatches||{}).filter(Boolean).map(x=>x.matchId)),catOf=m=>App.normalizeCategory?App.normalizeCategory(m.category):m.category;
  const inRange=m=>!!m.date&&m.date>=input.from&&m.date<=input.to&&!locked.has(m.date);
  const eligible=m=>(input.category==='ALL'||catOf(m)===input.category)&&!protectedStatus.has(m.status)&&!activeIds.has(m.id)&&!App.state.teams?.[m.teamAId]?.withdrawn&&!App.state.teams?.[m.teamBId]?.withdrawn;
  const target=matches.filter(m=>{if(!eligible(m))return false;if(!m.date)return true;if(!inRange(m))return false;if(input.reschedule)return true;return !m.time||!Up36.resolveCourt(m.courtId);}),targetIds=new Set(target.map(m=>m.id));
  if(!target.length)throw new Error(tr('Không có lịch chưa đấu phù hợp để xếp','No eligible unplayed matches to schedule','没有符合条件的未赛比赛可排程'));

  const occCourt={},occTeam={},occPerson={},dayCount={},teamDay={},personDay={};
  const addDayLoad=(m,d)=>{if(!d||!statusCountsForQuota(m))return;dayCount[d]=(dayCount[d]||0)+1;participants(m).forEach(id=>teamDay[key(d,id)]=(teamDay[key(d,id)]||0)+1);matchPeople(m).forEach(n=>personDay[key(d,fold(n))]=(personDay[key(d,fold(n))]||0)+1);};
  const addTimeOcc=(m,d,t,cid)=>{if(!d||!t||m.status==='CANCELLED')return;const st=toMin(t),en=st+dur;participants(m).forEach(id=>(occTeam[key(d,id)]??=[]).push([st,en]));matchPeople(m).forEach(n=>(occPerson[key(d,fold(n))]??=[]).push([st,en]));if(cid)(occCourt[key(d,Up36.canonicalCourtKey(cid))]??=[]).push([st,en]);};
  matches.filter(m=>!targetIds.has(m.id)&&m.date&&m.status!=='CANCELLED').forEach(m=>{addDayLoad(m,m.date);if(m.time)addTimeOcc(m,m.date,m.time,m.courtId)});
  const addPlaced=(m,d,t,cid)=>{addDayLoad(m,d);addTimeOcc(m,d,t,cid)};
  const busyTeam=(id,d)=>(c.busy||[]).some(r=>r.teamId===id&&r.date===d);
  const windowAllows=(m,d,st,en)=>typeof Up20?.windowAllows==='function'?Up20.windowAllows(m,d,st,en,c):true;
  const earlyWeight=(m,d)=>typeof Up20?.earlyWeight==='function'?Up20.earlyWeight(m,d,c):0;
  const combinedPriority=(m,d)=>teamLegacyPriority(m,d,c)+playerPriorityWeight(m,d,c)*2;

  function dateEligible(m,d){
    const ids=participants(m),ps=matchPeople(m),pkeys=ps.map(fold);
    if(ids.some(id=>busyTeam(id,d))||busyPerson(m,d,c)||(dayCount[d]||0)>=input.maxDay)return false;
    if(ids.some(id=>(teamDay[key(d,id)]||0)>=teamDailyLimit(id,d,c)))return false;
    if(ps.some((p,i)=>(personDay[key(d,pkeys[i])]||0)>=playerRuleLimit(p,d,c)))return false;
    return true;
  }
  function placementsForDate(m,d){
    if(!dateEligible(m,d))return[];
    const ids=participants(m),ps=matchPeople(m),pkeys=ps.map(fold),out=[];
    for(let slot=0;slot<300;slot++){
      const st=start+slot*input.interval,en=st+dur;if(en>1440)break;if(!windowAllows(m,d,st,en))continue;
      for(const court of courts){
        if(overlap(occCourt[key(d,court.__physicalKey)],st,en,0))continue;
        if(ids.some(id=>overlap(occTeam[key(d,id)],st,en,rest)))continue;
        if(pkeys.some(k=>overlap(occPerson[key(d,k)],st,en,athleteRest)))continue;
        out.push({date:d,time:minToTime(st),courtId:court.id,st,slot});
      }
    }
    return out;
  }
  function candidateForDate(m,d){
    const placements=placementsForDate(m,d);if(!placements.length)return null;
    const order=specialOrder(m,d,c),early=earlyWeight(m,d),priority=combinedPriority(m,d),ids=participants(m),pkeys=matchPeople(m).map(fold),teamLoad=ids.reduce((n,id)=>n+(teamDay[key(d,id)]||0),0),personLoad=pkeys.reduce((n,k)=>n+(personDay[key(d,k)]||0),0);
    placements.sort((a,b)=>a.st-b.st||String(a.courtId).localeCompare(String(b.courtId)));
    const place=placements[0];
    /* Scarcity is deliberately high: schedule the match with fewer legal slots first,
       which increases the chance that the day can actually reach maxDay. */
    const scarcity=Math.max(0,1000-Math.min(1000,placements.length));
    const specialScore=Number.isFinite(order)?1000000000-order*1000000:0;
    const earlyScore=early?50000000-place.slot*25000:0;
    const score=specialScore+earlyScore+priority*150000+scarcity*5000-teamLoad*1000-personLoad*1800-place.slot*4;
    return{m,place,score,feasibleCount:placements.length,priorityOrder:Number.isFinite(order)?order:null,earlyPriority:early};
  }

  const remaining=[...target],plan=[];
  function batchQuotaAllows(m,d,teamAdds,playerAdds){
    const ids=participants(m),ps=matchPeople(m),pkeys=ps.map(fold);
    if(ids.some(id=>busyTeam(id,d))||busyPerson(m,d,c))return false;
    if(ids.some(id=>(teamDay[key(d,id)]||0)+(teamAdds.get(id)||0)>=teamDailyLimit(id,d,c)))return false;
    if(ps.some((p,i)=>(personDay[key(d,pkeys[i])]||0)+(playerAdds.get(pkeys[i])||0)>=playerRuleLimit(p,d,c)))return false;
    return true;
  }
  function findPackingBatch(d,want){
    const base=[];
    for(const m of remaining){const cand=candidateForDate(m,d);if(cand)base.push(cand);}
    if(!base.length||want<=0)return[];
    /* Keep high-demand teams/players moving every day so bottleneck participants do
       not accumulate at the end of a long range. Packing cardinality stays first. */
    const teamFreq=new Map(),playerFreq=new Map();
    remaining.forEach(m=>{participants(m).forEach(id=>teamFreq.set(id,(teamFreq.get(id)||0)+1));matchPeople(m).map(fold).forEach(k=>playerFreq.set(k,(playerFreq.get(k)||0)+1));});
    base.forEach(x=>{x.pressure=participants(x.m).reduce((n,id)=>n+(teamFreq.get(id)||0),0)+matchPeople(x.m).map(fold).reduce((n,k)=>n+(playerFreq.get(k)||0),0);});
    base.sort((a,b)=>b.pressure-a.pressure||b.score-a.score||a.feasibleCount-b.feasibleCount||String(a.m.code||a.m.id).localeCompare(String(b.m.code||b.m.id)));
    const maxWant=Math.min(want,base.length),nodeLimit=120000;
    /* Bounded exact packing is used for the common tournament target (<=8/day).
       For larger capacities, avoid combinatorial search and let the outer loop pack
       one high-pressure feasible match at a time. */
    if(maxWant>8)return base.slice(0,maxWant);
    for(let goal=maxWant;goal>=1;goal--){
      let nodes=0,answer=null;
      const dfs=(startIdx,chosen,teamAdds,playerAdds)=>{
        if(answer)return true;if(++nodes>nodeLimit)return false;
        if(chosen.length===goal){answer=[...chosen];return true;}
        if(chosen.length+(base.length-startIdx)<goal)return false;
        for(let i=startIdx;i<base.length;i++){
          const x=base[i],m=x.m;if(!batchQuotaAllows(m,d,teamAdds,playerAdds))continue;
          const ids=participants(m),pkeys=matchPeople(m).map(fold);
          ids.forEach(id=>teamAdds.set(id,(teamAdds.get(id)||0)+1));pkeys.forEach(k=>playerAdds.set(k,(playerAdds.get(k)||0)+1));chosen.push(x);
          if(dfs(i+1,chosen,teamAdds,playerAdds))return true;
          chosen.pop();ids.forEach(id=>{const n=(teamAdds.get(id)||1)-1;n?teamAdds.set(id,n):teamAdds.delete(id)});pkeys.forEach(k=>{const n=(playerAdds.get(k)||1)-1;n?playerAdds.set(k,n):playerAdds.delete(k)});
        }
        return false;
      };
      dfs(0,[],new Map(),new Map());if(answer)return answer;
    }
    return[];
  }
  /* Pack date by date. A long selected range is only a search horizon; it is not a
     reason to spread matches evenly. */
  for(const d of dates){
    if(!remaining.length)break;
    while((dayCount[d]||0)<input.maxDay&&remaining.length){
      const capacity=input.maxDay-(dayCount[d]||0),batch=findPackingBatch(d,capacity);
      if(!batch.length)break; // Smart constraints make this day unable to reach the target.
      /* Pick from a batch proven to be able to reach the largest available cardinality.
         Recompute after every placement so time/rest occupancy is always current. */
      batch.sort((a,b)=>(b.pressure||0)-(a.pressure||0)||b.score-a.score||a.feasibleCount-b.feasibleCount||String(a.m.code||a.m.id).localeCompare(String(b.m.code||b.m.id)));
      const chosen=batch[0],m=chosen.m,p=chosen.place,after={...m,date:d,time:p.time,courtId:p.courtId,status:'SCHEDULED',scheduledAt:Date.now(),schedulerVersion:VERSION};
      plan.push({before:m,after,priorityOrder:chosen.priorityOrder,earlyPriority:chosen.earlyPriority});
      addPlaced(after,d,p.time,p.courtId);
      const idx=remaining.findIndex(x=>x.id===m.id);if(idx>=0)remaining.splice(idx,1);
    }
  }
  const unplaced=remaining;
  const usedDates=dates.filter(d=>(dayCount[d]||0)>0);
  const daySummary=usedDates.map(d=>({date:d,count:dayCount[d]||0,target:input.maxDay,full:(dayCount[d]||0)>=input.maxDay,scheduled:plan.filter(x=>x.after.date===d).length}));
  const result={input,plan,unplaced,targetIds:[...targetIds],rest,dur,athleteRest,lockedDates:[...locked],playerBusy:(c.playerBusy||[]).length,playerPriority:(c.playerPriority||[]).length,playerDailyLimits:(c.playerDailyLimits||[]).length,playerTimeWindows:(c.playerTimeWindows||[]).length,legacyTeamLimits:(c.limits||[]).length,duplicateCourtRecords:courtInfo.duplicates.length,daySummary,usedDates};
  const validation=Up36.validateMatches(finalMatchesForResult(result),{plannedIds:new Set(plan.map(x=>x.after.id)),rules,c,onlyRelevant:true});result.validation=validation;
  if(!validation.ok){const sample=validation.issues.slice(0,3).map(x=>x.message).join(' | ');throw new Error(tr(`Kế hoạch bị chặn vì còn ${validation.issues.length} xung đột: ${sample}`,`Schedule blocked by ${validation.issues.length} conflicts: ${sample}`,`排程因 ${validation.issues.length} 个冲突被阻止：${sample}`));}
  return result;
}

async function autoSchedule37(){
  try{
    try{window.TopkeyUpgrade32?.saveDraft?.();}catch{}
    const r=buildSchedulePlan();App.renderSchedulePreview?.(r);
    if(!r.plan.length&&!r.unplaced.length)return U.toast(tr('Không có trận nào cần xếp','No matches need scheduling','没有需要排程的比赛'),'info');
    const clearRows=r.input.reschedule?r.unplaced.filter(m=>m.date||m.time||m.courtId):[];
    const full=r.daySummary.filter(x=>x.full).length,partial=r.daySummary.filter(x=>!x.full).length;
    const detail=tr(`Sẽ xếp ${r.plan.length} trận theo nguyên tắc lấp đầy ngày sớm nhất đến ${r.input.maxDay} trận/ngày. ${full} ngày đạt đủ ${r.input.maxDay}; ${partial} ngày thấp hơn do ràng buộc thông minh.${clearRows.length?` ${clearRows.length} trận không thể xếp hợp lệ sẽ chuyển về CHƯA XẾP.`:''} Ngày trống cuối khoảng không được tạo.`,`Will schedule ${r.plan.length} matches by filling the earliest day toward ${r.input.maxDay} matches/day first. ${full} days reach the target; ${partial} days are lower due to smart constraints.${clearRows.length?` ${clearRows.length} unsafe matches will move to UNSCHEDULED.`:''} Empty trailing dates are not created.`,`将按“优先填满最早日期”的原则排定 ${r.plan.length} 场，每日目标 ${r.input.maxDay} 场。${full} 天达到目标；${partial} 天因智能约束低于目标。${clearRows.length?` ${clearRows.length} 场无法安全排定的比赛将转为未排程。`:''} 区间末尾空日期不会创建。`);
    const ok=await U.confirmDanger(tr('Áp dụng Smart Scheduler','Apply Smart Scheduler','应用智能排程'),detail,tr('XẾP LỊCH','SCHEDULE','排程'));if(!ok)return;
    const updates={};r.plan.forEach(x=>updates[T.Data.path('matches/'+x.after.id)]=x.after);clearRows.forEach(m=>updates[T.Data.path('matches/'+m.id)]={...m,date:'',time:'',courtId:'',scheduledAt:null,schedulerVersion:VERSION,updatedAt:Date.now()});
    await T.Data.queueMulti(updates,{type:'SMART_SCHEDULE_V37'});
    await T.Data.audit('SMART_SCHEDULE','tournament',T.Data.tid,null,{scheduled:r.plan.length,clearedUnplaced:clearRows.length,unplaced:r.unplaced.length,settings:r.input,packing:{targetPerDay:r.input.maxDay,days:r.daySummary},validation:{issues:0,athleteRest:r.athleteRest,duration:r.dur}});
    U.toast(tr(`Đã xếp ${r.plan.length} trận · ưu tiên lấp đầy ${r.input.maxDay} trận/ngày`,`Scheduled ${r.plan.length} matches · packed toward ${r.input.maxDay}/day`,`已排定 ${r.plan.length} 场 · 优先填满每日 ${r.input.maxDay} 场`),'ok');
  }catch(e){U.toast('Smart Scheduler: '+(e?.message||e),'err')}
}

function patchPreview(){
  const base=App.renderSchedulePreview?.bind(App);if(!base||App.__u37PreviewRender)return;App.__u37PreviewRender=true;
  App.renderSchedulePreview=function(result,...args){
    const out=base(result,...args),box=$('schedule-preview-box');if(!box||!result?.daySummary)return out;
    const wrap=document.createElement('div');wrap.className='tk37-day-summary';
    const title=document.createElement('b');title.textContent=tr(`Mật độ lịch · mục tiêu ${result.input.maxDay} trận/ngày`,`Schedule density · target ${result.input.maxDay} matches/day`,`赛程密度 · 每日目标 ${result.input.maxDay} 场`);wrap.appendChild(title);
    const chips=document.createElement('div');chips.className='tk37-day-chips';
    result.daySummary.forEach(x=>{const s=document.createElement('span');s.className='tk37-day-chip '+(x.full?'full':'partial');s.textContent=`${fmtDate(x.date)} · ${x.count}/${x.target}`;s.title=x.full?tr('Đạt mục tiêu ngày','Daily target reached','达到每日目标'):tr('Không thể lấp đầy hơn do ràng buộc thông minh hoặc đã hết trận','Could not fill further due to smart constraints or no matches left','因智能约束或比赛已用完，无法继续填充');chips.appendChild(s)});
    wrap.appendChild(chips);const note=document.createElement('small');note.textContent=tr('Chỉ hiển thị ngày thực sự có lịch; ngày trống cuối khoảng được bỏ qua.','Only dates with actual matches are shown; empty trailing dates are skipped.','仅显示实际有比赛的日期；区间末尾空日期会跳过。');wrap.appendChild(note);box.prepend(wrap);return out;
  };
}
function install(){if(VERSION&&T.VERSION!==VERSION)T.VERSION=VERSION;App.buildSchedulePlan=buildSchedulePlan;if(window.TopkeyUpgrade9)window.TopkeyUpgrade9.buildSchedulePlan=buildSchedulePlan;App.autoSchedule=autoSchedule37;patchPreview();}
install();
window.TopkeyUpgrade37={installed:true,VERSION,buildSchedulePlan,autoSchedule37};
})();
