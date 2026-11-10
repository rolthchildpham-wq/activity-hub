(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade19ReliabilityInstalled)return;
App.__upgrade19ReliabilityInstalled=true;
const $=id=>document.getElementById(id);
const UNPLAYED=new Set(['SCHEDULED','CHECK_IN','READY','CALLED_TO_COURT','WARM_UP']);
const COUNTED=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
const PUBLIC_BRANCHES=['config','teams','matches','courts','activeMatches','commentary'];
const clone=v=>JSON.parse(JSON.stringify(v??null));
function isWithdrawn(id){return !!App.state.teams?.[id]?.withdrawn;}
function hasWithdrawn(m){return isWithdrawn(m?.teamAId)||isWithdrawn(m?.teamBId);}
function opponent(m,teamId){return m.teamAId===teamId?m.teamBId:m.teamAId;}
function policyOf(t){return t?.withdrawalPolicy?.mode||'KEEP_PLAYED_CANCEL';}
function woSets(m,teamId){return m.teamAId===teamId?[{a:0,b:11,finished:true},{a:0,b:11,finished:true}]:[{a:11,b:0,finished:true},{a:11,b:0,finished:true}];}
function stripOutcome(m){const x={...m};delete x.winnerId;delete x.finishedAt;return x;}
function activeFor(matchId){return Object.entries(App.state.activeMatches||{}).find(([,s])=>s?.matchId===matchId)||null;}
function desiredWithdrawOutcome(m){
  const a=App.state.teams?.[m.teamAId],b=App.state.teams?.[m.teamBId],wa=!!a?.withdrawn,wb=!!b?.withdrawn;
  if(!wa&&!wb)return null;
  if(wa&&wb){if(m.status==='CANCELLED')return null;return {...stripOutcome(m),status:'CANCELLED',sets:[],updatedAt:Date.now(),cancelReason:'BOTH_TEAMS_WITHDRAWN',withdrawnTeamIds:[m.teamAId,m.teamBId]};}
  const tid=wa?m.teamAId:m.teamBId,t=wa?a:b,mode=policyOf(t),opp=opponent(m,tid),active=!!activeFor(m.id)||['LIVE','INTERVAL','SUSPENDED'].includes(m.status);
  if(mode==='CANCEL_ALL'){
    if(m.status==='CANCELLED'&&m.cancelReason==='TEAM_WITHDRAWN_CANCEL_ALL')return null;
    return {...stripOutcome(m),status:'CANCELLED',sets:[],updatedAt:Date.now(),cancelReason:'TEAM_WITHDRAWN_CANCEL_ALL',withdrawnTeamId:tid,withdrawalPolicy:mode};
  }
  if(COUNTED.has(m.status)||m.status==='CANCELLED')return null;
  if(active)return {...m,status:'RETIRED',winnerId:opp,finishedAt:Date.now(),updatedAt:Date.now(),retiredTeamId:tid,withdrawalPolicy:mode};
  if(!UNPLAYED.has(m.status))return null;
  if(mode==='KEEP_PLAYED_WO')return {...m,status:'WALKOVER',sets:woSets(m,tid),winnerId:opp,finishedAt:Date.now(),updatedAt:Date.now(),walkoverTeamId:tid,walkoverReason:'TEAM_WITHDRAWN',withdrawalPolicy:mode};
  return {...stripOutcome(m),status:'CANCELLED',sets:[],updatedAt:Date.now(),cancelReason:'TEAM_WITHDRAWN_NO_POINTS',withdrawnTeamId:tid,withdrawalPolicy:mode};
}
function cleanupActivePatch(up,m){const hit=activeFor(m.id);if(!hit)return;const [cid]=hit;up[T.Data.path('activeMatches/'+cid)]=null;const c=App.state.courts?.[cid];if(c)up[T.Data.path('courts/'+cid)]={...c,status:'AVAILABLE',activeMatchId:'',updatedAt:Date.now()};}
async function writeDirect(up,label){
  if(!T.Data?.db||!T.Data.connected)throw new Error(label+' cần Firebase CONNECTED');
  const clean=window.TopkeyUpgrade13?.clean||((v)=>v);
  await T.Data.db.ref().update(clean(up));
}
async function reconcileWithdrawnMatches(showToast=false){
  if(T.Auth?.role?.()!=='ADMIN'||!T.Data?.connected)return {changed:0};
  const up={},changed=[];
  for(const m of Object.values(App.state.matches||{})){
    const after=desiredWithdrawOutcome(m);if(!after)continue;
    const before=JSON.stringify({s:m.status,w:m.winnerId||'',sets:m.sets||[],r:m.cancelReason||'',wp:m.withdrawalPolicy||''});
    const next=JSON.stringify({s:after.status,w:after.winnerId||'',sets:after.sets||[],r:after.cancelReason||'',wp:after.withdrawalPolicy||''});
    if(before===next)continue;
    up[T.Data.path('matches/'+m.id)]=after;cleanupActivePatch(up,m);changed.push(m.id);
  }
  if(!changed.length){if(showToast)U.toast('Không còn lịch sai trạng thái của đội bỏ cuộc','ok');return {changed:0};}
  try{await writeDirect(up,'Đồng bộ đội bỏ cuộc');if(showToast)U.toast(`Đã sửa ${changed.length} trận liên quan đội bỏ cuộc`,'ok');return {changed:changed.length};}
  catch(e){if(showToast)U.toast('Chưa sửa được lịch đội bỏ cuộc: '+(e?.message||e),'err');throw e;}
}
function scheduleGuard(){
  const base=App.buildSchedulePlan?.bind(App);if(!base||App.__u19ScheduleGuard)return;App.__u19ScheduleGuard=true;
  App.buildSchedulePlan=function(){const r=base();r.plan=(r.plan||[]).filter(x=>!hasWithdrawn(x.after||x.m||x.before));r.unplaced=(r.unplaced||[]).filter(m=>!hasWithdrawn(m));return r;};
  const baseAdd=App.addMatch?.bind(App);if(baseAdd)App.addMatch=async function(e){const f=new FormData(e.target),a=f.get('teamAId'),b=f.get('teamBId');if(isWithdrawn(a)||isWithdrawn(b)){e.preventDefault();return U.toast('Đội đã bỏ cuộc không thể tạo/xếp trận mới','err');}return baseAdd(e);};
  const baseEdit=App.editMatchSchedule?.bind(App);if(baseEdit)App.editMatchSchedule=function(id){const m=this.state.matches?.[id];if(m&&hasWithdrawn(m)&&UNPLAYED.has(m.status))return U.toast('Không thể sửa/xếp lại trận của đội đã bỏ cuộc. Hãy dùng chính sách bỏ cuộc để xử lý kết quả.','err');return baseEdit(id);};
  const baseStatus=App.setMatchStatus?.bind(App);if(baseStatus)App.setMatchStatus=function(id,status){const m=this.state.matches?.[id];if(m&&hasWithdrawn(m)&&UNPLAYED.has(status))return U.toast('Không thể chuyển trận của đội bỏ cuộc về trạng thái chưa thi đấu','err');return baseStatus(id,status);};
}
function markWithdrawnScheduleRows(){
  const box=$('matches-list');if(!box)return;
  box.querySelectorAll('tr.tk12-match-row').forEach(tr=>{const id=tr.dataset.matchId;let m=id&&App.state.matches?.[id];if(!m){const code=tr.cells?.[0]?.textContent||'';m=Object.values(App.state.matches||{}).find(x=>String(x.code||x.id)===String(code));}if(!m||!hasWithdrawn(m)||!UNPLAYED.has(m.status))return;tr.classList.add('tk19-withdrawn-pending');const badge=tr.cells?.[5]?.querySelector('.tk12-status-badge');if(badge)badge.textContent='Bỏ cuộc · chờ đồng bộ';});
}
function patchWithdrawal(){
  const old=window.TopkeyUpgrade18?.applyWithdrawPolicy;if(!old||App.__u19WithdrawPatch)return;App.__u19WithdrawPatch=true;
  // Replace only the exposed action. Upgrade18 modal button is rebound below.
  const apply=async()=>{
    const teamId=App._tk18WithdrawTeamId,t=App.state.teams?.[teamId];if(!t)return;
    const policy=document.querySelector('input[name="tk18-withdraw-policy"]:checked')?.value;if(!policy)return U.toast('Chọn cách xử lý kết quả khi bỏ cuộc','err');
    if(!T.Data.connected)return U.toast('Bỏ cuộc là thao tác quan trọng: cần Firebase CONNECTED để lưu và xác minh','err');
    const summary=window.TopkeyUpgrade18.policySummary(teamId),ok=await U.confirmDanger('Xác nhận '+t.name+' bỏ cuộc','Đội sẽ bị khóa khỏi Smart Scheduler ngay. Các trận liên quan được xử lý theo lựa chọn và xác minh lại trên Firebase.','BỎ CUỘC');if(!ok)return;
    try{
      // Phase 1 is deliberately separate: even if a later match write is rejected, the team can never be scheduled again.
      const now=Date.now(),teamAfter={...t,withdrawn:true,checkedIn:false,withdrawnAt:now,updatedAt:now,withdrawalPolicy:{mode:policy,label:window.TopkeyUpgrade18.POLICY_LABEL[policy]||policy,appliedAt:now,appliedBy:T.Auth.user?.uid||''}};
      await T.Data.db.ref(T.Data.path('teams/'+teamId)).set((window.TopkeyUpgrade13?.clean||((v)=>v))(teamAfter));App.state.teams[teamId]=teamAfter;
      const up={};for(const m of summary.matches){const after=desiredWithdrawOutcome(m);if(after){up[T.Data.path('matches/'+m.id)]=after;cleanupActivePatch(up,m);}}
      if(Object.keys(up).length)await writeDirect(up,'Xử lý lịch bỏ cuộc');
      const verify=await T.Data.ref('teams/'+teamId).once('value');if(!verify.val()?.withdrawn)throw new Error('Firebase chưa xác nhận trạng thái bỏ cuộc');
      await T.Data.audit('WITHDRAW_POLICY','team',teamId,t,{team:teamAfter,policy,affectedMatches:Object.keys(up).filter(k=>k.includes('/matches/')).length});
      $('tk18-withdraw-modal')?.classList.add('hidden');App._tk18WithdrawTeamId=null;await reconcileWithdrawnMatches(false);U.toast('✓ Đã lưu bỏ cuộc và khóa đội khỏi mọi lần xếp lịch tiếp theo','ok');
    }catch(e){U.toast('Đội đã được khóa khỏi Scheduler nhưng xử lý lịch chưa hoàn tất: '+(e?.message||e)+'. Publish Database Rules Upgrade 19 rồi bấm sửa tự động.','err');}
  };
  window.TopkeyUpgrade19ApplyWithdraw=apply;
  const bind=()=>{const b=$('tk18-withdraw-apply');if(b)b.onclick=apply;};bind();
  const open=window.TopkeyUpgrade18?.openWithdraw;
  if(open){
    App.toggleWithdrawn=function(id){const r=open(id);setTimeout(bind,0);return r;};
    App.bulkWithdrawTeams=function(){const ids=this.selectedTeamIds?.('withdraw-team-grid')||[];if(!ids.length)return U.toast('Tick ít nhất 1 đội cần bỏ cuộc','err');if(ids.length>1)return U.toast('Chính sách bỏ cuộc ảnh hưởng BXH. Hãy xử lý từng đội để xác nhận riêng cách tính kết quả cho từng đội.','info');const r=open(ids[0]);setTimeout(bind,0);return r;};
  }
}
function freshStatus(text,kind='ok'){
  const root=$('tk12-spectator-layout');if(!root)return;let el=$('tk19-viewer-fresh');if(!el){el=document.createElement('div');el.id='tk19-viewer-fresh';el.className='tk19-viewer-fresh';root.prepend(el);}el.dataset.kind=kind;el.textContent=text;
}
async function clearOldViewerCaches(){
  try{if(!('caches'in window))return;const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('topkey-vnext-')&&!k.includes('upgrade19')).map(k=>caches.delete(k)));}catch{}
}
async function refreshSpectatorNow(show=false){
  if(location.hash!=='#spectator'||!T.Data?.ready)return;
  try{
    const snaps=await Promise.all(PUBLIC_BRANCHES.map(b=>T.Data.ref(b).once('value')));
    snaps.forEach((s,i)=>App.state[PUBLIC_BRANCHES[i]]=s.val()||{});App.renderSpectator?.();
    const tm=new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});freshStatus(`● Realtime · dữ liệu Firebase mới nhất lúc ${tm} · tự kiểm tra mỗi 10 giây`,'ok');if(show)U.toast('Viewer đã tải dữ liệu mới nhất từ Firebase','ok');
  }catch(e){freshStatus('⚠ Viewer chưa tải được dữ liệu mới: '+(e?.message||e),'err');}
}
function patchSpectator(){
  const base=App.startSpectator?.bind(App);if(!base||App.__u19SpectatorFresh)return;App.__u19SpectatorFresh=true;
  App.startSpectator=function(){
    // Never render the previous in-memory snapshot while a public viewer is opening.
    PUBLIC_BRANCHES.forEach(b=>this.state[b]={});this.renderSpectator?.();clearOldViewerCaches();
    const r=base();clearInterval(this._u19ViewerTimer);this._u19ViewerTimer=setInterval(()=>refreshSpectatorNow(false),10000);refreshSpectatorNow(false);return r;
  };
  addEventListener('focus',()=>refreshSpectatorNow(false));document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshSpectatorNow(false)});
  addEventListener('online',()=>refreshSpectatorNow(false));
}
function permissionUiFix(){
  const apply=()=>{document.querySelectorAll('.tk9-readonly').forEach(zone=>{const nodes=zone.matches?.('button,input,select,textarea')?[zone]:[...zone.querySelectorAll('button,input,select,textarea')];nodes.forEach(el=>{if(el.dataset.viewOk==='true')return;el.disabled=true;el.setAttribute('aria-disabled','true');el.title=el.title||'Tài khoản chỉ có quyền xem';});});};
  const base=window.TopkeyUpgrade9?.applyPermissionsDom?.bind(window.TopkeyUpgrade9);if(base&&!window.TopkeyUpgrade9.__u19PermUi){window.TopkeyUpgrade9.__u19PermUi=true;window.TopkeyUpgrade9.applyPermissionsDom=function(){const r=base();apply();return r;};}
  setTimeout(apply,0);
}
function adminRepairUi(){
  if(T.Auth?.role?.()!=='ADMIN')return;const page=$('page-health');if(!page||$('tk19-repair-card'))return;const c=document.createElement('div');c.id='tk19-repair-card';c.className='card tk19-repair-card';c.innerHTML=`<div class="split"><div><h2>🧰 Đồng bộ & quyền truy cập</h2><p class="muted">Upgrade 19: kiểm tra lịch của đội bỏ cuộc, retry queue Firebase và tải lại dữ liệu hiện tại.</p></div><span class="pill">${T.VERSION}</span></div><div class="action-bar"><button id="tk19-repair-withdraw" class="btn warn">🏳 Sửa lịch đội bỏ cuộc</button><button id="tk19-retry-queue" class="btn primary">↻ Retry queue Firebase</button><button id="tk19-refresh-admin" class="btn">⟳ Tải snapshot mới</button></div><div id="tk19-repair-note" class="note"></div>`;page.appendChild(c);
  $('tk19-repair-withdraw').onclick=()=>reconcileWithdrawnMatches(true).catch(()=>{});$('tk19-retry-queue').onclick=async()=>{await T.Data.flushQueue();U.toast(T.Data.pending?`Còn ${T.Data.pending} thay đổi chưa đồng bộ`:'Queue Firebase đã sạch','info')};$('tk19-refresh-admin').onclick=async()=>{for(const b of PUBLIC_BRANCHES){try{const s=await T.Data.ref(b).once('value');App.state[b]=s.val()||{}}catch{}}App.renderAll?.();U.toast('Đã tải lại snapshot Firebase','ok')};
}
function install(){
  scheduleGuard();patchSpectator();permissionUiFix();patchWithdrawal();
  const baseMatches=App.renderMatches?.bind(App);if(baseMatches)App.renderMatches=function(){const r=baseMatches();markWithdrawnScheduleRows();return r;};
  const baseAfter=App.afterLogin?.bind(App);if(baseAfter)App.afterLogin=async function(...args){const r=await baseAfter(...args);adminRepairUi();if(T.Auth.role()==='ADMIN')setTimeout(()=>reconcileWithdrawnMatches(false).catch(()=>{}),1800);return r;};
  setTimeout(()=>{adminRepairUi();markWithdrawnScheduleRows();if(location.hash==='#spectator')App.startSpectator?.();},0);
}
install();
window.TopkeyUpgrade19={reconcileWithdrawnMatches,refreshSpectatorNow,desiredWithdrawOutcome,hasWithdrawn};
})();
