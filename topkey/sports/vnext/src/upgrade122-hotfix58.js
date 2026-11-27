(()=>{
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U,S=T?.SPORT;
const VERSION='2026.11.06-vnext-upgrade122-hotfix58-multisport-parity';
if(!T||!App||!U||!S){window.__TOPKEY_H58_STATUS='skipped: missing TOPKEY core';return}
if(window.__TOPKEY_H58_INSTALLED===VERSION){window.__TOPKEY_H58_STATUS='already-installed';return}
window.__TOPKEY_H58_INSTALLED=VERSION;window.__TOPKEY_H58_STATUS='installing';
const CACHE_TAG='u122h58-20261106';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const TERMINAL=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
let activeCategory=S.categories?.[0]||'OPEN';
let reportModel=null,reportLogo='',reportLogoName='',pendingLogo=false;

function stamp(){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;window.__TOPKEY_BOOT_VERSION=VERSION;window.__TOPKEY_BOOT_CACHE=CACHE_TAG;const h=$('health-version');if(h)h.textContent=VERSION;const ls=$('login-sport');if(ls&&!ls.textContent.includes(VERSION))ls.textContent=`${S.name} · ${VERSION}`;}
function isGroupMatch(m){if(['time','judged'].includes(S.mode))return true;const st=String(m?.stage||'GROUP').toUpperCase();return st==='GROUP'||st==='ROUND_ROBIN'||st==='LEAGUE'||st===String(S.stages?.[0]||'GROUP').toUpperCase();}
function teamCategory(t){return String(t?.category||S.categories?.[0]||'OPEN');}
function canonicalMatches(category){
  const rows=Object.values(App.state.matches||{}).filter(m=>TERMINAL.has(String(m.status||'').toUpperCase())&&isGroupMatch(m)&&(category==='ALL'||!category||String(m.category||teamCategory(App.state.teams?.[m.teamAId]))===category));
  if(['time','judged'].includes(S.mode))return rows.sort((a,b)=>(a.finishedAt||a.updatedAt||a.createdAt||0)-(b.finishedAt||b.updatedAt||b.createdAt||0));
  const map=new Map();
  rows.forEach(m=>{const pair=[String(m.teamAId||''),String(m.teamBId||'')].sort().join('|');const key=`${m.category||''}|${pair}`;const prev=map.get(key);const score=x=>num(x.finishedAt||x.updatedAt||x.createdAt);if(!prev||score(m)>=score(prev))map.set(key,m)});
  return [...map.values()];
}
function winnerId(m){if(m.winnerId)return m.winnerId;if(S.mode==='sets'){let a=0,b=0;(m.sets||[]).forEach(s=>{if(num(s.a)>num(s.b))a++;else if(num(s.b)>num(s.a))b++});if(a>b)return m.teamAId;if(b>a)return m.teamBId;return''}if(S.mode==='score'){if(num(m.scoreA)>num(m.scoreB))return m.teamAId;if(num(m.scoreB)>num(m.scoreA))return m.teamBId}return''}
function addMatch(rowA,rowB,m,rules){
  if(!rowA)return;
  if(['time','judged'].includes(S.mode)){rowA.played++;if(S.mode==='time'&&m.resultMs!=null&&(rowA.bestTime==null||num(m.resultMs)<rowA.bestTime))rowA.bestTime=num(m.resultMs);if(S.mode==='judged'&&m.judgeScore!=null&&(rowA.score==null||num(m.judgeScore)>rowA.score))rowA.score=num(m.judgeScore);return}
  if(!rowB)return;rowA.played++;rowB.played++;
  if(S.mode==='sets'){
    (m.sets||[]).forEach(s=>{const a=num(s.a),b=num(s.b);rowA.for+=a;rowA.against+=b;rowB.for+=b;rowB.against+=a;if(a>b){rowA.setsFor++;rowB.setsAgainst++}else if(b>a){rowB.setsFor++;rowA.setsAgainst++}})
  }else{rowA.for+=num(m.scoreA);rowA.against+=num(m.scoreB);rowB.for+=num(m.scoreB);rowB.against+=num(m.scoreA)}
  const w=winnerId(m),administrative=String(m.status||'').toUpperCase()!=='FINISHED';
  const winPts=administrative?num(rules.walkoverWinPoints??rules.winPoints??3):num(rules.winPoints??3),lossPts=num(rules.lossPoints??0),drawPts=num(rules.drawPoints??1);
  if(w===rowA.id){rowA.w++;rowB.l++;rowA.points+=winPts;rowB.points+=lossPts}
  else if(w===rowB.id){rowB.w++;rowA.l++;rowB.points+=winPts;rowA.points+=lossPts}
  else if(S.mode==='score'){rowA.d++;rowB.d++;rowA.points+=drawPts;rowB.points+=drawPts}
}
function rowsFor(category,matches=canonicalMatches(category),onlyIds=null){
  const teams=Object.values(App.state.teams||{}).filter(t=>(category==='ALL'||!category||!t.category||teamCategory(t)===category)&&(!onlyIds||onlyIds.has(t.id)));
  const rows=teams.map(t=>({id:t.id,name:t.name||t.id,category:teamCategory(t),played:0,w:0,d:0,l:0,points:0,for:0,against:0,setsFor:0,setsAgainst:0,bestTime:null,score:null}));
  const map=Object.fromEntries(rows.map(r=>[r.id,r])),rules=App.state.config?.rules||S.rules||{};
  matches.forEach(m=>{if(onlyIds&&(!onlyIds.has(m.teamAId)||(!['time','judged'].includes(S.mode)&&!onlyIds.has(m.teamBId))))return;addMatch(map[m.teamAId],map[m.teamBId],m,rules)});
  return rows;
}
function criterionValue(r,c){switch(c){case'points':return r.points;case'goalDiff':case'pointDiff':return r.for-r.against;case'goalsFor':case'pointsFor':return r.for;case'setDiff':return r.setsFor-r.setsAgainst;case'setsWon':return r.setsFor;case'time':return -(r.bestTime??Infinity);case'score':return r.score??-Infinity;default:return null}}
function miniTuple(group,matches){const ids=new Set(group.map(x=>x.id)),mini=rowsFor(group[0]?.category||activeCategory,matches.filter(m=>ids.has(m.teamAId)&&(['time','judged'].includes(S.mode)||ids.has(m.teamBId))),ids),map=Object.fromEntries(mini.map(r=>[r.id,r]));return r=>{const x=map[r.id]||{};if(S.mode==='sets')return[num(x.points),num(x.setsFor)-num(x.setsAgainst),num(x.for)-num(x.against),num(x.setsFor),num(x.for)];if(S.mode==='score')return[num(x.points),num(x.for)-num(x.against),num(x.for)];return[0]}}
function sameTuple(a,b){return a.length===b.length&&a.every((x,i)=>x===b[i])}
function sortByCriteria(rows,criteria,matches,idx=0){
  if(rows.length<=1||idx>=criteria.length)return [...rows].sort((a,b)=>String(a.name).localeCompare(String(b.name),'vi'));
  const c=criteria[idx];if(c==='name')return [...rows].sort((a,b)=>String(a.name).localeCompare(String(b.name),'vi'));
  if(c==='headToHead'){
    const get=miniTuple(rows,matches),ordered=[...rows].sort((a,b)=>{const A=get(a),B=get(b);for(let i=0;i<Math.max(A.length,B.length);i++){if(num(B[i])!==num(A[i]))return num(B[i])-num(A[i])}return 0});
    const out=[];for(let i=0;i<ordered.length;){let j=i+1,A=get(ordered[i]);while(j<ordered.length&&sameTuple(A,get(ordered[j])))j++;out.push(...sortByCriteria(ordered.slice(i,j),criteria,matches,idx+1));i=j}return out;
  }
  const desc=c!=='time';const ordered=[...rows].sort((a,b)=>{const A=criterionValue(a,c),B=criterionValue(b,c);return desc?num(B)-num(A):num(A)-num(B)});const out=[];
  for(let i=0;i<ordered.length;){let j=i+1,A=criterionValue(ordered[i],c);while(j<ordered.length&&criterionValue(ordered[j],c)===A)j++;out.push(...sortByCriteria(ordered.slice(i,j),criteria,matches,idx+1));i=j}return out;
}
function ranking(opts={}){
  const category=typeof opts==='string'?opts:(opts.category||activeCategory||S.categories?.[0]||'OPEN'),onlyIds=Array.isArray(opts.teamIds)?new Set(opts.teamIds):null;
  const matches=(onlyIds?canonicalMatches('ALL'):canonicalMatches(category)).filter(m=>!onlyIds||(onlyIds.has(m.teamAId)&&(['time','judged'].includes(S.mode)||onlyIds.has(m.teamBId))));
  const rows=rowsFor(category,matches,onlyIds);
  if(S.mode==='time')return rows.sort((a,b)=>(a.bestTime??Infinity)-(b.bestTime??Infinity)||a.name.localeCompare(b.name,'vi'));
  if(S.mode==='judged')return rows.sort((a,b)=>(b.score??-Infinity)-(a.score??-Infinity)||a.name.localeCompare(b.name,'vi'));
  const criteria=[...((App.state.config?.rules||S.rules||{}).tieBreakers||['points',S.mode==='sets'?'setDiff':'goalDiff',S.mode==='sets'?'pointDiff':'goalsFor','headToHead','name'])];
  if(!criteria.includes('name'))criteria.push('name');return sortByCriteria(rows,criteria,matches,0);
}
App.ranking=ranking;

function normalizedGroup(value){const group=String(value??'').replace(/^Bảng\s*/i,'').trim();return group.toUpperCase()==='ALL'?'':group}
function groupBuckets(category=activeCategory){
  const selected=String(category||'ALL'),assignments=new Map(),saved=App.state.config?.scheduleGroups||{};
  const assign=(id,cat,group)=>{const g=normalizedGroup(group),c=String(cat||'');if(!id||!g||(selected!=='ALL'&&selected&&c&&c!==selected)||assignments.has(id))return;assignments.set(id,{category:c||teamCategory(App.state.teams?.[id]),group:g})};
  Object.entries(saved).forEach(([cat,cfg])=>{
    if(selected!=='ALL'&&selected&&cat!==selected)return;
    const entries=Array.isArray(cfg?.entries)?cfg.entries:[];
    const grouped=String(cfg?.format||'').toUpperCase()==='GROUP'||entries.some(e=>normalizedGroup(e?.group));
    if(!grouped)return;
    entries.forEach(entry=>assign(entry?.id,cat,entry?.group));
  });
  Object.values(App.state.matches||{}).forEach(m=>{
    const cat=String(m.category||teamCategory(App.state.teams?.[m.teamAId]));
    if(selected!=='ALL'&&selected&&cat!==selected)return;
    const group=m.groupId??m.groupName??m.group??m.pool??'';
    assign(m.teamAId,cat,group);assign(m.teamBId,cat,group);
  });
  Object.values(App.state.teams||{}).forEach(team=>{
    const cat=teamCategory(team);
    if(selected!=='ALL'&&selected&&cat!==selected)return;
    assign(team.id,cat,team.groupId??team.groupName??team.group??team.pool??'');
  });
  const buckets=new Map();
  Object.values(App.state.teams||{}).forEach(team=>{
    const a=assignments.get(team.id);if(!a)return;
    if(selected!=='ALL'&&selected&&a.category!==selected)return;
    const key=a.category+'|'+a.group,item=buckets.get(key)||{category:a.category,group:a.group,teamIds:[]};
    item.teamIds.push(team.id);buckets.set(key,item);
  });
  return [...buckets.values()].filter(g=>g.teamIds.length).sort((a,b)=>a.category.localeCompare(b.category,'vi')||a.group.localeCompare(b.group,'vi'));
}
function standingsCols(){if(S.mode==='time')return['#',S.participantLabel,'Lượt','Thành tích tốt nhất'];if(S.mode==='judged')return['#',S.participantLabel,'Lượt','Điểm tốt nhất'];if(S.mode==='sets')return['#','Đội','Trận','W-L','HS set','HS điểm','Điểm'];return['#','Đội','Trận','W-D-L','Hiệu số','Điểm']}
function renderStandings(){
  const head=$('ranking-head'),box=$('standings-list');if(!head||!box)return;
  const tableWrap=box.closest('.table-wrap')||head.closest('.table-wrap')||box.closest('table')?.parentElement;
  const groups=groupBuckets(activeCategory);let host=$('standings-group-tables');
  if(groups.length){
    if(!host){host=document.createElement('div');host.id='standings-group-tables';host.className='tk-standings-groups';const parent=tableWrap?.parentNode||box.parentElement;if(parent)parent.appendChild(host)}
    host.replaceChildren();host.hidden=false;if(tableWrap)tableWrap.hidden=true;
    const labels={NAM_6V6:'Nam 6 người',NU_6V6:'Nữ 6 người',MIX_6V6:'Nam nữ 6 người',PHONG_TRAO_6V6:'Phong trào 6 người'};
    groups.forEach(g=>{
      const rows=ranking({category:g.category,teamIds:g.teamIds}),section=document.createElement('section');section.className='subcard tk-group-standings';
      const title=document.createElement('h3');title.textContent='Bảng '+g.group+(g.category?' · '+(labels[g.category]||g.category.replaceAll('_',' ')):'');
      const wrap=document.createElement('div');wrap.className='table-wrap';
      const table=document.createElement('table'),thead=document.createElement('thead'),trh=document.createElement('tr'),tbody=document.createElement('tbody');
      standingsCols().forEach(label=>{const th=document.createElement('th');th.textContent=label;trh.appendChild(th)});thead.appendChild(trh);
      rows.forEach((r,i)=>{
        let values;if(S.mode==='time')values=[i+1,r.name,r.played,r.bestTime==null?'—':App.formatTime(r.bestTime)];
        else if(S.mode==='judged')values=[i+1,r.name,r.played,r.score??'—'];
        else if(S.mode==='sets')values=[i+1,r.name,r.played,r.w+'-'+r.l,r.setsFor-r.setsAgainst,r.for-r.against,r.points];
        else values=[i+1,r.name,r.played,r.w+'-'+r.d+'-'+r.l,r.for-r.against,r.points];
        const tr=document.createElement('tr');values.forEach(value=>{const td=document.createElement('td');td.textContent=String(value);tr.appendChild(td)});tbody.appendChild(tr);
      });
      table.append(thead,tbody);wrap.appendChild(table);section.append(title,wrap);host.appendChild(section);
    });
    return;
  }
  if(host)host.hidden=true;if(tableWrap)tableWrap.hidden=false;
  head.innerHTML='<tr>'+standingsCols().map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr>';box.innerHTML='';
  ranking({category:activeCategory}).forEach((r,i)=>{let vals;if(S.mode==='time')vals=[i+1,r.name,r.played,r.bestTime==null?'—':App.formatTime(r.bestTime)];else if(S.mode==='judged')vals=[i+1,r.name,r.played,r.score??'—'];else if(S.mode==='sets')vals=[i+1,r.name,r.played,r.w+'-'+r.l,r.setsFor-r.setsAgainst,r.for-r.against,r.points];else vals=[i+1,r.name,r.played,r.w+'-'+r.d+'-'+r.l,r.for-r.against,r.points];const tr=document.createElement('tr');vals.forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.appendChild(td)});box.appendChild(tr)});
}
function ensureStandingsRenderer(){
  const current=App.renderStandings;
  if(current===renderStandings||current?.__tkH58Wrapped)return;
  const previous=typeof current==='function'?current.bind(App):null;
  const owned=function(...args){const result=previous?.(...args);renderStandings();return result};
  owned.__tkH58Wrapped=true;App.renderStandings=owned;
}
App.renderStandings=renderStandings;

function ensureRankingToolbar(){const head=$('ranking-head');if(!head||$('tk58-ranking-toolbar'))return;const wrap=head.closest('.table-wrap')||head.parentElement;const bar=document.createElement('div');bar.id='tk58-ranking-toolbar';bar.className='tk58-toolbar';bar.innerHTML=`<b>🏆 BXH nhanh</b><label>Nội dung <select id="tk58-ranking-category">${(S.categories||[]).map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label><button id="tk58-report-btn" class="btn mini primary">🧾 Giải trình BXH</button>`;if(wrap?.parentNode)wrap.parentNode.appendChild(bar);$('tk58-ranking-category').value=activeCategory;$('tk58-ranking-category').onchange=e=>{activeCategory=e.target.value;renderStandings();renderPublicStandings()};$('tk58-report-btn').onclick=openReport;}

function isAdministrativeLoss(m){if(!m||!TERMINAL.has(String(m.status||'').toUpperCase()))return false;if(['WALKOVER','RETIRED','DISQUALIFIED'].includes(String(m.status||'').toUpperCase()))return true;if(m.walkoverTeamId||m.retiredTeamId||m.disqualifiedTeamId||m.withdrawnTeamId||m.forfeitTeamId||m.loserId)return true;const reason=[m.walkoverReason,m.resultReason,m.outcomeReason,m.cancelReason].join('|').toUpperCase();return /WITHDRAW|FORFEIT|WALKOVER|\bWO\b|RETIR|DISQUAL|XU.?THUA|BO.?CUOC/.test(reason)}
function matchForScheduleRow(row){
  if(!row||!row.classList?.contains('tk12-match-row'))return null;
  const byId=row.dataset?.matchId&&App.state.matches?.[row.dataset.matchId];if(byId)return byId;
  const raw=String(row.cells?.[0]?.textContent||'').trim();
  const code=(raw.match(/M\d+/i)||[])[0]||raw.replace(/^[^A-Za-z0-9]+/,'').trim();
  return Object.values(App.state.matches||{}).find(x=>String(x.code||x.id||'').trim().toUpperCase()===String(code).toUpperCase())||null;
}
function reorderMatches(){
  const box=$('matches-list');if(!box)return;
  const original=[...box.children],ordered=[];let header=null,group=[];
  const flush=()=>{
    if(header)ordered.push(header);
    group.sort((a,b)=>{
      const fa=isAdministrativeLoss(a.m)?1:0,fb=isAdministrativeLoss(b.m)?1:0;if(fa!==fb)return fa-fb;
      const ao=Number(a.m.scheduleOrder),bo=Number(b.m.scheduleOrder),av=Number.isFinite(ao),bv=Number.isFinite(bo);
      if(av&&bv&&ao!==bo)return ao-bo;if(av!==bv)return av?-1:1;
      return String(a.m.time||'99:99').localeCompare(String(b.m.time||'99:99'))||String(a.m.code||'').localeCompare(String(b.m.code||''));
    });
    group.forEach(({row,m})=>{
      ordered.push(row);row.dataset.matchId=m.id||'';
      row.classList.toggle('tk58-forfeit-bottom',isAdministrativeLoss(m));
      const badge=row.cells?.[5]?.querySelector?.('.tk12-status-badge');
      if(badge)badge.dataset.tk58Administrative=isAdministrativeLoss(m)?'1':'0';
    });
    header=null;group=[];
  };
  for(const row of original){
    if(row.classList?.contains('tk12-day-row')){flush();header=row;continue;}
    if(row.classList?.contains('tk12-match-row')){const m=matchForScheduleRow(row);if(m){group.push({row,m});continue;}}
    flush();ordered.push(row);
  }
  flush();
  const fragment=document.createDocumentFragment();ordered.forEach(node=>fragment.appendChild(node));box.appendChild(fragment);
}
const baseRenderMatches=App.renderMatches?.bind(App);if(baseRenderMatches)App.renderMatches=function(...a){const r=baseRenderMatches(...a);reorderMatches();return r};

function rawRole(){return String(T.Auth?.profile?.role||T.Auth?.role?.()||'').trim().toUpperCase()}
function canShare(){const role=rawRole();if(role==='ADMIN')return true;const p=T.Auth?.profile?.permissions||{},m=String(p.modules?.publicLinks||'').toLowerCase(),d=String(p.details?.['publicLinks:manage']||p.details?.['settings:publicLinks']||'').toLowerCase();if(['none','view','edit'].includes(m))return m==='view'||m==='edit';if(['none','view','edit'].includes(d))return d==='view'||d==='edit';return role==='BTC'}
function patchPublicLinks(){try{window.TopkeyUpgrade14?.render?.()}catch{}const card=$('tk14-public-links-card');if(!card)return;card.classList.toggle('hidden',!canShare());const h=card.querySelector('h2');if(h)h.textContent='🔗 Setup · Liên kết & Chia sẻ';const p=card.querySelector('.muted');if(p)p.textContent='Quyền riêng: Liên kết & Chia sẻ. ADMIN cấp độc lập cho BTC; Trọng tài mặc định không có quyền.'}

function ensurePublicStandings(){const pub=$('public-spectator');if(!pub||$('tk58-public-ranking'))return;const sec=document.createElement('section');sec.id='tk58-public-ranking';sec.className='card';sec.innerHTML=`<div class="split"><h2>🏆 Bảng xếp hạng</h2><select id="tk58-public-category">${(S.categories||[]).map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></div><div id="tk58-public-ranking-body"></div>`;const sched=$('spectator-schedule')?.parentElement;pub.appendChild(sec);$('tk58-public-category').value=activeCategory;$('tk58-public-category').onchange=e=>{activeCategory=e.target.value;const a=$('tk58-ranking-category');if(a)a.value=activeCategory;renderPublicStandings()}}
function renderPublicStandings(){
 ensurePublicStandings();const box=$('tk58-public-ranking-body');if(!box)return;
 const groups=groupBuckets(activeCategory);
 const rowHtml=(r,i)=>{let sub;if(S.mode==='time')sub=r.played+' lượt · '+(r.bestTime==null?'—':App.formatTime(r.bestTime));else if(S.mode==='judged')sub=r.played+' lượt · '+(r.score??'—')+' điểm';else if(S.mode==='sets')sub=r.played+' trận · '+r.w+'-'+r.l+' · HS set '+(r.setsFor-r.setsAgainst)+' · HS điểm '+(r.for-r.against);else sub=r.played+' trận · '+r.w+'-'+r.d+'-'+r.l+' · HS '+(r.for-r.against);return '<div class="tk58-rank-row"><b>'+(i+1)+'</b><span><strong>'+esc(r.name)+'</strong><small>'+esc(sub)+'</small></span><em>'+(S.mode==='time'?(r.bestTime==null?'—':App.formatTime(r.bestTime)):S.mode==='judged'?(r.score??'—'):r.points)+'</em></div>'};
 if(groups.length){box.innerHTML=groups.map(g=>'<section class="subcard tk-group-standings"><h3>Bảng '+esc(g.group)+(g.category?' · '+esc(g.category.replaceAll('_',' ')):'')+'</h3>'+ranking({category:g.category,teamIds:g.teamIds}).map(rowHtml).join('')+'</section>').join('');return}
 box.innerHTML=ranking({category:activeCategory}).map(rowHtml).join('');
}
const baseStartPublic=App.startPublicSpectator?.bind(App);App.startPublicSpectator=function(){if(!T.Data.ready)return baseStartPublic?.();['matches','courts','activeMatches','teams','config'].forEach(b=>{if(this['pubOff'+b])this['pubOff'+b]();this['pubOff'+b]=T.Data.listen(b,v=>{this.state[b]=v||{};this.renderSpectator()})})};
const baseRenderSpectator=App.renderSpectator?.bind(App);if(baseRenderSpectator)App.renderSpectator=function(...a){const r=baseRenderSpectator(...a);renderPublicStandings();return r};

function shortTournament(){const t=String(App.state.config?.title||S.title||'TOPKEY').replace(/\s+/g,' ').trim();const cleaned=t.replace(/^GIẢI\s+/i,'').replace(/CÔNG TY\s+/i,'').replace(/VNEXT/ig,'').trim();return(cleaned.length>34?cleaned.slice(0,34).trim():cleaned).replace(/[\\/:*?"<>|]+/g,'-')}
function ddmmyyyy(ts=Date.now()){const d=new Date(ts);return`${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${d.getFullYear()}`}
function safeCategory(c){return String(c||'').replace(/_/g,' ').replace(/[\\/:*?"<>|]+/g,'-')}
function reportBaseName(m){return`${ddmmyyyy(m.generatedAt)}_Báo cáo BXH_${safeCategory(m.category)}_${shortTournament()}`}
function t3(vi,en,zh,L){if(L==='en')return en;if(L==='zh')return zh;if(L==='bi')return`${vi} / ${en}`;if(L==='vizh')return`${vi} / ${zh}`;if(L==='tri')return`${vi} / ${en} / ${zh}`;return vi}
function ruleLabel(L='vi'){const r=(App.state.config?.rules||S.rules||{}).tieBreakers||[];const map={points:['Điểm','Points','积分'],headToHead:['H2H / mini-league','H2H / mini-league','相互战绩 / 小组排名'],setDiff:['HS set','Set differential','局分差'],pointDiff:['HS điểm','Point differential','得分差'],setsWon:['Set thắng','Sets won','胜局数'],pointsFor:['Điểm ghi được','Points scored','总得分'],goalDiff:['Hiệu số bàn thắng','Goal difference','净胜球'],goalsFor:['Bàn thắng ghi được','Goals scored','进球数'],time:['Thời gian','Time','时间'],score:['Điểm giám khảo','Judge score','评委得分'],name:['Tên','Name','名称']};return r.map(x=>{const a=map[x]||[x,x,x];return t3(a[0],a[1],a[2],L)}).join(' → ')}
function topReason(row,rank,rows){const prev=rows[rank-2],next=rows[rank];if(S.mode==='time')return`Hạng ${rank}: ${row.name} có thành tích tốt nhất ${row.bestTime==null?'—':App.formatTime(row.bestTime)}.${prev?` So với hạng ${rank-1} (${prev.name}), thứ tự được xác định theo thời gian tăng dần.`:''}`;if(S.mode==='judged')return`Hạng ${rank}: ${row.name} có điểm tốt nhất ${row.score??'—'}.${prev?` So với hạng ${rank-1} (${prev.name}), thứ tự được xác định theo điểm giảm dần.`:''}`;const diff=S.mode==='sets'?`HS set ${row.setsFor-row.setsAgainst}, HS điểm ${row.for-row.against}`:`hiệu số ${row.for-row.against}, ghi ${row.for}`;return`Hạng ${rank}: ${row.name} có ${row.points} điểm BXH, ${diff}. ${prev?`Được so với ${prev.name} theo thứ tự tie-break của giải.`:''}${next?` Đồng thời đứng trên ${next.name} theo tiêu chí phân hạng đang áp dụng.`:''}`}
function model(category){const rows=ranking({category}),matches=canonicalMatches(category),generatedAt=Date.now();return{category,rows,matches,top4:rows.slice(0,4),generatedAt,tournament:App.state.config?.title||S.title,logo:reportLogo,logoName:reportLogoName}}
function reportHtml(m,L='vi',standalone=true){const title=t3('BÁO CÁO BẢNG XẾP HẠNG','STANDINGS REPORT','排名报告',L);const rows=m.rows.map((r,i)=>`<tr class="${i<4?'top':''}"><td>${i+1}</td><td>${esc(r.name)}</td><td>${r.played}</td><td>${S.mode==='time'?(r.bestTime==null?'—':App.formatTime(r.bestTime)):S.mode==='judged'?(r.score??'—'):r.points}</td><td>${S.mode==='sets'?`${r.setsFor-r.setsAgainst} / ${r.for-r.against}`:S.mode==='score'?`${r.for-r.against} / ${r.for}`:'—'}</td></tr>`).join('');const reasons=m.top4.map((r,i)=>`<div class="reason"><b>${t3(`Hạng ${i+1}`,`Rank ${i+1}`,`第 ${i+1} 名`,L)} · ${esc(r.name)}</b><p>${esc(topReason(r,i+1,m.rows))}</p></div>`).join('');const d=new Date(m.generatedAt),date=t3(`Ngày ${d.getDate()} tháng ${d.getMonth()+1} năm ${d.getFullYear()}`,`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`,`${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`,L);const body=`<div class="report"><header>${m.logo?`<img src="${m.logo}" alt="logo">`:''}<div><h1>${title}</h1><h2>${esc(m.tournament)}</h2><p>${t3('Nội dung','Category','项目',L)}: <b>${esc(m.category)}</b></p></div></header><section><h3>1. ${t3('Quy tắc xếp hạng','Ranking rule','排名规则',L)}</h3><p>${esc(ruleLabel(L)||t3('Theo Rule Engine của môn','According to the sport Rule Engine','按该项目规则引擎',L))}</p></section><section><h3>2. ${t3('Bảng xếp hạng','Standings','排名表',L)}</h3><table><thead><tr><th>#</th><th>${t3('Đội/VĐV','Team/Athlete','队伍/运动员',L)}</th><th>${t3('Lượt/Trận','Played','场次',L)}</th><th>${t3('Điểm/Thành tích','Points/Result','积分/成绩',L)}</th><th>${t3('Chỉ số phụ','Differential','附加指标',L)}</th></tr></thead><tbody>${rows}</tbody></table></section><section><h3>3. ${t3('Giải trình Top 1-2-3-4','Top 1-2-3-4 explanation','前四名说明',L)}</h3>${reasons||'<p>—</p>'}</section><div class="sign"><b>${t3('BTC - Giải','ORGANIZING COMMITTEE - Tournament','组委会 - 赛事',L)} ${esc(m.tournament)}</b><div>${date}</div><div class="space"></div><div>${t3('(Ký, ghi rõ họ tên)','(Signature and full name)','（签字并注明姓名）',L)}</div></div><footer>${t3('Báo cáo được sinh từ Ranking Engine đang chạy tại thời điểm xuất.','Generated from the active Ranking Engine at export time.','本报告基于导出时正在运行的排名引擎生成。',L)}</footer></div>`;if(!standalone)return body;return`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(reportBaseName(m))}</title><style>body{font-family:Arial,"Microsoft YaHei",sans-serif;color:#10233b;margin:28px}.report{max-width:1100px;margin:auto}header{display:flex;gap:20px;align-items:center;border-bottom:3px solid #1593c5;padding-bottom:16px}header img{max-width:120px;max-height:80px;object-fit:contain}h1{margin:0}section{margin:22px 0}table{border-collapse:collapse;width:100%}th,td{border:1px solid #b8c9d6;padding:8px}th{background:#eaf4fb}.top{background:#fff8d8}.reason{border-left:5px solid #1593c5;padding:10px 14px;margin:10px 0;background:#f7fbfe}.sign{width:420px;margin:42px 0 0 auto;text-align:center;line-height:1.6}.space{height:70px}footer{margin-top:28px;color:#667;font-size:11px}</style></head><body>${body}</body></html>`}
function csvText(m,L='vi'){const q=v=>`"${String(v??'').replace(/"/g,'""')}"`,lines=[];lines.push(['Rank','Team/Athlete','Played','Points/Result','Diff'].map(q).join(','));m.rows.forEach((r,i)=>lines.push([i+1,r.name,r.played,S.mode==='time'?(r.bestTime==null?'':App.formatTime(r.bestTime)):S.mode==='judged'?(r.score??''):r.points,S.mode==='sets'?`${r.setsFor-r.setsAgainst}/${r.for-r.against}`:S.mode==='score'?`${r.for-r.against}/${r.for}`:''].map(q).join(',')));lines.push('');lines.push(q(t3('GIẢI TRÌNH TOP 4','TOP 4 EXPLANATION','前四名说明',L)));m.top4.forEach((r,i)=>lines.push([q(t3(`Hạng ${i+1}`,`Rank ${i+1}`,`第 ${i+1} 名`,L)),q(r.name),q(topReason(r,i+1,m.rows))].join(',')));return'\uFEFF'+lines.join('\r\n')}
function download(name,content,type){U.download(name,new Blob([content],{type}))}
function ensureReportModal(){if($('tk58-report-modal'))return;const modal=document.createElement('div');modal.id='tk58-report-modal';modal.className='modal hidden';modal.innerHTML=`<div class="modal-box wide"><div class="split"><div><h2>🧾 Giải trình BXH</h2><p class="muted">Top 1-2-3-4 · logo · chữ ký BTC · đa ngôn ngữ</p></div><button id="tk58-report-close" class="btn mini">Đóng</button></div><div class="tk58-report-controls"><label>Nội dung<select id="tk58-report-category">${(S.categories||[]).map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label><label>Ngôn ngữ<select id="tk58-report-lang"><option value="vi">Tiếng Việt</option><option value="en">English</option><option value="zh">简体中文</option><option value="bi">Việt - Anh</option><option value="vizh">Việt - Trung / 越中双语</option><option value="tri">Việt - Anh - Trung / 越英中三语</option></select></label><label>Logo công ty<input id="tk58-report-logo" type="file" accept="image/*"></label></div><div class="action-bar"><button id="tk58-report-generate" class="btn primary">Tạo báo cáo</button><button id="tk58-report-html" class="btn">HTML</button><button id="tk58-report-csv" class="btn">CSV</button><button id="tk58-report-print" class="btn ok">In / PDF</button></div><div id="tk58-report-preview" class="tk58-preview"></div></div>`;document.body.appendChild(modal);$('tk58-report-close').onclick=()=>modal.classList.add('hidden');$('tk58-report-logo').onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{reportLogo=String(r.result||'');reportLogoName=f.name;if(pendingLogo){pendingLogo=false;generateReport()}};r.readAsDataURL(f)};$('tk58-report-generate').onclick=generateReport;$('tk58-report-html').onclick=()=>{const m=reportModel||generateReport();if(m)download(reportBaseName(m)+'.html',reportHtml(m,$('tk58-report-lang').value,true),'text/html;charset=utf-8')};$('tk58-report-csv').onclick=()=>{const m=reportModel||generateReport();if(m)download(reportBaseName(m)+'.csv',csvText(m,$('tk58-report-lang').value),'text/csv;charset=utf-8')};$('tk58-report-print').onclick=()=>{const m=reportModel||generateReport();if(!m)return;const w=window.open('','_blank');if(!w)return;w.document.write(reportHtml(m,$('tk58-report-lang').value,true));w.document.close();setTimeout(()=>w.print(),250)}}
function openReport(){if(rawRole()!=='ADMIN'){U.toast('Chỉ ADMIN được xuất giải trình BXH','err');return}ensureReportModal();$('tk58-report-category').value=activeCategory;$('tk58-report-modal').classList.remove('hidden')}
function generateReport(){ensureReportModal();if(!reportLogo){pendingLogo=true;$('tk58-report-logo')?.click();U.toast('Chọn logo công ty để tạo báo cáo','info');return null}const cat=$('tk58-report-category').value,L=$('tk58-report-lang').value;reportModel=model(cat);$('tk58-report-preview').innerHTML=reportHtml(reportModel,L,false);return reportModel}

function style(){if($('tk58-style'))return;const s=document.createElement('style');s.id='tk58-style';s.textContent=`.tk58-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 10px}.tk58-toolbar label{display:flex;gap:6px;align-items:center}.tk58-forfeit-bottom{box-shadow:inset 3px 0 0 #f59e0b}.tk58-rank-row{display:grid;grid-template-columns:36px 1fr auto;gap:10px;align-items:center;padding:9px;border-bottom:1px solid #24435e}.tk58-rank-row span{display:flex;flex-direction:column}.tk58-rank-row small{opacity:.75;margin-top:3px}.tk58-rank-row em{font-style:normal;font-weight:800;color:#48e7ca}.tk58-report-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}.tk58-report-controls label{display:flex;flex-direction:column;gap:5px}.tk58-preview{max-height:58vh;overflow:auto;background:#fff;color:#10233b;padding:16px;border-radius:12px}.tk58-preview table{width:100%;border-collapse:collapse}.tk58-preview th,.tk58-preview td{border:1px solid #b8c9d6;padding:6px}.tk58-preview .top{background:#fff8d8}.tk58-preview .reason{border-left:4px solid #1593c5;padding:8px;margin:8px 0}.tk58-preview header{display:flex;gap:16px;align-items:center}.tk58-preview header img{max-width:90px;max-height:65px}.tk58-preview .sign{width:380px;margin:30px 0 0 auto;text-align:center}.tk58-preview .space{height:55px}@media(max-width:760px){.tk58-report-controls{grid-template-columns:1fr}.tk58-toolbar{align-items:stretch}}`;document.head.appendChild(s)}


function publicBootFix(){const h=location.hash;if(h==='#spectator'||h==='#register'){document.getElementById('login-screen')?.classList.add('hidden');document.getElementById('app-shell')?.classList.add('hidden');document.getElementById('public-spectator')?.classList.toggle('hidden',h!=='#spectator');document.getElementById('public-register')?.classList.toggle('hidden',h!=='#register');}}
window.addEventListener('hashchange',()=>setTimeout(publicBootFix,0));

function hook(){style();stamp();publicBootFix();ensureStandingsRenderer();ensureRankingToolbar();renderStandings();patchPublicLinks();if(location.hash==='#spectator')renderPublicStandings();const baseAll=App.renderAll?.bind(App);if(baseAll&&!App.__h58All){App.__h58All=true;App.renderAll=function(...a){const r=baseAll(...a);stamp();ensureRankingToolbar();renderStandings();patchPublicLinks();return r}}const baseTab=App.showTab?.bind(App);if(baseTab&&!App.__h58Tab){App.__h58Tab=true;App.showTab=function(tab,...a){const r=baseTab(tab,...a);if(tab==='settings')setTimeout(patchPublicLinks,0);if(tab==='overview')setTimeout(()=>{ensureStandingsRenderer();ensureRankingToolbar();renderStandings()},0);return r}}}
hook();window.TopkeyLifecycle?.bind(()=>{stamp();ensureStandingsRenderer();renderStandings();patchPublicLinks(),{settleTicks:6,settleEvery:300,debounceMs:60});window.__TOPKEY_H58_STATUS='installed';
window.TopkeyUpgrade122Hotfix58={VERSION,CACHE_TAG,ranking,groupBuckets,renderStandings,ensureStandingsRenderer,renderPublicStandings,canonicalMatches,isAdministrativeLoss,reorderMatches,matchForScheduleRow,reportHtml,csvText};
})();
