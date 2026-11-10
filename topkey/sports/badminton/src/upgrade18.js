(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U||App.__upgrade18ResultsInstalled)return;
App.__upgrade18ResultsInstalled=true;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=v=>JSON.parse(JSON.stringify(v??null));
const TERMINAL_COUNTED=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
const UNPLAYED=new Set(['SCHEDULED','CHECK_IN','READY','CALLED_TO_COURT','WARM_UP']);
const POLICY_LABEL={
  CANCEL_ALL:'Hủy toàn bộ kết quả',
  KEEP_PLAYED_WO:'Giữ trận đã đấu · trận chưa đấu xử WO 11–0, 11–0',
  KEEP_PLAYED_CANCEL:'Giữ trận đã đấu · trận chưa đấu không tính điểm'
};
const STATUS_LABEL={SCHEDULED:'Chưa thi đấu',CHECK_IN:'Check-in',READY:'Sẵn sàng',CALLED_TO_COURT:'Gọi ra sân',WARM_UP:'Khởi động',LIVE:'Đang thi đấu',INTERVAL:'Nghỉ giữa set',SUSPENDED:'Tạm dừng',FINISHED:'Đã kết thúc',WALKOVER:'Thắng WO',RETIRED:'Bỏ cuộc giữa trận',DISQUALIFIED:'Loại',CANCELLED:'Đã hủy'};
function byCode(code){return Object.values(App.state.matches||{}).find(m=>String(m.code||m.id||'')===String(code||''));}
function activeEntry(matchId){for(const [courtId,s] of Object.entries(App.state.activeMatches||{}))if(s?.matchId===matchId)return{courtId,state:s};return null;}
function stripOutcome(m){const x={...m};delete x.winnerId;delete x.finishedAt;return x;}
function scoreText(m){return (m.sets||[]).map(s=>`${Number(s.a)||0}-${Number(s.b)||0}`).join(' | ')||'—';}
function safeFile(v){return String(v||'doi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,50)||'doi';}
function injectUI(){
  if(!$('tk18-score-modal')){
    const d=document.createElement('div');d.id='tk18-score-modal';d.className='modal hidden';d.innerHTML=`<div class="modal-box wide tk18-modal-box"><div class="split"><div><h2>🏸 Nhập tỷ số nhanh</h2><p id="tk18-score-match" class="muted"></p></div><button id="tk18-score-close" type="button" class="btn mini">Đóng</button></div><div id="tk18-score-active-note" class="tk18-warning hidden"></div><div class="tk18-score-head"><span>Set</span><b id="tk18-score-a">Đội A</b><b id="tk18-score-b">Đội B</b></div><div id="tk18-score-sets" class="tk18-score-sets"></div><div class="field tk18-status-field"><label>Trạng thái sau khi lưu</label><select id="tk18-score-status"><option value="FINISHED">Đã kết thúc · tính BXH</option><option value="SUSPENDED">Tạm dừng</option><option value="SCHEDULED">Chưa thi đấu</option></select></div><p class="note">Nếu chọn <b>Đã kết thúc</b>, hệ thống tự xác định đội thắng theo số set, lưu Firebase và cập nhật BXH. Trận đang hoạt động trên sân chỉ cho phép chốt kết thúc tại đây để tránh lệch trạng thái phát cầu.</p><div class="split tk18-modal-actions"><button id="tk18-score-clear" type="button" class="btn danger">Xóa tỷ số nhập</button><button id="tk18-score-save" type="button" class="btn ok">💾 Lưu tỷ số & trạng thái</button></div></div>`;document.body.appendChild(d);
  }
  if(!$('tk18-withdraw-modal')){
    const d=document.createElement('div');d.id='tk18-withdraw-modal';d.className='modal hidden';d.innerHTML=`<div class="modal-box wide tk18-modal-box"><div class="split"><div><h2>🏳️ Chính sách đội bỏ cuộc</h2><p id="tk18-withdraw-team" class="muted"></p></div><button id="tk18-withdraw-close" type="button" class="btn mini">Đóng</button></div><div id="tk18-withdraw-summary" class="tk18-summary"></div><div class="tk18-policy-list"><label class="tk18-policy danger"><input type="radio" name="tk18-withdraw-policy" value="CANCEL_ALL"><span><b>1. Hủy kết quả toàn giải của đội</b><small>Tất cả trận của đội chuyển CANCELLED, xóa tỷ số/winner khỏi BXH. Các đối thủ không nhận điểm từ các trận này.</small></span></label><label class="tk18-policy"><input type="radio" name="tk18-withdraw-policy" value="KEEP_PLAYED_WO" checked><span><b>2. Giữ kết quả đã đấu + xử thắng các trận chưa đấu</b><small>Trận đã hoàn tất giữ nguyên. Trận chưa bắt đầu: đối thủ thắng WO <b>2–0</b>, tỷ số mặc định <b>11–0, 11–0</b>. Trận đang LIVE chuyển RETIRED và đối thủ thắng.</small></span></label><label class="tk18-policy"><input type="radio" name="tk18-withdraw-policy" value="KEEP_PLAYED_CANCEL"><span><b>3. Chỉ tính các trận đã đấu</b><small>Trận đã hoàn tất giữ nguyên. Trận chưa bắt đầu chuyển CANCELLED và không tính điểm. Trận đang LIVE chuyển RETIRED và đối thủ thắng.</small></span></label></div><div class="tk18-warning">Trước khi ghi Firebase, hệ thống tự tải JSON backup của đội và toàn bộ trận liên quan. Khôi phục trạng thái đội sau này <b>không tự đảo ngược</b> các kết quả đã xử lý.</div><div class="split tk18-modal-actions"><button id="tk18-withdraw-cancel" type="button" class="btn">Hủy</button><button id="tk18-withdraw-apply" type="button" class="btn danger">🏳️ Xác nhận bỏ cuộc & lưu trạng thái</button></div></div>`;document.body.appendChild(d);
  }
  $('tk18-score-close').onclick=()=>closeScore();$('tk18-score-clear').onclick=()=>clearScoreInputs();$('tk18-score-save').onclick=()=>saveScore();
  $('tk18-withdraw-close').onclick=()=>closeWithdraw();$('tk18-withdraw-cancel').onclick=()=>closeWithdraw();$('tk18-withdraw-apply').onclick=()=>applyWithdrawPolicy();
}
function closeScore(){$('tk18-score-modal')?.classList.add('hidden');App._tk18ScoreMatchId=null;}
function clearScoreInputs(){document.querySelectorAll('#tk18-score-sets input').forEach(x=>x.value='');U.toast('Đã xóa các ô tỷ số trên form; chưa ghi Firebase','info');}
function openScore(matchId){
  if(T.Auth?.role?.()!=='ADMIN')return U.toast('Chỉ ADMIN được nhập tỷ số nhanh tại lịch','err');
  injectUI();const m=App.state.matches?.[matchId];if(!m)return U.toast('Không tìm thấy trận','err');App._tk18ScoreMatchId=matchId;
  $('tk18-score-match').textContent=`${m.code||m.id} · ${App.teamName(m.teamAId)} vs ${App.teamName(m.teamBId)} · ${m.date||'chưa xếp ngày'} ${m.time||''}`;
  $('tk18-score-a').textContent=App.teamName(m.teamAId);$('tk18-score-b').textContent=App.teamName(m.teamBId);
  const bestOf=Math.max(1,Math.min(5,Number(App.state.config?.rules?.bestOf)||3)),host=$('tk18-score-sets');host.innerHTML='';
  for(let i=0;i<bestOf;i++){const s=m.sets?.[i];const row=document.createElement('div');row.className='tk18-score-row';row.innerHTML=`<b>Set ${i+1}</b><input data-side="a" data-set="${i}" type="number" min="0" max="99" inputmode="numeric" value="${s?Number(s.a)||0:''}" placeholder="0"><span>–</span><input data-side="b" data-set="${i}" type="number" min="0" max="99" inputmode="numeric" value="${s?Number(s.b)||0:''}" placeholder="0">`;host.appendChild(row);}
  const active=activeEntry(matchId),note=$('tk18-score-active-note');note.classList.toggle('hidden',!active);if(active)note.textContent=`⚠ Trận đang hoạt động tại ${App.state.courts?.[active.courtId]?.name||active.courtId}. Tại màn này chỉ nên chốt kết quả cuối; nếu muốn chấm tiếp hãy dùng màn Trọng tài.`;
  const st=$('tk18-score-status');st.value=m.status==='SUSPENDED'?'SUSPENDED':m.status==='SCHEDULED'?'SCHEDULED':'FINISHED';if(TERMINAL_COUNTED.has(m.status)||m.status==='LIVE'||m.status==='INTERVAL')st.value='FINISHED';
  $('tk18-score-modal').classList.remove('hidden');
}
function collectScoreSets(status){
  const rows=[...document.querySelectorAll('#tk18-score-sets .tk18-score-row')],sets=[];let gap=false;
  for(const row of rows){const aEl=row.querySelector('input[data-side="a"]'),bEl=row.querySelector('input[data-side="b"]'),av=aEl.value.trim(),bv=bEl.value.trim();if(!av&&!bv){gap=true;continue}if(!av||!bv)throw new Error('Mỗi set phải nhập đủ điểm của cả hai đội');if(gap)throw new Error('Không được bỏ trống set ở giữa rồi nhập set phía sau');const a=Number(av),b=Number(bv);if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>99||b>99)throw new Error('Điểm set phải là số nguyên từ 0 đến 99');if(a===b&&status==='FINISHED')throw new Error('Set đã kết thúc không thể có tỷ số hòa');const finished=status==='FINISHED'?a!==b:!!T.Scoring?.isSetWon?.(a,b,{...T.DEFAULT_RULES,...App.state.config?.rules});sets.push({a,b,finished});}
  return sets;
}
function winnerFromSets(sets){let a=0,b=0;sets.forEach(s=>{if(s.a>s.b)a++;else if(s.b>s.a)b++;});const need=Math.ceil((Number(App.state.config?.rules?.bestOf)||3)/2);return{a,b,need,side:a>=need?'A':b>=need?'B':null};}
async function saveScore(){
  const id=App._tk18ScoreMatchId,m=App.state.matches?.[id];if(!m)return U.toast('Trận không còn tồn tại','err');
  try{
    const status=$('tk18-score-status').value,sets=collectScoreSets(status),active=activeEntry(id);if(active&&status!=='FINISHED')return U.toast('Trận đang hoạt động trên sân: hãy chấm tiếp ở màn Trọng tài hoặc chọn Đã kết thúc tại đây','err');
    let after={...m,sets,status,updatedAt:Date.now(),manualResult:true,manualResultBy:T.Auth.user?.uid||''};
    if(status==='FINISHED'){const w=winnerFromSets(sets);if(!sets.length||!w.side)throw new Error(`Chưa đủ ${w.need} set thắng để kết thúc trận`);after.winnerId=w.side==='A'?m.teamAId:m.teamBId;after.finishedAt=Date.now();}
    else{delete after.winnerId;delete after.finishedAt;}
    const updates={};updates[T.Data.path('matches/'+id)]=after;
    if(status==='FINISHED'&&active){updates[T.Data.path('activeMatches/'+active.courtId)]=null;const c=App.state.courts?.[active.courtId];if(c)updates[T.Data.path('courts/'+active.courtId)]={...c,status:'AVAILABLE',activeMatchId:'',updatedAt:Date.now()};}
    await T.Data.queueMulti(updates,{type:'ADMIN_RESULT_SAVE'});await T.Data.audit('ADMIN_RESULT_SAVE','match',id,m,after);closeScore();U.toast(`Đã lưu ${scoreText(after)} · ${STATUS_LABEL[status]||status}${status==='FINISHED'?' · BXH đã cập nhật':''}`,'ok');
  }catch(e){U.toast('Không lưu được tỷ số: '+(e?.message||e),'err');}
}
function enhanceScheduleRows(){
  if(T.Auth?.role?.()!=='ADMIN')return;const box=$('matches-list');if(!box)return;
  box.querySelectorAll('tr.tk12-match-row').forEach(tr=>{if(tr.querySelector('.tk18-score-btn'))return;const m=byCode(tr.cells?.[0]?.textContent||'');if(!m)return;tr.dataset.matchId=m.id;const act=tr.lastElementChild;if(!act)return;const b=document.createElement('button');b.type='button';b.className='btn mini ok tk18-score-btn';b.textContent='Tỷ số';b.title='ADMIN nhập/sửa tỷ số và lưu trạng thái';b.onclick=()=>openScore(m.id);act.insertBefore(b,act.firstChild);});
}
function policySummary(teamId){const ms=Object.values(App.state.matches||{}).filter(m=>m.teamAId===teamId||m.teamBId===teamId),activeIds=new Set(Object.values(App.state.activeMatches||{}).filter(Boolean).map(s=>s.matchId));let completed=0,active=0,unplayed=0,cancelled=0;ms.forEach(m=>{if(activeIds.has(m.id)||m.status==='LIVE'||m.status==='INTERVAL'||m.status==='SUSPENDED')active++;else if(TERMINAL_COUNTED.has(m.status))completed++;else if(m.status==='CANCELLED')cancelled++;else unplayed++;});return{matches:ms,completed,active,unplayed,cancelled};}
function openWithdraw(teamId){
  injectUI();const t=App.state.teams?.[teamId];if(!t)return;if(t.withdrawn)return restoreTeam(teamId);App._tk18WithdrawTeamId=teamId;const s=policySummary(teamId);$('tk18-withdraw-team').textContent=`${t.code||''} · ${t.name}`;$('tk18-withdraw-summary').innerHTML=`<span><b>${s.matches.length}</b> trận liên quan</span><span><b>${s.completed}</b> đã hoàn tất</span><span><b>${s.active}</b> đang diễn ra/tạm dừng</span><span><b>${s.unplayed}</b> chưa đấu</span>${s.cancelled?`<span><b>${s.cancelled}</b> đã hủy từ trước</span>`:''}`;$('tk18-withdraw-modal').classList.remove('hidden');
}
function closeWithdraw(){$('tk18-withdraw-modal')?.classList.add('hidden');App._tk18WithdrawTeamId=null;}
async function restoreTeam(teamId){
  const t=App.state.teams?.[teamId];if(!t)return;const ok=await U.confirmDanger('Khôi phục '+t.name,'Chỉ khôi phục trạng thái đội để Smart Scheduler có thể sử dụng lại. Các trận đã CANCELLED / WO / RETIRED do lần bỏ cuộc trước KHÔNG tự hoàn nguyên; dùng backup JSON nếu cần phục hồi dữ liệu cũ.','KHÔI PHỤC');if(!ok)return;const after={...t,withdrawn:false,withdrawnAt:null,updatedAt:Date.now(),restoredAt:Date.now(),restoredBy:T.Auth.user?.uid||''};await T.Data.queueSet('teams/'+teamId,after,{type:'TEAM_RESTORE'});await T.Data.audit('RESTORE','team',teamId,t,after);U.toast('Đã khôi phục đội. Kết quả/lịch đã xử lý trước đó được giữ nguyên để tránh ghi đè dữ liệu mới.','ok');
}
function backupWithdrawal(t,summary,policy){const payload={type:'TOPKEY_WITHDRAWAL_BACKUP',version:T.VERSION,exportedAt:new Date().toISOString(),tournamentId:T.Data.tid,policy,team:t,matches:summary.matches,activeMatches:Object.fromEntries(Object.entries(App.state.activeMatches||{}).filter(([,s])=>s&&summary.matches.some(m=>m.id===s.matchId))),courts:App.state.courts};U.download(`Topkey_Backup_BoCuoc_${safeFile(t.code||t.name)}_${new Date().toISOString().slice(0,10)}.json`,new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));}
function matchWithActiveSets(m){const a=activeEntry(m.id);return a?.state?.sets?.length?clone(a.state.sets):clone(m.sets||[]);}
function cleanupActiveForMatch(updates,m){const a=activeEntry(m.id);if(!a)return;updates[T.Data.path('activeMatches/'+a.courtId)]=null;const c=App.state.courts?.[a.courtId];if(c)updates[T.Data.path('courts/'+a.courtId)]={...c,status:'AVAILABLE',activeMatchId:'',updatedAt:Date.now()};}
async function applyWithdrawPolicy(){
  const teamId=App._tk18WithdrawTeamId,t=App.state.teams?.[teamId];if(!t)return;const policy=document.querySelector('input[name="tk18-withdraw-policy"]:checked')?.value;if(!POLICY_LABEL[policy])return U.toast('Chọn cách xử lý kết quả khi bỏ cuộc','err');
  const summary=policySummary(teamId),detail=policy==='CANCEL_ALL'?`Hủy kết quả của toàn bộ ${summary.matches.length} trận liên quan.`:policy==='KEEP_PLAYED_WO'?`Giữ ${summary.completed} trận đã hoàn tất; ${summary.unplayed} trận chưa đấu còn hiệu lực sẽ xử WO 11–0, 11–0.`:`Giữ ${summary.completed} trận đã hoàn tất; ${summary.unplayed} trận chưa đấu sẽ không tính điểm.`;
  const ok=await U.confirmDanger('Xác nhận '+t.name+' bỏ cuộc',detail+' Trận đang LIVE/tạm dừng sẽ chốt RETIRED cho đối thủ thắng.','BỎ CUỘC');if(!ok)return;
  try{
    backupWithdrawal(t,summary,policy);const now=Date.now(),updates={},changed=[];let wo=0,cancel=0,retired=0,kept=0;
    for(const m of summary.matches){
      const isActive=!!activeEntry(m.id)||['LIVE','INTERVAL','SUSPENDED'].includes(m.status),opponent=m.teamAId===teamId?m.teamBId:m.teamAId;
      if(policy==='CANCEL_ALL'){
        let after=stripOutcome(m);after={...after,status:'CANCELLED',sets:[],updatedAt:now,cancelReason:'TEAM_WITHDRAWN_CANCEL_ALL',withdrawnTeamId:teamId};updates[T.Data.path('matches/'+m.id)]=after;cleanupActiveForMatch(updates,m);changed.push(m.id);cancel++;continue;
      }
      if(TERMINAL_COUNTED.has(m.status)){kept++;continue;}
      if(m.status==='CANCELLED'){kept++;continue;}
      if(isActive){const after={...m,status:'RETIRED',sets:matchWithActiveSets(m),winnerId:opponent,finishedAt:now,updatedAt:now,retiredTeamId:teamId,withdrawalPolicy:policy};updates[T.Data.path('matches/'+m.id)]=after;cleanupActiveForMatch(updates,m);changed.push(m.id);retired++;continue;}
      if(policy==='KEEP_PLAYED_WO'&&UNPLAYED.has(m.status)){
        const withdrawnIsA=m.teamAId===teamId,sets=withdrawnIsA?[{a:0,b:11,finished:true},{a:0,b:11,finished:true}]:[{a:11,b:0,finished:true},{a:11,b:0,finished:true}],after={...m,status:'WALKOVER',sets,winnerId:opponent,finishedAt:now,updatedAt:now,walkoverTeamId:teamId,walkoverReason:'TEAM_WITHDRAWN',withdrawalPolicy:policy};updates[T.Data.path('matches/'+m.id)]=after;changed.push(m.id);wo++;continue;
      }
      if(policy==='KEEP_PLAYED_CANCEL'&&UNPLAYED.has(m.status)){
        let after=stripOutcome(m);after={...after,status:'CANCELLED',sets:[],updatedAt:now,cancelReason:'TEAM_WITHDRAWN_NO_POINTS',withdrawnTeamId:teamId,withdrawalPolicy:policy};updates[T.Data.path('matches/'+m.id)]=after;changed.push(m.id);cancel++;continue;
      }
      kept++;
    }
    const teamAfter={...t,withdrawn:true,checkedIn:false,withdrawnAt:now,updatedAt:now,withdrawalPolicy:{mode:policy,label:POLICY_LABEL[policy],appliedAt:now,appliedBy:T.Auth.user?.uid||'',affectedMatches:changed.length,walkovers:wo,cancelled:cancel,retired,kept}};updates[T.Data.path('teams/'+teamId)]=teamAfter;
    await T.Data.queueMulti(updates,{type:'TEAM_WITHDRAW_POLICY'});await T.Data.audit('WITHDRAW_POLICY','team',teamId,t,{team:teamAfter,summary:{policy,changed:changed.length,walkovers:wo,cancelled:cancel,retired,kept}});closeWithdraw();U.toast(`Đã lưu bỏ cuộc: ${POLICY_LABEL[policy]} · WO ${wo} · hủy ${cancel} · RET ${retired} · giữ ${kept}`,'ok');
  }catch(e){U.toast('Không áp dụng được chính sách bỏ cuộc: '+(e?.message||e),'err');}
}
function enhanceTeamRows(){
  const box=$('teams-list');if(!box)return;[...box.rows].forEach(tr=>{const code=tr.cells?.[0]?.textContent||'',t=Object.values(App.state.teams||{}).find(x=>String(x.code||x.id||'')===String(code));if(!t)return;if(t.withdrawn&&tr.cells[7]){const mode=t.withdrawalPolicy?.mode,label=POLICY_LABEL[mode];tr.cells[7].innerHTML=`<b class="status-withdrawn">BỎ CUỘC</b>${label?`<small class="tk18-policy-tag">${esc(label)}</small>`:''}`;}});
}
function enhanceWithdrawList(){const box=$('withdraw-list');if(!box)return;box.querySelectorAll('.rule-chip').forEach(row=>{const text=row.querySelector('span');if(!text)return;const t=Object.values(App.state.teams||{}).find(x=>text.textContent.includes(x.name));if(t?.withdrawalPolicy?.mode&&!text.querySelector?.('.tk18-policy-tag')){const small=document.createElement('small');small.className='tk18-policy-tag';small.textContent=POLICY_LABEL[t.withdrawalPolicy.mode]||t.withdrawalPolicy.mode;text.appendChild(document.createElement('br'));text.appendChild(small);}});}
function install(){
  injectUI();
  const baseMatches=App.renderMatches?.bind(App);if(baseMatches)App.renderMatches=function(){const r=baseMatches();enhanceScheduleRows();return r;};
  const baseTeams=App.renderTeams?.bind(App);if(baseTeams)App.renderTeams=function(){const r=baseTeams();enhanceTeamRows();return r;};
  const baseScheduler=App.renderSchedulerControls?.bind(App);if(baseScheduler)App.renderSchedulerControls=function(){const r=baseScheduler();enhanceWithdrawList();return r;};
  App.toggleWithdrawn=function(id){return openWithdraw(id);};
  App.bulkWithdrawTeams=function(){const ids=this.selectedTeamIds?.('withdraw-team-grid')||[];if(!ids.length)return U.toast('Tick ít nhất 1 đội cần bỏ cuộc','err');if(ids.length>1)return U.toast('Chính sách bỏ cuộc ảnh hưởng BXH. Hãy xử lý từng đội để xác nhận riêng cách tính kết quả cho từng đội.','info');return openWithdraw(ids[0]);};
  App.openAdminScore=openScore;
  setTimeout(()=>{enhanceScheduleRows();enhanceTeamRows();enhanceWithdrawList();},0);
}
install();
window.TopkeyUpgrade18={openScore,openWithdraw,applyWithdrawPolicy,policySummary,POLICY_LABEL};
})();
