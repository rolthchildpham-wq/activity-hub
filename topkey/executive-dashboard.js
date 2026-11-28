(()=>{'use strict';
const AUTH_ROOT='topkey_badminton_vnext_2026';
const VERSION=window.TopkeyRelease?.version||'UNAVAILABLE_RELEASE_RUNTIME';
const SPORTS=[
 {key:'badminton',name:'Cầu lông',icon:'🏸',root:'topkey_badminton_vnext_2026'},
 {key:'football',name:'Bóng đá',icon:'⚽',root:'topkey_football_vnext_2026'},
 {key:'volleyball',name:'Bóng chuyền',icon:'🏐',root:'topkey_volleyball_vnext_2026'},
 {key:'running',name:'Chạy bộ',icon:'🏃',root:'topkey_running_vnext_2026'},
 {key:'handmade',name:'DIY / Handmade',icon:'🧶',root:'topkey_handmade_vnext_2026'},
 {key:'shuttle',name:'Đá cầu',icon:'🪶',root:'topkey_shuttle_vnext_2026'},
 {key:'cooking',name:'Nấu ăn',icon:'👨‍🍳',root:'topkey_cooking_vnext_2026'}
];
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('vi-VN').format(Number(n)||0)+' ₫';
const yearOf=v=>{if(!v)return null;if(typeof v==='number'){const d=new Date(v);return isNaN(d)?null:d.getFullYear()}const m=String(v).match(/(20\d{2}|19\d{2})/);return m?Number(m[1]):null};
const obj=v=>v&&typeof v==='object'?v:{}; const arr=v=>Object.values(obj(v));
function roleKey(v){return String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]+/g,'_')}
function mode(profile){const r=roleKey(profile?.role);if(r==='ADMIN')return'edit';const p=profile?.permissions||{};const vals=[p.modules?.executiveDashboard,p.details?.['executiveDashboard:view'],p.details?.['dashboard:executive']].map(x=>String(x||'').toLowerCase());for(const v of vals){if(v==='view')return'view';if(v==='edit')return r==='BTC'?'view':'edit'}return r==='BTC'?'view':'none'}
function normName(s){return String(s||'').trim().toLocaleLowerCase('vi-VN').replace(/\s+/g,' ')}
function addPerson(set,v){const x=String(v||'').trim();if(x&&x.length>1&&!/^(hlv|đại diện|coach|manager)$/i.test(x))set.add(normName(x))}
function participantNames(t){const out=[];['p1','p2','player1','player2','captain','athlete'].forEach(k=>{if(t?.[k])out.push(t[k])});if(!out.length&&t?.name)out.push(t.name);for(const k of ['players','roster','members']){const v=t?.[k];if(Array.isArray(v))v.forEach(x=>out.push(typeof x==='string'?x:(x?.name||x?.fullName||'')));else if(v&&typeof v==='object')Object.values(v).forEach(x=>out.push(typeof x==='string'?x:(x?.name||x?.fullName||'')))}return out}
function tournamentDate(t){const c=obj(t.config),m=arr(t.matches);const y=yearOf(c.closedAt)||yearOf(c.updatedAt)||yearOf(c.createdAt)||yearOf(t.meta?.createdAt)||Math.min(...m.map(x=>yearOf(x.date)).filter(Boolean),9999);return y===9999?null:y}
function championRows(t,sportName){const c=obj(t.config),top=c.finalTop3||c.top3||{};const out=[];for(const [cat,rows0] of Object.entries(obj(top))){const rows=Array.isArray(rows0)?rows0:arr(rows0);const r=rows[0];if(!r)continue;const team=obj(t.teams)[r.id||r.teamId]||{};out.push({sport:sportName,category:cat,name:r.name||r.teamName||team.name||team.p1||'—'})}return out}
function financeStats(t){let income=0,expense=0,pending=0;arr(t.finance).forEach(r=>{const a=Number(r.amount)||0;if(String(r.type).toUpperCase()==='INCOME')income+=a;else expense+=a;if(!['PAID','DONE','COMPLETED'].includes(String(r.status||'').toUpperCase()))pending++});return{income,expense,balance:income-expense,pending}}
function tournamentTitle(t,tid,sport){return t?.config?.title||t?.title||`${sport} · ${tid}`}
async function readRaw(db){
 const out={};SPORTS.forEach(s=>out[s.key]={});out.__liveCalendarEvents=[];
 let idx={};try{idx=(await db.ref(AUTH_ROOT+'/tournamentIndex').once('value')).val()||{}}catch(e){console.warn('Executive tournamentIndex read',e)}
 for(const s of SPORTS){
  const rows=obj(idx[s.key]);
  for(const [tid,e0] of Object.entries(rows)){
   const e=obj(e0),r=obj(e.finalReport),teams=Array.isArray(r.teams)?Object.fromEntries(r.teams.map((x,i)=>[x.id||('t'+i),x])):obj(r.teams),matches=Array.isArray(r.matches)?Object.fromEntries(r.matches.map((x,i)=>[x.id||('m'+i),x])):obj(r.matches),finRows=Array.isArray(r.finance?.rows)?Object.fromEntries(r.finance.rows.map((x,i)=>[x.id||('f'+i),x])):obj(r.finance?.rows);
   out[s.key][tid]={config:{title:e.title||r.title||'',closedAt:e.closedAt||e.reportGeneratedAt||r.generatedAt||0,createdAt:e.createdAt||r.generatedAt||0,finalTop3:r.top4||{}},meta:{createdAt:e.createdAt||r.generatedAt||0},teams,matches,finance:finRows,title:e.title||r.title||''};
  }
  // The archive index contains only closed/final reports. Read the current
  // sport-scoped schedule separately so upcoming Saturday fixtures are visible.
  try{
   const results=await Promise.all([
    db.ref(s.root+'/matches').once('value'),
    db.ref(s.root+'/teams').once('value'),
    db.ref(s.root+'/config').once('value')
   ]);
   const liveMatches=obj(results[0].val()),liveTeams=obj(results[1].val()),liveConfig=obj(results[2].val()),archivedIds=new Set(Object.values(out[s.key]).flatMap(t=>Object.keys(obj(t.matches))));
   for(const [id,m0] of Object.entries(liveMatches)){
    const m=obj(m0),date=String(m.date||'').slice(0,10),status=String(m.status||'SCHEDULED').toUpperCase();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||status==='CANCELLED'||archivedIds.has(id))continue;
    const teamA=obj(liveTeams[m.teamAId]),teamB=obj(liveTeams[m.teamBId]),a=teamA.name||teamA.teamName||teamA.p1||m.participantName||'',b=teamB.name||teamB.teamName||teamB.p1||'';
    const label=[m.code||'Trận',a,b?('vs '+b):''].filter(Boolean).join(' · ');
    out.__liveCalendarEvents.push({date,time:String(m.time||''),sport:s.name,icon:s.icon,title:liveConfig.title||s.name,label,status,matchId:id});
   }
  }catch(e){console.warn('Executive live schedule read '+s.key,e)}
 }
 return out;
}
function compute(raw,meta){const clubs=[],years={},allPeople=new Set(),champions=[],events=[],calendarEvents=[...(raw.__liveCalendarEvents||[])];let totalEntries=0,totalIncome=0,totalExpense=0,totalPending=0;
 for(const s of SPORTS){const tournaments=obj(raw[s.key]),cm=obj(meta.clubs?.[s.key]),clubPeople=new Set();let cIncome=0,cExpense=0,cPending=0,cEvents=0,lastYear=0,firstYear=9999,cChamps=0;
  for(const [tid,t0] of Object.entries(tournaments)){if(String(tid).startsWith('__testlab_'))continue;const t=obj(t0);if(!Object.keys(t).length)continue;const teams=arr(t.teams);const matches=arr(t.matches);if(!teams.length&&!matches.length&&!arr(t.finance).length&&!t.config)continue;cEvents++;const y=tournamentDate(t);if(y){firstYear=Math.min(firstYear,y);lastYear=Math.max(lastYear,y);years[y]??={events:0,people:new Set(),income:0,expense:0};years[y].events++}
   const eventPeople=new Set();teams.forEach(team=>{participantNames(team).forEach(n=>{addPerson(clubPeople,n);addPerson(allPeople,n);addPerson(eventPeople,n);if(y)addPerson(years[y].people,n)});totalEntries++});
   const fs=financeStats(t);cIncome+=fs.income;cExpense+=fs.expense;cPending+=fs.pending;totalIncome+=fs.income;totalExpense+=fs.expense;totalPending+=fs.pending;if(y){years[y].income+=fs.income;years[y].expense+=fs.expense}
   const eventTitle=tournamentTitle(t,tid,s.name);const ch=championRows(t,s.name);cChamps+=ch.length;ch.forEach(x=>champions.push({...x,tournament:eventTitle,year:y||'—'}));events.push({sport:s.name,icon:s.icon,tid,title:eventTitle,year:y||'—',participants:eventPeople.size||teams.length,teams:teams.length,matches:matches.length,...fs});matches.forEach(match=>{const matchDate=String(match?.date||'').slice(0,10);if(/^\d{4}-\d{2}-\d{2}$/.test(matchDate)){const teamMap=obj(t.teams),a=obj(teamMap[match.teamAId]),b=obj(teamMap[match.teamBId]),label=[match.code||'Trận',a.name||a.teamName||a.p1||match.participantName||'',(b.name||b.teamName||b.p1)?'vs '+(b.name||b.teamName||b.p1):''].filter(Boolean).join(' · ');calendarEvents.push({date:matchDate,time:String(match.time||''),sport:s.name,icon:s.icon,title:eventTitle,label,status:String(match.status||'')})}});
  }
  const founded=Number(cm.foundedYear)|| (firstYear===9999?null:firstYear);clubs.push({key:s.key,name:cm.displayName||`${s.name} Club`,sport:s.name,icon:s.icon,founded,head:cm.headOrganizer||'',events:cEvents,people:clubPeople.size,income:cIncome,expense:cExpense,balance:cIncome-cExpense,pending:cPending,lastYear:lastYear||null,champions:cChamps,active:cm.active!==false});
 }
 const yearSummary={};for(const [y,v] of Object.entries(years))yearSummary[y]={events:v.events,people:v.people.size,income:v.income,expense:v.expense};return{clubs,years:yearSummary,calendarEvents,champions:champions.sort((a,b)=>Number(b.year||0)-Number(a.year||0)),events:events.sort((a,b)=>Number(b.year||0)-Number(a.year||0)),kpi:{clubs:clubs.filter(x=>x.active).length,events:events.length,uniquePeople:allPeople.size,entries:totalEntries,income:totalIncome,expense:totalExpense,balance:totalIncome-totalExpense,pending:totalPending}}}
function renderShell(){const host=$('#executive-dashboard');if(!host)return;host.innerHTML=`<div class="panel exec-dashboard"><div class="exec-head"><div><h2>📊 Dashboard điều hành xã đoàn</h2><div class="muted">Tổng hợp toàn bộ CLB, lịch sử giải, VĐV, thành tích và tài chính cho Ban lãnh đạo.</div></div><div class="exec-actions"><button id="exec-refresh" class="exec-btn primary">↻ Cập nhật dữ liệu</button></div></div><div id="exec-body"><div class="exec-empty">Đang tải dashboard…</div></div><div class="exec-footer-note"><span id="exec-source"></span><span>${VERSION}</span></div></div>`}
function calendarMarkup(items){
 const valid=(Array.isArray(items)?items:[]).filter(item=>/^\d{4}-\d{2}-\d{2}$/.test(String(item.date||'')));
 const today=new Date(),todayKey=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
 const upcoming=valid.map(item=>item.date).filter(date=>date>=todayKey).sort()[0];
 const anchor=upcoming||valid.reduce((latest,item)=>item.date>latest?item.date:latest,'');
 const selected=anchor?new Date(anchor+'T12:00:00'):today;
 const year=selected.getFullYear(),month=selected.getMonth(),firstDay=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate();
 const monthLabel=new Intl.DateTimeFormat('vi-VN',{month:'long',year:'numeric'}).format(selected),monthPrefix=year+'-'+String(month+1).padStart(2,'0')+'-';
 const byDay=new Map();valid.filter(item=>item.date.startsWith(monthPrefix)).forEach(item=>{const rows=byDay.get(item.date)||[];rows.push(item);byDay.set(item.date,rows)});
 const cells=Array.from({length:firstDay},()=>'<div class="exec-calendar-day is-empty" aria-hidden="true"></div>');
 for(let day=1;day<=days;day++){
  const date=monthPrefix+String(day).padStart(2,'0'),rows=byDay.get(date)||[];
  const tags=rows.slice(0,2).map(item=>'<span class="exec-calendar-event" title="'+esc((item.title||item.sport)+' · '+(item.label||'')+(item.time?' · '+item.time:''))+'">'+esc(item.icon+' '+(item.label||item.sport+(item.time?' · '+item.time:'')))+'</span>').join('');
  const more=rows.length>2?'<small class="exec-calendar-more">+'+(rows.length-2)+' trận/hoạt động</small>':'';
  cells.push('<div class="exec-calendar-day'+(rows.length?' has-events':'')+'" data-date="'+date+'"><span class="exec-calendar-date">'+day+'</span>'+tags+more+'</div>');
 }
 const weekdays=['CN','T2','T3','T4','T5','T6','T7'].map(day=>'<span>'+day+'</span>').join('');
 return '<section class="exec-card exec-calendar-card"><div class="exec-calendar-head"><div><h3>📅 Lịch thi đấu và hoạt động các môn</h3><p>Lịch đang diễn ra + lịch sử đã lưu · hiển thị đúng ngày trong tuần</p></div><strong>'+esc(monthLabel)+'</strong></div><div class="exec-calendar-weekdays">'+weekdays+'</div><div class="exec-calendar-grid">'+cells.join('')+'</div>'+(valid.length?'':'<p class="exec-calendar-empty">Chưa có trận có ngày thi đấu trong dữ liệu hiện tại hoặc lịch sử.</p>')+'</section>';
}
function render(data,meta,source){const b=$('#exec-body');if(!b)return;const k=data.kpi, maxEvents=Math.max(1,...data.clubs.map(x=>x.events));const alerts=[];data.clubs.forEach(c=>{if(!c.head)alerts.push({bad:false,text:`${c.icon} ${c.name}: chưa khai báo Trưởng BTC/phụ trách.`});if(!c.founded)alerts.push({bad:false,text:`${c.icon} ${c.name}: chưa có năm thành lập.`});if(c.balance<0)alerts.push({bad:true,text:`${c.icon} ${c.name}: đang âm quỹ ${money(Math.abs(c.balance))}.`});if(c.pending)alerts.push({bad:false,text:`${c.icon} ${c.name}: còn ${c.pending} khoản tài chính chưa hoàn tất.`});});
 const clubRows=data.clubs.filter(x=>x.active).map(c=>`<tr><td data-label="CLB"><span class="exec-sports-title">${c.icon} ${esc(c.name)}</span><br><span class="exec-meta">${esc(c.sport)}</span></td><td data-label="Ra đời">${c.founded||'—'}</td><td data-label="Trưởng BTC">${esc(c.head||'Chưa khai báo')}</td><td data-label="Số giải">${c.events}</td><td data-label="VĐV">${c.people}</td><td data-label="Gần nhất">${c.lastYear||'—'}</td><td data-label="Thu">${money(c.income)}</td><td data-label="Chi">${money(c.expense)}</td><td data-label="Số dư" class="${c.balance<0?'exec-bad':'exec-good'}">${money(c.balance)}</td></tr>`).join('');
 const yearRows=Object.entries(data.years).sort((a,b)=>Number(a[0])-Number(b[0]));const maxYear=Math.max(1,...yearRows.map(([,v])=>v.events));
 const champ=data.champions.slice(0,18).map(x=>`<div class="exec-champ"><b>🏆 ${esc(x.name)}</b><div>${esc(x.sport)} · ${esc(x.category)}</div><div class="exec-meta">${esc(x.tournament)} · ${x.year}</div></div>`).join('')||'<div class="exec-empty">Chưa có dữ liệu nhà vô địch đã chốt.</div>';
 const finance=data.events.slice(0,30).map(e=>`<tr><td data-label="CLB">${e.icon} ${esc(e.sport)}</td><td data-label="Giải">${esc(e.title)}</td><td data-label="Năm">${e.year}</td><td data-label="Thu">${money(e.income)}</td><td data-label="Chi">${money(e.expense)}</td><td data-label="Số dư" class="${e.balance<0?'exec-bad':'exec-good'}">${money(e.balance)}</td><td data-label="Chờ">${e.pending||0}</td></tr>`).join('');
 b.innerHTML=`<div class="exec-kpis"><div class="exec-kpi"><span>CLB đang hoạt động</span><strong>${k.clubs}</strong></div><div class="exec-kpi"><span>Tổng số giải</span><strong>${k.events}</strong></div><div class="exec-kpi"><span>VĐV/đại diện duy nhất</span><strong>${k.uniquePeople}</strong></div><div class="exec-kpi"><span>Lượt hồ sơ tham gia</span><strong>${k.entries}</strong></div><div class="exec-kpi"><span>Tổng thu</span><strong>${money(k.income)}</strong></div><div class="exec-kpi"><span>Tổng chi</span><strong>${money(k.expense)}</strong></div><div class="exec-kpi"><span>Số dư toàn xã đoàn</span><strong class="${k.balance<0?'exec-bad':''}">${money(k.balance)}</strong></div></div>
 ${calendarMarkup(data.calendarEvents||[])}
 <div class="exec-card"><h3>🏛 Tổng quan từng CLB</h3><div class="exec-table-wrap"><table class="exec-table"><thead><tr><th>CLB</th><th>Ra đời</th><th>Trưởng BTC</th><th>Số giải</th><th>VĐV</th><th>Gần nhất</th><th>Thu</th><th>Chi</th><th>Số dư</th></tr></thead><tbody>${clubRows}</tbody></table></div></div>
 <div class="exec-grid"><div class="exec-card"><h3>📈 Hoạt động theo CLB</h3>${data.clubs.filter(x=>x.active).map(c=>`<div class="exec-bar-row"><span>${c.icon} ${esc(c.sport)}</span><div class="exec-bar"><i style="width:${Math.max(3,Math.round(c.events/maxEvents*100))}%"></i></div><b>${c.events} giải</b></div>`).join('')}<h3 style="margin-top:18px">📅 Xu hướng theo năm</h3>${yearRows.length?yearRows.map(([y,v])=>`<div class="exec-bar-row"><span>${y}</span><div class="exec-bar"><i style="width:${Math.max(3,Math.round(v.events/maxYear*100))}%"></i></div><b>${v.events}</b></div>`).join(''):'<div class="exec-empty">Chưa đủ dữ liệu lịch sử.</div>'}</div><div class="exec-card"><h3>⚠ Cảnh báo lãnh đạo</h3><div class="exec-alerts">${alerts.length?alerts.slice(0,12).map(a=>`<div class="exec-alert ${a.bad?'bad':''}">${esc(a.text)}</div>`).join(''):'<div class="exec-alert" style="border-color:#14532d;background:#0c261c">✓ Chưa phát hiện cảnh báo nổi bật.</div>'}</div><div class="exec-meta" style="margin-top:10px">Khoản tài chính chờ hoàn tất toàn hệ thống: ${k.pending}</div></div></div>
 <div class="exec-grid"><div class="exec-card"><h3>🏆 Nhà vô địch qua các giải</h3><div class="exec-champs">${champ}</div></div><div class="exec-card"><h3>💰 Tài chính từng giải</h3><div class="exec-table-wrap"><table class="exec-table"><thead><tr><th>CLB</th><th>Giải</th><th>Năm</th><th>Thu</th><th>Chi</th><th>Số dư</th><th>Chờ</th></tr></thead><tbody>${finance||'<tr><td colspan="7">Chưa có dữ liệu.</td></tr>'}</tbody></table></div></div></div>`;
 try{window.TopkeyExecutiveSportInsights?.render(b,data)}catch(e){console.warn('Executive sport insights unavailable',e)}
 $('#exec-source').textContent=`${meta.orgName||'Xã đoàn TOPKEY'} · Snapshot: ${source==='live'?'LIVE ADMIN':'TỔNG HỢP ĐÃ LƯU'} · ${new Date(meta.snapshotAt||Date.now()).toLocaleString('vi-VN')}`;
}
async function boot(){renderShell();const host=$('#executive-dashboard');if(!host||!window.firebase)return;let auth=firebase.auth(),db=firebase.database();auth.onAuthStateChanged(async user=>{if(!user){host.classList.add('hidden');return}let profile={};try{profile=(await db.ref(`${AUTH_ROOT}/users/${user.uid}`).once('value')).val()||{}}catch{}const m=mode(profile);if(m==='none'){host.classList.add('hidden');return}host.classList.remove('hidden');let meta={};try{meta=(await db.ref(`${AUTH_ROOT}/associationDashboard`).once('value')).val()||{}}catch{}const isAdmin=roleKey(profile.role)==='ADMIN';$('#exec-refresh').style.display=isAdmin?'':'none';async function load(){if(isAdmin){const raw=await readRaw(db),data=compute(raw,meta);meta={...meta,snapshot:data,snapshotAt:Date.now()};render(data,meta,'live');try{await db.ref(`${AUTH_ROOT}/associationDashboard`).update({snapshot:data,snapshotAt:meta.snapshotAt})}catch(e){console.warn('Executive snapshot save',e)}}else if(meta.snapshot){render(meta.snapshot,meta,'snapshot')}else $('#exec-body').innerHTML='<div class="exec-empty">Chưa có snapshot lãnh đạo. ADMIN cần mở Dashboard và bấm “Cập nhật dữ liệu”.</div>'}
 let loading=false;$('#exec-refresh').onclick=async()=>{if(loading)return;loading=true;$('#exec-refresh').disabled=true;try{await load()}catch(e){console.error('Dashboard refresh',e);$('#exec-source').textContent='Chưa cập nhật được dữ liệu. Vui lòng thử lại.'}finally{loading=false;$('#exec-refresh').disabled=false}};if(meta.snapshot){render(meta.snapshot,meta,'snapshot')}else await $('#exec-refresh').onclick()})}
window.TopkeyExecutiveDashboard={compute,readRaw,render,calendarMarkup};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
