(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__u122h40Installed)return;
App.__u122h40Installed=true;
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const CACHE_TAG='u122h47-20261104';
const BUILD='upgrade122';
const COUNTED=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
const norm=v=>App.normalizeCategory?App.normalizeCategory(v):String(v||'MIX').toUpperCase();
const clone=v=>JSON.parse(JSON.stringify(v??null));
function isGroup(m){const s=String(m?.stage||'GROUP').trim().toUpperCase();return !s||s==='GROUP'||s==='ROUND_ROBIN'||s==='VONG_BANG'||s==='VÒNG BẢNG';}
function teamSnapshot(id){const t=App.state.teams?.[id];return t?{id:t.id,code:t.code||'',name:t.name||'',category:norm(t.category),withdrawn:!!t.withdrawn}:null;}
function snapFor(m,side){
  const id=side==='A'?m.teamAId:m.teamBId;
  const live=teamSnapshot(id);if(live)return live;
  const s=side==='A'?m.teamASnapshot:m.teamBSnapshot;
  if(s)return{id:id||s.id,code:s.code||'',name:s.name||'',category:norm(s.category||m.category),withdrawn:true,deleted:true};
  return{id,code:'',name:(side==='A'?(m.teamAName||m.teamA||''):(m.teamBName||m.teamB||''))||'Đội đã xóa',category:norm(m.category||'MIX'),withdrawn:true,deleted:true};
}
function withSnapshots(m){return{...m,teamASnapshot:m.teamASnapshot||teamSnapshot(m.teamAId)||snapFor(m,'A'),teamBSnapshot:m.teamBSnapshot||teamSnapshot(m.teamBId)||snapFor(m,'B')};}
function setIsComplete(s,m){
  if(!s)return false;
  if(m?.status==='FINISHED'||m?.status==='WALKOVER')return Number(s.a)!==Number(s.b);
  if(s.finished===true)return true;
  try{return !!T.Scoring?.isSetWon?.(Number(s.a)||0,Number(s.b)||0,{...T.DEFAULT_RULES,...App.state.config?.rules});}catch{return false;}
}
function canonicalRanking({category=null}={}){
  const rules={...T.DEFAULT_RULES,...App.state.config?.rules},rows={},anomalies=[],counted=[];
  Object.values(App.state.teams||{}).forEach(t=>{const cat=norm(t.category);if(category&&cat!==norm(category))return;rows[t.id]={id:t.id,name:t.name,category:cat,withdrawn:!!t.withdrawn,eligible:!t.withdrawn,withdrawalPolicy:t.withdrawalPolicy?.mode||'',played:0,w:0,l:0,setsFor:0,setsAgainst:0,pointsFor:0,pointsAgainst:0,points:0};});
  for(const raw of Object.values(App.state.matches||{})){
    const m=withSnapshots(raw);if(!COUNTED.has(String(m.status||'').toUpperCase())||!isGroup(m))continue;
    const A=rows[m.teamAId]||null,B=rows[m.teamBId]||null;if(!A&&!B)continue;
    const sa=snapFor(m,'A'),sb=snapFor(m,'B');
    const matchCat=norm(m.category||sa.category||sb.category||A?.category||B?.category||'MIX');
    if(category&&matchCat!==norm(category))continue;
    if(A&&A.category!==matchCat)anomalies.push({type:'CATEGORY_MATCH_MISMATCH',matchId:m.id,teamId:A.id,teamCategory:A.category,matchCategory:matchCat});
    if(B&&B.category!==matchCat)anomalies.push({type:'CATEGORY_MATCH_MISMATCH',matchId:m.id,teamId:B.id,teamCategory:B.category,matchCategory:matchCat});
    let aw=0,bw=0,pA=0,pB=0,sAf=0,sAa=0,sBf=0,sBa=0;
    for(const s of (m.sets||[])){const a=Number(s?.a)||0,b=Number(s?.b)||0;pA+=a;pB+=b;if(setIsComplete(s,m)){if(a>b){sAf++;sBa++;aw++;}else if(b>a){sBf++;sAa++;bw++;}}}
    let winner=m.winnerId;if(!winner&&m.status==='FINISHED'&&aw!==bw)winner=aw>bw?m.teamAId:m.teamBId;
    if(winner!==m.teamAId&&winner!==m.teamBId){anomalies.push({type:'MISSING_WINNER',matchId:m.id,code:m.code,status:m.status,aw,bw});continue;}
    if(A){A.pointsFor+=pA;A.pointsAgainst+=pB;A.setsFor+=sAf;A.setsAgainst+=sAa;A.played++;}
    if(B){B.pointsFor+=pB;B.pointsAgainst+=pA;B.setsFor+=sBf;B.setsAgainst+=sBa;B.played++;}
    const wp=m.status==='WALKOVER'?Number(rules.walkoverWinPoints)||0:Number(rules.winPoints)||0,lp=Number(rules.lossPoints)||0;
    if(winner===m.teamAId){if(A){A.w++;A.points+=wp;}if(B){B.l++;B.points+=lp;}}else{if(B){B.w++;B.points+=wp;}if(A){A.l++;A.points+=lp;}}
    counted.push(m);
  }
  const head=(a,b)=>{const m=[...counted].reverse().find(x=>(x.teamAId===a.id&&x.teamBId===b.id)||(x.teamAId===b.id&&x.teamBId===a.id));if(!m)return 0;return m.winnerId===a.id?-1:m.winnerId===b.id?1:0;};
  const cmp=(a,b)=>{if(b.points!==a.points)return b.points-a.points;for(const key of (rules.tieBreakers||T.DEFAULT_RULES.tieBreakers)){if(key==='headToHead'){const h=head(a,b);if(h)return h;}else if(key==='setDiff'){const d=(b.setsFor-b.setsAgainst)-(a.setsFor-a.setsAgainst);if(d)return d;}else if(key==='pointDiff'){const d=(b.pointsFor-b.pointsAgainst)-(a.pointsFor-a.pointsAgainst);if(d)return d;}else if(key==='name'){const d=String(a.name||'').localeCompare(String(b.name||''),'vi');if(d)return d;}}return 0;};
  const result=Object.values(rows).sort(cmp);result.anomalies=anomalies;result.countedMatches=counted.length;return result;
}
App.ranking=function(arg){if(typeof arg==='string')return canonicalRanking({category:arg});if(arg&&typeof arg==='object')return canonicalRanking(arg);return canonicalRanking();};
App.rankingAll=function(category){return canonicalRanking({category});};
App.rankingEligible=function(arg){const rows=typeof arg==='string'?canonicalRanking({category:arg}):arg&&typeof arg==='object'?canonicalRanking(arg):canonicalRanking();const filtered=rows.filter(r=>!r.withdrawn);filtered.anomalies=rows.anomalies;filtered.countedMatches=rows.countedMatches;return filtered;};

// Persist team snapshots whenever a withdrawal policy is written so later team deletion cannot erase history.
if(T.Data?.queueMulti&&!T.Data.__h40SnapshotQueue){
  T.Data.__h40SnapshotQueue=true;const base=T.Data.queueMulti.bind(T.Data);
  T.Data.queueMulti=async function(updates,meta){
    if(meta?.type==='TEAM_WITHDRAW_POLICY'&&updates&&typeof updates==='object'){
      let tid='';for(const [p,v] of Object.entries(updates)){const mm=String(p).match(/\/teams\/([^/]+)$/);if(mm&&v?.withdrawn){tid=mm[1];break;}}
      if(tid){for(const m0 of Object.values(App.state.matches||{})){if(m0.teamAId!==tid&&m0.teamBId!==tid)continue;const p=T.Data.path('matches/'+m0.id),existing=updates[p];updates[p]=withSnapshots(existing&&typeof existing==='object'?existing:m0);}}
    }
    return base(updates,meta);
  };
}

// Safe deletion: withdrawn teams may be removed from roster while match history stays intact.
const baseDelete=App.deleteTeam?.bind(App);
if(baseDelete&&!App.__h40DeleteInstalled){
  App.__h40DeleteInstalled=true;
  App.deleteTeam=async function(id){
    const t=this.state.teams?.[id];if(!t)return;const refs=Object.values(this.state.matches||{}).filter(m=>m.teamAId===id||m.teamBId===id);
    if(!t.withdrawn||!refs.length)return baseDelete(id);
    const ok=await U.confirmDanger('Xóa đội bỏ cuộc '+t.name,`Giữ nguyên ${refs.length} trận lịch sử, tỷ số và kết quả của các đối thủ. Đội chỉ bị xóa khỏi danh sách đội.`,'');if(!ok)return;
    const updates={};for(const m of refs)updates[T.Data.path('matches/'+m.id)]=withSnapshots(m);updates[T.Data.path('teams/'+id)]=null;
    await T.Data.queueMulti(updates,{type:'WITHDRAWN_TEAM_DELETE_KEEP_HISTORY'});await T.Data.audit('DELETE_WITHDRAWN_KEEP_HISTORY','team',id,t,{deleted:true,preservedMatches:refs.length});U.toast(`Đã xóa ${t.name} khỏi danh sách; giữ nguyên ${refs.length} trận lịch sử/BXH.`,'ok');
  };
}

const baseRenderStandings=App.renderStandings?.bind(App);
if(baseRenderStandings&&!App.__h40StandingsRender){App.__h40StandingsRender=true;App.renderStandings=function(...args){const out=baseRenderStandings(...args);try{const cat=this.quickStandingCategory;if(cat){const rows=this.ranking(cat),box=document.getElementById('standings-list');if(box){box.replaceChildren();rows.forEach((r,i)=>{const tr=document.createElement('tr');[i+1,r.name+(r.withdrawn?' · BỎ CUỘC':''),r.played,`${r.w}-${r.l}`,r.setsFor-r.setsAgainst,r.pointsFor-r.pointsAgainst,r.points].forEach(x=>{const td=document.createElement('td');td.textContent=x;tr.appendChild(td)});box.appendChild(tr);});}}}catch(e){console.warn('H40 standings',e);}return out;};}
function auditTeam(teamId){const all=Object.values(App.state.matches||{}).filter(m=>m.teamAId===teamId||m.teamBId===teamId),counted=[],skipped=[];for(const m of all){if(!isGroup(m)){skipped.push({id:m.id,code:m.code,reason:'NOT_GROUP',status:m.status});continue;}if(!COUNTED.has(String(m.status||'').toUpperCase())){skipped.push({id:m.id,code:m.code,reason:'STATUS_'+String(m.status||''),status:m.status});continue;}const w=m.winnerId;if(w!==m.teamAId&&w!==m.teamBId&&!(m.status==='FINISHED'&&(m.sets||[]).length)){skipped.push({id:m.id,code:m.code,reason:'MISSING_WINNER',status:m.status});continue;}counted.push({id:m.id,code:m.code,status:m.status,opponent:m.teamAId===teamId?m.teamBId:m.teamAId,winner:m.winnerId});}return{teamId,totalRelated:all.length,counted:counted.length,skipped:skipped.length,countedMatches:counted,skippedMatches:skipped};}
function stamp(){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=document.getElementById('health-version');if(h)h.textContent=VERSION;}
stamp();window.addEventListener('topkey:admin-ready',()=>{stamp();try{App.renderStandings?.();}catch{}},{passive:true});
window.TopkeyUpgrade122Hotfix40={installed:true,VERSION,CACHE_TAG,canonicalRanking,auditTeam,withSnapshots,rules:{historicalMatchIndependentOfTeamRecord:true,withdrawnDeleteKeepsHistory:true,groupOnly:true}};
})();
