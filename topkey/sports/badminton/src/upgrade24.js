(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade24Installed)return;
App.__upgrade24Installed=true;
const $=id=>document.getElementById(id);
const TERMINAL=new Set(['FINISHED','CANCELLED','WALKOVER','RETIRED','DISQUALIFIED']);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const tokens=v=>fold(v).split(/\s+/).filter(Boolean);
function primitiveText(value,depth=0){
  if(value==null||depth>4)return'';
  if(['string','number','boolean'].includes(typeof value))return String(value);
  if(Array.isArray(value))return value.map(x=>primitiveText(x,depth+1)).join(' ');
  if(typeof value==='object')return Object.entries(value).filter(([k])=>!['createdAt','updatedAt','checkInAt'].includes(k)).map(([,v])=>primitiveText(v,depth+1)).join(' ');
  return'';
}
function matchHaystack(m){
  if(!m)return'';
  const a=App.state.teams?.[m.teamAId]||{},b=App.state.teams?.[m.teamBId]||{},court=App.state.courts?.[m.courtId]||{};
  return fold([primitiveText(m),primitiveText(a),primitiveText(b),primitiveText(court),App.teamName?.(m.teamAId)||'',App.teamName?.(m.teamBId)||''].join(' '));
}
function matchPass(m,q){const qs=tokens(q);if(!qs.length)return true;const hay=matchHaystack(m);return qs.every(x=>hay.includes(x));}
function matchSort(a,b){return String(a.date||'9999-99-99').localeCompare(String(b.date||'9999-99-99'))||String(a.time||'99:99').localeCompare(String(b.time||'99:99'))||String(a.courtId||'').localeCompare(String(b.courtId||''))||String(a.code||a.id||'').localeCompare(String(b.code||b.id||''));}
function localISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function fmtDate(v){const p=String(v||'').split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:String(v||'');}
function pendingMatches(){return Object.values(App.state.matches||{}).filter(m=>!TERMINAL.has(m.status)&&!App.state.teams?.[m.teamAId]?.withdrawn&&!App.state.teams?.[m.teamBId]?.withdrawn).sort(matchSort);}

function hardScrollTop(){
  try{if('scrollRestoration' in history)history.scrollRestoration='manual';}catch{}
  const run=()=>{
    const page=$('page-umpire');
    try{page?.scrollIntoView({block:'start',inline:'nearest',behavior:'auto'});}catch{}
    try{window.scrollTo(0,0);}catch{}
    try{document.documentElement.scrollTop=0;}catch{}
    try{document.body.scrollTop=0;}catch{}
  };
  run();
  requestAnimationFrame(()=>{run();requestAnimationFrame(run);});
  setTimeout(run,0);setTimeout(run,80);setTimeout(run,240);
}
function installUmpireTopReset(){
  if(window.TopkeyUmpireRuntime?.installed)return;
  const boundary=window.TopkeyUIBoundary;if(boundary&&!App.__u24ShowTab){App.__u24ShowTab=true;boundary.onTab?.(({tab})=>{if(tab==='umpire')hardScrollTop()},'u24:umpire:scroll-top');addEventListener('pageshow',()=>{if(App.currentTab==='umpire'&&!$('page-umpire')?.classList.contains('hidden'))hardScrollTop();},{passive:true});return}
  const base=App.showTab?.bind(App);if(!base||App.__u24ShowTab)return;App.__u24ShowTab=true;
  App.showTab=function(tab,...args){const out=base(tab,...args);if(tab==='umpire')hardScrollTop();return out;};
  addEventListener('pageshow',()=>{if(App.currentTab==='umpire'&&!$('page-umpire')?.classList.contains('hidden'))hardScrollTop();});
}

function ensureUmpireSearchBinding(){
  const input=$('tk20-umpire-search');if(!input)return;
  if(input.dataset.u24Bound==='1')return;input.dataset.u24Bound='1';
  const run=()=>{App.umpireSearch=input.value||'';renderUmpireMatchOptions24();};
  input.addEventListener('input',run);input.addEventListener('search',run);input.addEventListener('change',run);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run();}});
  const date=$('tk20-umpire-date');if(date&&date.dataset.u24Bound!=='1'){date.dataset.u24Bound='1';date.addEventListener('change',()=>{App.umpireDateFilter=date.value||'ALL';renderUmpireMatchOptions24();});}
}
function renderUmpireMatchOptions24(){
  const sel=$('umpire-match'),input=$('tk20-umpire-search'),dateSel=$('tk20-umpire-date');if(!sel)return;
  ensureUmpireSearchBinding();
  const keep=sel.value||App.selectedMatch||'',q=input?.value??App.umpireSearch??'',date=dateSel?.value||App.umpireDateFilter||'ALL';
  App.umpireSearch=q;App.umpireDateFilter=date;
  const rows=pendingMatches().filter(m=>(date==='ALL'||m.date===date)&&matchPass(m,q));
  sel.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='-- Chọn trận --';sel.appendChild(empty);
  let lastDate='',dayNo=0,group=null;
  for(const m of rows){
    if((m.date||'')!==lastDate){lastDate=m.date||'';dayNo=0;group=document.createElement('optgroup');group.label=m.date?`${m.date===localISO()?'⭐ HÔM NAY · ':''}${fmtDate(m.date)}`:'CHƯA XẾP NGÀY';group.dataset.date=m.date||'';sel.appendChild(group);}
    dayNo++;const o=document.createElement('option');o.value=m.id;o.dataset.search=matchHaystack(m);o.textContent=`Trận ${String(dayNo).padStart(2,'0')} · ${m.time||'--:--'} · ${m.code||m.id} · ${App.teamName(m.teamAId)} vs ${App.teamName(m.teamBId)}`;(group||sel).appendChild(o);
  }
  if(keep&&rows.some(m=>m.id===keep))sel.value=keep;else sel.value='';
  const count=$('tk20-umpire-match-count');if(count)count.textContent=q?`Tìm thấy ${rows.length} trận phù hợp · tên/VĐV/mã trận`:`${rows.length} trận phù hợp · sắp theo ngày/giờ tăng dần`;
  if(input){input.setAttribute('aria-controls','umpire-match');input.setAttribute('aria-label','Tìm trận theo tên đội, vận động viên hoặc mã trận');}
}
function installUmpireSearch(){
  const baseSelectors=App.renderSelectors?.bind(App);if(baseSelectors&&!App.__u24Selectors){App.__u24Selectors=true;App.renderSelectors=function(...args){const out=baseSelectors(...args);setTimeout(()=>{ensureUmpireSearchBinding();renderUmpireMatchOptions24();},0);return out;};}
  ensureUmpireSearchBinding();renderUmpireMatchOptions24();
}

function matchFromAdminRow(row){
  const id=row?.dataset?.matchId;if(id&&App.state.matches?.[id])return App.state.matches[id];
  const code=row?.cells?.[0]?.textContent?.trim()||'';return Object.values(App.state.matches||{}).find(m=>String(m.code||m.id||'').trim()===code)||null;
}
function applyAdminSearch24(){
  const box=$('matches-list'),input=$('tk16-admin-search-input');if(!box||!input)return;
  const q=input.value||'';App.scheduleSearch=q;box.querySelector('#tk24-admin-empty')?.remove();
  let header=null,visible=0,total=0,shown=0,all=0;
  const finish=()=>{if(header)header.hidden=!!fold(q)&&visible===0;};
  [...box.children].forEach(row=>{
    if(row.classList.contains('tk12-day-row')){finish();header=row;visible=0;total=0;return;}
    if(!row.classList.contains('tk12-match-row'))return;total++;all++;const m=matchFromAdminRow(row),ok=!fold(q)||(m&&matchPass(m,q));row.hidden=!ok;if(ok){visible++;shown++;}
  });finish();
  const count=$('tk16-admin-search-count');if(count)count.textContent=fold(q)?`Tìm thấy ${shown}/${all} trận`:`${all} trận trong lịch`;
  if(fold(q)&&shown===0){const tr=document.createElement('tr');tr.id='tk24-admin-empty';const td=document.createElement('td');td.colSpan=9;td.className='tk12-empty';td.textContent='Không tìm thấy trận theo tên đội / VĐV / mã trận.';tr.appendChild(td);box.appendChild(tr);}
}
function bindAdminSearch24(){
  const input=$('tk16-admin-search-input');if(!input||input.dataset.u24Bound==='1')return;input.dataset.u24Bound='1';
  const run=()=>applyAdminSearch24();input.addEventListener('input',run);input.addEventListener('search',run);input.addEventListener('change',run);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run();}});
  const btn=$('tk16-admin-search-btn');if(btn)btn.addEventListener('click',run);
  const clear=$('tk16-admin-search-clear');if(clear)clear.addEventListener('click',()=>setTimeout(applyAdminSearch24,0));
}
function matchFromPublicCard(el){
  const id=el?.dataset?.matchId;if(id&&App.state.matches?.[id])return App.state.matches[id];
  const code=el?.querySelector('.tk12-match-code')?.textContent?.trim()||'';return Object.values(App.state.matches||{}).find(m=>String(m.code||m.id||'').trim()===code)||null;
}
function applyPublicSearch24(){
  const sched=$('spectator-schedule'),input=$('tk16-public-search-input');if(!sched||!input)return;
  const q=input.value||'';App.publicScheduleSearch=q;sched.querySelector('.tk24-public-empty')?.remove();let header=null,visible=0,total=0,shown=0,all=0;
  const finish=()=>{if(header)header.hidden=!!fold(q)&&visible===0;};
  [...sched.children].forEach(el=>{
    if(el.classList.contains('tk12-public-day')){finish();header=el;visible=0;total=0;return;}
    if(!el.classList.contains('tk12-public-match'))return;total++;all++;const m=matchFromPublicCard(el),ok=!fold(q)||(m&&matchPass(m,q));el.hidden=!ok;if(ok){visible++;shown++;}
  });finish();
  const count=$('tk16-public-search-count');if(count)count.textContent=fold(q)?`Tìm thấy ${shown}/${all} trận`:`${all} trận trong lịch`;
  if(fold(q)&&shown===0){const d=document.createElement('div');d.className='empty tk24-public-empty';d.textContent='Không tìm thấy lịch theo tên đội / VĐV / mã trận.';sched.appendChild(d);}
}
function bindPublicSearch24(){
  const input=$('tk16-public-search-input');if(!input||input.dataset.u24Bound==='1')return;input.dataset.u24Bound='1';
  const run=()=>applyPublicSearch24();input.addEventListener('input',run);input.addEventListener('search',run);input.addEventListener('change',run);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run();}});
  $('tk16-public-search-btn')?.addEventListener('click',run);$('tk16-public-search-clear')?.addEventListener('click',()=>setTimeout(applyPublicSearch24,0));
}
function installScheduleSearch(){
  const boundary=window.TopkeyUIBoundary;
  if(boundary){
    if(!App.__u24Matches){App.__u24Matches=true;boundary.afterMatches?.(()=>setTimeout(()=>{bindAdminSearch24();applyAdminSearch24();},0),'u24:schedule:admin-search')}
    if(!App.__u24Spectator){App.__u24Spectator=true;boundary.afterSpectator?.(()=>setTimeout(()=>{bindPublicSearch24();applyPublicSearch24();},0),'u24:schedule:public-search')}
  }else{
    const baseMatches=App.renderMatches?.bind(App);if(baseMatches&&!App.__u24Matches){App.__u24Matches=true;App.renderMatches=function(...args){const out=baseMatches(...args);setTimeout(()=>{bindAdminSearch24();applyAdminSearch24();},0);return out;};}
    const baseSpectator=App.renderSpectator?.bind(App);if(baseSpectator&&!App.__u24Spectator){App.__u24Spectator=true;App.renderSpectator=function(...args){const out=baseSpectator(...args);setTimeout(()=>{bindPublicSearch24();applyPublicSearch24();},0);return out;};}
  }
  bindAdminSearch24();applyAdminSearch24();bindPublicSearch24();applyPublicSearch24();
}

installUmpireTopReset();installUmpireSearch();installScheduleSearch();
setTimeout(()=>{ensureUmpireSearchBinding();renderUmpireMatchOptions24();bindAdminSearch24();applyAdminSearch24();bindPublicSearch24();applyPublicSearch24();if(App.currentTab==='umpire')hardScrollTop();},0);
window.TopkeyUpgrade24={fold,tokens,matchHaystack,matchPass,pendingMatches,hardScrollTop,renderUmpireMatchOptions:renderUmpireMatchOptions24,applyAdminSearch:applyAdminSearch24,applyPublicSearch:applyPublicSearch24};
})();
