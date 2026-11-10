(function(){
'use strict';
const TAG='u122h33-20261103';
function waitForApp(){
  const boot=()=>{const T=window.Topkey,App=T?.App,U=T?.U;if(!T||!App||!U)return false;install(T,App,U);return true};
  if(boot())return;
  let n=0;const iv=setInterval(()=>{if(boot()||++n>120)clearInterval(iv)},250);
  window.addEventListener('topkey:admin-ready',boot,{once:false});
}
function install(T,App,U){
 if(App.__u122h12DayTimeOptimizer)return;App.__u122h12DayTimeOptimizer=true;
 const $=id=>document.getElementById(id);
 const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^\s*(men|women)\s*[-:/.]?\s*/i,'').replace(/\s+/g,' ').trim();
 const teamPeople=id=>{const t=App.state.teams?.[id]||{};return [t.p1,t.p2].map(fold).filter(Boolean)};
 const people=m=>[...new Set([...(teamPeople(m.teamAId)),...(teamPeople(m.teamBId))])];
 const shared=(a,b)=>{const A=new Set(people(a));return people(b).filter(x=>A.has(x))};
 const cat=m=>String(App.normalizeCategory?App.normalizeCategory(m.category):m.category||'').toUpperCase();
 const isMen=m=>cat(m)==='MEN';
 const toMin=t=>{const [h,m]=String(t||'00:00').split(':').map(Number);return (h||0)*60+(m||0)};
 const protectedStatus=new Set(['LIVE','FINISHED','WALKOVER','RETIRED','DISQUALIFIED','SUSPENDED','CANCELLED']);
 const movable=m=>m?.date&&m?.time&&!protectedStatus.has(String(m.status||'').toUpperCase())&&!Object.values(App.state.activeMatches||{}).some(x=>x?.matchId===m.id)&&!(m.sets||[]).some(s=>(Number(s.a)||0)>0||(Number(s.b)||0)>0);
 function dates(){return [...new Set(Object.values(App.state.matches||{}).filter(m=>movable(m)).map(m=>m.date).filter(Boolean))].sort()}
 function snapshot(date){return Object.values(App.state.matches||{}).filter(m=>m.date===date&&m.time&&m.courtId).map(m=>({...m,__time:m.time}));}
 function cost(rows){
   let total=0,sameTime=0,adj=0,menOrder=0;const details=[];
   const times=[...new Set(rows.map(m=>m.time).filter(Boolean))].sort();const rank=new Map(times.map((t,i)=>[t,i]));
   for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
     const a=rows[i],b=rows[j],sp=shared(a,b);if(!sp.length)continue;
     const ra=rank.get(a.time),rb=rank.get(b.time),d=Math.abs((ra??0)-(rb??0));
     if(a.time===b.time){total+=100000*sp.length;sameTime+=sp.length;details.push({kind:'same',a,b,sp});continue}
     if(d===1){let earlier=toMin(a.time)<=toMin(b.time)?a:b,later=earlier===a?b:a;let p=1000*sp.length;adj+=sp.length;
       if(isMen(later)&&!isMen(earlier)){p+=160*sp.length;menOrder+=sp.length}
       total+=p;details.push({kind:'adj',a:earlier,b:later,sp,menOrder:isMen(later)&&!isMen(earlier)});
     }
   }
   return {total,sameTime,adj,menOrder,details};
 }
 function validCourtTimes(rows){const seen=new Set();for(const m of rows){const k=m.courtId+'|'+m.time;if(seen.has(k))return false;seen.add(k)}return true}
 function optimize(date){
   const all=snapshot(date),moving=all.filter(m=>movable(m));if(moving.length<2)return {all,moving,before:cost(all),after:cost(all),changed:[]};
   let best=moving.map(x=>({...x}));
   let bestAll=all.map(x=>({...x})),bestScore=cost(bestAll);
   // Pair-swap hill climb. Chỉ hoán đổi giờ giữa hai trận cùng sân => ngày/sân không đổi.
   // Hàm cost ưu tiên: (1) không trùng VĐV cùng giờ, (2) không đánh hai lượt liên tiếp,
   // (3) nếu buộc liên tiếp thì MEN nên nằm ở lượt sớm hơn.
   for(let pass=0;pass<100;pass++){
     let improved=false,bestSwap=null,bestSwapScore=bestScore;
     for(let i=0;i<best.length;i++)for(let j=i+1;j<best.length;j++){
       if(best[i].courtId!==best[j].courtId||best[i].time===best[j].time)continue;
       const cand=best.map(x=>({...x}));const t=cand[i].time;cand[i].time=cand[j].time;cand[j].time=t;
       const candidateAll=all.map(x=>{const q=cand.find(y=>y.id===x.id);return q?{...x,time:q.time}:x});
       if(!validCourtTimes(candidateAll))continue;const sc=cost(candidateAll);
       if(sc.total<bestSwapScore.total){bestSwap={cand,candidateAll};bestSwapScore=sc;}
     }
     if(bestSwap){best=bestSwap.cand;bestAll=bestSwap.candidateAll;bestScore=bestSwapScore;improved=true}
     if(!improved)break;
   }
   const changed=best.filter(m=>{const old=App.state.matches?.[m.id];return old&&old.time!==m.time}).map(m=>({id:m.id,code:m.code||m.id,from:App.state.matches[m.id].time,to:m.time,courtId:m.courtId,category:cat(m)}));
   return {all,moving,before:cost(all),after:bestScore,changed,bestAll};
 }
 function ensureModal(){let d=$('tk-h12-modal');if(d)return d;d=document.createElement('div');d.id='tk-h12-modal';d.className='modal hidden';d.innerHTML=`<div class="modal-box wide"><div class="split"><div><h2>⏱ Sắp time trong ngày</h2><p class="muted">Giữ nguyên ngày và sân. Ưu tiên một VĐV không đánh 2 lượt thời gian liên tiếp; nếu không tránh được, ưu tiên đôi Nam-Nam ở lượt sớm hơn.</p></div><button class="btn mini" id="tk-h12-close">Đóng</button></div><div class="form-grid" style="margin-top:12px"><div class="field"><label>Ngày cần tối ưu</label><select id="tk-h12-date"></select></div><div class="field"><label>Quy tắc</label><input disabled value="Tránh VĐV liên tiếp → MEN trước nếu bắt buộc"></div></div><div id="tk-h12-report" class="subcard" style="margin-top:12px"></div><div class="action-bar" style="margin-top:12px;justify-content:flex-end"><button class="btn" id="tk-h12-preview">↻ Tính lại</button><button class="btn ok" id="tk-h12-apply">✓ Áp dụng giờ mới</button></div></div>`;document.body.appendChild(d);$('tk-h12-close').onclick=()=>d.classList.add('hidden');$('tk-h12-preview').onclick=()=>renderPreview();$('tk-h12-date').onchange=()=>renderPreview();$('tk-h12-apply').onclick=()=>applyPlan();return d}
 let currentPlan=null;
 function rowLabel(m){return `${m.code||m.id} · ${App.teamName?.(m.teamAId)||m.teamAId} vs ${App.teamName?.(m.teamBId)||m.teamBId}`}
 function renderPreview(){const date=$('tk-h12-date')?.value;if(!date)return;currentPlan=optimize(date);const r=$('tk-h12-report'),b=currentPlan.before,a=currentPlan.after;const changed=currentPlan.changed;
   let html=`<div class="split"><b>${date} · ${currentPlan.moving.length} trận có thể đổi giờ</b><span class="pill">${changed.length} trận đổi giờ</span></div>`;
   html+=`<div class="scheduler-grid" style="margin-top:10px"><div><small>VĐV trùng cùng giờ</small><h3>${b.sameTime} → ${a.sameTime}</h3></div><div><small>VĐV đánh 2 lượt liên tiếp</small><h3>${b.adj} → ${a.adj}</h3></div><div><small>Trường hợp MEN bị xếp sau khi buộc liên tiếp</small><h3>${b.menOrder} → ${a.menOrder}</h3></div></div>`;
   if(changed.length)html+=`<div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>Trận</th><th>Nội dung</th><th>Giờ cũ</th><th>Giờ mới</th></tr></thead><tbody>${changed.map(x=>`<tr><td>${App.escape?.(x.code)||x.code}</td><td>${x.category}</td><td>${x.from}</td><td><b>${x.to}</b></td></tr>`).join('')}</tbody></table></div>`;else html+=`<p class="muted" style="margin-top:10px">Lịch hiện tại đã tối ưu theo quy tắc này hoặc không có hoán đổi giờ hợp lệ khi giữ nguyên sân.</p>`;
   r.innerHTML=html;$('tk-h12-apply').disabled=!changed.length;
 }
 async function applyPlan(){if(!currentPlan?.changed?.length)return;const role=String(T.Auth?.role?.()||'').toUpperCase();if(role!=='ADMIN')return U.toast('Chỉ ADMIN được sắp lại giờ thi đấu','err');const date=$('tk-h12-date')?.value;const ok=await U.confirmDanger?.('Sắp lại giờ trong ngày',`Ngày ${date}: đổi giờ ${currentPlan.changed.length} trận. Giữ nguyên sân và không chạm trận LIVE/đã có điểm/đã kết thúc.`,'SẮP TIME');if(ok===false)return;const updates={};for(const c of currentPlan.changed){const old=App.state.matches[c.id];if(!old)continue;updates[T.Data.path('matches/'+c.id)]={...old,time:c.to,dayTimeOptimizedAt:Date.now(),dayTimeOptimizer:TAG}}
   if(!Object.keys(updates).length)return;await T.Data.queueMulti(updates,{type:'DAY_TIME_OPTIMIZER_H12'});await T.Data.audit?.('DAY_TIME_OPTIMIZE','tournament',T.Data.tid,null,{date,count:currentPlan.changed.length,before:currentPlan.before,after:currentPlan.after});U.toast(`Đã sắp lại giờ ${currentPlan.changed.length} trận trong ngày ${date}`,'ok');setTimeout(()=>{App.renderMatches?.();renderPreview()},120);
 }
 function open(){const ds=dates();if(!ds.length)return U.toast('Không có ngày nào có từ 2 trận chưa bắt đầu để tối ưu','info');const d=ensureModal(),sel=$('tk-h12-date'),old=sel.value;sel.innerHTML=ds.map(x=>`<option value="${x}">${x}</option>`).join('');sel.value=ds.includes(old)?old:ds[0];d.classList.remove('hidden');renderPreview()}
 function mount(){const page=$('page-schedule');if(!page||$('tk-h12-open'))return;const cards=page.querySelectorAll('.card');const scheduleCard=[...cards].find(c=>c.querySelector('#matches-list'));const bar=scheduleCard?.querySelector('.action-bar');if(!bar)return;const b=document.createElement('button');b.id='tk-h12-open';b.className='btn primary';b.textContent='⏱ Sắp time trong ngày';b.title='Giữ nguyên ngày/sân; tránh VĐV đánh 2 lượt liên tiếp; nếu buộc liên tiếp ưu tiên đôi Nam-Nam trước';b.onclick=open;bar.prepend(b)}
 mount();const oldRender=App.renderMatches?.bind(App);if(oldRender&&!App.__u122h12RenderWrap){App.__u122h12RenderWrap=true;App.renderMatches=function(...args){const out=oldRender(...args);setTimeout(mount,0);return out}}
 window.addEventListener('topkey:tab-change',()=>setTimeout(mount,0));setTimeout(mount,500);
 window.TopkeyUpgrade122Hotfix12={TAG,optimize,open,cost};
}
waitForApp();
})();
