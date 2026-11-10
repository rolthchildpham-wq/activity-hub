(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||App.__u122h38Installed)return;
App.__u122h38Installed=true;
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const CACHE_TAG='u122h47-20261104';
const BUILD='upgrade122';
const COUNTED=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
const norm=v=>App.normalizeCategory?App.normalizeCategory(v):String(v||'MIX').toUpperCase();
const clone=v=>JSON.parse(JSON.stringify(v??null));

function isGroup(m){const s=String(m?.stage||'GROUP').trim().toUpperCase();return !s||s==='GROUP'||s==='ROUND_ROBIN'||s==='VONG_BANG'||s==='VÒNG BẢNG';}
function categoryOfMatch(m){
  const a=App.state.teams?.[m?.teamAId],b=App.state.teams?.[m?.teamBId];
  const ca=a?norm(a.category):'',cb=b?norm(b.category):'',cm=norm(m?.category||ca||cb||'MIX');
  if(ca&&cb&&ca===cb)return ca;
  return cm;
}
function setIsComplete(s,m){
  if(!s)return false;
  if(m?.status==='FINISHED'||m?.status==='WALKOVER')return Number(s.a)!==Number(s.b);
  if(s.finished===true)return true;
  try{return !!T.Scoring?.isSetWon?.(Number(s.a)||0,Number(s.b)||0,{...T.DEFAULT_RULES,...App.state.config?.rules});}catch{return false;}
}
function canonicalRanking({includeWithdrawn=false,category=null}={}){
  const rules={...T.DEFAULT_RULES,...App.state.config?.rules},rows={},anomalies=[];
  Object.values(App.state.teams||{}).forEach(t=>{
    const cat=norm(t.category);
    if(category&&cat!==norm(category))return;
    rows[t.id]={id:t.id,name:t.name,category:cat,withdrawn:!!t.withdrawn,eligible:!t.withdrawn,withdrawalPolicy:t.withdrawalPolicy?.mode||'',played:0,w:0,l:0,setsFor:0,setsAgainst:0,pointsFor:0,pointsAgainst:0,points:0};
  });
  const completed=Object.values(App.state.matches||{}).filter(m=>COUNTED.has(String(m.status||'').toUpperCase())&&isGroup(m));
  const counted=[];
  for(const m of completed){
    const A=rows[m.teamAId],B=rows[m.teamBId];
    if(!A||!B)continue;
    const cat=categoryOfMatch(m);
    if(A.category!==B.category){anomalies.push({type:'CATEGORY_TEAM_MISMATCH',matchId:m.id,code:m.code,a:A.category,b:B.category,matchCategory:norm(m.category)});continue;}
    if(cat!==A.category){anomalies.push({type:'CATEGORY_MATCH_MISMATCH',matchId:m.id,code:m.code,teamCategory:A.category,matchCategory:norm(m.category)});}
    let aw=0,bw=0,pA=0,pB=0,sAf=0,sAa=0,sBf=0,sBa=0;
    for(const s of (m.sets||[])){
      const a=Number(s?.a)||0,b=Number(s?.b)||0;
      pA+=a;pB+=b;
      if(setIsComplete(s,m)){
        if(a>b){sAf++;sBa++;aw++;}
        else if(b>a){sBf++;sAa++;bw++;}
      }
    }
    let winner=m.winnerId;
    if(!winner&&m.status==='FINISHED'&&aw!==bw)winner=aw>bw?m.teamAId:m.teamBId;
    if(winner!==m.teamAId&&winner!==m.teamBId){
      anomalies.push({type:'MISSING_WINNER',matchId:m.id,code:m.code,status:m.status,aw,bw});
      // Do not invent a winner. Also do not count played/W-L/points for an ambiguous result.
      continue;
    }
    A.pointsFor+=pA;A.pointsAgainst+=pB;B.pointsFor+=pB;B.pointsAgainst+=pA;
    A.setsFor+=sAf;A.setsAgainst+=sAa;B.setsFor+=sBf;B.setsAgainst+=sBa;
    A.played++;B.played++;
    const wp=m.status==='WALKOVER'?Number(rules.walkoverWinPoints)||0:Number(rules.winPoints)||0;
    const lp=Number(rules.lossPoints)||0;
    if(winner===m.teamAId){A.w++;B.l++;A.points+=wp;B.points+=lp;}else{B.w++;A.l++;B.points+=wp;A.points+=lp;}
    counted.push(m);
  }
  const head=(a,b)=>{
    const m=[...counted].reverse().find(x=>(x.teamAId===a.id&&x.teamBId===b.id)||(x.teamAId===b.id&&x.teamBId===a.id));
    if(!m)return 0;return m.winnerId===a.id?-1:m.winnerId===b.id?1:0;
  };
  const cmp=(a,b)=>{
    if(b.points!==a.points)return b.points-a.points;
    for(const key of (rules.tieBreakers||T.DEFAULT_RULES.tieBreakers)){
      if(key==='headToHead'){const h=head(a,b);if(h)return h;}
      else if(key==='setDiff'){const d=(b.setsFor-b.setsAgainst)-(a.setsFor-a.setsAgainst);if(d)return d;}
      else if(key==='pointDiff'){const d=(b.pointsFor-b.pointsAgainst)-(a.pointsFor-a.pointsAgainst);if(d)return d;}
      else if(key==='name'){const d=String(a.name||'').localeCompare(String(b.name||''),'vi');if(d)return d;}
    }
    return 0;
  };
  const result=Object.values(rows).sort(cmp);
  result.anomalies=anomalies;result.countedMatches=counted.length;return result;
}

App.ranking=function(arg){
  if(typeof arg==='string')return canonicalRanking({category:arg});
  if(arg&&typeof arg==='object')return canonicalRanking(arg);
  return canonicalRanking();
};
App.rankingAll=function(category){return canonicalRanking({category});};
App.rankingEligible=function(arg){
  const rows=typeof arg==='string'?canonicalRanking({category:arg}):arg&&typeof arg==='object'?canonicalRanking(arg):canonicalRanking();
  const filtered=rows.filter(r=>!r.withdrawn);
  filtered.anomalies=rows.anomalies;filtered.countedMatches=rows.countedMatches;return filtered;
};

// Keep category tabs compatible, but make category comparison canonical for legacy WOMEN labels.
const baseRenderStandings=App.renderStandings?.bind(App);
if(baseRenderStandings)App.renderStandings=function(...args){const out=baseRenderStandings(...args);try{const cat=this.quickStandingCategory;if(cat){const rows=this.ranking(cat),box=document.getElementById('standings-list');if(box){box.replaceChildren();if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=7;td.className='tk12-empty';td.textContent='Chưa có dữ liệu BXH trong nội dung này.';tr.appendChild(td);box.appendChild(tr);}else rows.forEach((r,i)=>{const tr=document.createElement('tr');[i+1,r.name+(r.withdrawn?' · BỎ CUỘC':''),r.played,`${r.w}-${r.l}`,r.setsFor-r.setsAgainst,r.pointsFor-r.pointsAgainst,r.points].forEach(x=>{const td=document.createElement('td');td.textContent=x;tr.appendChild(td)});box.appendChild(tr);});}}}catch(e){console.warn('H38 render standings',e);}return out;};

// Qualification is separate from standings: withdrawn teams keep earned statistics, but cannot advance.
const baseGenerateKnockout=App.generateKnockout?.bind(App);
if(baseGenerateKnockout)App.generateKnockout=async function(){
  const original=this.ranking;
  try{this.ranking=(...args)=>this.rankingEligible(...args);return await baseGenerateKnockout();}
  finally{this.ranking=original;}
};
const baseRenderTop3=App.renderTop3?.bind(App);
if(baseRenderTop3)App.renderTop3=function(){
  const original=this.ranking;
  try{this.ranking=(...args)=>this.rankingEligible(...args);return baseRenderTop3();}
  finally{this.ranking=original;}
};
const baseFinishTournament=App.finishTournament?.bind(App);
if(baseFinishTournament)App.finishTournament=async function(){
  const original=this.ranking;
  try{this.ranking=(...args)=>this.rankingEligible(...args);return await baseFinishTournament();}
  finally{this.ranking=original;}
};

function audit(){
  const categories=['MEN','WOMEN','MIX'];
  const report={version:VERSION,categories:{},withdrawnTeams:[],invalidMatches:[]};
  for(const c of categories){const rows=canonicalRanking({includeWithdrawn:true,category:c});report.categories[c]={standings:rows,eligible:rows.filter(r=>!r.withdrawn),withdrawn:rows.filter(r=>r.withdrawn),countedMatches:rows.countedMatches,anomalies:rows.anomalies};report.invalidMatches.push(...rows.anomalies);}
  report.withdrawnTeams=Object.values(App.state.teams||{}).filter(t=>t.withdrawn).map(t=>({id:t.id,code:t.code,name:t.name,category:norm(t.category),policy:t.withdrawalPolicy?.mode||'UNKNOWN'}));
  return report;
}
function stamp(){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=document.getElementById('health-version');if(h)h.textContent=VERSION;}
stamp();window.addEventListener('topkey:admin-ready',()=>{stamp();try{App.renderStandings?.();}catch{}},{passive:true});
window.TopkeyUpgrade122Hotfix38={installed:true,VERSION,CACHE_TAG,canonicalRanking,audit,rules:{standingsStage:'GROUP_ONLY',categories:'ISOLATED',withdrawnStandings:'KEEP_BY_POLICY',withdrawnQualification:false,walkover:'2-0 / 11-0,11-0',cancelled:'NOT_COUNTED',retired:'MATCH_WIN_TO_OPPONENT; ONLY_COMPLETED_SETS_COUNT_FOR_SET_DIFF; ACTUAL_POINTS_RECORDED',missingWinner:'SKIP_AND_FLAG'}};
})();
