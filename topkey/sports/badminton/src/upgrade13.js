(() => {
'use strict';
const T=window.Topkey,App=T?.App,U=T?.U;
if(!T||!App||!U)return;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Firebase rejects undefined/NaN/Infinity. Keep the payload JSON-safe before every direct migration write.
function clean(value){
  if(value===undefined)return undefined;
  if(value===null||typeof value==='string'||typeof value==='boolean')return value;
  if(typeof value==='number')return Number.isFinite(value)?value:null;
  if(Array.isArray(value))return value.map(v=>clean(v)===undefined?null:clean(v));
  if(typeof value==='object'){
    const out={};
    for(const [k,v] of Object.entries(value)){const c=clean(v);if(c!==undefined)out[k]=c;}
    return out;
  }
  return String(value);
}

async function bundledData(){
  const r=await fetch('./data/badminton_migration_2026.json',{cache:'no-store'});
  if(!r.ok)throw new Error('Không đọc được gói dữ liệu CSV đi kèm');
  return clean(await r.json());
}

async function clearFailedMigrationQueue(){
  const items=await T.idb.all('queue');
  let n=0;
  for(const item of items){
    const type=String(item?.meta?.type||'');
    if(type.includes('MIGRATION')||type.includes('MIGRATE')){await T.idb.del('queue',item.id);n++;}
  }
  T.Data.pending=(await T.idb.all('queue')).length;
  App.renderHealth?.();
  return n;
}

function physicalNumber(physicalHalf,row){
  // Court labels are fixed physical positions, never player numbers:
  // LEFT half: top=1, bottom=2. RIGHT half: top=2, bottom=1.
  return physicalHalf==='left'?(row===0?'1':'2'):(row===0?'2':'1');
}
function playerCard(side,key,team,state,physicalHalf,row){
  const pos=state.positions?.[side]?.[key]||((key==='p1')?'right':'left');
  const even=pos==='right';
  const serving=state.serverSide===side&&state.serverPlayer===key;
  const name=team?.[key]||`VĐV ${key==='p1'?'1':'2'}`;
  const slot=physicalNumber(physicalHalf,row);
  return `<div class="player tk11-player tk13-player ${serving?'serving':''}" data-court-slot="${slot}"><span class="tk11-player-no tk13-fixed-court-no" title="Số vị trí sân cố định">${slot}</span><div><b>${esc(name)}</b><small>${even?'Ô CHẴN · BÊN PHẢI':'Ô LẺ · BÊN TRÁI'}${serving?' · 🏸 PHÁT CẦU':''}</small></div></div>`;
}
function teamHalf(side,team,state,physicalHalf){
  const pos=state.positions?.[side]||{p1:'right',p2:'left'};
  const order=['p1','p2'].sort((a,b)=>(pos[a]==='left'?0:1)-(pos[b]==='left'?0:1));
  return `<div class="court-half tk13-${physicalHalf}" data-side="${side}"><div class="tk11-team-head"><b>${esc(team?.name||`Đội ${side}`)}</b><button class="btn mini tk11-swap-pos" data-swap-pos="${side}">↕ Đổi vị trí</button></div>${order.map((k,i)=>playerCard(side,k,team,state,physicalHalf,i)).join('')}</div>`;
}

function installFixedCourtNumbers(){
  App.renderUmpire=function(){
    const court=$('umpire-court')?.value||this.currentCourt;this.currentCourt=court||this.currentCourt;
    const s=this.state.activeMatches?.[this.currentCourt],box=$('umpire-board');if(!box)return;
    if(!s){box.innerHTML='<div class="empty">Chọn trận và bấm Load.</div>';return;}
    s.positions=s.positions||{A:{p1:'right',p2:'left'},B:{p1:'right',p2:'left'}};s.serverSide=s.serverSide||'A';s.serverPlayer=s.serverPlayer||'p1';
    const m=this.state.matches?.[s.matchId],set=s.sets?.[s.setIndex]||{a:0,b:0},A=this.state.teams?.[m?.teamAId]||{},B=this.state.teams?.[m?.teamBId]||{};
    const left=s.sideSwapped?'B':'A',right=left==='A'?'B':'A',teams={A,B},serverTeam=teams[s.serverSide]||{},serverPos=s.positions?.[s.serverSide]?.[s.serverPlayer]||'right',serverName=serverTeam?.[s.serverPlayer]||'—';
    box.innerHTML=`<div class="score-head"><div><small>SET ${s.setIndex+1} · A</small><strong>${set.a}</strong></div><span>${esc(A.name||'Đội A')} vs ${esc(B.name||'Đội B')}</span><div><small>SET ${s.setIndex+1} · B</small><strong>${set.b}</strong></div></div><div class="tk11-service-line"><span>🏸 Phát cầu: <b>${esc(serverName)}</b> · Bên ${s.serverSide} · ${serverPos==='right'?'Ô CHẴN':'Ô LẺ'}</span><span class="tk13-court-legend">Số sân cố định: TRÁI 1↑/2↓ · PHẢI 2↑/1↓</span><button class="btn mini primary" id="tk11-swap-court">⇄ Đổi bên sân</button></div><div class="court">${teamHalf(left,teams[left],s,'left')}<div class="net"></div>${teamHalf(right,teams[right],s,'right')}</div>`;
    box.querySelectorAll('[data-swap-pos]').forEach(b=>b.onclick=()=>this.swapTeamPositions(b.dataset.swapPos));
    $('tk11-swap-court').onclick=()=>this.swapCourtSides();
  };
}

async function probeOne(label,path,value){
  const ref=T.Data.db.ref(T.Data.path(path));
  try{await ref.set(clean(value));await ref.remove();return {label,ok:true};}
  catch(e){try{await ref.remove()}catch(_e){}return {label,ok:false,error:e?.message||String(e)};}
}
async function diagnoseWrites(show=true){
  if(!T.Data?.db||!T.Data.connected)throw new Error('Firebase chưa CONNECTED');
  const uid=T.Auth?.user?.uid||'',stamp=Date.now(),base={probe:true,uid,at:stamp,version:T.VERSION};
  const tests=[
    ['meta','meta/upgrade13Probe',base],
    ['config','config/upgrade13Probe',base],
    ['teams','teams/__upgrade13_probe__',{id:'__upgrade13_probe__',name:'PROBE',p1:'PROBE',category:'MEN',createdAt:stamp}],
    ['matches','matches/__upgrade13_probe__',{id:'__upgrade13_probe__',teamAId:'probeA',teamBId:'probeB',category:'MEN',stage:'GROUP',status:'SCHEDULED',sets:[],createdAt:stamp}],
    ['activeMatches','activeMatches/__upgrade13_probe__',{matchId:'__upgrade13_probe__',courtId:'__upgrade13_probe__',started:false,updatedAt:stamp}],
    ['courts','courts/__upgrade13_probe__',{id:'__upgrade13_probe__',name:'PROBE',status:'AVAILABLE',updatedAt:stamp}],
    ['audit','audit/__upgrade13_probe__',{id:'__upgrade13_probe__',action:'PROBE',entityType:'system',entityId:'upgrade13',uid,clientAt:stamp}]
  ];
  const results=[];for(const t of tests)results.push(await probeOne(...t));
  const failed=results.filter(x=>!x.ok);
  const el=$('legacy-migration-status');
  if(show&&el)el.innerHTML=failed.length?`<div class="tk13-probe-bad"><b>Firebase còn chặn ${failed.length} nhánh:</b> ${failed.map(x=>`${esc(x.label)} (${esc(x.error)})`).join(' · ')}<br>Hãy Publish <b>Database Rules Upgrade 13</b> ở Realtime Database → Rules.</div>`:`<div class="tk13-probe-ok"><b>✓ Quyền ghi PASS 7/7:</b> meta · config · teams · matches · activeMatches · courts · audit. Có thể Migration.</div>`;
  if(show)U.toast(failed.length?`Firebase còn chặn: ${failed.map(x=>x.label).join(', ')}`:'✓ Firebase quyền ghi PASS 7/7',failed.length?'err':'ok');
  return {ok:!failed.length,results,failed};
}

function installMigration13(){
  App.inspectLegacyData=async function(){
    const el=$('legacy-migration-status');
    try{const d=await bundledData(),s=d.summary||{};if(el)el.innerHTML=`<div class="migration-summary"><b>Dữ liệu CSV sẵn sàng:</b> ${s.teams} đội · ${s.matches} trận · ${s.finished} đã xong · ${s.scheduled} chưa đấu. MEN ${s.categories?.MEN||0} · WOMEN ${s.categories?.WOMEN||0} · MIX ${s.categories?.MIX||0}.<br><b>Upgrade 13:</b> đã sửa lỗi undefined + PERMISSION_DENIED do ghi nguyên nhánh. Hãy bấm “Kiểm tra quyền ghi 7 nhánh” trước khi nhập.</div>`;$('migrate-legacy').textContent='📥 Nhập 26 đội + 95 trận → VNext';}
    catch(e){if(el)el.textContent='Không đọc được dữ liệu đính kèm: '+(e?.message||e)}
  };
  App.migrateLegacy=async function(){
    if(T.Auth.role()!=='ADMIN')return U.toast('Chỉ ADMIN được Migration','err');
    if(!T.Data.connected)return U.toast('Migration cần Firebase CONNECTED để xác nhận ghi thành công','err');
    const el=$('legacy-migration-status');
    try{
      const probe=await diagnoseWrites(false);if(!probe.ok){if(el)el.innerHTML=`<div class="tk13-probe-bad"><b>Chưa Migration.</b> Firebase đang chặn: ${probe.failed.map(x=>esc(x.label)).join(', ')}. Publish Database Rules Upgrade 13 rồi bấm kiểm tra lại.</div>`;return U.toast('Chưa đủ quyền ghi: '+probe.failed.map(x=>x.label).join(', '),'err');}
      const d=await bundledData(),s=d.summary||{};
      if(!await U.confirmDanger('Nhập dữ liệu giải đính kèm',`Thay danh sách đội/lịch hiện tại bằng ${s.teams} đội và ${s.matches} trận từ CSV. ${s.finished} trận đã xong sẽ vào BXH; ${s.scheduled} trận giữ trạng thái chưa đấu. Tài khoản, tài chính, Audit, firewall và hình nền được giữ nguyên.`,'NHẬP DỮ LIỆU'))return;
      const removed=await clearFailedMigrationQueue();
      const backup={type:'TOPKEY_PRE_MIGRATION_BACKUP',version:T.VERSION,exportedAt:new Date().toISOString(),tournamentId:T.Data.tid,teams:this.state.teams,matches:this.state.matches,config:this.state.config};
      U.download(`Topkey_Backup_Truoc_Migration_${new Date().toISOString().slice(0,10)}.json`,new Blob([JSON.stringify(clean(backup),null,2)],{type:'application/json'}));
      if(el)el.innerHTML=`Đang ghi dữ liệu theo path con an toàn… ${removed?`Đã dọn ${removed} queue Migration lỗi cũ. `:''}Vui lòng chờ xác minh lại 26 đội + 95 trận.`;
      const patch=d.configPatch||{},cfg=clean({...this.state.config,...patch,rules:{...T.DEFAULT_RULES,...(this.state.config?.rules||{})},appearance:{...(this.state.config?.appearance||{}),...(patch.appearance||{})},tournamentStatus:'ACTIVE',rulesLocked:true,updatedAt:Date.now()});
      const updates={};
      const newTeams=d.teams||{},newMatches=d.matches||{};
      // Delete stale test rows one child at a time; do not write entire protected parent branches.
      for(const id of Object.keys(this.state.teams||{}))if(!newTeams[id])updates[T.Data.path('teams/'+id)]=null;
      for(const [id,row] of Object.entries(newTeams))updates[T.Data.path('teams/'+id)]=clean(row);
      for(const id of Object.keys(this.state.matches||{}))if(!newMatches[id])updates[T.Data.path('matches/'+id)]=null;
      for(const [id,row] of Object.entries(newMatches))updates[T.Data.path('matches/'+id)]=clean(row);
      updates[T.Data.path('config')]=cfg;
      for(const cid of Object.keys(this.state.activeMatches||{}))updates[T.Data.path('activeMatches/'+cid)]=null;
      for(const [cid,c] of Object.entries(this.state.courts||{}))updates[T.Data.path('courts/'+cid)]=clean({...c,status:'AVAILABLE',activeMatchId:'',updatedAt:Date.now()});
      const auditId=U.id('audit');updates[T.Data.path('audit/'+auditId)]={id:auditId,action:'MIGRATE_CSV',entityType:'tournament',entityId:T.Data.tid,uid:T.Auth.user?.uid||'',actor:T.Auth.profile?.displayName||T.Auth.profile?.email||'ADMIN',after:{source:d.sourceFile,summary:s},clientAt:Date.now()};
      const safe=clean(updates);
      await T.Data.db.ref().update(safe);
      const [teamSnap,matchSnap]=await Promise.all([T.Data.ref('teams').once('value'),T.Data.ref('matches').once('value')]);
      const tc=teamSnap.numChildren(),mc=matchSnap.numChildren();
      if(tc!==Number(s.teams)||mc!==Number(s.matches))throw new Error(`Firebase đã ghi nhưng xác minh số lượng không khớp: ${tc}/${s.teams} đội, ${mc}/${s.matches} trận`);
      this.state.teams=newTeams;this.state.matches=newMatches;this.state.config=cfg;this.state.activeMatches={};this.renderAll();
      if(el)el.innerHTML=`<div class="tk13-probe-ok"><b>✓ MIGRATION HOÀN TẤT & ĐÃ XÁC MINH FIREBASE:</b> ${tc} đội · ${mc} trận (${s.finished} đã xong + ${s.scheduled} chưa đấu). Giải ở trạng thái <b>ĐANG DIỄN RA</b>; BXH tính lại từ kết quả set.${removed?` Đã dọn ${removed} queue lỗi cũ.`:''}</div>`;
      U.toast(`✓ Migration thành công: ${tc} đội · ${mc} trận`,'ok');
    }catch(e){console.error('Upgrade13 migration',e);if(el)el.innerHTML=`<div class="tk13-probe-bad"><b>Migration chưa ghi dữ liệu:</b> ${esc(e?.message||e)}<br>Bấm “Kiểm tra quyền ghi 7 nhánh” để biết chính xác path nào bị Firebase chặn.</div>`;U.toast('Migration lỗi: '+(e?.message||e),'err');}
  };

  const old=$('tk11-write-probe');if(old){old.textContent='🔎 Kiểm tra quyền ghi 7 nhánh';old.onclick=()=>diagnoseWrites(true);}
  const migrate=$('migrate-legacy');if(migrate){let cleanBtn=$('tk13-clear-migration-queue');if(!cleanBtn){cleanBtn=document.createElement('button');cleanBtn.id='tk13-clear-migration-queue';cleanBtn.className='btn mini';cleanBtn.style.marginLeft='8px';cleanBtn.textContent='🧹 Dọn queue Migration lỗi';cleanBtn.onclick=async()=>{const n=await clearFailedMigrationQueue();U.toast(n?`Đã dọn ${n} queue Migration lỗi cũ`:'Không có queue Migration lỗi cần dọn',n?'ok':'info')};migrate.parentElement?.appendChild(cleanBtn);}}
}

const baseDataInit=T.Data.init.bind(T.Data);
T.Data.init=async function(){const removed=await clearFailedMigrationQueue();if(removed)console.info('Upgrade13 cleared stale migration queue items:',removed);return baseDataInit();};
function install(){installFixedCourtNumbers();installMigration13();setTimeout(()=>App.inspectLegacyData?.(),0);}
install();
window.TopkeyUpgrade13={clean,diagnoseWrites,clearFailedMigrationQueue,bundledData};
})();
