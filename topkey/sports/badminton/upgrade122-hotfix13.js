(function(){
'use strict';
const TAG='u122h33-20261103';
function boot(){
  const T=window.Topkey,App=T?.App,U=T?.U;
  if(!T||!App||!U)return false;
  if(App.__u122h13DayRowOptimizer)return true;
  App.__u122h13DayRowOptimizer=true;
  install(T,App,U);return true;
}
if(!boot()){
  let n=0;const iv=setInterval(()=>{if(boot()||++n>160)clearInterval(iv)},200);
  window.addEventListener('topkey:admin-ready',boot,{once:false});
}
function install(T,App,U){
 const $=id=>document.getElementById(id);
 const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^\s*(men|women)\s*[-:/.]?\s*/i,'').replace(/\s+/g,' ').trim();
 const teamPeople=id=>{const t=App.state.teams?.[id]||{};return [t.p1,t.p2].map(fold).filter(Boolean)};
 const people=m=>[...new Set([...(teamPeople(m.teamAId)),...(teamPeople(m.teamBId))])];
 const shared=(a,b)=>{const A=new Set(people(a));return people(b).filter(x=>A.has(x))};
 const cat=m=>String(App.normalizeCategory?App.normalizeCategory(m.category):m.category||'').toUpperCase();
 const isMen=m=>cat(m)==='MEN';
 const toMin=t=>{const [h,m]=String(t||'00:00').split(':').map(Number);return (h||0)*60+(m||0)};
 const minToTime=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
 const protectedStatus=new Set(['LIVE','FINISHED','WALKOVER','RETIRED','DISQUALIFIED','SUSPENDED','CANCELLED']);
 const activeIds=()=>new Set(Object.values(App.state.activeMatches||{}).filter(Boolean).map(x=>x.matchId));
 function movable(m){return !!(m?.date&&m?.courtId)&&!protectedStatus.has(String(m.status||'').toUpperCase())&&!activeIds().has(m.id)&&!(m.sets||[]).some(s=>(Number(s.a)||0)>0||(Number(s.b)||0)>0)}
 function matchesForDate(date){return Object.values(App.state.matches||{}).filter(m=>m?.date===date&&m?.courtId)}
 function inferInterval(rows){
   const vals=[...new Set(rows.map(m=>m.time).filter(Boolean).map(toMin))].sort((a,b)=>a-b);
   const gaps=[];for(let i=1;i<vals.length;i++){const g=vals[i]-vals[i-1];if(g>=10&&g<=90)gaps.push(g)}
   if(gaps.length)return Math.max(10,Math.min(...gaps));
   const rules={...(T.DEFAULT_RULES||{}),...(App.state.config?.rules||{})};
   const configured=Number(document.getElementById('auto-interval')?.value)||Number(rules.estimatedMatchMinutes)||20;
   return Math.max(10,Math.min(90,configured));
 }
 function pairPenalty(a,ta,b,tb,interval){
   const sp=shared(a,b);if(!sp.length)return 0;
   const d=Math.abs(ta-tb);if(d===0)return 100000*sp.length;
   if(d===interval){
     const earlier=ta<tb?a:b,later=ta<tb?b:a;
     let p=1000*sp.length;
     if(isMen(later)&&!isMen(earlier))p+=240*sp.length;
     return p;
   }
   return 0;
 }
 function scorePlan(assign,fixed,interval){
   let total=0,sameTime=0,adj=0,menOrder=0;
   const rows=[...fixed.map(m=>({m,time:toMin(m.time)})),...assign.map(x=>({m:x.m,time:x.time}))];
   for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
     const a=rows[i],b=rows[j],sp=shared(a.m,b.m);if(!sp.length)continue;
     const d=Math.abs(a.time-b.time);
     if(d===0){sameTime+=sp.length;total+=100000*sp.length}
     else if(d===interval){adj+=sp.length;const earlier=a.time<b.time?a:b,later=a.time<b.time?b:a;if(isMen(later.m)&&!isMen(earlier.m)){menOrder+=sp.length;total+=240*sp.length}total+=1000*sp.length}
   }
   for(const x of assign){if(x.m.time)total+=Math.abs(x.time-toMin(x.m.time))*0.35}
   return {total,sameTime,adj,menOrder};
 }
 function optimize(date){
   const rows=matchesForDate(date);const moving=rows.filter(movable);const fixed=rows.filter(m=>!movable(m));
   const interval=inferInterval(rows);if(moving.length<2)return {date,rows,moving,fixed,interval,changed:[],before:scorePlan(moving.map(m=>({m,time:toMin(m.time)})),fixed,interval),after:null};
   const existingMins=rows.map(m=>toMin(m.time)).filter(Number.isFinite);let start=Math.min(...existingMins);if(!Number.isFinite(start))start=8*60;
   // Align start to the first existing time. Generate fresh unique slots per court so duplicate legacy times can be repaired.
   const byCourt={};moving.forEach(m=>(byCourt[m.courtId]??=[]).push(m));
   const fixedBusy={};fixed.forEach(m=>{if(!m.time)return;(fixedBusy[m.courtId]??=new Set()).add(toMin(m.time))});
   const candidates={};
   for(const [cid,arr] of Object.entries(byCourt)){
     const need=arr.length;const out=[];for(let k=0;out.length<need+4&&k<80;k++){const t=start+k*interval;if(t>=24*60)break;if(!(fixedBusy[cid]?.has(t)))out.push(t)}candidates[cid]=out;
   }
   const pressure=m=>moving.reduce((n,x)=>n+(x.id!==m.id?shared(m,x).length:0),0);
   const order=[...moving].sort((a,b)=>pressure(b)-pressure(a)||(isMen(a)?-1:1)||(toMin(a.time)-toMin(b.time))||String(a.code||a.id).localeCompare(String(b.code||b.id)));
   let best=null,nodes=0;const LIMIT=moving.length<=9?180000:50000;
   const used={};Object.keys(byCourt).forEach(cid=>used[cid]=new Set());
   const current=[];
   function dfs(idx,partialCost){
     if(++nodes>LIMIT)return;
     if(best&&partialCost>=best.cost)return;
     if(idx===order.length){const sc=scorePlan(current,fixed,interval);if(!best||sc.total<best.cost)best={cost:sc.total,assign:current.map(x=>({...x})),score:sc};return}
     const m=order[idx],cid=m.courtId,list=candidates[cid]||[];
     // Try near original time first, then earlier slots. MEN gets a slight early tie-break.
     const orig=toMin(m.time);const sorted=[...list].sort((a,b)=>Math.abs(a-orig)-Math.abs(b-orig)||a-b);
     for(const t of sorted){if(used[cid].has(t))continue;let inc=Math.abs(t-orig)*0.35;
       for(const x of current)inc+=pairPenalty(m,t,x.m,x.time,interval);
       for(const f of fixed)inc+=pairPenalty(m,t,f,toMin(f.time),interval);
       if(isMen(m))inc+=(t-start)*0.01;
       used[cid].add(t);current.push({m,time:t});dfs(idx+1,partialCost+inc);current.pop();used[cid].delete(t);
     }
   }
   dfs(0,0);
   if(!best){
     // Safe greedy fallback for large/busy days.
     const assign=[];const busy={};Object.keys(byCourt).forEach(cid=>busy[cid]=new Set());
     for(const m of order){let pick=null;for(const t of (candidates[m.courtId]||[])){if(busy[m.courtId].has(t))continue;const test=[...assign,{m,time:t}];const sc=scorePlan(test,fixed,interval);if(!pick||sc.total<pick.sc.total)pick={t,sc}}if(pick){assign.push({m,time:pick.t});busy[m.courtId].add(pick.t)}}
     best={assign,score:scorePlan(assign,fixed,interval),cost:scorePlan(assign,fixed,interval).total};
   }
   const map=new Map(best.assign.map(x=>[x.m.id,x.time]));
   const changed=moving.filter(m=>map.has(m.id)&&minToTime(map.get(m.id))!==m.time).map(m=>({id:m.id,code:m.code||m.id,from:m.time||'—',to:minToTime(map.get(m.id)),courtId:m.courtId,category:cat(m)}));
   const before=scorePlan(moving.map(m=>({m,time:toMin(m.time)})),fixed,interval);
   return {date,rows,moving,fixed,interval,changed,before,after:best.score,nodes};
 }
 function dateFromHeader(row){
   const s=row?.textContent||'';let m=s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);if(m)return `${m[1]}-${m[2]}-${m[3]}`;
   m=s.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);if(m)return `${m[3]}-${m[2]}-${m[1]}`;return '';
 }
 function esc(s){return App.escape?.(String(s??''))??String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 let currentPlan=null;
 function ensureModal(){let d=$('tk-h13-modal');if(d)return d;d=document.createElement('div');d.id='tk-h13-modal';d.className='modal hidden';d.innerHTML=`<div class="modal-box wide"><div class="split"><div><h2>⏱ Sắp time ngày <span id="tk-h13-title-date"></span></h2><p class="muted">Tự tạo lại slot giờ trong ngày, giữ nguyên ngày và sân. Ưu tiên không để cùng VĐV đánh 2 lượt liên tiếp; nếu bắt buộc, ưu tiên đôi Nam-Nam ở lượt trước.</p></div><button class="btn mini" id="tk-h13-close">Đóng</button></div><div id="tk-h13-report" class="subcard" style="margin-top:12px"></div><div class="action-bar" style="margin-top:12px;justify-content:flex-end"><button class="btn" id="tk-h13-recalc">↻ Tính lại</button><button class="btn ok" id="tk-h13-apply">✓ Áp dụng giờ mới</button></div></div>`;document.body.appendChild(d);$('tk-h13-close').onclick=()=>d.classList.add('hidden');$('tk-h13-recalc').onclick=()=>currentPlan&&renderPreview(currentPlan.date);$('tk-h13-apply').onclick=applyPlan;return d}
 function renderPreview(date){currentPlan=optimize(date);ensureModal();$('tk-h13-title-date').textContent=date;const b=currentPlan.before,a=currentPlan.after||b,c=currentPlan.changed;
   let html=`<div class="split"><b>${date} · ${currentPlan.moving.length} trận có thể sắp giờ</b><span class="pill">Bước giờ ${currentPlan.interval} phút · ${c.length} trận đổi</span></div>`;
   html+=`<div class="scheduler-grid" style="margin-top:10px"><div><small>VĐV trùng cùng giờ</small><h3>${b.sameTime} → ${a.sameTime}</h3></div><div><small>VĐV đánh 2 lượt liên tiếp</small><h3>${b.adj} → ${a.adj}</h3></div><div><small>MEN bị xếp sau khi buộc liên tiếp</small><h3>${b.menOrder} → ${a.menOrder}</h3></div></div>`;
   if(c.length)html+=`<div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>Trận</th><th>Nội dung</th><th>Giờ cũ</th><th>Giờ mới</th></tr></thead><tbody>${c.map(x=>`<tr><td>${esc(x.code)}</td><td>${esc(x.category)}</td><td>${esc(x.from)}</td><td><b>${esc(x.to)}</b></td></tr>`).join('')}</tbody></table></div>`;else html+=`<p class="muted" style="margin-top:10px">Không cần đổi giờ hoặc ngày này có ít hơn 2 trận có thể sắp.</p>`;
   $('tk-h13-report').innerHTML=html;$('tk-h13-apply').disabled=!c.length;return currentPlan;
 }
 function openDay(date){if(!date)return;const d=ensureModal();d.classList.remove('hidden');renderPreview(date)}
 async function applyPlan(){if(!currentPlan?.changed?.length)return;const role=String(T.Auth?.role?.()||'').toUpperCase();if(role!=='ADMIN')return U.toast('Chỉ ADMIN được sắp lại giờ thi đấu','err');const p=currentPlan;const ok=await U.confirmDanger?.('Sắp time ngày '+p.date,`Đổi giờ ${p.changed.length} trận. Giữ nguyên ngày và sân; không chạm trận LIVE/đã có điểm/đã kết thúc.`,'SẮP TIME');if(ok===false)return;const updates={};for(const c of p.changed){const old=App.state.matches?.[c.id];if(!old)continue;updates[T.Data.path('matches/'+c.id)]={...old,time:c.to,dayTimeOptimizedAt:Date.now(),dayTimeOptimizer:TAG}}
   if(!Object.keys(updates).length)return;await T.Data.queueMulti(updates,{type:'DAY_TIME_OPTIMIZER_H13'});await T.Data.audit?.('DAY_TIME_OPTIMIZE','tournament',T.Data.tid,null,{date:p.date,count:p.changed.length,interval:p.interval,before:p.before,after:p.after,version:TAG});U.toast(`Đã sắp time ${p.changed.length} trận ngày ${p.date}`,'ok');$('tk-h13-modal')?.classList.add('hidden');setTimeout(()=>App.renderMatches?.(),100);
 }
 function mountDayButtons(){
   // Remove H12 global button: H13 works directly per day row.
   $('tk-h12-open')?.remove();
   const box=$('matches-list');if(!box)return;
   const rows=[...box.querySelectorAll('tr.tk12-day-row')];
   rows.forEach(row=>{const date=dateFromHeader(row);if(!date)return;const head=row.querySelector('.tk12-day-head');if(!head||head.querySelector('.tk-h13-day-btn'))return;const b=document.createElement('button');b.className='btn mini tk-h13-day-btn';b.type='button';b.textContent='⏱ Sắp time';b.title='Tự sắp lại giờ trong riêng ngày '+date;b.style.marginLeft='10px';b.onclick=e=>{e.preventDefault();e.stopPropagation();openDay(date)};const right=head.querySelector('span');if(right){const wrap=document.createElement('span');wrap.style.display='inline-flex';wrap.style.alignItems='center';wrap.style.gap='8px';right.replaceWith(wrap);wrap.append(right,b)}else head.appendChild(b)});
 }
 const base=App.renderMatches?.bind(App);if(base&&!App.__u122h13RenderWrap){App.__u122h13RenderWrap=true;App.renderMatches=function(...args){const out=base(...args);setTimeout(mountDayButtons,0);return out}}
 window.addEventListener('topkey:tab-change',()=>setTimeout(mountDayButtons,20));
 setTimeout(mountDayButtons,200);setTimeout(mountDayButtons,800);
 window.TopkeyUpgrade122Hotfix13={TAG,optimize,openDay,mountDayButtons};
}
})();
