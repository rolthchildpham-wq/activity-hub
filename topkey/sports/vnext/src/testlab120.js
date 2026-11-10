(() => {
'use strict';
const BUILD='u120-20261031';
const qs=new URLSearchParams(location.search);
if(qs.get('testlab')!=='1') return;
const T=window.Topkey||{};
const sport=(T.SPORT&&T.SPORT.key)||qs.get('sport')||'football';
const tid=qs.get('tid')||'';
const safePrefix=`__testlab_${BUILD.replace(/[^a-z0-9]/gi,'_')}_${sport}_`;
const safe=tid.startsWith(safePrefix);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const banner=document.createElement('div');
banner.id='topkey-testlab-banner';banner.style.cssText='position:sticky;top:0;z-index:99999;background:#7f1d1d;color:#fff;padding:10px 14px;font:700 12px/1.45 system-ui;border-bottom:2px solid #fbbf24;display:flex;gap:10px;align-items:center;flex-wrap:wrap';
banner.innerHTML=`<strong>🧪 TEST LAB · ${esc(sport.toUpperCase())}</strong><span id="tl120-status">Đang chờ xác thực…</span><span style="opacity:.8">Kênh: ${esc(tid||'KHÔNG HỢP LỆ')}</span><button id="tl120-reset" style="margin-left:auto;border:0;border-radius:8px;padding:7px 10px;font-weight:800;cursor:pointer">Reset dữ liệu test</button><a href="../../index.html" style="color:#fff;text-decoration:underline">Về Hub</a>`;
document.body.prepend(banner);
const status=(msg,ok=false)=>{const e=document.getElementById('tl120-status');if(e){e.textContent=msg;e.style.color=ok?'#bbf7d0':'#fde68a'}};
if(!safe){status('ĐÃ CHẶN: Tournament ID không thuộc namespace Test Lab');document.getElementById('tl120-reset').disabled=true;return;}
function iso(d){return d.toISOString().slice(0,10)}
function buildDataset(){
 const S=T.SPORT||{}; const mode=S.mode||'score'; const cats=S.categories||['OPEN']; const c1=cats[0],c2=cats[1]||c1; const now=Date.now(); const day0=new Date(); day0.setHours(0,0,0,0); const d=n=>iso(new Date(day0.getTime()+n*86400000));
 const names={football:['FC Alpha','FC Beta','FC Gamma','FC Delta','FC Epsilon','FC Zeta','FC Eta','FC Theta'],volleyball:['Volley Alpha','Volley Beta','Volley Gamma','Volley Delta','Volley Epsilon','Volley Zeta','Volley Eta','Volley Theta'],running:['Nguyễn An','Trần Bình','Lê Chi','Phạm Dũng','Hoàng Em','Võ Giang','Đặng Hà','Bùi Khang'],handmade:['Xưởng Mộc Mini','Sợi & Màu','Tái Chế Xanh','Gốm Nhỏ','Paper Lab','Tre Việt','Mây Studio','Upcycle 8'],shuttle:['Đá Cầu Alpha','Đá Cầu Beta','Đá Cầu Gamma','Đá Cầu Delta','Đá Cầu Epsilon','Đá Cầu Zeta','Đá Cầu Eta','Đá Cầu Theta'],cooking:['Bếp Alpha','Bếp Beta','Bếp Gamma','Bếp Delta','Bếp Epsilon','Bếp Zeta','Bếp Eta','Bếp Theta']}[sport]||Array.from({length:8},(_,i)=>`Đội ${i+1}`);
 const teams={}; names.forEach((name,i)=>{const id=`tl_p${i+1}`;teams[id]={id,code:`T${String(i+1).padStart(3,'0')}`,name,p1:`Thành viên ${i+1}A`,p2:`Thành viên ${i+1}B`,dept:i%2?'Khối Sản xuất':'Khối Văn phòng',category:i<6?c1:c2,checkedIn:i!==7,withdrawn:false,createdAt:now-10*86400000+i*1000,testLab:true};});
 const courts={}; const venuePrefix=mode==='time'?'Làn':(['handmade','cooking'].includes(sport)?'Khu vực (Sảnh)':mode==='judged'?'Khu':'Sân'); for(let i=1;i<=4;i++)courts[`court_${i}`]={id:`court_${i}`,name:`${venuePrefix} ${i}`,status:'AVAILABLE',activeMatchId:'',stream:{type:'CAMERA',url:''},testLab:true};
 const matches={}; let seq=1; const add=(a,b,stage,status,result={},date=d(-2),time='08:00',court='court_1',category=c1)=>{const id=`tl_m${seq}`;matches[id]={id,code:`M${String(seq).padStart(3,'0')}`,teamAId:`tl_p${a}`,teamBId:b?`tl_p${b}`:'',category,stage,date,time,courtId:court,status,sets:[],createdAt:now-7*86400000+seq*1000,testLab:true,...result};seq++;return id};
 const setResult=(aWins=true)=>({sets:aWins?[{a:25,b:18,finished:true},{a:25,b:21,finished:true},{a:25,b:20,finished:true}]:[{a:18,b:25,finished:true},{a:21,b:25,finished:true},{a:20,b:25,finished:true}],winnerId:aWins?'__A__':'__B__',finishedAt:now-2*86400000});
 const badSet=(aWins=true)=>({sets:aWins?[{a:21,b:15,finished:true},{a:21,b:18,finished:true}]:[{a:17,b:21,finished:true},{a:19,b:21,finished:true}],winnerId:aWins?'__A__':'__B__',finishedAt:now-2*86400000});
 if(mode==='time'){
   [1,2,3,4,5,6,7,8].forEach((p,i)=>add(p,0,i<4?'HEAT':(i<7?'QUALIFY':'FINAL'),'FINISHED',{resultMs:900000+i*3700,finishedAt:now-86400000},d(-2+i%2),`0${8+i%2}:00`,`court_${i%4+1}`,i<6?c1:c2));
   add(1,0,'FINAL','LIVE',{},d(0),'15:00','court_1',c1);
   add(2,0,'FINAL','SCHEDULED',{},d(1),'08:00','court_2',c1);
 }else if(mode==='judged'){
   [86.5,91.2,78.8,88.4,84.9,93.1,80.5,89.7].forEach((score,i)=>add(i+1,0,i<4?'DISPLAY':(i<7?'QUALIFY':'FINAL'),'FINISHED',{judgeScore:score,finishedAt:now-86400000,rubric:S.rubric||[]},d(-2+i%2),`0${8+i%2}:30`,`court_${i%4+1}`,i<6?c1:c2));
   add(1,0,'FINAL','LIVE',{},d(0),'15:30','court_1',c1);
   add(2,0,'FINAL','SCHEDULED',{},d(1),'09:00','court_2',c1);
 }else{
   const finishedPairs=[[1,2,true],[3,4,false],[5,6,true],[1,3,true],[2,4,true],[5,1,false]];
   finishedPairs.forEach(([a,b,aw],i)=>{let result;if(mode==='sets')result=sport==='shuttle'?badSet(aw):setResult(aw);else result={scoreA:aw?3:1,scoreB:aw?1:2,winnerId:aw?`tl_p${a}`:`tl_p${b}`,finishedAt:now-2*86400000}; const id=add(a,b,'GROUP','FINISHED',result,d(-3+i%2),`0${8+i}:00`,`court_${i%4+1}`,c1);if(result.winnerId==='__A__')matches[id].winnerId=`tl_p${a}`;if(result.winnerId==='__B__')matches[id].winnerId=`tl_p${b}`;});
   add(7,8,'GROUP','WALKOVER',{winnerId:'tl_p7',finishedAt:now-86400000},d(-1),'09:00','court_1',c2);
   for(const [a,b,aw,tm,court] of [[1,4,true,'10:00','court_1'],[2,5,false,'10:00','court_2']]){let result;if(mode==='sets')result=sport==='shuttle'?badSet(aw):setResult(aw);else result={scoreA:aw?2:0,scoreB:aw?0:2,winnerId:aw?`tl_p${a}`:`tl_p${b}`,finishedAt:now-12*3600000};const id=add(a,b,'SEMIFINAL','FINISHED',result,d(-1),tm,court,c1);if(result.winnerId==='__A__')matches[id].winnerId=`tl_p${a}`;if(result.winnerId==='__B__')matches[id].winnerId=`tl_p${b}`;}
   let finalResult;if(mode==='sets')finalResult=sport==='shuttle'?badSet(true):setResult(true);else finalResult={scoreA:2,scoreB:1,winnerId:'tl_p1',finishedAt:now-3600000};const fid=add(1,5,'FINAL','FINISHED',finalResult,d(0),'13:00','court_1',c1);if(finalResult.winnerId==='__A__')matches[fid].winnerId='tl_p1';if(finalResult.winnerId==='__B__')matches[fid].winnerId='tl_p5';
   add(3,6,'GROUP','LIVE',{},d(0),'15:00','court_2',c1); add(7,8,'GROUP','SCHEDULED',{},d(1),'09:00','court_3',c2);
 }
 const live=Object.values(matches).find(m=>m.status==='LIVE'); if(live){courts[live.courtId]={...courts[live.courtId],status:'LIVE',activeMatchId:live.id};}
 const activeMatches={}; if(live){activeMatches[live.courtId]=mode==='sets'?{matchId:live.id,courtId:live.courtId,teamAId:live.teamAId,teamBId:live.teamBId,sets:[{a:11,b:9,finished:false}],setIndex:0,serverSide:'A',serverPlayer:'p1',positions:{A:{p1:'right',p2:'left'},B:{p1:'right',p2:'left'}},started:true,finished:false,history:[],updatedAt:now,testLab:true}:mode==='score'?{matchId:live.id,courtId:live.courtId,teamAId:live.teamAId,teamBId:live.teamBId,scoreA:1,scoreB:0,started:true,finished:false,history:[],updatedAt:now,testLab:true}:{matchId:live.id,courtId:live.courtId,teamAId:live.teamAId,started:true,finished:false,history:[],updatedAt:now,testLab:true};}
 const registrations={tl_reg1:{id:'tl_reg1',name:'Đăng ký Test Chờ Duyệt',p1:'Người Test A',p2:'Người Test B',dept:'QA',category:c1,status:'PENDING',createdAt:now-3600000,testLab:true},tl_reg2:{id:'tl_reg2',name:'Đăng ký Test Đã Duyệt',p1:'Người Test C',p2:'',dept:'QA',category:c2,status:'APPROVED',createdAt:now-7200000,testLab:true}};
 const finance={tl_fin1:{id:'tl_fin1',seq:1,date:d(-4),type:'INCOME',category:'Tài trợ test',amount:12000000,invoice:'TL-INC-001',note:'Dữ liệu giả',status:'PAID',testLab:true},tl_fin2:{id:'tl_fin2',seq:2,date:d(-3),type:'EXPENSE',category:'Thuê địa điểm test',amount:3500000,invoice:'TL-EXP-001',note:'Dữ liệu giả',status:'PAID',testLab:true},tl_fin3:{id:'tl_fin3',seq:3,date:d(-2),type:'EXPENSE',category:'Vật tư test',amount:1250000,invoice:'TL-EXP-002',note:'Dữ liệu giả',status:'APPROVED',testLab:true}};
 const announcements={tl_ann1:{id:'tl_ann1',title:'🧪 Test Lab đang hoạt động',body:`Bộ dữ liệu giả ${sport} · ${tid}`,level:'INFO',popup:false,createdAt:now,author:'TOPKEY Test Lab',testLab:true},tl_ann2:{id:'tl_ann2',title:'Lịch thi đấu giả lập',body:'Đã nạp đủ trạng thái Scheduled / Live / Finished / Walkover và vòng trong.',level:'WARN',popup:false,createdAt:now-1000,author:'TOPKEY Test Lab',testLab:true}};
 const audit={tl_audit1:{id:'tl_audit1',action:'TESTLAB_SEED',entityType:'tournament',entityId:tid,uid:'testlab',actor:'TOPKEY Test Lab',clientAt:now,sport,testLab:true}};
 const config={title:`🧪 TEST LAB · ${S.name||sport} · ${BUILD}`,location:'TOPKEY QA Sandbox',rules:{...(T.DEFAULT_RULES||S.rules||{})},rulesLocked:false,publicMode:true,tournamentStatus:'ACTIVE',scheduler:{lockedDates:[d(2)],busy:[{teamId:'tl_p8',date:d(1)}],priority:[{teamId:'tl_p1',from:d(0),to:d(1)}],limits:[{teamId:'tl_p1',from:d(0),to:d(2),max:2}]},testLab:{enabled:true,build:BUILD,sport,tid,seededAt:now,safeNamespace:true}};
 return {config,teams,matches,courts,activeMatches,finance,announcements,registrations,audit};
}
async function seed(force=false){
 if(!safe) throw new Error('Unsafe Test Lab namespace');
 if(!window.firebase?.apps?.length) throw new Error('Firebase chưa khởi tạo');
 const user=firebase.auth().currentUser;if(!user){status('Đăng nhập ADMIN để tự nạp dữ liệu test');return false;}
 status(force?'Đang reset dữ liệu test…':'Đang nạp dữ liệu giả…');
 const root=`${T.ROOT}/tournaments/${tid}`; const ref=firebase.database().ref(root); const existing=(await ref.child('config/testLab').once('value')).val();
 if(!force&&existing?.build===BUILD){status(`Đã có dữ liệu test · ${Object.keys((await ref.child('matches').once('value')).val()||{}).length} lượt/trận`,true);runChecks(ref);return true;}
 const data=buildDataset(),updates={}; for(const [branch,value] of Object.entries(data)) updates[`${root}/${branch}`]=value; await firebase.database().ref().update(updates); status(`Đã nạp ${Object.keys(data.teams).length} đối tượng · ${Object.keys(data.matches).length} lượt/trận`,true); runChecks(ref); return true;
}
async function runChecks(ref){try{const s=(await ref.once('value')).val()||{};const checks=[['Namespace an toàn',safe],['Config',!!s.config?.testLab?.enabled],['Đối tượng',Object.keys(s.teams||{}).length>=8],['Lịch/kết quả',Object.keys(s.matches||{}).length>=8],['Đã hoàn tất',Object.values(s.matches||{}).some(m=>m.status==='FINISHED')],['LIVE',Object.values(s.matches||{}).some(m=>m.status==='LIVE')],['Đăng ký',Object.keys(s.registrations||{}).length>=2],['Tài chính',Object.keys(s.finance||{}).length>=3],['Thông báo',Object.keys(s.announcements||{}).length>=2],['Audit',Object.keys(s.audit||{}).length>=1]];let box=document.getElementById('tl120-checks');if(!box){box=document.createElement('div');box.id='tl120-checks';box.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99998;max-width:320px;background:#111827;color:#fff;border:1px solid #f59e0b;border-radius:12px;padding:10px 12px;font:12px/1.5 system-ui;box-shadow:0 12px 35px #0008';document.body.appendChild(box)}box.innerHTML='<b>🧪 Smoke Check</b><br>'+checks.map(([n,v])=>`${v?'✅':'❌'} ${esc(n)}`).join('<br>');}catch(e){status('Smoke check lỗi: '+e.message)}}
document.getElementById('tl120-reset').onclick=()=>seed(true).catch(e=>status('Reset lỗi: '+e.message));
const wait=()=>{if(!window.firebase?.apps?.length){setTimeout(wait,200);return;}firebase.auth().onAuthStateChanged(user=>{if(user)seed(qs.get('reset')==='1').catch(e=>status('Seed lỗi: '+e.message));else status('Đăng nhập ADMIN để tự nạp dữ liệu test');});};wait();
})();
