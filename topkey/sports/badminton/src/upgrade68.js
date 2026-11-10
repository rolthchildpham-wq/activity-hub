(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade68Installed)return;
App.__upgrade68Installed=true;
const VERSION='2026.10.29-vnext-featureparity15-upgrade68-admin-result-reset-fix';
const CACHE_TAG='u68-20261029';
const BUILD='upgrade68';
const $=id=>document.getElementById(id);
const UNPLAYED=new Set(['SCHEDULED','CHECK_IN','READY','CALLED_TO_COURT','WARM_UP']);
const RESULT_FIELDS=[
  'winnerId','finishedAt','startedAt','liveSetIndex','manualResult','manualResultBy',
  'actualFinishedAt','actualFinishedDate','actualFinishedTime','actualFinishedTimezoneOffset','actualFinishedBy','actualFinishSource',
  'retiredTeamId','walkoverTeamId','walkoverReason','cancelReason','withdrawnTeamId','withdrawnTeamIds','disqualifiedTeamId'
];
function clone(v){return U.clone?U.clone(v):JSON.parse(JSON.stringify(v));}
function activeEntries(matchId){return Object.entries(App.state.activeMatches||{}).filter(([,s])=>s?.matchId===matchId);}
function hasResultEvidence(m){
  if(!m)return false;
  return (Array.isArray(m.sets)&&m.sets.length>0)||RESULT_FIELDS.some(k=>m[k]!==undefined&&m[k]!==null&&m[k]!=='')||
    ['LIVE','INTERVAL','SUSPENDED','FINISHED','WALKOVER','RETIRED','DISQUALIFIED'].includes(String(m.status||''))||activeEntries(m.id).length>0;
}
function resetMatchObject(m,status='SCHEDULED',now=Date.now()){
  const after={...clone(m),status,sets:[],updatedAt:now,resultResetAt:now,resultResetBy:T.Auth?.user?.uid||'local',resultResetVersion:BUILD};
  RESULT_FIELDS.forEach(k=>delete after[k]);
  return after;
}
function touchesMatchQueue(item,matchId){
  const matchPath=T.Data.path('matches/'+matchId),activePrefix=T.Data.path('activeMatches').replace(/\/?$/,'/');
  return Object.entries(item?.updates||{}).some(([path,value])=>path===matchPath||(path.startsWith(activePrefix)&&value?.matchId===matchId));
}
async function purgeStaleQueuedWrites(matchId){
  if(!T.Data?.removeQueuedWhere)return 0;
  return T.Data.removeQueuedWhere(item=>touchesMatchQueue(item,matchId));
}
function localApplyReset(matchId,after,hits){
  App.state.matches[matchId]=after;
  for(const [courtId] of hits){
    if(App.state.activeMatches)delete App.state.activeMatches[courtId];
    const c=App.state.courts?.[courtId];if(c)App.state.courts[courtId]={...c,status:'AVAILABLE',activeMatchId:'',updatedAt:after.updatedAt};
  }
}
async function verifyReset(matchId,status){
  const snap=await T.Data.ref('matches/'+matchId).once('value'),v=snap.val();
  if(!v)throw new Error('Firebase không còn bản ghi trận sau khi reset');
  const badSets=Array.isArray(v.sets)?v.sets.length>0:!!v.sets;
  const badOutcome=RESULT_FIELDS.some(k=>v[k]!==undefined&&v[k]!==null&&v[k]!=='');
  if(String(v.status)!==String(status)||badSets||badOutcome)throw new Error('Firebase chưa xác nhận xóa sạch tỷ số/kết quả');
  return v;
}
async function resetMatchResult(matchId,{status='SCHEDULED',confirm=true,source='ADMIN_RESULT_RESET_U68'}={}){
  if(T.Auth?.role?.()!=='ADMIN')return U.toast('Chỉ ADMIN được xóa kết quả trận','err');
  const m=App.state.matches?.[matchId];if(!m)return U.toast('Không tìm thấy trận','err');
  if(App.state.teams?.[m.teamAId]?.withdrawn||App.state.teams?.[m.teamBId]?.withdrawn)return U.toast('Trận có đội đã bỏ cuộc: hãy xử lý bằng chính sách bỏ cuộc, không reset kết quả trực tiếp.','err');
  if(!T.Data?.connected||!T.Data?.db)return U.toast('Xóa kết quả là thao tác quan trọng: cần Firebase CONNECTED để lưu và xác minh.','err');
  if(confirm){const ok=await U.confirmDanger('Xóa tỷ số & kết quả trận',`${m.code||matchId}: xóa toàn bộ tỷ số set, đội thắng, thời gian bắt đầu/kết thúc và phiên chấm điểm đang treo. Ngày/giờ/sân đã xếp vẫn được giữ. Trận sẽ về CHƯA THI ĐẤU.`,'XÓA TỶ SỐ');if(!ok){App.renderMatches?.();return null;}}
  const before=clone(m),hits=activeEntries(matchId),now=Date.now(),after=resetMatchObject(m,status,now),updates={};
  updates[T.Data.path('matches/'+matchId)]=after;
  for(const [courtId] of hits){
    updates[T.Data.path('activeMatches/'+courtId)]=null;
    const c=App.state.courts?.[courtId];if(c)updates[T.Data.path('courts/'+courtId)]={...c,status:'AVAILABLE',activeMatchId:'',updatedAt:now};
  }
  try{
    const purged=await purgeStaleQueuedWrites(matchId);
    const clean=window.TopkeyUpgrade13?.clean||((v)=>v);
    await T.Data.db.ref().update(clean(updates));
    const verified=await verifyReset(matchId,status);
    localApplyReset(matchId,verified,hits);
    if(App._tk18ScoreMatchId===matchId){$('tk18-score-modal')?.classList.add('hidden');App._tk18ScoreMatchId=null;}
    App.renderAll?.();
    try{await T.Data.audit('ADMIN_RESULT_RESET','match',matchId,before,{...verified,purgedQueuedWrites:purged,source});}catch(e){console.warn('Upgrade68 audit reset',e);}
    U.toast(`✓ Đã xóa tỷ số ${m.code||matchId} trên Firebase · về Chưa thi đấu${purged?` · loại ${purged} lệnh cũ trong queue`:''}`,'ok');
    return verified;
  }catch(e){console.error('Upgrade68 reset failed',e);App.renderMatches?.();U.toast('Không xóa được tỷ số: '+(e?.message||e),'err');return null;}
}

// Admin status dropdown: a result-bearing match may never become UNPLAYED while keeping old sets/outcome.
const baseSetStatus=App.setMatchStatus?.bind(App);
if(baseSetStatus)App.setMatchStatus=async function(id,status){
  const m=this.state.matches?.[id];
  if(m&&UNPLAYED.has(status)&&hasResultEvidence(m))return resetMatchResult(id,{status:'SCHEDULED',confirm:true,source:'ADMIN_STATUS_TO_UNPLAYED_U68'});
  if(m&&status==='FINISHED'&&!((m.sets||[]).length)){
    U.toast('Muốn kết thúc trận phải có tỷ số. Hãy bấm nút “Tỷ số” và lưu kết quả.','err');
    this.renderMatches?.();this.openAdminScore?.(id);return null;
  }
  return baseSetStatus(id,status);
};

function patchScoreModal(){
  const clear=$('tk18-score-clear'),save=$('tk18-score-save');
  if(clear&&!clear.dataset.u68){
    clear.dataset.u68='1';clear.textContent='🗑 Xóa tỷ số & đưa về Chưa thi đấu';clear.title='Xóa thật trên Firebase, không chỉ xóa ô nhập';
    clear.onclick=()=>{const id=App._tk18ScoreMatchId;if(!id)return U.toast('Chưa chọn trận','err');return resetMatchResult(id,{status:'SCHEDULED',confirm:true,source:'ADMIN_SCORE_CLEAR_U68'});};
  }
  if(save&&!save.dataset.u68){
    save.dataset.u68='1';const oldSave=save.onclick;
    save.onclick=async ev=>{
      const status=$('tk18-score-status')?.value,id=App._tk18ScoreMatchId;
      if(status==='SCHEDULED'&&id)return resetMatchResult(id,{status:'SCHEDULED',confirm:true,source:'ADMIN_SCORE_SAVE_SCHEDULED_U68'});
      return oldSave?.call(save,ev);
    };
  }
}
const baseOpenScore=App.openAdminScore?.bind(App);
if(baseOpenScore)App.openAdminScore=function(...args){const out=baseOpenScore(...args);patchScoreModal();return out;};
const baseRenderMatches=App.renderMatches?.bind(App);
if(baseRenderMatches)App.renderMatches=function(...args){const out=baseRenderMatches(...args);setTimeout(patchScoreModal,0);return out;};

function stamp(){
  T.CONFIG_VERSION=VERSION;T.VERSION=VERSION;T.RUNTIME_BUILD=VERSION;document.documentElement.dataset.topkeyBuild=BUILD;
  const h=$('health-version');if(h)h.textContent=VERSION;
  document.querySelectorAll('#page-health .version-badge, #page-health .upgrade-version, #page-health [data-version-badge], #tk19-repair-card .pill').forEach(el=>el.textContent=VERSION);
}
const baseHealth=App.renderHealth?.bind(App);
if(baseHealth)App.renderHealth=function(...args){const out=baseHealth(...args);stamp();return out;};
async function refreshSW(){if(!('serviceWorker'in navigator)||!location.protocol.startsWith('http'))return;try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${CACHE_TAG}`,{updateViaCache:'none'});try{await reg.update()}catch{}}catch(e){console.warn('Upgrade68 SW refresh',e)}}
stamp();patchScoreModal();refreshSW();setTimeout(()=>{stamp();patchScoreModal()},60);window.addEventListener('focus',()=>{stamp();patchScoreModal();refreshSW()},{passive:true});
window.TopkeyUpgrade68={installed:true,VERSION,CACHE_TAG,BUILD,UNPLAYED,RESULT_FIELDS,hasResultEvidence,resetMatchObject,touchesMatchQueue,resetMatchResult,verifyReset};
})();
