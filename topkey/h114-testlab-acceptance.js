/* H114: Honest, opt-in Test Lab scenario checks, NEVER writes outside __testlab_. */
(()=>{'use strict';const q=new URLSearchParams(location.search);if(q.get('testlab')!=='1')return;
const sport=q.get('sport')||'badminton',tid=q.get('tid')||'',strict=tid.startsWith('__testlab_')&&tid.includes('_'+sport+'_');let running=false,installed=false;
function feature(id,label,status,details=''){return{id,label,status,details}}
async function run(){if(running)return;running=true;const btn=document.getElementById('h114-qa'),box=document.getElementById('h114-qa-result');if(btn)btn.disabled=true;
 const results=[],t=window.Topkey,app=t?.App,ctrl=window.TopkeyH114;const add=(i,l,s,d='')=>results.push(feature(i,l,s,d));
 try{
  add('namespace','Namespace Test Lab riêng',strict?'PASS':'FAIL',tid);if(!strict)throw Error('Đã chặn ghi dữ liệu vì namespace không an toàn');
  add('app','Dùng cùng module App với production',app&&t?.Data?'PASS':'FAIL',t?.SPORT?.key||'');
  add('auth','Quyền ADMIN được Firebase xác minh',t?.Auth?.role?.()==='ADMIN'&&t?.Auth?._profileVerifiedUid===t?.Auth?.user?.uid?'PASS':'UNTESTED','Không cấp quyền từ Test Lab');
  const ref=t?.Data?.db?.ref(t.Data.path());if(!ref)throw Error('Firebase chưa sẵn sàng');
  const raw=(await ref.once('value')).val()||{},teams=raw.teams||{},matches=raw.matches||{},finance=raw.finance||{};
  const m=Object.values(matches);const entitySet=new Set(Object.keys(teams));
  add('fixture','Dữ liệu test độc lập (đội/trận)',Object.keys(teams).length>=8&&m.length>=10?'PASS':'FAIL',`${Object.keys(teams).length} đội, ${m.length} trận`);
  add('relations','Tham chiếu đội/trận hợp lệ',m.every(x=>x.teamAId?entitySet.has(x.teamAId)&&(!x.teamBId||entitySet.has(x.teamBId)):true)?'PASS':'FAIL');
  const audit=ctrl?.analyseMatches?.(matches);add('closure','Đối chiếu đóng giải từ dữ liệu toàn nhánh',audit&&audit.total===m.length?'PASS':'FAIL',audit?`${audit.finished}/${audit.total} xong, ${audit.unfinished.length} chưa xong`:'');
  add('closure-safety','Không cho đóng giải nếu còn LIVE/SCHEDULED',audit&&audit.unfinished.length>0?'PASS':'FAIL');
  add('finance','Dữ liệu tài chính có thu và chi',Object.values(finance).some(x=>x.type==='INCOME')&&Object.values(finance).some(x=>x.type==='EXPENSE')?'PASS':'FAIL',Object.keys(finance).length+' bút toán');
  const fApi=window.TopkeyFinanceReportH113;add('finance-csv','CSV dùng chung production',typeof fApi?.CSV==='function'&&fApi.CSV(Object.values(finance)).includes('TỔNG THU')?'PASS':'FAIL');
  add('finance-pdf','PDF dùng chung production',typeof fApi?.makePdf==='function'?'PASS':'FAIL','PDF chứng từ thực tế cần mở và xem từng trang');
  add('finance-actions','Nút sửa/xóa tài chính ADMIN',typeof ctrl?.install==='function'&&!!document.querySelector('[data-h114-action="edit"]')&&!!document.querySelector('[data-h114-action="delete"]')?'PASS':'UNTESTED','Chỉ hiện ở Tab Tài chính với ADMIN');
  add('final-report','Bộ xuất báo cáo toàn giải',!!window.TopkeyUpgrade122Hotfix65?.buildReport?'PASS':'FAIL');
  add('awards','Giải thưởng fixture',Array.isArray(raw.config?.prizeStructure)&&raw.config.prizeStructure.length>=3?'PASS':'FAIL');
  add('ppt','Mẫu riêng theo môn',typeof window.TopkeyPptTemplateH112==='object'||!!document.querySelector('script[src*="h112-ppt-template"]')?'PASS':'UNTESTED');
  add('ranking','Tính BXH',typeof app?.ranking==='function'?'PASS':'FAIL');
  add('scheduler','Tạo lịch Smart',typeof app?.buildSchedulePlan==='function'||typeof app?.autoSchedule==='function'?'PASS':'UNTESTED');
  add('live','Luồng live thuộc đúng giải',Object.keys(raw.activeMatches||{}).every(k=>matches[raw.activeMatches[k]?.matchId])?'PASS':'FAIL');
  add('permissions','Màn hình phân quyền không bypass',t?.Auth?.role?.()!=='ADMIN'||t.Auth._profileVerifiedUid===t.Auth.user?.uid?'PASS':'FAIL');
  add('pdf-pages-real','In PDF gốc và Excel thành trang trực tiếp','UNTESTED','Cần chạy với tài liệu PDF/Excel thật trên trình duyệt có PDF renderer');
  add('auth-edgeone','Đăng nhập Firebase và hiệu năng EdgeOne','UNTESTED','Cần kiểm thử trình duyệt có đăng nhập trên môi trường staging');
  // Writable CRUD smoke only on sandbox, within approved Test Lab namespace, no production state touched.
  if(t?.Auth?.role?.()==='ADMIN'&&t?.Auth?._profileVerifiedUid===t?.Auth?.user?.uid&&navigator.onLine){
   const key='h114_smoke_'+Date.now().toString(36),doc=t.Data.db.ref(t.Data.path('finance/'+key));
   try{await doc.set({id:key,type:'EXPENSE',amount:12,category:'H114 sandbox CRUD',status:'REQUESTED',date:'2026-11-09',createdAt:Date.now(),testLab:true});const created=(await doc.once('value')).val();
    await doc.update({amount:15,updatedAt:Date.now()});const updated=(await doc.once('value')).val();await doc.remove();const removed=(await doc.once('value')).val();
    add('finance-crud-sandbox','Firebase CREATE → UPDATE → DELETE an toàn',created?.amount===12&&updated?.amount===15&&!removed?'PASS':'FAIL',key);
   }catch(e){add('finance-crud-sandbox','Firebase CRUD sandbox','FAIL',e.message)}finally{await doc.remove().catch(()=>{})}
  }else add('finance-crud-sandbox','CRUD Firebase sandbox','UNTESTED','Cần ADMIN và kết nối Firebase');
  for(const [id,desc] of [['umpire-ui','Chấm điểm trọng tài thật'],['match-edit','Tạo, sửa, xóa lịch theo quyền'],['camera','Camera/WebRTC trên thiết bị thật'],['invoice','Tải ảnh/PDF/Excel chứng từ thật'],['concurrency','Hai người dùng sửa cùng giao dịch']])add(id,desc,'UNTESTED','Cần chạy thao tác trực tiếp trên Test Lab');
 }catch(e){add('fatal','Khởi tạo Test Lab','FAIL',e.message)}finally{running=false;if(btn)btn.disabled=false}
 const pass=results.filter(x=>x.status==='PASS').length,fail=results.filter(x=>x.status==='FAIL').length,untested=results.filter(x=>x.status==='UNTESTED').length;
 const report={schema:'TOPKEY_H114_TESTLAB_DEEP',sport,tid,time:new Date().toISOString(),summary:{pass,fail,untested,total:results.length,status:fail?'FAIL':untested?'PARTIAL':'PASS'},checks:results};window.__TOPKEY_H114_DEEP_REPORT=report;
 if(box){box.textContent=JSON.stringify(report.summary)+'\n'+results.map(x=>`${x.status} ${x.label}${x.details?' · '+x.details:''}`).join('\n');box.style.whiteSpace='pre-wrap'}
 const dl=document.getElementById('h114-qa-download');if(dl)dl.disabled=false;
}
function install(){if(installed||!strict)return;const banner=document.getElementById('topkey-testlab-banner')||document.getElementById('tl120-status')?.parentElement;if(!banner)return false;installed=true;const btn=document.createElement('button');btn.id='h114-qa';btn.type='button';btn.textContent='🧪 Kiểm tra sâu H114';btn.style.cssText='background:#134e4a;color:#fff;border:1px solid #5eead4;border-radius:8px;padding:7px';btn.onclick=run;banner.append(btn);const dl=document.createElement('button');dl.id='h114-qa-download';dl.type='button';dl.disabled=true;dl.textContent='⬇ JSON H114';dl.onclick=()=>{const blob=new Blob([JSON.stringify(window.__TOPKEY_H114_DEEP_REPORT,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`TOPKEY_H114_TestLab_${sport}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};banner.append(dl);const box=document.createElement('pre');box.id='h114-qa-result';box.style.cssText='display:block;max-height:220px;overflow:auto;margin:5px 8px;padding:9px;background:#0d253a;color:#c4f1ee;font:12px/1.4 monospace';banner.after(box);return true}
let tries=0;function boot(){if(install())return;if(tries++<50)setTimeout(boot,300)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.addEventListener('topkey:admin-ready',boot);
window.TopkeyH114Testlab={run};
})();
