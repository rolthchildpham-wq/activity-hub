(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,Up=window.TopkeyUpgrade9;
if(!T||!App||!U||!Up||App.__upgrade17SchedulerInstalled)return;
App.__upgrade17SchedulerInstalled=true;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const teamName=id=>App.teamName?App.teamName(id):(App.state.teams?.[id]?.name||id);
const fmtDate=v=>{const p=String(v||'').split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:String(v||'')};
const exactLimit=r=>r&&r.from&&r.from===r.to&&Number(r.max)>1;
const normName=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const nameMatches=(a,b)=>{a=normName(a);b=normName(b);if(!a||!b)return false;if(a===b)return true;return Math.min(a.length,b.length)>=3&&(a.includes(b)||b.includes(a));};
const Upgrade17={
  limitSelection:[],
  install(){
    this.injectQuickLimit();
    this.patchRender();
    this.patchSchedulerEngine();
    this.bindQuickLimit();
    this.renderAll();
  },
  cfg(){return Up.schedulerCfg?Up.schedulerCfg():((App.schedulerConfig||App.schedulerCfg)?.call(App)||{busy:[],priority:[],limits:[],lockedDates:[],playerBusy:[]})},
  async save(cfg,type){
    App.state.config=App.state.config||{};
    App.state.config.scheduler=cfg;
    if(Up.saveScheduler)await Up.saveScheduler(cfg,type);
    else if(App.saveSchedulerConfig)await App.saveSchedulerConfig(cfg,type);
    else if(App.saveScheduler)await App.saveScheduler(cfg,type);
    else await T.Data.queueSet('config/scheduler',cfg,{type});
    this.renderAll();
  },
  patchRender(){
    const base=Up.renderSchedulerUpgrade?.bind(Up);
    if(base)Up.renderSchedulerUpgrade=(...args)=>{const r=base(...args);this.renderBusyGrouped();this.renderQuickLimit();return r};
  },
  renderAll(){this.renderBusyGrouped();this.renderQuickLimit()},
  renderBusyGrouped(){
    const box=$('busy-list');if(!box)return;
    const cfg=this.cfg(),groups=new Map();
    (cfg.busy||[]).forEach(r=>{if(!r?.teamId||!r?.date)return;if(!groups.has(r.teamId))groups.set(r.teamId,new Set());groups.get(r.teamId).add(r.date)});
    box.innerHTML='';
    [...groups.entries()].sort((a,b)=>teamName(a[0]).localeCompare(teamName(b[0]),'vi')).forEach(([teamId,dateSet])=>{
      const row=document.createElement('div');row.className='tk17-busy-row';
      const name=document.createElement('div');name.className='tk17-busy-team';name.innerHTML=`<b>${esc(teamName(teamId))}</b><span>Bận:</span>`;
      const dates=document.createElement('div');dates.className='tk17-busy-dates';
      [...dateSet].sort().forEach(date=>{const chip=document.createElement('span');chip.className='tk17-date-rule';chip.innerHTML=`<span>${esc(fmtDate(date))}</span>`;const del=document.createElement('button');del.type='button';del.title='Xóa ngày bận này';del.textContent='×';del.onclick=()=>this.removeBusyDate(teamId,date);chip.appendChild(del);dates.appendChild(chip)});
      const all=document.createElement('button');all.type='button';all.className='btn mini danger tk17-remove-team-rule';all.textContent='Xóa đội';all.onclick=()=>this.removeBusyTeam(teamId);
      row.append(name,dates,all);box.appendChild(row);
    });
    if(!box.children.length)box.innerHTML='<span class="muted">Chưa có đội bận.</span>';
  },
  async removeBusyDate(teamId,date){const cfg=this.cfg(),before=(cfg.busy||[]).length;cfg.busy=(cfg.busy||[]).filter(x=>!(x.teamId===teamId&&x.date===date));if(cfg.busy.length===before)return;await this.save(cfg,'SCHED_BUSY_REMOVE_DATE');U.toast(`Đã xóa ngày bận ${fmtDate(date)} của ${teamName(teamId)}`,'ok')},
  async removeBusyTeam(teamId){const cfg=this.cfg(),n=(cfg.busy||[]).filter(x=>x.teamId===teamId).length;if(!n)return;cfg.busy=(cfg.busy||[]).filter(x=>x.teamId!==teamId);await this.save(cfg,'SCHED_BUSY_REMOVE_TEAM');U.toast(`Đã xóa ${n} ngày bận của ${teamName(teamId)}`,'ok')},
  injectQuickLimit(){
    const card=$('tk9-quick-limit-card');if(!card)return;
    card.classList.add('tk17-quick-limit');
    card.innerHTML=`<h3>⚡ NGOẠI LỆ 2–4 TRẬN / NGÀY CHO NHIỀU ĐỘI</h3>
      <p class="note">Tick nhiều đội cho một ngày cụ thể. <b>Ưu tiên 1</b> là đội được thêm trước và Smart Scheduler sẽ xét trước; các đội không có ngoại lệ vẫn tối đa 1 trận/ngày.</p>
      <div class="tk9-inline tk17-limit-toolbar"><div class="field"><label>Ngày áp dụng</label><input id="tk17-limit-date" type="date"></div><div class="field"><label>Số trận tối đa</label><select id="tk17-limit-max"><option value="2">2 trận/ngày</option><option value="3">3 trận/ngày</option><option value="4">4 trận/ngày</option></select></div><button id="tk17-limit-add" class="btn primary">+ Thêm đội đã tick</button></div>
      <div class="picker-head"><b>Tick nhiều đội theo thứ tự ưu tiên</b><span><button id="tk17-limit-all" class="btn mini" type="button">Chọn tất cả</button> <button id="tk17-limit-none" class="btn mini" type="button">Bỏ chọn</button></span></div>
      <div id="tk17-limit-team-grid" class="team-picker tk17-limit-picker"></div>
      <div class="tk17-priority-help">Thứ tự tick được ghi nhận khi bấm “Thêm đội đã tick”. Sau khi lưu có thể dùng <b>↑ / ↓</b> để đổi ưu tiên.</div>
      <div id="tk17-limit-list" class="rule-list tk17-priority-list"></div>`;
  },
  bindQuickLimit(){
    $('tk17-limit-add')?.addEventListener('click',()=>this.addPriorityLimits());
    $('tk17-limit-all')?.addEventListener('click',()=>{this.limitSelection=this.teams().map(t=>t.id);this.renderLimitPicker()});
    $('tk17-limit-none')?.addEventListener('click',()=>{this.limitSelection=[];this.renderLimitPicker()});
  },
  teams(){return Object.values(App.state.teams||{}).filter(t=>!t.withdrawn).sort((a,b)=>(a.code||'').localeCompare(b.code||'')||(a.name||'').localeCompare(b.name||'','vi'))},
  renderLimitPicker(){
    const box=$('tk17-limit-team-grid');if(!box)return;
    const valid=new Set(this.teams().map(t=>t.id));this.limitSelection=this.limitSelection.filter(id=>valid.has(id));
    box.innerHTML='';
    this.teams().forEach(t=>{const label=document.createElement('label');label.className='team-pick tk17-team-pick';const cb=document.createElement('input');cb.type='checkbox';cb.value=t.id;cb.checked=this.limitSelection.includes(t.id);cb.onchange=()=>{if(cb.checked&&!this.limitSelection.includes(t.id))this.limitSelection.push(t.id);if(!cb.checked)this.limitSelection=this.limitSelection.filter(id=>id!==t.id);this.updateLimitBadges()};const text=document.createElement('span');text.innerHTML=`<b>${esc(t.code||'')} · ${esc(t.name||'')}</b><small>${esc(t.category||'')}</small>`;const badge=document.createElement('i');badge.className='tk17-select-order';badge.dataset.teamId=t.id;label.append(cb,text,badge);box.appendChild(label)});this.updateLimitBadges();
  },
  updateLimitBadges(){document.querySelectorAll('#tk17-limit-team-grid .tk17-select-order').forEach(b=>{const i=this.limitSelection.indexOf(b.dataset.teamId);b.textContent=i>=0?String(i+1):'';b.classList.toggle('show',i>=0)})},
  normalizeOrders(cfg){
    let next=1;
    const specific=(cfg.limits||[]).map((r,index)=>({r,index,order:Number(r.priorityOrder)})).filter(x=>exactLimit(x.r)).sort((a,b)=>((Number.isFinite(a.order)&&a.order>0)?a.order:1e9)-((Number.isFinite(b.order)&&b.order>0)?b.order:1e9)||a.index-b.index);
    specific.forEach(x=>{x.r.priorityOrder=next++});return next;
  },
  async addPriorityLimits(){
    const date=$('tk17-limit-date')?.value,max=Math.max(2,Math.min(4,Number($('tk17-limit-max')?.value)||2)),ids=this.limitSelection.slice();
    if(!date||!ids.length)return U.toast('Chọn ngày và tick ít nhất 1 đội','err');
    const cfg=this.cfg();cfg.limits=Array.isArray(cfg.limits)?cfg.limits:[];let next=this.normalizeOrders(cfg),added=0,updated=0;
    ids.forEach(teamId=>{const i=cfg.limits.findIndex(x=>x.teamId===teamId&&x.from===date&&x.to===date);if(i>=0){cfg.limits[i]={...cfg.limits[i],max,priorityOrder:cfg.limits[i].priorityOrder||next++};updated++}else{cfg.limits.push({teamId,from:date,to:date,max,priorityOrder:next++});added++}});
    this.normalizeOrders(cfg);await this.save(cfg,'SCHED_LIMIT_SPECIFIC_MULTI_PRIORITY');this.limitSelection=[];this.renderLimitPicker();U.toast(`Đã lưu ${ids.length} đội ngày ${fmtDate(date)} · tối đa ${max} trận/ngày · ưu tiên theo thứ tự thêm`,'ok');
  },
  priorityRows(cfg){return (cfg.limits||[]).map((r,index)=>({r,index,order:Number(r.priorityOrder)||1e9})).filter(x=>exactLimit(x.r)).sort((a,b)=>a.order-b.order||a.index-b.index)},
  renderQuickLimit(){
    if(!$('tk17-limit-team-grid'))this.injectQuickLimit();
    this.renderLimitPicker();
    const date=$('tk17-limit-date');if(date&&!date.value)date.value=$('auto-date')?.value||new Date().toISOString().slice(0,10);
    const box=$('tk17-limit-list');if(!box)return;const cfg=this.cfg();this.normalizeOrders(cfg);const rows=this.priorityRows(cfg);box.innerHTML='';
    rows.forEach((x,pos)=>{const r=x.r,row=document.createElement('div');row.className='tk17-priority-row';row.innerHTML=`<span class="tk17-priority-no">${pos+1}</span><span class="tk17-priority-text"><b>${esc(teamName(r.teamId))}</b><small>${esc(fmtDate(r.from))} · tối đa <b>${Number(r.max)||1} trận/ngày</b></small></span>`;const actions=document.createElement('span');actions.className='tk17-priority-actions';const up=document.createElement('button');up.type='button';up.className='btn mini';up.textContent='↑';up.title='Ưu tiên cao hơn';up.disabled=pos===0;up.onclick=()=>this.moveLimit(r.teamId,r.from,-1);const down=document.createElement('button');down.type='button';down.className='btn mini';down.textContent='↓';down.title='Ưu tiên thấp hơn';down.disabled=pos===rows.length-1;down.onclick=()=>this.moveLimit(r.teamId,r.from,1);const del=document.createElement('button');del.type='button';del.className='btn mini danger';del.textContent='×';del.title='Xóa ngoại lệ';del.onclick=()=>this.removeLimit(r.teamId,r.from);actions.append(up,down,del);row.appendChild(actions);box.appendChild(row)});
    if(!rows.length)box.innerHTML='<span class="muted">Chưa có ngoại lệ 2–4 trận/ngày.</span>';
  },
  async moveLimit(teamId,date,dir){const cfg=this.cfg();this.normalizeOrders(cfg);const rows=this.priorityRows(cfg),i=rows.findIndex(x=>x.r.teamId===teamId&&x.r.from===date);const j=i+dir;if(i<0||j<0||j>=rows.length)return;const a=rows[i].r,b=rows[j].r,tmp=a.priorityOrder;a.priorityOrder=b.priorityOrder;b.priorityOrder=tmp;this.normalizeOrders(cfg);await this.save(cfg,'SCHED_LIMIT_PRIORITY_REORDER');U.toast('Đã đổi thứ tự ưu tiên Smart Scheduler','ok')},
  async removeLimit(teamId,date){const cfg=this.cfg(),before=(cfg.limits||[]).length;cfg.limits=(cfg.limits||[]).filter(x=>!(x.teamId===teamId&&x.from===date&&x.to===date&&Number(x.max)>1));if(cfg.limits.length===before)return;this.normalizeOrders(cfg);await this.save(cfg,'SCHED_LIMIT_SPECIFIC_REMOVE');U.toast(`Đã xóa ngoại lệ của ${teamName(teamId)} ngày ${fmtDate(date)}`,'ok')},
  patchSchedulerEngine(){
    const self=this;
    const build=function(){
      const input={category:$('adv-category')?.value||'ALL',from:$('auto-date')?.value,to:$('auto-end-date')?.value,start:$('auto-time')?.value||'08:00',interval:Math.max(5,Number($('auto-interval')?.value)||35),maxDay:Math.max(1,Number($('auto-max-day')?.value)||24),includeSunday:$('auto-sunday')?.checked!==false,reschedule:$('auto-reschedule')?.checked!==false};
      if(!input.from||!input.to||input.to<input.from)throw new Error('Khoảng ngày không hợp lệ');
      const cfg=self.cfg(),locked=new Set(cfg.lockedDates||[]),dates=Up.dateRange(input.from,input.to,input.includeSunday).filter(d=>!locked.has(d)),courts=Object.values(App.state.courts||{}).sort((a,b)=>(a.name||'').localeCompare(b.name||''));
      if(!dates.length||!courts.length)throw new Error('Không có ngày hoặc sân/khu khả dụng');
      const rules={...T.DEFAULT_RULES,...App.state.config?.rules},dur=Math.max(5,Number(rules.estimatedMatchMinutes)||input.interval),rest=Math.max(0,Number(rules.minRestMinutes)||0),toMin=t=>{const[a,b]=String(t||'00:00').split(':').map(Number);return(a||0)*60+(b||0)},start=toMin(input.start),matches=Object.values(App.state.matches||{}),protectedStatus=new Set(['LIVE','FINISHED','WALKOVER','RETIRED','DISQUALIFIED','SUSPENDED','CANCELLED']),activeIds=new Set(Object.values(App.state.activeMatches||{}).filter(Boolean).map(x=>x.matchId)),catOf=m=>App.normalizeCategory?App.normalizeCategory(m.category):m.category,eligible=m=>(input.category==='ALL'||catOf(m)===input.category)&&!protectedStatus.has(m.status)&&!activeIds.has(m.id)&&!App.state.teams?.[m.teamAId]?.withdrawn&&!App.state.teams?.[m.teamBId]?.withdrawn,target=matches.filter(m=>eligible(m)&&(!m.date||(input.reschedule&&m.date>=input.from&&m.date<=input.to&&!locked.has(m.date))||(!m.time||!m.courtId))),targetIds=new Set(target.map(m=>m.id)),fixed=matches.filter(m=>!targetIds.has(m.id)&&m.date&&m.time&&m.courtId&&m.status!=='CANCELLED');
      if(!target.length)throw new Error('Không có lịch chưa đấu phù hợp để xếp');
      const occCourt={},occTeam={},occPerson={},dayCount={},teamDay={},key=(d,id)=>d+'|'+id,participants=m=>[m.teamAId,m.teamBId].filter(Boolean),people=m=>[...new Set(participants(m).flatMap(id=>Up.teamPeople(id)))],add=(m,d,t,cid)=>{const st=toMin(t),en=st+dur;dayCount[d]=(dayCount[d]||0)+1;participants(m).forEach(id=>{(occTeam[key(d,id)]??=[]).push([st,en]);teamDay[key(d,id)]=(teamDay[key(d,id)]||0)+1});people(m).forEach(n=>(occPerson[key(d,n)]??=[]).push([st,en]));(occCourt[key(d,cid)]??=[]).push([st,en])};fixed.forEach(m=>add(m,m.date,m.time,m.courtId));
      const busyTeam=(id,d)=>(cfg.busy||[]).some(x=>x.teamId===id&&x.date===d),busyPerson=(m,d)=>{const ps=people(m);return(cfg.playerBusy||[]).some(x=>x.date===d&&ps.some(p=>nameMatches(p,x.name)))},limit=(id,d)=>{const xs=(cfg.limits||[]).filter(x=>x.teamId===id&&d>=x.from&&d<=x.to);return xs.length?Math.min(4,Math.max(...xs.map(x=>Number(x.max)||1))):1},windowPriority=(m,d)=>participants(m).reduce((n,id)=>n+((cfg.priority||[]).some(x=>x.teamId===id&&d>=x.from&&d<=x.to)?1:0),0),specialOrder=(m,d)=>{const orders=[];participants(m).forEach(id=>(cfg.limits||[]).forEach((r,idx)=>{if(r.teamId===id&&r.from===d&&r.to===d&&Number(r.max)>1)orders.push(Number(r.priorityOrder)||idx+1)}));return orders.length?Math.min(...orders):Infinity},overlap=(arr,st,en,gap=0)=>(arr||[]).some(([a,b])=>st<b+gap&&en+gap>a),bestSpecial=m=>Math.min(...dates.map(d=>specialOrder(m,d))),bestWindow=m=>Math.max(...dates.map(d=>windowPriority(m,d)));
      target.sort((a,b)=>bestSpecial(a)-bestSpecial(b)||bestWindow(b)-bestWindow(a)||String(a.code||a.id).localeCompare(String(b.code||b.id)));
      const plan=[],unplaced=[];
      for(const m of target){let best=null;for(let di=0;di<dates.length;di++){const d=dates[di],ids=participants(m),ps=people(m);if(ids.some(id=>busyTeam(id,d))||busyPerson(m,d)||(dayCount[d]||0)>=input.maxDay)continue;if(ids.some(id=>(teamDay[key(d,id)]||0)>=limit(id,d)))continue;for(let slot=0;slot<300;slot++){const st=start+slot*input.interval,en=st+dur;if(en>1440)break;for(const c of courts){if(overlap(occCourt[key(d,c.id)],st,en,0))continue;if(ids.some(id=>overlap(occTeam[key(d,id)],st,en,rest)))continue;const personGap=Math.max(rest,input.interval);if(ps.some(n=>overlap(occPerson[key(d,n)],st,en,personGap)))continue;const order=specialOrder(m,d),specialScore=Number.isFinite(order)?1000000000-order*1000000:0,teamLoad=ids.reduce((n,id)=>n+(teamDay[key(d,id)]||0),0),idealPerDay=Math.max(1,Math.ceil(target.length/dates.length)),overflowLoad=Math.max(0,(dayCount[d]||0)-idealPerDay+1),score=specialScore+windowPriority(m,d)*100000-overflowLoad*3000-teamLoad*1200-slot*4-di;if(!best||score>best.score)best={date:d,time:String(Math.floor(st/60)).padStart(2,'0')+':'+String(st%60).padStart(2,'0'),courtId:c.id,score,priorityOrder:Number.isFinite(order)?order:null};}}}if(best){const after={...m,date:best.date,time:best.time,courtId:best.courtId,status:'SCHEDULED',scheduledAt:Date.now(),schedulerVersion:T.VERSION};plan.push({before:m,after,priorityOrder:best.priorityOrder});add(after,best.date,best.time,best.courtId)}else unplaced.push(m)}
      return{input,plan,unplaced,rest,dur,lockedDates:[...locked],playerBusy:(cfg.playerBusy||[]).length,specificLimitPriorities:self.priorityRows(cfg).length};
    };
    App.buildSchedulePlan=build;Up.buildSchedulePlan=build;
  }
};
Upgrade17.install();
window.TopkeyUpgrade17=Upgrade17;
})();
