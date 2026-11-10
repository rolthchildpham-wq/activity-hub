(()=>{
'use strict';
const VERSION='2026.11.04-vnext-upgrade122-hotfix47-withdrawal-legacy-recovery';
const CACHE_TAG='u122h47-20261104';
const BUILD='upgrade122';
window.__TOPKEY_BOOT_VERSION=VERSION;window.__TOPKEY_BOOT_CACHE=CACHE_TAG;
let installed=false;
function install(){
  const T=window.Topkey,App=T?.App,U=T?.U;if(installed||!T||!App||!U)return false;
  installed=true;App.__u122h43Installed=true;
  const COUNTED=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
  const norm=v=>App.normalizeCategory?App.normalizeCategory(v):String(v||'MIX').toUpperCase();
  const isGroup=m=>{const s=String(m?.stage||'GROUP').trim().toUpperCase();return !s||s==='GROUP'||s==='ROUND_ROBIN'||s==='VONG_BANG'||s==='VÒNG BẢNG';};
  const pairKey=(a,b)=>[String(a||''),String(b||'')].sort().join('|');
  const teamLive=id=>App.state.teams?.[id]||null;
  function archivedTeams(){
    const out={};
    const a=App.state.config?.withdrawnTeamArchive||{};
    for(const [id,t] of Object.entries(a||{}))if(t)out[id]={...t,id:t.id||id,category:norm(t.category),withdrawn:true,deleted:true};
    for(const m of Object.values(App.state.matches||{})){
      for(const side of ['A','B']){
        const id=side==='A'?m.teamAId:m.teamBId;if(!id||teamLive(id)||out[id])continue;
        const s=side==='A'?m.teamASnapshot:m.teamBSnapshot;if(!s)continue;
        const pol=s.withdrawalPolicy||m.withdrawalPolicy||'';
        out[id]={...s,id,category:norm(s.category||m.category),withdrawn:s.withdrawn!==false,deleted:true,withdrawalPolicy:typeof pol==='string'?{mode:pol}:pol};
      }
    }
    return out;
  }
  function teamMeta(id,archive){
    const t=teamLive(id)||archive[id];if(!t)return null;
    const p=t.withdrawalPolicy;const mode=typeof p==='string'?p:(p?.mode||'');
    return {id:t.id||id,name:t.name||t.code||'Đội '+id,code:t.code||'',category:norm(t.category),withdrawn:!!t.withdrawn,policy:mode,deleted:!!t.deleted};
  }
  function snapFor(m,side,archive){
    const id=side==='A'?m.teamAId:m.teamBId,live=teamMeta(id,archive);if(live)return live;
    const s=side==='A'?m.teamASnapshot:m.teamBSnapshot;
    if(s){const pol=s.withdrawalPolicy||m.withdrawalPolicy||'';return{id:id||s.id,name:s.name||s.code||'Đội đã xóa',code:s.code||'',category:norm(s.category||m.category),withdrawn:s.withdrawn!==false,deleted:true,policy:typeof pol==='string'?pol:(pol?.mode||'')};}
    return{id,name:(side==='A'?(m.teamAName||m.teamA):(m.teamBName||m.teamB))||'Đội đã xóa',code:'',category:norm(m.category),withdrawn:true,deleted:true,policy:typeof m.withdrawalPolicy==='string'?m.withdrawalPolicy:''};
  }
  function completeSet(s,m){if(!s)return false;if(m.status==='FINISHED'||m.status==='WALKOVER')return Number(s.a)!==Number(s.b);if(s.finished===true)return true;try{return !!T.Scoring?.isSetWon?.(Number(s.a)||0,Number(s.b)||0,{...T.DEFAULT_RULES,...App.state.config?.rules});}catch{return false;}}
  function makeVirtual(active,withdrawn){
    return {id:`__virtual_wo__${pairKey(active.id,withdrawn.id).replace(/[^a-zA-Z0-9_-]/g,'_')}`,code:'WO*',stage:'GROUP',category:active.category,teamAId:active.id,teamBId:withdrawn.id,status:'WALKOVER',winnerId:active.id,sets:[{a:11,b:0,finished:true},{a:11,b:0,finished:true}],walkoverTeamId:withdrawn.id,walkoverReason:'MISSING_FIXTURE_WITHDRAWN',withdrawalPolicy:'KEEP_PLAYED_WO',virtualStandingOnly:true,teamASnapshot:{...active},teamBSnapshot:{...withdrawn}};
  }
  function buildVirtualFixtures(category=null){
    const archive=archivedTeams(),all={};
    for(const [id,t] of Object.entries(App.state.teams||{})){const x=teamMeta(id,archive);if(x)all[id]=x;}
    for(const [id,t] of Object.entries(archive))if(!all[id])all[id]=teamMeta(id,archive);
    const existing=new Map();
    for(const m of Object.values(App.state.matches||{})){
      if(!m||!isGroup(m)||!m.teamAId||!m.teamBId)continue;
      const k=pairKey(m.teamAId,m.teamBId),arr=existing.get(k)||[];arr.push(m);existing.set(k,arr);
    }
    const teams=Object.values(all).filter(t=>!category||t.category===norm(category)),virtual=[];
    for(let i=0;i<teams.length;i++)for(let j=i+1;j<teams.length;j++){
      const a=teams[i],b=teams[j];if(a.category!==b.category)continue;
      const withdrawn=a.withdrawn?a:(b.withdrawn?b:null),active=!a.withdrawn?a:(!b.withdrawn?b:null);if(!withdrawn||!active)continue;
      if(withdrawn.policy!=='KEEP_PLAYED_WO')continue;
      const pairMatches=existing.get(pairKey(a.id,b.id))||[];
      // Any already-counted result is authoritative and must never be double-counted.
      if(pairMatches.some(m=>COUNTED.has(String(m.status||'').toUpperCase())))continue;
      // Policy 2 is authoritative for an uncounted/missing pairing. Historical
      // CANCELLED/UNPLAYED placeholders may remain in Firebase even when they
      // no longer appear in the schedule UI; they must not suppress the WO.
      const explicitlyExcluded=pairMatches.some(ex=>ex.excludeFromStandings===true||ex.manualNoStanding===true||String(ex.cancelReason||'').toUpperCase()==='ADMIN_EXCLUDE_STANDINGS');
      if(explicitlyExcluded)continue;
      virtual.push(makeVirtual(active,withdrawn));
    }
    return virtual;
  }
  function canonicalRanking({category=null}={}){
    const rules={...T.DEFAULT_RULES,...App.state.config?.rules},archive=archivedTeams(),rows={},anomalies=[],counted=[];
    for(const t of Object.values(App.state.teams||{})){const cat=norm(t.category);if(category&&cat!==norm(category))continue;rows[t.id]={id:t.id,name:t.name,category:cat,withdrawn:!!t.withdrawn,eligible:!t.withdrawn,withdrawalPolicy:t.withdrawalPolicy?.mode||'',played:0,w:0,l:0,setsFor:0,setsAgainst:0,pointsFor:0,pointsAgainst:0,points:0,virtualWO:0};}
    const matches=[...Object.values(App.state.matches||{}),...buildVirtualFixtures(category)];
    for(const m of matches){
      if(!m||!COUNTED.has(String(m.status||'').toUpperCase())||!isGroup(m))continue;
      const A=rows[m.teamAId]||null,B=rows[m.teamBId]||null;if(!A&&!B)continue;
      const sa=snapFor(m,'A',archive),sb=snapFor(m,'B',archive),matchCat=norm(m.category||sa?.category||sb?.category||A?.category||B?.category||'MIX');if(category&&matchCat!==norm(category))continue;
      let aw=0,bw=0,pA=0,pB=0,sAf=0,sAa=0,sBf=0,sBa=0;
      for(const s of (m.sets||[])){const a=Number(s?.a)||0,b=Number(s?.b)||0;pA+=a;pB+=b;if(completeSet(s,m)){if(a>b){sAf++;sBa++;aw++;}else if(b>a){sBf++;sAa++;bw++;}}}
      let winner=m.winnerId;if(!winner&&m.status==='FINISHED'&&aw!==bw)winner=aw>bw?m.teamAId:m.teamBId;
      if(winner!==m.teamAId&&winner!==m.teamBId){anomalies.push({type:'MISSING_WINNER',matchId:m.id,code:m.code,status:m.status});continue;}
      if(A){A.pointsFor+=pA;A.pointsAgainst+=pB;A.setsFor+=sAf;A.setsAgainst+=sAa;A.played++;if(m.virtualStandingOnly)A.virtualWO++;}
      if(B){B.pointsFor+=pB;B.pointsAgainst+=pA;B.setsFor+=sBf;B.setsAgainst+=sBa;B.played++;if(m.virtualStandingOnly)B.virtualWO++;}
      const wp=m.status==='WALKOVER'?Number(rules.walkoverWinPoints)||0:Number(rules.winPoints)||0,lp=Number(rules.lossPoints)||0;
      if(winner===m.teamAId){if(A){A.w++;A.points+=wp;}if(B){B.l++;B.points+=lp;}}else{if(B){B.w++;B.points+=wp;}if(A){A.l++;A.points+=lp;}}
      counted.push(m);
    }
    const head=(a,b)=>{const m=[...counted].reverse().find(x=>(x.teamAId===a.id&&x.teamBId===b.id)||(x.teamAId===b.id&&x.teamBId===a.id));if(!m)return 0;return m.winnerId===a.id?-1:m.winnerId===b.id?1:0;};
    const cmp=(a,b)=>{if(b.points!==a.points)return b.points-a.points;for(const key of (rules.tieBreakers||T.DEFAULT_RULES.tieBreakers)){if(key==='headToHead'){const h=head(a,b);if(h)return h;}else if(key==='setDiff'){const d=(b.setsFor-b.setsAgainst)-(a.setsFor-a.setsAgainst);if(d)return d;}else if(key==='pointDiff'){const d=(b.pointsFor-b.pointsAgainst)-(a.pointsFor-a.pointsAgainst);if(d)return d;}else if(key==='name'){const d=String(a.name||'').localeCompare(String(b.name||''),'vi');if(d)return d;}}return 0;};
    const result=Object.values(rows).sort(cmp);result.anomalies=anomalies;result.countedMatches=counted.length;result.virtualFixtures=counted.filter(m=>m.virtualStandingOnly);return result;
  }
  App.ranking=function(arg){if(typeof arg==='string')return canonicalRanking({category:arg});if(arg&&typeof arg==='object')return canonicalRanking(arg);return canonicalRanking();};
  App.rankingAll=category=>canonicalRanking({category});
  App.rankingEligible=function(arg){const rows=typeof arg==='string'?canonicalRanking({category:arg}):arg&&typeof arg==='object'?canonicalRanking(arg):canonicalRanking();const f=rows.filter(r=>!r.withdrawn);f.anomalies=rows.anomalies;f.countedMatches=rows.countedMatches;f.virtualFixtures=rows.virtualFixtures;return f;};

  // Preserve a tombstone before deleting a withdrawn team so missing fixtures can still be reconstructed later.
  const baseDelete=App.deleteTeam?.bind(App);
  if(baseDelete&&!App.__h42DeleteInstalled){App.__h42DeleteInstalled=true;App.deleteTeam=async function(id){
    const t=this.state.teams?.[id];if(!t?.withdrawn)return baseDelete(id);
    const refs=Object.values(this.state.matches||{}).filter(m=>m.teamAId===id||m.teamBId===id),ok=await U.confirmDanger('Xóa đội bỏ cuộc '+(t.name||t.code||id),`Giữ lịch sử ${refs.length} trận và lưu hồ sơ đội để BXH vẫn bù các cặp WO còn thiếu.`,'');if(!ok)return;
    const archive={id:t.id||id,code:t.code||'',name:t.name||'',category:norm(t.category),withdrawn:true,withdrawnAt:t.withdrawnAt||Date.now(),withdrawalPolicy:t.withdrawalPolicy||{mode:'KEEP_PLAYED_CANCEL'},deletedAt:Date.now()};
    const up={};up[T.Data.path('config/withdrawnTeamArchive/'+id)]=archive;for(const m of refs){up[T.Data.path('matches/'+m.id)]={...m,teamASnapshot:m.teamASnapshot||(m.teamAId===id?archive:(teamLive(m.teamAId)||null)),teamBSnapshot:m.teamBSnapshot||(m.teamBId===id?archive:(teamLive(m.teamBId)||null))};}up[T.Data.path('teams/'+id)]=null;
    await T.Data.queueMulti(up,{type:'WITHDRAWN_TEAM_DELETE_ARCHIVE_HISTORY'});await T.Data.audit('DELETE_WITHDRAWN_ARCHIVE','team',id,t,{preservedMatches:refs.length,archive});U.toast(`Đã xóa ${t.name||id}; giữ lịch sử và rule WO các cặp thiếu.`,'ok');
  };}

  function auditCategory(cat){const rows=canonicalRanking({category:cat});return{category:norm(cat),virtualFixtures:rows.virtualFixtures.map(m=>({id:m.id,winner:m.winnerId,loser:m.walkoverTeamId,sets:m.sets})),rows:rows.map(r=>({id:r.id,name:r.name,played:r.played,w:r.w,l:r.l,points:r.points,virtualWO:r.virtualWO}))};}
  function stamp(){T.VERSION=VERSION;T.CONFIG_VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;const h=document.getElementById('health-version');if(h)h.textContent=VERSION;}
  stamp();setTimeout(stamp,0);window.addEventListener('focus',stamp,{passive:true});window.addEventListener('pageshow',()=>setTimeout(stamp,0),{passive:true});
  window.TopkeyUpgrade122Hotfix43={installed:true,VERSION,CACHE_TAG,canonicalRanking,buildVirtualFixtures,auditCategory,rules:{missingWithdrawnPairVirtualWO:true,virtualDoesNotCreateSchedule:true,policy:'KEEP_PLAYED_WO_COMPLETES_UNCOUNTED_PAIRS',lossPointsApplied:true}};
  return true;
}
if(!install()){window.addEventListener('topkey:admin-ready',install,{once:true});let n=0;const t=setInterval(()=>{if(install()||++n>=40)clearInterval(t)},250);}
})();
