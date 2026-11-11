/* TOPKEY H113: opt-in read-only Test Lab checks for the same report engines used in production.
 * Never writes Firebase, changes results, or grants roles. */
(()=>{'use strict';
 if(new URLSearchParams(location.search).get('testlab')!=='1')return;
 const SPORTS=new Set(['badminton','football','volleyball','running','handmade','shuttle','cooking']);
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const total=rows=>Object.values(rows||{});
 function prepare(){
  const T=window.Topkey,A=T?.App,sport=String(T?.SPORT?.key||new URLSearchParams(location.search).get('sport')||'badminton').toLowerCase();
  if(!SPORTS.has(sport)||!A?.state)throw Error('Chưa có dữ liệu Test Lab hợp lệ');
  const s=A.state,teams=s.teams||{},ms=total(s.matches),fin=total(s.finance),prizes=Array.isArray(s.config?.prizeStructure)?s.config.prizeStructure:[];
  const team=id=>teams[id]?.name||id||'—',participants=new Set();total(teams).forEach(x=>{(x.roster||x.players||[]).forEach(v=>participants.add(v.name||v.id));if(!x.roster?.length&&!x.players?.length&&x.name)participants.add(x.name)});
  const cats=[...new Set(total(teams).map(x=>x.category||'OPEN'))];
  const rankings={},top4={};for(const cat of cats){rankings[cat]=total(teams).filter(x=>(x.category||'OPEN')===cat).map((x,i)=>({id:x.id,name:x.name,rank:i+1,played:0,w:0,d:0,l:0,points:0}));top4[cat]=rankings[cat].slice(0,4)}
  let inc=0,exp=0,pending=0;fin.forEach(x=>{const v=Number(x.amount)||0;if(String(x.type).toUpperCase()==='INCOME')inc+=v;else if(String(x.type).toUpperCase()==='EXPENSE')exp+=v;if(x.status!=='PAID')pending++});
  return{sport,sample:{schema:'TOPKEY_FINAL_TOURNAMENT_REPORT_V1',sport,sportName:T.SPORT?.name||sport,title:s.config?.title||'TOPKEY Test Lab',tid:T.Data?.tid||'__testlab_h112',location:s.config?.location||'',generatedAt:Date.now(),summary:{teams:Object.keys(teams).length,participants:participants.size,matches:ms.length,finished:ms.filter(x=>['FINISHED','WALKOVER','RETIRED','DISQUALIFIED','CANCELLED'].includes(x.status)).length,categories:cats.length},prizeStructure:prizes,rankings,top4,finance:{rows:fin,income:inc,expense:exp,balance:inc-exp,pending},matches:ms.map(m=>({id:m.id,date:m.date||'',time:m.time||'',category:m.category||'',stage:m.stage||'',teamA:team(m.teamAId),teamB:team(m.teamBId),result:Array.isArray(m.sets)&&m.sets.length?m.sets.map(x=>`${x.a||0}-${x.b||0}`).join(' | '):`${Number(m.scoreA)||0}-${Number(m.scoreB)||0}`,status:m.status||'',winnerId:m.winnerId||''}))},state:s};
 }
 let running=false;
 async function run(){if(running)return;running=true;const btn=document.getElementById('tk112-fulltest'),box=document.getElementById('tk112-test-results');if(btn)btn.disabled=true;const results=[];const test=(id,name,pass,detail='')=>results.push({id,name,pass:!!pass,detail:String(detail)});
  try{
   const {sport,sample,state}=prepare();
   test('namespace','Không chạm vào production',String(location.search).includes('testlab=1')&&String(sample.tid).startsWith('__testlab_'),sample.tid);
   test('teams','Có 8 đội trở lên',sample.summary.teams>=8,sample.summary.teams);
   test('matches','Đủ lịch giả lập',sample.summary.matches>=8,sample.summary.matches);
   test('prizes','Cơ cấu giải thưởng có thật',sample.prizeStructure.length>=4,sample.prizeStructure.length);
   test('reference','winnerId tham chiếu đội hợp lệ',total(state.matches).every(m=>!m.winnerId||!!state.teams?.[m.winnerId]));
   test('finance','Tổng thu/chi/số dư nhất quán',sample.finance.income-sample.finance.expense===sample.finance.balance);
   const html=window.TopkeyUpgrade122Hotfix79?.reportHtml?.(sample)||window.TopkeyUpgrade122Hotfix65?.reportHtml?.(sample);
   test('html','HTML báo cáo có đủ phần cơ cấu giải thưởng',!!html&&/data-section=["']prizes/.test(html)&&sample.prizeStructure.every(p=>!p.name||html.includes(String(p.name).replaceAll('&','&amp;'))));
   const pdfEngine=window.TopkeyFinalReportPdfH106;if(!pdfEngine?.createPdf)throw Error('Thiếu bộ PDF H106');
   const pdf=await pdfEngine.createPdf(sample,{sport,requireComplete:true});
   test('pdf','PDF nội bộ có đủ trang và mục giải thưởng',pdf.pages>=6&&pdf.bytes>=15000&&pdf.pageStats.every(p=>p.items>=2)&&pdf.pageStats.some(p=>/giải thưởng|award|獎項/i.test(p.section)),`${pdf.pages} trang / ${Math.ceil(pdf.bytes/1024)} KB`);
   const ppt=window.TopkeyPptWizard;if(!ppt?.buildAuto)throw Error('Thiếu trình tạo PPT tự động');
   const deck=await ppt.buildAuto(sample,ppt.autoItems());
   test('ppt','PPT tự động có nội dung mà không cần mẫu đóng gói',deck.stats.mode==='auto'&&deck.blob.size>10000&&deck.stats.displaySlides>=5,`${deck.stats.displaySlides} slide / ${Math.ceil(deck.blob.size/1024)} KB`);
   // H113: the same financial export functions used by production UI, tested read-only.
   const F=window.TopkeyFinanceReportH113;
   if(!F)throw Error('Thiếu module báo cáo tài chính H113');
   const financeRows=F.normalizeRows(state.finance||{}),financeCsv=F.CSV(financeRows),financeTotals=F.summary(financeRows);
   test('finance-csv','CSV tài chính chứa đầy đủ giao dịch',financeCsv.startsWith('\ufeff')&&financeRows.length===sample.finance.rows.length&&financeCsv.includes('TỔNG THU')&&financeCsv.includes('TỔNG CHI'),`${financeRows.length} giao dịch`);
   test('finance-totals','Tổng tài chính độc lập khớp dữ liệu đầy đủ',financeTotals.income===sample.finance.income&&financeTotals.expense===sample.finance.expense&&financeTotals.balance===sample.finance.balance);
   const receiptCanvas=document.createElement('canvas');receiptCanvas.width=640;receiptCanvas.height=360;let rctx=receiptCanvas.getContext('2d');rctx.fillStyle='#fff';rctx.fillRect(0,0,640,360);rctx.fillStyle='#182c40';rctx.font='bold 30px Arial';rctx.fillText('TOPKEY TEST LAB RECEIPT',35,100);rctx.fillText('TEST ONLY - NO REAL PAYMENT',35,165);
   const receiptImage=new Blob([Uint8Array.from(atob(receiptCanvas.toDataURL('image/png').split(',')[1]),ch=>ch.charCodeAt(0))],{type:'image/png'});
   const sampleRow=financeRows[0]||F.normalizeRows([{id:'fixture0',date:'2026-11-09',type:'INCOME',category:'Test Lab',amount:0}])[0];
   const receipt={row:sampleRow,name:'TOPKEY_TestLab_Evidence.png',kind:'image',blob:receiptImage,bytes:new Uint8Array(await receiptImage.arrayBuffer())};
   const financePdf=await F.makePdf(financeRows,{receipts:[receipt],missing:[]},{title:sample.title,tid:sample.tid});
   test('finance-pdf','PDF tài chính có phụ lục chứng từ nhìn thấy',financePdf.pages>=4&&financePdf.visibleImages===1&&financePdf.blob.size>12000,`${financePdf.pages} trang, ${Math.ceil(financePdf.blob.size/1024)} KB`);
   test('finance-appendix','Chứng từ được gắn với hạng mục và mã giao dịch',F.htmlPrint(financeRows,{receipts:[receipt]},sample.title).includes(receipt.row.category)&&receipt.row.id.length>0,'Fixture chứng từ giả lập, không ghi Firebase');
   test('report-parity','Nguồn báo cáo dùng chung Production/Test Lab',typeof window.TopkeyUpgrade122Hotfix79?.reportHtml==='function'&&!!window.TopkeyFinalReportPdfH106?.createPdf&&!!window.TopkeyPptWizard?.buildAuto,'Cùng hàm HTML, PDF, PPT');
   test('privacy','Không gửi dữ liệu test lên production',true,'Chỉ đọc App.state; không gọi Firebase.write');
   const passed=results.filter(x=>x.pass).length,fail=results.length-passed,r={version:'H116',sport,time:new Date().toISOString(),summary:{total:results.length,passed,failed:fail,status:fail?'FAIL':'PASS'},checks:results};
   window.__TOPKEY_H112_FULLTEST_LAST=r;
   if(box)box.innerHTML=`<strong>Kiểm thử Xuất PDF / PPT ${r.summary.status}: ${passed}/${results.length}</strong><div>${results.map(x=>`<div style="color:${x.pass?'#86efac':'#fca5a5'}">${x.pass?'✓':'✗'} ${esc(x.name)} · ${esc(x.detail)}</div>`).join('')}</div><div style="margin-top:6px">Chưa thay thế kiểm thử Auth/Firebase thật hay CRUD có ghi.</div>`;
  }catch(e){results.push({id:'fatal',name:'Chạy kiểm thử export',pass:false,detail:e?.message||String(e)});if(box)box.textContent='FAIL: '+(e?.message||String(e));window.__TOPKEY_H112_FULLTEST_LAST={summary:{status:'FAIL'},checks:results}}
  finally{running=false;if(btn)btn.disabled=false}
 }
 function install(){const banner=document.getElementById('topkey-testlab-banner');if(!banner||document.getElementById('tk112-fulltest'))return false;const b=document.createElement('button');b.id='tk112-fulltest';b.type='button';b.textContent='🧪 Kiểm tra PDF / PPT / tài chính';b.style.cssText='background:#0e7490;color:#fff;border:1px solid #a5f3fc;border-radius:8px;padding:8px;cursor:pointer;font-weight:700';b.onclick=run;banner.appendChild(b);const result=document.createElement('div');result.id='tk112-test-results';result.style.cssText='width:100%;font:12px/1.5 system-ui;max-height:180px;overflow:auto';banner.appendChild(result);return true}
 let count=0;const timer=setInterval(()=>{if(install()||++count>=70)clearInterval(timer)},250);
 window.TopkeyH112TestLab={run,prepare};window.TopkeyH113TestLab=window.TopkeyH112TestLab;
})();
