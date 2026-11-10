(()=>{
'use strict';
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const CACHE_TAG='u122h47-20261104';
const BUILD='upgrade122';
window.__TOPKEY_BOOT_VERSION=VERSION;window.__TOPKEY_BOOT_CACHE=CACHE_TAG;
let installed=false;
function install(){
  const T=window.Topkey,App=T?.App;if(installed||!T||!App)return false;
  installed=true;App.__u122h44Installed=true;
  const COUNTED=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
  const norm=v=>App.normalizeCategory?App.normalizeCategory(v):String(v||'MIX').toUpperCase();
  const isGroup=m=>{const s=String(m?.stage||'GROUP').trim().toUpperCase();return !s||s==='GROUP'||s==='ROUND_ROBIN'||s==='VONG_BANG'||s==='VÒNG BẢNG';};
  const pairKey=(a,b)=>[String(a||''),String(b||'')].sort().join('|');
  const teamLive=id=>App.state.teams?.[id]||null;
  function archiveMap(){
    const out={};const cfg=App.state.config?.withdrawnTeamArchive||{};
    for(const [id,t] of Object.entries(cfg))if(t)out[id]={...t,id:t.id||id,category:norm(t.category),withdrawn:true,deleted:true};
    for(const m of Object.values(App.state.matches||{}))for(const side of ['A','B']){
      const id=side==='A'?m.teamAId:m.teamBId;if(!id||teamLive(id)||out[id])continue;
      const s=side==='A'?m.teamASnapshot:m.teamBSnapshot;if(!s)continue;
      out[id]={...s,id,category:norm(s.category||m.category),withdrawn:s.withdrawn!==false,deleted:true};
    }
    return out;
  }
  function meta(id,archive){
    const t=teamLive(id)||archive[id];if(!t)return null;const p=t.withdrawalPolicy;const mode=typeof p==='string'?p:(p?.mode||'');
    return {id:t.id||id,name:t.name||t.code||('Đội '+id),code:t.code||'',category:norm(t.category),withdrawn:!!t.withdrawn,policy:mode,deleted:!!t.deleted};
  }
  function completeSet(s,m){
    if(!s)return false;if(m.status==='FINISHED'||m.status==='WALKOVER')return Number(s.a)!==Number(s.b);if(s.finished===true)return true;
    try{return !!T.Scoring?.isSetWon?.(Number(s.a)||0,Number(s.b)||0,{...T.DEFAULT_RULES,...App.state.config?.rules});}catch{return false;}
  }
  function realPriority(m){
    const st=String(m?.status||'').toUpperCase();
    if(st==='FINISHED')return 500;if(st==='RETIRED')return 400;if(st==='DISQUALIFIED')return 350;if(st==='WALKOVER')return 300;return 0;
  }
  function timeScore(m){return Number(m?.finishedAt||m?.updatedAt||m?.createdAt||0)||0;}
  function winnerOf(m){
    if(m?.winnerId===m?.teamAId||m?.winnerId===m?.teamBId)return m.winnerId;
    let a=0,b=0;for(const s of (m?.sets||[])){if(!completeSet(s,m))continue;if(Number(s.a)>Number(s.b))a++;else if(Number(s.b)>Number(s.a))b++;}
    return a===b?'':(a>b?m.teamAId:m.teamBId);
  }
  function chooseAuthoritative(list){
    const valid=(list||[]).filter(m=>m&&isGroup(m)&&COUNTED.has(String(m.status||'').toUpperCase())&&winnerOf(m));
    valid.sort((x,y)=>{
      const rv=(x.virtualStandingOnly?0:1000)-(y.virtualStandingOnly?0:1000);if(rv)return -rv;
      const rp=realPriority(y)-realPriority(x);if(rp)return rp;
      return timeScore(y)-timeScore(x);
    });
    return valid[0]||null;
  }
  function makeVirtual(active,withdrawn){
    return {id:`__h44_virtual_wo__${pairKey(active.id,withdrawn.id).replace(/[^a-zA-Z0-9_-]/g,'_')}`,code:'WO*',stage:'GROUP',category:active.category,teamAId:active.id,teamBId:withdrawn.id,status:'WALKOVER',winnerId:active.id,sets:[{a:11,b:0,finished:true},{a:11,b:0,finished:true}],walkoverTeamId:withdrawn.id,walkoverReason:'MISSING_FIXTURE_WITHDRAWN',withdrawalPolicy:'KEEP_PLAYED_WO',virtualStandingOnly:true,teamASnapshot:{...active},teamBSnapshot:{...withdrawn}};
  }
  function pairResults(category=null){
    const archive=archiveMap(),all={};
    for(const [id] of Object.entries(App.state.teams||{})){const x=meta(id,archive);if(x)all[id]=x;}
    for(const [id] of Object.entries(archive))if(!all[id]){const x=meta(id,archive);if(x)all[id]=x;}
    const groups=new Map();
    for(const m of Object.values(App.state.matches||{})){
      if(!m||!isGroup(m)||!m.teamAId||!m.teamBId)continue;
      const k=pairKey(m.teamAId,m.teamBId),arr=groups.get(k)||[];arr.push(m);groups.set(k,arr);
    }
    const selected=new Map();
    for(const [k,list] of groups){const m=chooseAuthoritative(list);if(m)selected.set(k,m);}
    const teams=Object.values(all).filter(t=>!category||t.category===norm(category));
    for(let i=0;i<teams.length;i++)for(let j=i+1;j<teams.length;j++){
      const a=teams[i],b=teams[j];if(a.category!==b.category)continue;
      const k=pairKey(a.id,b.id);if(selected.has(k))continue;
      const withdrawn=a.withdrawn?a:(b.withdrawn?b:null),active=!a.withdrawn?a:(!b.withdrawn?b:null);if(!withdrawn||!active)continue;
      if(withdrawn.policy!=='KEEP_PLAYED_WO')continue;
      const raw=groups.get(k)||[];
      if(raw.some(x=>x.excludeFromStandings===true||x.manualNoStanding===true||String(x.cancelReason||'').toUpperCase()==='ADMIN_EXCLUDE_STANDINGS'))continue;
      selected.set(k,makeVirtual(active,withdrawn));
    }
    return {archive,all,selected,groups};
  }
  function canonicalRanking(arg={}){
    const category=typeof arg==='string'?arg:(arg?.category||null),cat=category?norm(category):null;
    const {archive,selected,groups}=pairResults(cat),rows={},anomalies=[],contrib={};
    for(const t of Object.values(App.state.teams||{})){
      const c=norm(t.category);if(cat&&c!==cat)continue;
      rows[t.id]={id:t.id,name:t.name,category:c,withdrawn:!!t.withdrawn,eligible:!t.withdrawn,played:0,w:0,l:0,setsFor:0,setsAgainst:0,pointsFor:0,pointsAgainst:0,points:0,virtualWO:0};contrib[t.id]=[];
    }
    // Deleted withdrawn teams may still appear so historical losses/WO remain visible.
    for(const [id,t] of Object.entries(archive))if(!rows[id]&&(!cat||norm(t.category)===cat)){
      rows[id]={id,name:t.name||t.code||('Đội '+id),category:norm(t.category),withdrawn:true,eligible:false,played:0,w:0,l:0,setsFor:0,setsAgainst:0,pointsFor:0,pointsAgainst:0,points:0,virtualWO:0};contrib[id]=[];
    }
    const counted=[];
    for(const [pk,m] of selected){
      const A=rows[m.teamAId]||null,B=rows[m.teamBId]||null;if(!A&&!B)continue;
      const mc=norm(m.category||A?.category||B?.category||'MIX');if(cat&&mc!==cat)continue;
      const winner=winnerOf(m);if(!winner){anomalies.push({type:'MISSING_WINNER',pair:pk,matchId:m.id});continue;}
      let pA=0,pB=0,sAf=0,sAa=0,sBf=0,sBa=0;
      const sets=(m.sets&&m.sets.length)?m.sets:(String(m.status).toUpperCase()==='WALKOVER'?[{a:11,b:0,finished:true},{a:11,b:0,finished:true}]:[]);
      for(const s of sets){const a=Number(s?.a)||0,b=Number(s?.b)||0;pA+=a;pB+=b;if(completeSet(s,m)){if(a>b){sAf++;sBa++;}else if(b>a){sBf++;sAa++;}}}
      if(A){A.played++;A.pointsFor+=pA;A.pointsAgainst+=pB;A.setsFor+=sAf;A.setsAgainst+=sAa;if(m.virtualStandingOnly)A.virtualWO++;}
      if(B){B.played++;B.pointsFor+=pB;B.pointsAgainst+=pA;B.setsFor+=sBf;B.setsAgainst+=sBa;if(m.virtualStandingOnly)B.virtualWO++;}
      const loser=winner===m.teamAId?m.teamBId:m.teamAId;
      if(winner===m.teamAId){if(A)A.w++;if(B)B.l++;}else{if(B)B.w++;if(A)A.l++;}
      if(rows[winner])rows[winner].points=rows[winner].w; // TOPKEY rule: 1 point per win, including WO.
      if(rows[loser])rows[loser].points=rows[loser].w;   // Loss contributes 0 ranking points.
      if(contrib[m.teamAId])contrib[m.teamAId].push({pair:pk,matchId:m.id,status:m.status,result:winner===m.teamAId?'W':'L',points:winner===m.teamAId?1:0,virtual:!!m.virtualStandingOnly});
      if(contrib[m.teamBId])contrib[m.teamBId].push({pair:pk,matchId:m.id,status:m.status,result:winner===m.teamBId?'W':'L',points:winner===m.teamBId?1:0,virtual:!!m.virtualStandingOnly});
      counted.push(m);
    }
    // Hard invariant: one point per win. This prevents legacy config or WO values from mixing scoring systems.
    for(const r of Object.values(rows)){r.points=r.w;if(r.played!==r.w+r.l)anomalies.push({type:'PLAYED_WL_MISMATCH',teamId:r.id,played:r.played,w:r.w,l:r.l});}
    const head=(a,b)=>{const m=[...counted].reverse().find(x=>pairKey(x.teamAId,x.teamBId)===pairKey(a.id,b.id));if(!m)return 0;const w=winnerOf(m);return w===a.id?-1:w===b.id?1:0;};
    const cmp=(a,b)=>{if(b.points!==a.points)return b.points-a.points;const rules={...T.DEFAULT_RULES,...App.state.config?.rules};for(const key of (rules.tieBreakers||T.DEFAULT_RULES.tieBreakers)){if(key==='headToHead'){const h=head(a,b);if(h)return h;}else if(key==='setDiff'){const d=(b.setsFor-b.setsAgainst)-(a.setsFor-a.setsAgainst);if(d)return d;}else if(key==='pointDiff'){const d=(b.pointsFor-b.pointsAgainst)-(a.pointsFor-a.pointsAgainst);if(d)return d;}else if(key==='name'){const d=String(a.name||'').localeCompare(String(b.name||''),'vi');if(d)return d;}}return 0;};
    const result=Object.values(rows).sort(cmp);result.anomalies=anomalies;result.countedMatches=counted.length;result.contributions=contrib;result.pairGroups=groups;result.virtualFixtures=counted.filter(m=>m.virtualStandingOnly);return result;
  }
  App.ranking=function(arg){return canonicalRanking(typeof arg==='string'?{category:arg}:(arg||{}));};
  App.rankingAll=category=>canonicalRanking({category});
  App.rankingEligible=function(arg){const rows=canonicalRanking(typeof arg==='string'?{category:arg}:(arg||{}));const f=rows.filter(r=>!r.withdrawn);f.anomalies=rows.anomalies;f.countedMatches=rows.countedMatches;f.contributions=rows.contributions;f.virtualFixtures=rows.virtualFixtures;return f;};
  App.auditStandingTeam=function(teamId,category){const rows=canonicalRanking({category}),r=rows.find(x=>x.id===teamId);return{team:r||null,contributions:rows.contributions?.[teamId]||[],anomalies:rows.anomalies||[]};};
  function stamp(){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=document.getElementById('health-version');if(h)h.textContent=VERSION;}
  stamp();setTimeout(stamp,0);window.addEventListener('focus',stamp,{passive:true});window.addEventListener('pageshow',()=>setTimeout(stamp,0),{passive:true});
  window.TopkeyUpgrade122Hotfix44={installed:true,VERSION,CACHE_TAG,canonicalRanking,pairResults,rules:{oneAuthoritativeResultPerPair:true,standingPointPerWin:1,standingLossPoints:0,walkoverWinPoints:1}};
  return true;
}
if(!install()){window.addEventListener('topkey:admin-ready',install,{once:true});let n=0;const t=setInterval(()=>{if(install()||++n>=40)clearInterval(t)},250);}
})();
