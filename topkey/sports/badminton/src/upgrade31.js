(() => {
'use strict';
const T=window.Topkey, App=T?.App, U=T?.U;
if(!T||!App||!U||App.__upgrade31WithdrawFlowInstalled)return;
App.__upgrade31WithdrawFlowInstalled=true;
const $=id=>document.getElementById(id);
const UNPLAYED=new Set(['SCHEDULED','CHECK_IN','READY','CALLED_TO_COURT','WARM_UP']);
const COUNTED=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
const POLICY_LABEL=window.TopkeyUpgrade18?.POLICY_LABEL||{
  CANCEL_ALL:'Hủy toàn bộ kết quả',
  KEEP_PLAYED_WO:'Giữ trận đã đấu · trận chưa đấu xử WO 11–0, 11–0',
  KEEP_PLAYED_CANCEL:'Giữ trận đã đấu · trận chưa đấu không tính điểm'
};
const clone=v=>JSON.parse(JSON.stringify(v??null));
const lang=()=>window.TopkeyI18n?.language||'vi';
const tr=(vi,en,zh)=>lang()==='zh'?zh:lang()==='en'?en:vi;
const clean=window.TopkeyUpgrade13?.clean||((v)=>v);
function withTimeout(p,ms,label){let timer;return Promise.race([p,new Promise((_,rej)=>{timer=setTimeout(()=>rej(new Error(label)),ms);})]).finally(()=>clearTimeout(timer));}
function activeEntry(matchId){for(const [courtId,s] of Object.entries(App.state.activeMatches||{}))if(s?.matchId===matchId)return {courtId,state:s};return null;}
function stripOutcome(m){const x={...m};delete x.winnerId;delete x.finishedAt;return x;}
function woSets(m,teamId){return m.teamAId===teamId?[{a:0,b:11,finished:true},{a:0,b:11,finished:true}]:[{a:11,b:0,finished:true},{a:11,b:0,finished:true}];}
function matchWithActiveSets(m){const a=activeEntry(m.id);return a?.state?.sets?.length?clone(a.state.sets):clone(m.sets||[]);}
function safeFile(v){return String(v||'doi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,50)||'doi';}
function backupWithdrawal(t,summary,policy){
  try{
    const payload={type:'TOPKEY_WITHDRAWAL_BACKUP',version:T.VERSION,exportedAt:new Date().toISOString(),tournamentId:T.Data.tid,policy,team:t,matches:summary.matches,activeMatches:Object.fromEntries(Object.entries(App.state.activeMatches||{}).filter(([,s])=>s&&summary.matches.some(m=>m.id===s.matchId))),courts:App.state.courts};
    U.download(`Topkey_Backup_BoCuoc_${safeFile(t.code||t.name)}_${new Date().toISOString().slice(0,10)}.json`,new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  }catch(e){console.warn('Upgrade31 withdrawal backup failed',e);}
}
function cleanupActive(updates,m,now){
  const a=activeEntry(m.id);if(!a)return;
  updates[T.Data.path('activeMatches/'+a.courtId)]=null;
  const c=App.state.courts?.[a.courtId];
  if(c)updates[T.Data.path('courts/'+a.courtId)]={...c,status:'AVAILABLE',activeMatchId:'',updatedAt:now};
}
function buildPlan(teamId,policy,now=Date.now()){
  const t=App.state.teams?.[teamId];if(!t)throw new Error('TEAM_NOT_FOUND');
  if(!POLICY_LABEL[policy])throw new Error('POLICY_REQUIRED');
  const summary=window.TopkeyUpgrade18?.policySummary?.(teamId)||{matches:Object.values(App.state.matches||{}).filter(m=>m.teamAId===teamId||m.teamBId===teamId)};
  const updates={},changed=[];let wo=0,cancel=0,retired=0,kept=0;
  for(const m of summary.matches||[]){
    const isActive=!!activeEntry(m.id)||['LIVE','INTERVAL','SUSPENDED'].includes(m.status);
    const opponent=m.teamAId===teamId?m.teamBId:m.teamAId;
    if(policy==='CANCEL_ALL'){
      let after=stripOutcome(m);after={...after,status:'CANCELLED',sets:[],updatedAt:now,cancelReason:'TEAM_WITHDRAWN_CANCEL_ALL',withdrawnTeamId:teamId,withdrawalPolicy:policy};
      updates[T.Data.path('matches/'+m.id)]=after;cleanupActive(updates,m,now);changed.push(m.id);cancel++;continue;
    }
    if(COUNTED.has(m.status)||m.status==='CANCELLED'){kept++;continue;}
    if(isActive){
      const after={...m,status:'RETIRED',sets:matchWithActiveSets(m),winnerId:opponent,finishedAt:now,updatedAt:now,retiredTeamId:teamId,withdrawalPolicy:policy};
      updates[T.Data.path('matches/'+m.id)]=after;cleanupActive(updates,m,now);changed.push(m.id);retired++;continue;
    }
    if(policy==='KEEP_PLAYED_WO'&&UNPLAYED.has(m.status)){
      const after={...m,status:'WALKOVER',sets:woSets(m,teamId),winnerId:opponent,finishedAt:now,updatedAt:now,walkoverTeamId:teamId,walkoverReason:'TEAM_WITHDRAWN',withdrawalPolicy:policy};
      updates[T.Data.path('matches/'+m.id)]=after;changed.push(m.id);wo++;continue;
    }
    if(policy==='KEEP_PLAYED_CANCEL'&&UNPLAYED.has(m.status)){
      let after=stripOutcome(m);after={...after,status:'CANCELLED',sets:[],updatedAt:now,cancelReason:'TEAM_WITHDRAWN_NO_POINTS',withdrawnTeamId:teamId,withdrawalPolicy:policy};
      updates[T.Data.path('matches/'+m.id)]=after;changed.push(m.id);cancel++;continue;
    }
    kept++;
  }
  const snap=x=>x?{id:x.id,code:x.code||'',name:x.name||'',category:App.normalizeCategory?App.normalizeCategory(x.category):x.category,withdrawn:!!x.withdrawn,withdrawalPolicy:x.withdrawalPolicy||null}:null;
  for(const m of summary.matches||[]){const p=T.Data.path('matches/'+m.id),cur=updates[p]||m;updates[p]={...cur,teamASnapshot:cur.teamASnapshot||snap(App.state.teams?.[cur.teamAId]),teamBSnapshot:cur.teamBSnapshot||snap(App.state.teams?.[cur.teamBId])};}
  const teamAfter={...t,withdrawn:true,checkedIn:false,withdrawnAt:now,updatedAt:now,withdrawalPolicy:{mode:policy,label:POLICY_LABEL[policy],appliedAt:now,appliedBy:T.Auth?.user?.uid||'',affectedMatches:changed.length,walkovers:wo,cancelled:cancel,retired,kept}};
  updates[T.Data.path('teams/'+teamId)]=teamAfter;
  return {t,summary,updates,teamAfter,stats:{policy,changed:changed.length,walkovers:wo,cancelled:cancel,retired,kept},changed};
}
function addAuditToBatch(updates,teamId,before,after,stats,now){
  const id=U.id('audit'),uid=T.Auth?.user?.uid||'local';
  updates[T.Data.path('audit/'+id)]={id,action:'WITHDRAW_POLICY',entityType:'team',entityId:teamId,uid,actor:T.Auth?.profile?.displayName||T.Auth?.profile?.username||'local',before,after:{team:after,summary:stats},clientAt:now};
}
function setBusy(on,message){
  const b=$('tk18-withdraw-apply'),cancel=$('tk18-withdraw-cancel'),close=$('tk18-withdraw-close'),modal=$('tk18-withdraw-modal');
  if(b){if(!b.dataset.u31Label)b.dataset.u31Label=b.textContent;b.disabled=!!on;b.setAttribute('aria-busy',on?'true':'false');b.textContent=on?(message||tr('⏳ Đang xử lý dữ liệu giải...','⏳ Processing tournament data...','⏳ 正在处理赛事数据...')):b.dataset.u31Label;}
  if(cancel)cancel.disabled=!!on;if(close)close.disabled=!!on;if(modal)modal.classList.toggle('tk31-withdraw-busy',!!on);
}
function closeAndRefresh(){
  const modal=$('tk18-withdraw-modal');if(modal)modal.classList.add('hidden');App._tk18WithdrawTeamId=null;
  try{App.renderAll?.();}catch(e){console.warn('Upgrade31 renderAll',e);}
  try{window.scrollTo({top:0,behavior:'auto'});}catch{}
}
async function refreshAffected(teamId,changed){
  if(!T.Data?.connected)return;
  try{
    const [ts,ms,cs,as]=await withTimeout(Promise.all([T.Data.ref('teams').once('value'),T.Data.ref('matches').once('value'),T.Data.ref('courts').once('value'),T.Data.ref('activeMatches').once('value')]),12000,'Firebase refresh timeout');
    App.state.teams=ts.val()||{};App.state.matches=ms.val()||{};App.state.courts=cs.val()||{};App.state.activeMatches=as.val()||{};App.renderAll?.();
  }catch(e){console.warn('Upgrade31 post-withdraw refresh',teamId,changed,e);}
}
async function applyWithdraw(){
  const teamId=App._tk18WithdrawTeamId,t=App.state.teams?.[teamId];if(!t)return;
  const policy=document.querySelector('input[name="tk18-withdraw-policy"]:checked')?.value;
  if(!POLICY_LABEL[policy])return U.toast(tr('Chọn cách xử lý kết quả khi bỏ cuộc','Choose how withdrawal results should be handled','请选择退赛结果处理方式'),'err');
  if(!T.Data?.db||!T.Data.connected)return U.toast(tr('Cần kết nối Firebase để lưu bỏ cuộc','Firebase connection is required to save the withdrawal','需要连接 Firebase 才能保存退赛'),'err');
  const button=$('tk18-withdraw-apply');if(button?.disabled)return;
  setBusy(true);
  try{
    const now=Date.now(),plan=buildPlan(teamId,policy,now);
    backupWithdrawal(t,plan.summary,policy);
    addAuditToBatch(plan.updates,teamId,t,plan.teamAfter,plan.stats,now);
    setBusy(true,tr('⏳ Đang ghi Firebase...','⏳ Saving to Firebase...','⏳ 正在写入 Firebase...'));
    await withTimeout(T.Data.db.ref().update(clean(plan.updates)),25000,tr('Firebase phản hồi quá lâu. Hãy kiểm tra mạng rồi thử lại.','Firebase response timed out. Check the network and try again.','Firebase 响应超时。请检查网络后重试。'));
    // Update local state immediately so the screen behind the modal reflects the committed batch without waiting for listeners.
    App.state.teams[teamId]=plan.teamAfter;
    for(const mid of plan.changed){const key=T.Data.path('matches/'+mid),after=plan.updates[key];if(after)App.state.matches[mid]=after;}
    for(const [path,value] of Object.entries(plan.updates)){
      const activePrefix=T.Data.path('activeMatches')+'/',courtPrefix=T.Data.path('courts')+'/';
      if(path.startsWith(activePrefix)){const id=path.slice(activePrefix.length);if(value===null)delete App.state.activeMatches[id];else App.state.activeMatches[id]=value;}
      if(path.startsWith(courtPrefix)){const id=path.slice(courtPrefix.length);if(value===null)delete App.state.courts[id];else App.state.courts[id]=value;}
    }
    closeAndRefresh();
    const s=plan.stats;
    U.toast(tr(`✓ Đã xử lý bỏ cuộc · WO ${s.walkovers} · hủy ${s.cancelled} · RET ${s.retired} · giữ ${s.kept}`,`✓ Withdrawal processed · WO ${s.walkovers} · cancelled ${s.cancelled} · RET ${s.retired} · kept ${s.kept}`,`✓ 退赛已处理 · WO ${s.walkovers} · 取消 ${s.cancelled} · RET ${s.retired} · 保留 ${s.kept}`),'ok');
    refreshAffected(teamId,plan.changed);
  }catch(e){
    console.error('Upgrade31 withdrawal save failed',e);
    setBusy(false);
    U.toast(tr('Không lưu được bỏ cuộc: ','Could not save withdrawal: ','无法保存退赛：')+(e?.message||e),'err');
  }
}
function bind(){
  const b=$('tk18-withdraw-apply');if(!b)return;
  b.onclick=applyWithdraw;b.dataset.u31Bound='1';
  // The button itself is the final confirmation. Avoid a hidden second modal behind this dynamic modal.
  b.title=tr('Bấm để xử lý dữ liệu giải và lưu Firebase','Process tournament data and save to Firebase','处理赛事数据并保存到 Firebase');
}
function installOpeners(){
  const open=window.TopkeyUpgrade18?.openWithdraw;if(!open)return;
  App.toggleWithdrawn=function(id){const r=open(id);setTimeout(()=>{setBusy(false);bind();},0);return r;};
  App.bulkWithdrawTeams=function(){
    const ids=this.selectedTeamIds?.('withdraw-team-grid')||[];
    if(!ids.length)return U.toast(tr('Tick ít nhất 1 đội cần bỏ cuộc','Select at least one team to withdraw','至少选择一支要退赛的队伍'),'err');
    if(ids.length>1)return U.toast(tr('Chính sách bỏ cuộc ảnh hưởng BXH. Hãy xử lý từng đội.','Withdrawal affects standings. Process one team at a time.','退赛会影响排名，请逐队处理。'),'info');
    const r=open(ids[0]);setTimeout(()=>{setBusy(false);bind();},0);return r;
  };
}
bind();installOpeners();
window.addEventListener('topkey:languagechange',()=>{const b=$('tk18-withdraw-apply');if(b&&!b.disabled){b.dataset.u31Label='';bind();}});
window.TopkeyUpgrade19ApplyWithdraw=applyWithdraw;
window.TopkeyUpgrade31={installed:true,applyWithdraw,buildPlan,bind};
})();
