(()=>{
'use strict';
const T=window.Topkey,App=T?.App;
if(!T||!App)return;
const VERSION='2026.11.06-vnext-upgrade122-hotfix56-forfeit-bottom-of-day';
const CACHE_TAG='u122h56-20261106';
const TERMINAL=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
function isAdministrativeLoss(m){
  if(!m||!TERMINAL.has(String(m.status||'').toUpperCase()))return false;
  if(m.walkoverTeamId||m.retiredTeamId||m.disqualifiedTeamId||m.withdrawnTeamId)return true;
  if(Array.isArray(m.withdrawnTeamIds)&&m.withdrawnTeamIds.length)return true;
  const reason=[m.walkoverReason,m.cancelReason,m.resultReason,m.outcomeReason].map(x=>String(x||'').toUpperCase()).join('|');
  if(/WITHDRAW|FORFEIT|WALKOVER|WO|RETIR|DISQUAL|XU.?THUA|BO.?CUOC/.test(reason))return true;
  const wp=typeof m.withdrawalPolicy==='string'?m.withdrawalPolicy:(m.withdrawalPolicy?.mode||'');
  if(wp&&String(wp).toUpperCase().includes('KEEP_PLAYED')){
    const A=App.state?.teams?.[m.teamAId],B=App.state?.teams?.[m.teamBId];
    // Only treat as administrative if the finished record also carries a loser/winner marker;
    // this avoids moving genuine matches played before a later withdrawal.
    const loserId=m.loserId||m.forfeitTeamId||m.walkoverTeamId||m.retiredTeamId||m.disqualifiedTeamId||m.withdrawnTeamId;
    if(loserId||(m.winnerId&&(A?.withdrawn||B?.withdrawn)&&m.finishedAt&&m.updatedAt&&m.updatedAt>=m.finishedAt))return true;
  }
  return false;
}
function matchForRow(row){
  if(!row)return null;
  const id=row.dataset?.matchId;
  if(id&&App.state?.matches?.[id])return App.state.matches[id];
  const code=row.cells?.[0]?.textContent?.trim()?.replace(/^#?\d+\s*/,'')||'';
  return Object.values(App.state?.matches||{}).find(m=>String(m.code||m.id)===code)||null;
}
function reorderAdminSchedule(){
  const box=document.getElementById('matches-list');if(!box)return;
  const children=[...box.children];
  let header=null,rows=[];
  const flush=()=>{
    if(!header||!rows.length){rows=[];return;}
    const normal=[],admin=[];
    for(const row of rows){const m=matchForRow(row);(isAdministrativeLoss(m)?admin:normal).push(row);}
    const ordered=[...normal,...admin];
    let anchor=header;
    ordered.forEach((row,i)=>{
      anchor.after(row);anchor=row;
      const m=matchForRow(row),cell=row.cells?.[0];
      if(cell){cell.dataset.dayOrder=String(i+1);cell.title=`Trận ${i+1} trong ngày ${m?.date||'chưa xếp'}${isAdministrativeLoss(m)?' · xử thua - xếp cuối ngày':''}`;}
      row.classList.toggle('tk56-admin-loss-bottom',!!m&&isAdministrativeLoss(m));
    });
    rows=[];
  };
  for(const node of children){
    if(node.classList?.contains('tk12-day-row')){flush();header=node;continue;}
    if(node.classList?.contains('tk12-match-row'))rows.push(node);
  }
  flush();
}
function patchAdmin(){
  if(App.__u56ForfeitBottom)return;App.__u56ForfeitBottom=true;
  const base=App.renderMatches?.bind(App);if(!base)return;
  App.renderMatches=function(...args){const out=base(...args);reorderAdminSchedule();setTimeout(reorderAdminSchedule,0);return out;};
}
function style(){if(document.getElementById('tk56-style'))return;const s=document.createElement('style');s.id='tk56-style';s.textContent=`#matches-list tr.tk56-admin-loss-bottom{box-shadow:inset 3px 0 0 #f59e0b}#matches-list tr.tk56-admin-loss-bottom td:first-child:after{content:' · xử thua';font-size:9px;color:#fbbf24;font-weight:800}`;document.head.appendChild(s);}
function install(){style();patchAdmin();setTimeout(()=>{patchAdmin();App.renderMatches?.();},0);}
install();
window.TopkeyUpgrade122Hotfix56={installed:true,VERSION,CACHE_TAG,isAdministrativeLoss,reorderAdminSchedule};
})();
