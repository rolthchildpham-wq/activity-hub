(() => {
'use strict';
const BUILD='u122-20261031',qs=new URLSearchParams(location.search);if(qs.get('testlab')!=='1')return;
const T=window.Topkey||{},sport=(T.SPORT&&T.SPORT.key)||qs.get('sport')||'football',tid=qs.get('tid')||'';
const safePrefix=`__testlab_${BUILD.replace(/[^a-z0-9]/gi,'_')}_${sport}_`,safe=tid.startsWith(safePrefix);
let localFixture=null,localReport=null,localMode=false;const isDenied=e=>/permission[_ -]?denied|PERMISSION_DENIED/i.test(String(e?.code||e?.message||e||''));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const banner=document.createElement('div');banner.id='topkey-testlab-banner';banner.style.cssText='position:sticky;top:0;z-index:99999;background:#7f1d1d;color:#fff;padding:10px 14px;font:700 12px/1.45 system-ui;border-bottom:2px solid #fbbf24;display:flex;gap:10px;align-items:center;flex-wrap:wrap';
banner.innerHTML=`<strong>🧪 TEST LAB · ${esc(sport.toUpperCase())}</strong><span id="tl122-status">Đang chờ xác thực…</span><span style="opacity:.8">Kênh: ${esc(tid||'KHÔNG HỢP LỆ')}</span><button id="tl122-report" style="border:0;border-radius:8px;padding:7px 10px;font-weight:800;cursor:pointer">📋 Báo cáo</button><button id="tl122-reset" style="margin-left:auto;border:0;border-radius:8px;padding:7px 10px;font-weight:800;cursor:pointer">♻️ Dựng lại dữ liệu</button><a href="../../index.html" style="color:#fff;text-decoration:underline">Về Hub</a>`;document.body.prepend(banner);
const status=(m,ok=false)=>{const e=document.getElementById('tl122-status');if(e){e.textContent=m;e.style.color=ok?'#bbf7d0':'#fde68a'}};
if(!safe){status('ĐÃ CHẶN: namespace không an toàn');document.getElementById('tl122-reset').disabled=true;return;}
const iso=d=>d.toISOString().slice(0,10),now=Date.now(),day0=new Date(new Date().setHours(0,0,0,0)),d=n=>iso(new Date(day0.getTime()+n*86400000));
function buildDataset(){
 const S=T.SPORT||{},mode=S.mode||'score',cats=S.categories||['OPEN'],c1=cats[0],c2=cats[1]||c1;
 const names={football:['FC Alpha','FC Beta','FC Gamma','FC Delta','FC Epsilon','FC Zeta','FC Eta','FC Theta'],volleyball:['Volley Alpha','Volley Beta','Volley Gamma','Volley Delta','Volley Epsilon','Volley Zeta','Volley Eta','Volley Theta'],running:['Nguyễn An','Trần Bình','Lê Chi','Phạm Dũng','Hoàng Em','Võ Giang','Đặng Hà','Bùi Khang'],handmade:['Xưởng Mộc Mini','Sợi & Màu','Tái Chế Xanh','Gốm Nhỏ','Paper Lab','Tre Việt','Mây Studio','Upcycle 8'],shuttle:['Đá Cầu Alpha','Đá Cầu Beta','Đá Cầu Gamma','Đá Cầu Delta','Đá Cầu Epsilon','Đá Cầu Zeta','Đá Cầu Eta','Đá Cầu Theta'],cooking:['Bếp Alpha','Bếp Beta','Bếp Gamma','Bếp Delta','Bếp Epsilon','Bếp Zeta','Bếp Eta','Bếp Theta']}[sport]||Array.from({length:8},(_,i)=>`Đội ${i+1}`);
 const teams={};names.forEach((name,i)=>{const id=`tl_p${i+1}`;teams[id]={id,code:`T${String(i+1).padStart(3,'0')}`,name,p1:`Thành viên ${i+1}A`,p2:`Thành viên ${i+1}B`,dept:i%2?'Khối Sản xuất':'Khối Văn phòng',category:i<6?c1:c2,checkedIn:i!==7,withdrawn:false,roster:Array.from({length:mode==='time'||mode==='judged'?1:Math.min(6,i+2)},(_,j)=>({id:`${id}_r${j+1}`,name:`${name} · TV ${j+1}`,number:j+1,eligible:true})),createdAt:now-10*86400000+i*1000,testLab:true};});
 const courts={},venuePrefix=mode==='time'?'Làn':mode==='judged'?'Khu':'Sân';for(let i=1;i<=4;i++)courts[`court_${i}`]={id:`court_${i}`,name:`${venuePrefix} ${i}`,status:'AVAILABLE',activeMatchId:'',stream:{type:'CAMERA',url:''},testLab:true};
 const matches={};let seq=1;const add=(a,b,stage,state,result={},date=d(-2),time='08:00',court='court_1',category=c1)=>{const id=`tl_m${seq}`;matches[id]={id,code:`M${String(seq).padStart(3,'0')}`,teamAId:`tl_p${a}`,teamBId:b?`tl_p${b}`:'',category,stage,date,time,courtId:court,status:state,sets:[],createdAt:now-7*86400000+seq*1000,testLab:true,...result};seq++;return id};
 const setResult=aw=>({sets:aw?[{a:25,b:18,finished:true},{a:25,b:21,finished:true},{a:25,b:20,finished:true}]:[{a:18,b:25,finished:true},{a:21,b:25,finished:true},{a:20,b:25,finished:true}],winnerId:aw?'__A__':'__B__',finishedAt:now-2*86400000});
 const shuttleSet=aw=>({sets:aw?[{a:21,b:15,finished:true},{a:21,b:18,finished:true}]:[{a:17,b:21,finished:true},{a:19,b:21,finished:true}],winnerId:aw?'__A__':'__B__',finishedAt:now-2*86400000});
 if(mode==='time'){
   [1,2,3,4,5,6,7,8].forEach((p,i)=>add(p,0,i<4?'HEAT':(i<7?'QUALIFY':'FINAL'),'FINISHED',{resultMs:900000+i*3700,rank:i+1,finishedAt:now-86400000},d(-2+i%2),`0${8+i%2}:00`,`court_${i%4+1}`,i<6?c1:c2));add(1,0,'FINAL','LIVE',{lap:2,elapsedMs:420000},d(0),'15:00','court_1',c1);add(2,0,'FINAL','SCHEDULED',{},d(1),'08:00','court_2',c1);
 }else if(mode==='judged'){
   [86.5,91.2,78.8,88.4,84.9,93.1,80.5,89.7].forEach((score,i)=>add(i+1,0,i<4?'DISPLAY':(i<7?'QUALIFY':'FINAL'),'FINISHED',{judgeScore:score,judgeSheets:[{judge:'J1',score:score-1},{judge:'J2',score},{judge:'J3',score:score+1}],finishedAt:now-86400000,rubric:S.rubric||[]},d(-2+i%2),`0${8+i%2}:30`,`court_${i%4+1}`,i<6?c1:c2));add(1,0,'FINAL','LIVE',{judgeScore:42.5},d(0),'15:30','court_1',c1);add(2,0,'FINAL','SCHEDULED',{},d(1),'09:00','court_2',c1);
 }else{
   [[1,2,true],[3,4,false],[5,6,true],[1,3,true],[2,4,true],[5,1,false]].forEach(([a,b,aw],i)=>{let r=mode==='sets'?(sport==='shuttle'?shuttleSet(aw):setResult(aw)):{scoreA:aw?3:1,scoreB:aw?1:2,winnerId:aw?`tl_p${a}`:`tl_p${b}`,finishedAt:now-2*86400000};const id=add(a,b,'GROUP','FINISHED',r,d(-3+i%2),`0${8+i}:00`,`court_${i%4+1}`,c1);if(r.winnerId==='__A__')matches[id].winnerId=`tl_p${a}`;if(r.winnerId==='__B__')matches[id].winnerId=`tl_p${b}`});
   add(7,8,'GROUP','WALKOVER',{winnerId:'tl_p7',finishedAt:now-86400000},d(-1),'09:00','court_1',c2);
   [[1,4,true,'10:00','court_1'],[2,5,false,'10:00','court_2']].forEach(([a,b,aw,tm,court])=>{let r=mode==='sets'?(sport==='shuttle'?shuttleSet(aw):setResult(aw)):{scoreA:aw?2:0,scoreB:aw?0:2,winnerId:aw?`tl_p${a}`:`tl_p${b}`,finishedAt:now-12*3600000};const id=add(a,b,'SEMIFINAL','FINISHED',r,d(-1),tm,court,c1);if(r.winnerId==='__A__')matches[id].winnerId=`tl_p${a}`;if(r.winnerId==='__B__')matches[id].winnerId=`tl_p${b}`});
   let fr=mode==='sets'?(sport==='shuttle'?shuttleSet(true):setResult(true)):{scoreA:2,scoreB:1,winnerId:'tl_p1',finishedAt:now-3600000};const fid=add(1,5,'FINAL','FINISHED',fr,d(0),'13:00','court_1',c1);if(fr.winnerId==='__A__')matches[fid].winnerId='tl_p1';if(fr.winnerId==='__B__')matches[fid].winnerId='tl_p5';add(3,6,'GROUP','LIVE',{},d(0),'15:00','court_2',c1);add(7,8,'GROUP','SCHEDULED',{},d(1),'09:00','court_3',c2);
 }
 const live=Object.values(matches).find(m=>m.status==='LIVE');if(live)courts[live.courtId]={...courts[live.courtId],status:'LIVE',activeMatchId:live.id};
 const activeMatches={};if(live)activeMatches[live.courtId]=mode==='sets'?{matchId:live.id,courtId:live.courtId,teamAId:live.teamAId,teamBId:live.teamBId,sets:[{a:11,b:9,finished:false}],setIndex:0,serverSide:'A',serverPlayer:'p1',positions:{A:{p1:'right',p2:'left'},B:{p1:'right',p2:'left'}},started:true,finished:false,history:[{at:now-60000,event:'START'}],updatedAt:now,testLab:true}:mode==='score'?{matchId:live.id,courtId:live.courtId,teamAId:live.teamAId,teamBId:live.teamBId,scoreA:1,scoreB:0,started:true,finished:false,history:[{at:now-60000,event:'START'}],updatedAt:now,testLab:true}:{matchId:live.id,courtId:live.courtId,teamAId:live.teamAId,started:true,finished:false,history:[{at:now-60000,event:'START'}],updatedAt:now,testLab:true};
 const registrations={tl_reg1:{id:'tl_reg1',name:'Đăng ký Test Chờ Duyệt',p1:'Người Test A',p2:'Người Test B',dept:'QA',category:c1,status:'PENDING',createdAt:now-3600000,testLab:true},tl_reg2:{id:'tl_reg2',name:'Đăng ký Test Đã Duyệt',p1:'Người Test C',p2:'',dept:'QA',category:c2,status:'APPROVED',createdAt:now-7200000,testLab:true},tl_reg3:{id:'tl_reg3',name:'Đăng ký Test Từ Chối',p1:'Người Test D',dept:'QA',category:c1,status:'REJECTED',createdAt:now-10800000,testLab:true}};
 const finance={tl_fin1:{id:'tl_fin1',seq:1,date:d(-4),type:'INCOME',category:'Tài trợ test',amount:12000000,invoice:'TL-INC-001',note:'Dữ liệu giả production fixture',status:'PAID',testLab:true},tl_fin2:{id:'tl_fin2',seq:2,date:d(-3),type:'EXPENSE',category:'Thuê địa điểm test',amount:3500000,invoice:'TL-EXP-001',note:'Dữ liệu giả',status:'PAID',testLab:true},tl_fin3:{id:'tl_fin3',seq:3,date:d(-2),type:'EXPENSE',category:'Vật tư test',amount:1250000,invoice:'TL-EXP-002',note:'Dữ liệu giả',status:'APPROVED',testLab:true}};
 const announcements={tl_ann1:{id:'tl_ann1',title:'🧪 Production Fixture đang hoạt động',body:`Bộ dữ liệu giả ${sport} · ${tid}`,level:'INFO',popup:false,createdAt:now,author:'TOPKEY Test Lab',testLab:true},tl_ann2:{id:'tl_ann2',title:'Lịch thi đấu giả lập',body:'Đủ Scheduled / Live / Finished / Walkover và vòng trong.',level:'WARN',popup:false,createdAt:now-1000,author:'TOPKEY Test Lab',testLab:true}};
 const audit={tl_audit1:{id:'tl_audit1',action:'TESTLAB_PRODUCTION_FIXTURE_SEED',entityType:'tournament',entityId:tid,uid:'testlab',actor:'TOPKEY Test Lab',clientAt:now,sport,testLab:true}};
 const standings=Object.fromEntries(Object.values(teams).map((x,i)=>[x.id,{teamId:x.id,rank:i+1,played:Math.max(1,5-i%3),wins:Math.max(0,4-i%4),losses:i%3,points:Math.max(1,12-i),testLab:true}]));
 const TESTLAB_PRIZES=[{id:'tl_prize_first',name:'Giải Nhất',quantity:1,reward:'1.000.000 VND',note:'Mỗi giải'},{id:'tl_prize_second',name:'Giải Nhì',quantity:1,reward:'800.000 VND',note:'Mỗi giải'},{id:'tl_prize_third',name:'Giải Ba',quantity:1,reward:'500.000 VND',note:'Mỗi giải'},{id:'tl_prize_consolation',name:'Giải Khuyến khích',quantity:4,reward:'100.000 VND',note:'Mỗi giải'}];
 const config={title:`🧪 PRODUCTION FIXTURE · ${S.name||sport} · ${BUILD}`,location:'TOPKEY QA Sandbox',prizeStructure:TESTLAB_PRIZES,rules:{...(T.DEFAULT_RULES||S.rules||{})},rulesLocked:true,publicMode:true,tournamentStatus:'ACTIVE',scheduler:{lockedDates:[d(2)],busy:[{teamId:'tl_p8',date:d(1)}],priority:[{teamId:'tl_p1',from:d(0),to:d(1)}],limits:[{teamId:'tl_p1',from:d(0),to:d(2),max:2}]},testLab:{enabled:true,fixture:'production-like',build:BUILD,sport,tid,seededAt:now,safeNamespace:true}};
 return {config,teams,matches,courts,activeMatches,standings,finance,announcements,registrations,audit};
}
function makeCheck(id,label,pass,detail='',severity='ERROR'){return{id,label,pass:!!pass,detail,severity}}
function getReportSource(){return localFixture||null}
function applyLocalFixture(data,why='Firebase Rules chưa cấp quyền Test Lab'){
 localMode=true;localFixture=data||buildDataset();
 try{localStorage.setItem(`topkey_testlab_fixture_${sport}_${tid}`,JSON.stringify(localFixture));}catch{}
 const A=T.App;
 if(A){
   try{(A.offs||[]).forEach(f=>{try{f&&f()}catch{}});A.offs=[]}catch{}
   for(const k of ['config','teams','matches','courts','activeMatches','finance','announcements','registrations','audit'])A.state[k]=localFixture[k]||{};
   A.state.commentary=A.state.commentary||{};
   try{A.renderAll?.()}catch(e){console.warn('TestLab local renderAll',e)}
   try{A.renderHealth?.()}catch{}
 }
 status(`LOCAL FALLBACK · ${why} · dữ liệu test vẫn đã dựng`,false);
 return localFixture;
}
function buildReportFrom(s,source='CLOUD'){
 const ms=Object.values(s.matches||{}),checks=[];
 checks.push(makeCheck('namespace','Namespace Test Lab an toàn',safe,tid));
 checks.push(makeCheck('fixture','Production Fixture marker',s.config?.testLab?.fixture==='production-like',s.config?.testLab?.build||''));
 checks.push(makeCheck('entities','Có ít nhất 8 đội/VĐV',Object.keys(s.teams||{}).length>=8,`${Object.keys(s.teams||{}).length} đối tượng`));
 checks.push(makeCheck('schedule','Có lịch toàn giải',ms.length>=8,`${ms.length} lượt/trận`));
 checks.push(makeCheck('states','Đủ FINISHED/LIVE/SCHEDULED',ms.some(x=>x.status==='FINISHED')&&ms.some(x=>x.status==='LIVE')&&ms.some(x=>x.status==='SCHEDULED'),[...new Set(ms.map(x=>x.status))].join(', ')));
 checks.push(makeCheck('knockout','Có vòng trong/final',ms.some(x=>/SEMI|FINAL|QUALIFY/i.test(x.stage||'')),[...new Set(ms.map(x=>x.stage))].join(', ')));
 checks.push(makeCheck('active','Có trạng thái thi đấu trực tiếp',Object.keys(s.activeMatches||{}).length>=1,`${Object.keys(s.activeMatches||{}).length} active`));
 checks.push(makeCheck('registration','Đủ trạng thái đăng ký',Object.keys(s.registrations||{}).length>=3,Object.values(s.registrations||{}).map(x=>x.status).join(', ')));
 checks.push(makeCheck('prize-config','Đã thiết lập cơ cấu giải thưởng cho báo cáo cuối',Array.isArray(s.config?.prizeStructure)&&s.config.prizeStructure.length>=4,`${s.config?.prizeStructure?.length||0} hạng mục`));
 checks.push(makeCheck('result-integrity','Tỷ số trận đã kết thúc và đội thắng hợp lệ',ms.filter(m=>m.status==='FINISHED').every(m=>!m.winnerId||!!s.teams?.[m.winnerId]),'Kiểm tra tham chiếu winnerId'));
 checks.push(makeCheck('finance','Có dữ liệu tài chính',Object.keys(s.finance||{}).length>=3,`${Object.keys(s.finance||{}).length} giao dịch`));
 checks.push(makeCheck('announcement','Có thông báo',Object.keys(s.announcements||{}).length>=2));
 checks.push(makeCheck('audit','Có audit log',Object.keys(s.audit||{}).length>=1));
 checks.push(makeCheck('standings','Có BXH/kết quả tổng hợp',Object.keys(s.standings||{}).length>=8));
 checks.push(makeCheck('firebase','Firebase SDK khả dụng',!!window.firebase?.database,source,'WARN'));
 checks.push(makeCheck('source','Nguồn fixture khả dụng',!!s.config?.testLab?.enabled,source,source==='LOCAL'?'WARN':'ERROR'));
 checks.push(makeCheck('online','Browser online',navigator.onLine,String(navigator.onLine),'WARN'));
 checks.push(makeCheck('ui-banner','Test Lab banner hiển thị',!!document.getElementById('topkey-testlab-banner')));
 checks.push(makeCheck('ui-main','App có nội dung chính',document.body.innerText.length>300,`text=${document.body.innerText.length}`));
 checks.push(makeCheck('final-report-engine','Bộ tạo báo cáo cuối giải dùng chung production',!!window.TopkeyUpgrade122Hotfix79?.reportHtml||!!window.TopkeyUpgrade122Hotfix65?.reportHtml,source,'ERROR'));
 checks.push(makeCheck('ppt-template','Mẫu PowerPoint theo đúng môn',!!window.TopkeyPptxTemplateH112?.templateFor?.(sport),sport,'ERROR'));
 checks.push(makeCheck('pdf-export','Bộ PDF nội bộ và in PDF khả dụng',!!window.TopkeyFinalReportPdfH106?.createPdf&&typeof window.print==='function',source,'ERROR'));
 checks.push(makeCheck('sw','Service Worker API khả dụng','serviceWorker'in navigator,'','WARN'));
 const hard=checks.filter(x=>x.severity!=='WARN'),passed=checks.filter(x=>x.pass).length,failed=hard.filter(x=>!x.pass).length;
 return {id:`r_${Date.now().toString(36)}`,build:BUILD,sport,tid,source,generatedAt:Date.now(),generatedAtISO:new Date().toISOString(),environment:{href:location.href,userAgent:navigator.userAgent,online:navigator.onLine},summary:{total:checks.length,passed,failed,status:failed?'FAIL':'PASS'},counts:{teams:Object.keys(s.teams||{}).length,matches:ms.length,registrations:Object.keys(s.registrations||{}).length,finance:Object.keys(s.finance||{}).length,announcements:Object.keys(s.announcements||{}).length},checks};
}
async function runReport(ref,fixtureOverride=null){
 let s=fixtureOverride,source=fixtureOverride?'LOCAL':'CLOUD';
 if(!s){
   try{s=(await ref.once('value')).val()||{}}catch(e){if(!isDenied(e))throw e;s=applyLocalFixture(buildDataset(),'Không đọc được Firebase Test Lab');source='LOCAL'}
 }
 const r=buildReportFrom(s,source);localReport=r;
 if(source==='CLOUD'){
   try{await ref.child('testReports/latest').set(r);await ref.child(`testRuns/${r.id}`).set(r)}catch(e){if(!isDenied(e))throw e;source='LOCAL';r.source='LOCAL';applyLocalFixture(s,'Không có quyền ghi testReports; báo cáo chạy local')}
 }
 try{localStorage.setItem(`topkey_testlab_report_${sport}_${tid}`,JSON.stringify(r));}catch{}
 renderReport(r);status(`${r.source==='LOCAL'?'LOCAL FALLBACK':'CLOUD'} · REPORT ${r.summary.status} ${r.summary.passed}/${r.summary.total}`,r.summary.status==='PASS');return r;
}
function renderReport(r){let box=document.getElementById('tl122-report-box');if(!box){box=document.createElement('div');box.id='tl122-report-box';box.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99998;width:min(460px,calc(100vw - 24px));max-height:72vh;overflow:auto;background:#111827;color:#fff;border:1px solid #f59e0b;border-radius:14px;padding:14px;font:12px/1.5 system-ui;box-shadow:0 16px 45px #0009;display:none';document.body.appendChild(box)}box.innerHTML=`<div style="display:flex;justify-content:space-between;gap:10px"><b>📋 Auto Regression Report · ${esc(r.summary.status)}</b><button id="tl122-close" style="border:0;border-radius:6px">✕</button></div><div style="margin:8px 0;color:#cbd5e1">Nguồn: <b style="color:${r.source==='LOCAL'?'#fbbf24':'#86efac'}">${esc(r.source||'CLOUD')}</b><br>${esc(r.generatedAtISO)}<br>${esc(r.tid)}</div><div style="font-size:18px;font-weight:900;margin-bottom:8px">${r.summary.passed}/${r.summary.total} PASS</div>${r.checks.map(c=>`<div style="padding:5px 0;border-top:1px solid #263244">${c.pass?'✅':(c.severity==='WARN'?'⚠️':'❌')} <b>${esc(c.label)}</b>${c.detail?`<div style="color:#94a3b8">${esc(c.detail)}</div>`:''}</div>`).join('')}<button id="tl122-download" style="margin-top:10px;width:100%;padding:9px;border:0;border-radius:8px;font-weight:800">⬇️ Tải báo cáo JSON</button>`;box.style.display='block';document.getElementById('tl122-close').onclick=()=>box.style.display='none';document.getElementById('tl122-download').onclick=()=>{const blob=new Blob([JSON.stringify(r,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`TOPKEY_TestLab_${sport}_${r.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};}
async function readRole(){try{return String((await firebase.database().ref(`${T.AUTH_ROOT}/users/${firebase.auth().currentUser?.uid||''}/role`).once('value')).val()||'').toUpperCase()}catch{return String(T.Auth?.role?.()||'').toUpperCase()}}
async function seed(force=false){
 if(!window.firebase?.apps?.length){const ds=applyLocalFixture(buildDataset(),'Firebase chưa khởi tạo');await runReport(null,ds);return true}
 const user=firebase.auth().currentUser;if(!user){const ds=applyLocalFixture(buildDataset(),'Chưa có phiên ADMIN; dựng local để kiểm tra UI');await runReport(null,ds);return true}
 const role=await readRole();if(role!=='ADMIN'){const ds=applyLocalFixture(buildDataset(),`Role ${role||'UNKNOWN'} không có quyền cloud Test Lab`);await runReport(null,ds);return true}
 const ref=firebase.database().ref(`${T.ROOT}/tournaments/${tid}`);
 try{
   const old=(await ref.child('config/testLab').once('value')).val();
   if(!force&&old?.build===BUILD){localMode=false;localFixture=null;status('Fixture cloud đã tồn tại · đang chạy báo cáo…');await runReport(ref);return true}
   const ds=buildDataset();status('Đang dựng toàn bộ dữ liệu Production Fixture trên Firebase…');await ref.set(ds);localMode=false;localFixture=null;await runReport(ref);return true;
 }catch(e){
   if(!isDenied(e))throw e;
   const ds=applyLocalFixture(buildDataset(),'Firebase permission_denied; cần deploy Database Rules H62 để lưu cloud');await runReport(ref,ds);return true;
 }
}
document.getElementById('tl122-reset').onclick=()=>seed(true).catch(e=>{console.error(e);const ds=applyLocalFixture(buildDataset(),'Cloud seed lỗi: '+(e?.message||e));runReport(null,ds).catch(()=>{})});
document.getElementById('tl122-report').onclick=async()=>{try{if(localReport)return renderReport(localReport);if(localFixture)return runReport(null,localFixture);try{const cached=JSON.parse(localStorage.getItem(`topkey_testlab_report_${sport}_${tid}`)||'null');if(cached){localReport=cached;return renderReport(cached)}}catch{}const ref=firebase.database().ref(`${T.ROOT}/tournaments/${tid}`);try{const r=(await ref.child('testReports/latest').once('value')).val();if(r){localReport=r;renderReport(r)}else await runReport(ref)}catch(e){if(isDenied(e)){const ds=applyLocalFixture(buildDataset(),'Không đọc được báo cáo cloud');await runReport(null,ds)}else throw e}}catch(e){status('Báo cáo lỗi: '+(e?.message||e))}};
const wait=()=>{if(!window.firebase?.apps?.length){setTimeout(wait,200);return}firebase.auth().onAuthStateChanged(async()=>{try{await window.TopkeyProductionLoader?.loadFeature?.('reports');await window.TopkeyProductionLoader?.loadFeature?.('testlab');await seed(qs.get('reset')==='1')}catch(e){console.error(e);const ds=applyLocalFixture(buildDataset(),'Seed / nạp báo cáo lỗi: '+(e?.message||e));runReport(null,ds).catch(()=>{})}})};wait();
})();
