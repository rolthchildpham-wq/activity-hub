(() => {
'use strict';
const T=window.Topkey,App=T?.App;
if(!T||!App)return;
const $=id=>document.getElementById(id);
const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/\s+/g,' ').trim();
function primitiveText(value,depth=0){
  if(value==null||depth>5)return'';
  if(['string','number','boolean'].includes(typeof value))return String(value);
  if(Array.isArray(value))return value.map(x=>primitiveText(x,depth+1)).join(' ');
  if(typeof value==='object')return Object.entries(value).filter(([k])=>!['createdAt','updatedAt','checkInAt'].includes(k)).map(([,v])=>primitiveText(v,depth+1)).join(' ');
  return'';
}
function matchSearchText(app,m){
  const a=app.state.teams?.[m.teamAId]||{},b=app.state.teams?.[m.teamBId]||{};
  const label=typeof app.matchLabel==='function'?app.matchLabel(m):`${app.teamName?.(m.teamAId)||''} ${app.teamName?.(m.teamBId)||''}`;
  return fold([primitiveText(m),label,primitiveText(a),primitiveText(b)].join(' '));
}
function matchPass(app,m,q){const needle=fold(q);return !needle||matchSearchText(app,m).includes(needle);}
function findMatchByCode(app,code){return Object.values(app.state.matches||{}).find(m=>String(m.code||m.id||'')===String(code||''));}
function adminSearchUI(){
  const box=$('matches-list');if(!box)return null;
  const card=box.closest('.card');if(!card)return null;
  let bar=$('tk16-admin-search');
  if(!bar){
    bar=document.createElement('div');bar.id='tk16-admin-search';bar.className='tk16-searchbar';
    bar.innerHTML=`<div class="field tk16-search-field"><label>🔎 Tìm lịch theo tên VĐV / đội</label><input id="tk16-admin-search-input" type="search" autocomplete="off" placeholder="VD: BẮC, VIỆT, KHÁNH LINH, Đội 8, MEN_G27..."></div><button id="tk16-admin-search-btn" type="button" class="btn primary">🔎 Tìm</button><button id="tk16-admin-search-clear" type="button" class="btn">× Xóa tìm</button><span id="tk16-admin-search-count" class="tk16-search-count"></span>`;
    const wrap=card.querySelector('.table-wrap');card.insertBefore(bar,wrap);
    const input=$('tk16-admin-search-input');
    const run=()=>{App.scheduleSearch=input.value;applyAdminFilter(App)};
    input.addEventListener('input',run);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run()}});
    $('tk16-admin-search-btn').onclick=run;
    $('tk16-admin-search-clear').onclick=()=>{input.value='';App.scheduleSearch='';applyAdminFilter(App);input.focus()};
  }
  const input=$('tk16-admin-search-input');if(input&&document.activeElement!==input&&input.value!==(App.scheduleSearch||''))input.value=App.scheduleSearch||'';
  return bar;
}
function finalizeAdminGroup(header,visible,total,q){
  if(!header)return;header.hidden=!!q&&visible===0;
  if(q){const span=header.querySelector('.tk12-day-head span');if(span)span.textContent=`${visible}/${total} trận phù hợp`;}
}
function applyAdminFilter(app){
  adminSearchUI();const box=$('matches-list');if(!box)return;
  box.querySelector('#tk16-admin-empty')?.remove();
  const q=fold(app.scheduleSearch||$('tk16-admin-search-input')?.value||'');let header=null,visible=0,total=0,shown=0,all=0;
  [...box.children].forEach(row=>{
    if(row.classList.contains('tk12-day-row')){finalizeAdminGroup(header,visible,total,q);header=row;visible=0;total=0;return;}
    if(!row.classList.contains('tk12-match-row'))return;
    total++;all++;const code=row.cells?.[0]?.textContent||'',m=findMatchByCode(app,code),ok=!q||!!m&&matchPass(app,m,q);row.hidden=!ok;if(ok){visible++;shown++;}
  });
  finalizeAdminGroup(header,visible,total,q);
  const count=$('tk16-admin-search-count');if(count)count.textContent=q?`Tìm thấy ${shown}/${all} trận`:`${all} trận trong lịch`;
  if(q&&shown===0){const tr=document.createElement('tr');tr.id='tk16-admin-empty';const td=document.createElement('td');td.colSpan=9;td.className='tk12-empty';td.textContent='Không tìm thấy trận có VĐV/đội phù hợp.';tr.appendChild(td);box.appendChild(tr);}
}
function publicSearchUI(){
  const sched=$('spectator-schedule');if(!sched)return null;const card=sched.closest('.card');if(!card)return null;
  let bar=$('tk16-public-search');
  if(!bar){
    bar=document.createElement('div');bar.id='tk16-public-search';bar.className='tk16-searchbar tk16-public-searchbar';
    bar.innerHTML=`<div class="field tk16-search-field"><label>🔎 Tìm lịch của VĐV / đội</label><input id="tk16-public-search-input" type="search" autocomplete="off" placeholder="Nhập tên VĐV hoặc tên đội..."></div><button id="tk16-public-search-btn" type="button" class="btn primary">🔎 Tìm</button><button id="tk16-public-search-clear" type="button" class="btn">× Xóa tìm</button><span id="tk16-public-search-count" class="tk16-search-count"></span>`;
    card.insertBefore(bar,sched);
    const input=$('tk16-public-search-input');const run=()=>{App.publicScheduleSearch=input.value;applyPublicFilter(App)};
    input.addEventListener('input',run);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run()}});
    $('tk16-public-search-btn').onclick=run;$('tk16-public-search-clear').onclick=()=>{input.value='';App.publicScheduleSearch='';applyPublicFilter(App);input.focus()};
  }
  const input=$('tk16-public-search-input');if(input&&document.activeElement!==input&&input.value!==(App.publicScheduleSearch||''))input.value=App.publicScheduleSearch||'';
  return bar;
}
function finalizePublicGroup(header,visible,total,q){
  if(!header)return;header.hidden=!!q&&visible===0;
  if(q){const span=header.querySelector('span');if(span)span.textContent=`${visible}/${total} trận phù hợp`;}
}
function applyPublicFilter(app){
  publicSearchUI();const sched=$('spectator-schedule');if(!sched)return;
  sched.querySelector('.tk16-search-empty')?.remove();
  const q=fold(app.publicScheduleSearch||$('tk16-public-search-input')?.value||'');let header=null,visible=0,total=0,shown=0,all=0;
  [...sched.children].forEach(el=>{
    if(el.classList.contains('tk12-public-day')){finalizePublicGroup(header,visible,total,q);header=el;visible=0;total=0;return;}
    if(!el.classList.contains('tk12-public-match'))return;
    total++;all++;const code=el.querySelector('.tk12-match-code')?.textContent||'',m=findMatchByCode(app,code),ok=!q||!!m&&matchPass(app,m,q);el.hidden=!ok;if(ok){visible++;shown++;}
  });
  finalizePublicGroup(header,visible,total,q);
  const count=$('tk16-public-search-count');if(count)count.textContent=q?`Tìm thấy ${shown}/${all} trận`:`${all} trận trong lịch`;
  if(q&&shown===0){const d=document.createElement('div');d.className='empty tk16-search-empty';d.textContent='Không tìm thấy lịch của VĐV/đội này.';sched.appendChild(d);}
}
function install(){
  if(App.__upgrade16SearchInstalled)return;App.__upgrade16SearchInstalled=true;
  const baseMatches=App.renderMatches?.bind(App);if(baseMatches)App.renderMatches=function(){const r=baseMatches();adminSearchUI();applyAdminFilter(this);return r;};
  const baseSpectator=App.renderSpectator?.bind(App);if(baseSpectator)App.renderSpectator=function(){const r=baseSpectator();publicSearchUI();applyPublicFilter(this);return r;};
  setTimeout(()=>{adminSearchUI();applyAdminFilter(App);if(location.hash==='#spectator'){publicSearchUI();applyPublicFilter(App)}},0);
}
install();
window.TopkeyUpgrade16={fold,matchPass,applyAdminFilter,applyPublicFilter};
})();
