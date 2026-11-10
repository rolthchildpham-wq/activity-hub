(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,Up9=window.TopkeyUpgrade9,Up17=window.TopkeyUpgrade17;
if(!T||!App||!U||App.__upgrade20Installed)return;
App.__upgrade20Installed=true;
const $=id=>document.getElementById(id);
const TERMINAL=new Set(['FINISHED','CANCELLED','WALKOVER','RETIRED','DISQUALIFIED']);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const nameMatches=(a,b)=>{a=fold(a);b=fold(b);if(!a||!b)return false;if(a===b)return true;return Math.min(a.length,b.length)>=2&&(a.includes(b)||b.includes(a));};
const localISO=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const fmtDate=v=>{const p=String(v||'').split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:String(v||'')};
const toMin=t=>{const[a,b]=String(t||'00:00').split(':').map(Number);return(a||0)*60+(b||0)};
const minToTime=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
const participants=m=>[m.teamAId,m.teamBId].filter(Boolean);
const teamPeople=id=>{const t=App.state.teams?.[id]||{};return [t.p1,t.p2].filter(Boolean);};
const matchPeople=m=>[...new Set(participants(m).flatMap(teamPeople))];
const matchSearch=m=>{const a=App.state.teams?.[m.teamAId]||{},b=App.state.teams?.[m.teamBId]||{};return fold([m.code,m.category,m.stage,a.code,a.name,a.p1,a.p2,a.dept,b.code,b.name,b.p1,b.p2,b.dept].join(' '));};
const matchSort=(a,b)=>String(a.date||'9999-99-99').localeCompare(String(b.date||'9999-99-99'))||String(a.time||'99:99').localeCompare(String(b.time||'99:99'))||String(a.courtId||'').localeCompare(String(b.courtId||''))||String(a.code||a.id).localeCompare(String(b.code||b.id));
function schedulerCfg(){
  const s=App.state.config?.scheduler||{};
  const base=typeof App.schedulerConfig==='function'?App.schedulerConfig():{};
  return {...base,playerBusy:Array.isArray(s.playerBusy)?s.playerBusy:(base.playerBusy||[]),playerTimeWindows:Array.isArray(s.playerTimeWindows)?s.playerTimeWindows:[]};
}
async function saveScheduler(cfg,type){
  if(typeof App.saveSchedulerConfig==='function')return App.saveSchedulerConfig(cfg,type);
  const before=App.state.config||{},after={...before,scheduler:cfg,updatedAt:Date.now()};
  await T.Data.queueSet('config',after,{type});
}
function ensureUmpireFilters(){
  const page=$('page-umpire'),form=page?.querySelector('.card > .form-grid');if(!form)return;
  if(!$('tk20-umpire-date')){
    const date=document.createElement('div');date.className='field tk20-umpire-filter';date.innerHTML='<label>Ngày thi đấu</label><select id="tk20-umpire-date"></select>';
    const search=document.createElement('div');search.className='field tk20-umpire-filter tk20-umpire-search';search.innerHTML='<label>🔎 Tìm đội / VĐV / mã trận</label><input id="tk20-umpire-search" type="search" autocomplete="off" placeholder="VD: BẮC, VIỆT, Đội 8, MEN_G27...">';
    form.insertBefore(date,form.firstChild);form.insertBefore(search,date.nextSibling);
    $('tk20-umpire-date').addEventListener('change',()=>{App.umpireDateFilter=$('tk20-umpire-date').value;renderUmpireMatchOptions();});
    $('tk20-umpire-search').addEventListener('input',U.debounce(()=>{App.umpireSearch=$('tk20-umpire-search').value;renderUmpireMatchOptions();},100));
  }
  if(!$('tk20-umpire-match-count')){
    const sel=$('umpire-match');const note=document.createElement('small');note.id='tk20-umpire-match-count';note.className='tk20-umpire-count';sel?.closest('.field')?.appendChild(note);
  }
}
function pendingMatches(){return Object.values(App.state.matches||{}).filter(m=>!TERMINAL.has(m.status)&&!App.state.teams?.[m.teamAId]?.withdrawn&&!App.state.teams?.[m.teamBId]?.withdrawn).sort(matchSort);}
function renderUmpireDateOptions(){
  ensureUmpireFilters();const sel=$('tk20-umpire-date');if(!sel)return;
  const rows=pendingMatches(),dates=[...new Set(rows.map(m=>m.date).filter(Boolean))].sort(),keep=App.umpireDateFilter??sel.value;
  sel.innerHTML='<option value="ALL">Tất cả ngày · từ sớm đến muộn</option>'+dates.map(d=>`<option value="${esc(d)}">${d===localISO()?'⭐ Hôm nay · ':''}${esc(fmtDate(d))}</option>`).join('');
  if(keep&&[...sel.options].some(o=>o.value===keep))sel.value=keep;else sel.value='ALL';App.umpireDateFilter=sel.value;
}
function renderUmpireMatchOptions(){
  ensureUmpireFilters();const sel=$('umpire-match');if(!sel)return;
  renderUmpireDateOptions();const keep=sel.value||App.selectedMatch||'',date=App.umpireDateFilter||'ALL',q=fold(App.umpireSearch||$('tk20-umpire-search')?.value||'');
  const rows=pendingMatches().filter(m=>(date==='ALL'||m.date===date)&&(!q||matchSearch(m).includes(q)));
  sel.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='-- Chọn trận --';sel.appendChild(empty);
  let lastDate='',dayNo=0;
  for(const m of rows){if((m.date||'')!==lastDate){lastDate=m.date||'';dayNo=0;const group=document.createElement('optgroup');group.label=m.date?`${m.date===localISO()?'⭐ HÔM NAY · ':''}${fmtDate(m.date)}`:'CHƯA XẾP NGÀY';group.dataset.date=m.date||'';sel.appendChild(group);}dayNo++;const group=sel.lastElementChild;const o=document.createElement('option');o.value=m.id;o.textContent=`Trận ${String(dayNo).padStart(2,'0')} · ${m.time||'--:--'} · ${m.code||m.id} · ${App.teamName(m.teamAId)} vs ${App.teamName(m.teamBId)}`;group.appendChild(o);}
  if(keep&&rows.some(m=>m.id===keep))sel.value=keep;else sel.value='';
  const count=$('tk20-umpire-match-count');if(count)count.textContent=`${rows.length} trận phù hợp · sắp theo ngày/giờ tăng dần`;
}
function patchSelectors(){
  const base=App.renderSelectors?.bind(App);if(!base||App.__u20Selectors)return;App.__u20Selectors=true;
  App.renderSelectors=function(){const selected=$('umpire-match')?.value||this.selectedMatch||'';const r=base();ensureUmpireFilters();renderUmpireMatchOptions();if(selected&&pendingMatches().some(m=>m.id===selected))$('umpire-match').value=selected;return r;};
}
function openUmpireForMatch(id){
  const m=App.state.matches?.[id];if(!m)return U.toast('Không tìm thấy trận','err');if(!T.Auth.can?.('umpire'))return U.toast('Tài khoản không có quyền mở màn Trọng tài','err');
  App.umpireDateFilter=m.date||'ALL';App.umpireSearch='';ensureUmpireFilters();if($('tk20-umpire-search'))$('tk20-umpire-search').value='';renderUmpireMatchOptions();
  const matchSel=$('umpire-match');if(matchSel)matchSel.value=id;
  const courtSel=$('umpire-court');const courtId=m.courtId||App.currentCourt||Object.keys(App.state.courts||{})[0]||'';if(courtSel&&courtId)courtSel.value=courtId;
  App.showTab('umpire');if(courtId){App.loadUmpireMatch();U.toast(`Đã load ${m.code||'trận'} vào màn Trọng tài`,'ok');}else U.toast('Đã chọn trận. Vui lòng chọn sân rồi bấm Load trận.','info');
  scrollTo({top:0,behavior:'smooth'});
}
function enhanceSchedule(){
  const box=$('matches-list');if(!box)return;const head=box.closest('table')?.querySelector('thead th:first-child');if(head)head.textContent='STT / Mã';
  let day='',no=0;
  [...box.children].forEach(row=>{
    if(row.classList.contains('tk12-day-row')){day='';no=0;const td=row.firstElementChild;if(td)td.colSpan=9;return;}
    if(!row.classList.contains('tk12-match-row'))return;const code=row.cells?.[0]?.textContent?.trim()||'';const m=(row.dataset.matchId&&App.state.matches?.[row.dataset.matchId])||Object.values(App.state.matches||{}).find(x=>String(x.code||x.id)===code);if(!m)return;
    if((m.date||'')!==day){day=m.date||'';no=0;}no++;row.dataset.matchId=m.id;const codeCell=row.cells[0];codeCell.dataset.dayOrder=String(no);codeCell.classList.add('tk20-order-code');codeCell.title=`Trận ${no} trong ngày ${m.date||'chưa xếp'}`;
    const act=row.lastElementChild;if(act&&!act.querySelector('.tk20-umpire-open')&&T.Auth.can?.('umpire')){const b=document.createElement('button');b.type='button';b.className='btn mini primary tk20-umpire-open';b.textContent='🏸 Trọng tài';b.title=`Load Trận ${no} vào màn Trọng tài`;b.onclick=()=>openUmpireForMatch(m.id);act.insertBefore(b,act.firstChild);}
  });
}
function patchMatches(){const base=App.renderMatches?.bind(App);if(!base||App.__u20Matches)return;App.__u20Matches=true;App.renderMatches=function(){const r=base();enhanceSchedule();return r;};}
function allPlayerNames(){const out=[];Object.values(App.state.teams||{}).filter(t=>!t.withdrawn).forEach(t=>[t.p1,t.p2].forEach(n=>{n=String(n||'').trim();if(n&&!out.some(x=>fold(x)===fold(n)))out.push(n);}));return out.sort((a,b)=>a.localeCompare(b,'vi'));}
function ensureAvailabilityUI(){
  const stack=document.querySelector('#page-schedule .scheduler-rule-stack');if(!stack||$('tk20-player-window-card'))return;
  const card=document.createElement('div');card.id='tk20-player-window-card';card.className='subcard tk20-player-window-card';card.innerHTML=`<h3>⏱ KHUNG GIỜ VĐV CÓ THỂ THI ĐẤU / ƯU TIÊN ĐÁNH SỚM</h3><p class="note">Áp dụng theo <b>tên VĐV</b>, kể cả khi người đó xuất hiện ở nhiều đội/nội dung. Scheduler chỉ xếp trận trong khung giờ hợp lệ; bật “Ưu tiên sớm nhất” để đẩy các trận của VĐV lên slot sớm nhất có thể trong ngày.</p><div class="tk20-window-grid"><div class="field"><label>Tên VĐV</label><input id="tk20-player-window-name" list="tk20-player-names" placeholder="VD: BẮC"><datalist id="tk20-player-names"></datalist></div><div class="field"><label>Từ ngày</label><input id="tk20-player-window-from-date" type="date"></div><div class="field"><label>Đến ngày</label><input id="tk20-player-window-to-date" type="date"></div><div class="field"><label>Từ giờ</label><input id="tk20-player-window-from-time" type="time" value="17:15"></div><div class="field"><label>Đến giờ</label><input id="tk20-player-window-to-time" type="time" value="22:00"></div></div><div class="tk20-window-actions"><label class="check-option"><input id="tk20-player-window-limit" type="checkbox" checked> Bắt buộc trong khung giờ trên</label><label class="check-option"><input id="tk20-player-window-early" type="checkbox"> ⭐ Ưu tiên xếp trận sớm nhất có thể trong ngày</label><button id="tk20-player-window-add" class="btn primary" type="button">+ Lưu khung giờ VĐV</button></div><div id="tk20-player-window-list" class="rule-list tall"></div>`;
  const anchor=$('tk9-player-busy-card');if(anchor)anchor.after(card);else stack.appendChild(card);
  $('tk20-player-window-add').onclick=addPlayerWindow;
}
function renderPlayerNames(){const list=$('tk20-player-names');if(list)list.innerHTML=allPlayerNames().map(n=>`<option value="${esc(n)}"></option>`).join('');}
function renderPlayerWindows(){
  ensureAvailabilityUI();renderPlayerNames();const cfg=schedulerCfg(),box=$('tk20-player-window-list');if(!box)return;box.innerHTML='';
  (cfg.playerTimeWindows||[]).forEach((r,i)=>{const row=document.createElement('div');row.className='tk20-window-row';const mode=r.enforceWindow!==false?`${r.fromTime||'00:00'}–${r.toTime||'23:59'}`:'không khóa giờ';row.innerHTML=`<span><b>👤 ${esc(r.name)}</b><small>${esc(fmtDate(r.fromDate))} → ${esc(fmtDate(r.toDate))} · ${esc(mode)}${r.preferEarliest?' · ⭐ ưu tiên sớm nhất':''}</small></span>`;const del=document.createElement('button');del.type='button';del.className='btn mini danger';del.textContent='×';del.title='Xóa quy tắc';del.onclick=()=>removePlayerWindow(i);row.appendChild(del);box.appendChild(row);});
  if(!box.children.length)box.innerHTML='<span class="muted">Chưa cài khung giờ riêng cho VĐV.</span>';
  const from=$('tk20-player-window-from-date'),to=$('tk20-player-window-to-date');if(from&&!from.value)from.value=$('auto-date')?.value||localISO();if(to&&!to.value)to.value=$('auto-end-date')?.value||from?.value||localISO();
}
async function addPlayerWindow(){
  const name=$('tk20-player-window-name')?.value.trim(),fromDate=$('tk20-player-window-from-date')?.value,toDate=$('tk20-player-window-to-date')?.value||fromDate,fromTime=$('tk20-player-window-from-time')?.value||'00:00',toTime=$('tk20-player-window-to-time')?.value||'23:59',enforceWindow=$('tk20-player-window-limit')?.checked!==false,preferEarliest=!!$('tk20-player-window-early')?.checked;
  if(!name||!fromDate||!toDate||toDate<fromDate)return U.toast('Nhập tên VĐV và khoảng ngày hợp lệ','err');if(enforceWindow&&toMin(toTime)<=toMin(fromTime))return U.toast('Giờ kết thúc phải sau giờ bắt đầu','err');if(!enforceWindow&&!preferEarliest)return U.toast('Chọn ít nhất: giới hạn khung giờ hoặc ưu tiên đánh sớm','err');
  const known=allPlayerNames().some(n=>nameMatches(n,name));if(!known&&!confirm(`Không tìm thấy “${name}” trong danh sách VĐV hiện tại. Vẫn lưu quy tắc theo tên này?`))return;
  const cfg=schedulerCfg();cfg.playerTimeWindows=Array.isArray(cfg.playerTimeWindows)?cfg.playerTimeWindows:[];const row={name,fromDate,toDate,fromTime,toTime,enforceWindow,preferEarliest,updatedAt:Date.now()};const i=cfg.playerTimeWindows.findIndex(x=>fold(x.name)===fold(name)&&x.fromDate===fromDate&&x.toDate===toDate);if(i>=0)cfg.playerTimeWindows[i]=row;else cfg.playerTimeWindows.push(row);await saveScheduler(cfg,'SCHED_PLAYER_TIME_WINDOW');renderPlayerWindows();U.toast(`Đã lưu lịch khả dụng của ${name}${preferEarliest?' · ưu tiên đánh sớm':''}`,'ok');
}
async function removePlayerWindow(i){const cfg=schedulerCfg();if(!Array.isArray(cfg.playerTimeWindows)||!cfg.playerTimeWindows[i])return;const name=cfg.playerTimeWindows[i].name;cfg.playerTimeWindows.splice(i,1);await saveScheduler(cfg,'SCHED_PLAYER_TIME_WINDOW_REMOVE');renderPlayerWindows();U.toast(`Đã xóa khung giờ của ${name}`,'ok');}
function playerRulesFor(m,date,cfg){const people=matchPeople(m);return (cfg.playerTimeWindows||[]).filter(r=>r?.name&&date>=String(r.fromDate||'')&&date<=String(r.toDate||'')&&people.some(p=>nameMatches(p,r.name)));}
function windowAllows(m,date,st,en,cfg){const rs=playerRulesFor(m,date,cfg).filter(r=>r.enforceWindow!==false);return rs.every(r=>st>=toMin(r.fromTime||'00:00')&&en<=toMin(r.toTime||'23:59'));}
function earlyWeight(m,date,cfg){return playerRulesFor(m,date,cfg).filter(r=>r.preferEarliest).length;}
function patchScheduler(){
  if(App.__u20Scheduler)return;App.__u20Scheduler=true;
  App.buildSchedulePlan=function(){
    const input={category:$('adv-category')?.value||'ALL',from:$('auto-date')?.value,to:$('auto-end-date')?.value,start:$('auto-time')?.value||'08:00',interval:Math.max(5,Number($('auto-interval')?.value)||35),maxDay:Math.max(1,Number($('auto-max-day')?.value)||24),includeSunday:$('auto-sunday')?.checked!==false,reschedule:$('auto-reschedule')?.checked!==false};
    if(!input.from||!input.to||input.to<input.from)throw new Error('Khoảng ngày không hợp lệ');
    const cfg=schedulerCfg(),locked=new Set(cfg.lockedDates||[]),dateRange=Up9?.dateRange?.bind(Up9)||App.dateRange?.bind(App),dates=dateRange(input.from,input.to,input.includeSunday).filter(d=>!locked.has(d)),courts=Object.values(App.state.courts||{}).sort((a,b)=>(a.name||'').localeCompare(b.name||''));
    if(!dates.length||!courts.length)throw new Error('Không có ngày hoặc sân/khu khả dụng');
    const rules={...T.DEFAULT_RULES,...App.state.config?.rules},dur=Math.max(5,Number(rules.estimatedMatchMinutes)||input.interval),rest=Math.max(0,Number(rules.minRestMinutes)||0),start=toMin(input.start),matches=Object.values(App.state.matches||{}),protectedStatus=new Set(['LIVE','FINISHED','WALKOVER','RETIRED','DISQUALIFIED','SUSPENDED','CANCELLED']),activeIds=new Set(Object.values(App.state.activeMatches||{}).filter(Boolean).map(x=>x.matchId)),catOf=m=>App.normalizeCategory?App.normalizeCategory(m.category):m.category,eligible=m=>(input.category==='ALL'||catOf(m)===input.category)&&!protectedStatus.has(m.status)&&!activeIds.has(m.id)&&!App.state.teams?.[m.teamAId]?.withdrawn&&!App.state.teams?.[m.teamBId]?.withdrawn,target=matches.filter(m=>eligible(m)&&(!m.date||(input.reschedule&&m.date>=input.from&&m.date<=input.to&&!locked.has(m.date))||(!m.time||!m.courtId))),targetIds=new Set(target.map(m=>m.id)),fixed=matches.filter(m=>!targetIds.has(m.id)&&m.date&&m.time&&m.courtId&&m.status!=='CANCELLED');
    if(!target.length)throw new Error('Không có lịch chưa đấu phù hợp để xếp');
    const occCourt={},occTeam={},occPerson={},dayCount={},teamDay={},key=(d,id)=>d+'|'+id,people=m=>matchPeople(m).map(fold).filter(Boolean),add=(m,d,t,cid)=>{const st=toMin(t),en=st+dur;dayCount[d]=(dayCount[d]||0)+1;participants(m).forEach(id=>{(occTeam[key(d,id)]??=[]).push([st,en]);teamDay[key(d,id)]=(teamDay[key(d,id)]||0)+1});people(m).forEach(n=>(occPerson[key(d,n)]??=[]).push([st,en]));(occCourt[key(d,cid)]??=[]).push([st,en])};fixed.forEach(m=>add(m,m.date,m.time,m.courtId));
    const busyTeam=(id,d)=>(cfg.busy||[]).some(x=>x.teamId===id&&x.date===d),busyPerson=(m,d)=>{const ps=matchPeople(m);return(cfg.playerBusy||[]).some(x=>x.date===d&&ps.some(p=>nameMatches(p,x.name)))},limit=(id,d)=>{const xs=(cfg.limits||[]).filter(x=>x.teamId===id&&d>=x.from&&d<=x.to);return xs.length?Math.min(4,Math.max(...xs.map(x=>Number(x.max)||1))):1},windowPriority=(m,d)=>participants(m).reduce((n,id)=>n+((cfg.priority||[]).some(x=>x.teamId===id&&d>=x.from&&d<=x.to)?1:0),0),specialOrder=(m,d)=>{const orders=[];participants(m).forEach(id=>(cfg.limits||[]).forEach((r,idx)=>{if(r.teamId===id&&r.from===d&&r.to===d&&Number(r.max)>1)orders.push(Number(r.priorityOrder)||idx+1)}));return orders.length?Math.min(...orders):Infinity},overlap=(arr,st,en,gap=0)=>(arr||[]).some(([a,b])=>st<b+gap&&en+gap>a),bestSpecial=m=>Math.min(...dates.map(d=>specialOrder(m,d))),bestWindow=m=>Math.max(...dates.map(d=>windowPriority(m,d))),bestEarly=m=>Math.max(...dates.map(d=>earlyWeight(m,d,cfg)));
    target.sort((a,b)=>bestSpecial(a)-bestSpecial(b)||bestEarly(b)-bestEarly(a)||bestWindow(b)-bestWindow(a)||String(a.code||a.id).localeCompare(String(b.code||b.id)));
    const plan=[],unplaced=[];
    for(const m of target){let best=null;for(let di=0;di<dates.length;di++){const d=dates[di],ids=participants(m),ps=people(m);if(ids.some(id=>busyTeam(id,d))||busyPerson(m,d)||(dayCount[d]||0)>=input.maxDay)continue;if(ids.some(id=>(teamDay[key(d,id)]||0)>=limit(id,d)))continue;for(let slot=0;slot<300;slot++){const st=start+slot*input.interval,en=st+dur;if(en>1440)break;if(!windowAllows(m,d,st,en,cfg))continue;for(const c of courts){if(overlap(occCourt[key(d,c.id)],st,en,0))continue;if(ids.some(id=>overlap(occTeam[key(d,id)],st,en,rest)))continue;const personGap=Math.max(rest,input.interval);if(ps.some(n=>overlap(occPerson[key(d,n)],st,en,personGap)))continue;const order=specialOrder(m,d),specialScore=Number.isFinite(order)?1000000000-order*1000000:0,early=earlyWeight(m,d,cfg),earlyScore=early?50000000-slot*25000:0,teamLoad=ids.reduce((n,id)=>n+(teamDay[key(d,id)]||0),0),idealPerDay=Math.max(1,Math.ceil(target.length/dates.length)),overflowLoad=Math.max(0,(dayCount[d]||0)-idealPerDay+1),score=specialScore+earlyScore+windowPriority(m,d)*100000-overflowLoad*3000-teamLoad*1200-slot*4-di;if(!best||score>best.score)best={date:d,time:minToTime(st),courtId:c.id,score,priorityOrder:Number.isFinite(order)?order:null,earlyPriority:early};}}}if(best){const after={...m,date:best.date,time:best.time,courtId:best.courtId,status:'SCHEDULED',scheduledAt:Date.now(),schedulerVersion:T.VERSION};plan.push({before:m,after,priorityOrder:best.priorityOrder,earlyPriority:best.earlyPriority});add(after,best.date,best.time,best.courtId)}else unplaced.push(m);}
    return{input,plan,unplaced,rest,dur,lockedDates:[...locked],playerBusy:(cfg.playerBusy||[]).length,playerTimeWindows:(cfg.playerTimeWindows||[]).length,specificLimitPriorities:Up17?.priorityRows?Up17.priorityRows(cfg).length:0};
  };
  if(Up9)Up9.buildSchedulePlan=()=>App.buildSchedulePlan();
}
function patchSchedulerRender(){
  const base=App.renderSchedulerControls?.bind(App);if(base&&!App.__u20SchedulerRender){App.__u20SchedulerRender=true;App.renderSchedulerControls=function(){const r=base();renderPlayerWindows();return r;};}
  const baseUp=Up9?.renderSchedulerUpgrade?.bind(Up9);if(baseUp&&!Up9.__u20Render){Up9.__u20Render=true;Up9.renderSchedulerUpgrade=function(...args){const r=baseUp(...args);renderPlayerWindows();return r;};}
}
function install(){ensureUmpireFilters();ensureAvailabilityUI();patchSelectors();patchMatches();patchScheduler();patchSchedulerRender();renderUmpireMatchOptions();renderPlayerWindows();enhanceSchedule();window.TopkeyUpgrade9?.applyPermissionsDom?.();setTimeout(()=>{renderUmpireMatchOptions();renderPlayerWindows();enhanceSchedule();window.TopkeyUpgrade9?.applyPermissionsDom?.();},0);}
install();
window.TopkeyUpgrade20={renderUmpireMatchOptions,openUmpireForMatch,renderPlayerWindows,windowAllows,earlyWeight,schedulerCfg};
})();
