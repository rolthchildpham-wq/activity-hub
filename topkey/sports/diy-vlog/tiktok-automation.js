/* TOPKEY TikTok public-link reader + official owner-consent sync. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const status=$("tiktok-sync-status"),connect=$("tiktok-connect"),sync=$("tiktok-sync-now"),reader=$("tiktok-read-link"),bulk=$("tiktok-sync-all-links");
if(!status||!bulk)return;
window.__topkeyTikTokStatsMeta=null;
async function readEdgeOneMetadata(url){
 const user=window.firebase?.auth?.().currentUser;
 if(!user)throw Error("Cần đăng nhập ADMIN/BTC trước khi đọc TikTok.");
 async function requestMetadata(forceRefresh){
  const token=await user.getIdToken(Boolean(forceRefresh));
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(new Error('Quá thời gian chờ phản hồi TikTok 30 giây')),30000);
  try{
   const response=await fetch("/api/tiktok-stats",{
    method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
    body:JSON.stringify({url}),signal:controller.signal,cache:"no-store"
   });
   if(!(response.headers.get("content-type")||"").includes("application/json"))
    throw Error("EdgeOne API TikWM không trả JSON, kiểm tra deployment.");
   const data=await response.json();
   if(!response.ok||!data.ok){
    const failure=Error(data.message||("EdgeOne API lỗi "+response.status));
    failure.status=response.status;
    failure.code=String(data.code||"");
    throw failure;
   }
   return data;
  }catch(e){
   if(controller.signal.aborted){
    const failure=new Error('Quá thời gian chờ phản hồi TikTok (30 giây)');
    failure.status=504;failure.code='UPSTREAM_TIMEOUT';throw failure;
   }
   throw e;
  }finally{clearTimeout(timer)}
 }
 try{return await requestMetadata(false)}
 catch(e){
  // Retry stale sign-in token once, but do not retry broken API / Google cert 503.
  if(e?.status===401 && window.firebase?.auth?.().currentUser===user)
   return requestMetadata(true);
  throw e;
 }
}
function info(t){status.hidden=false;status.style.display="block";status.textContent=t}
function vlogFailureReason(error){
 const code=Number(error?.status||error?.code||0);
 const raw=String(error?.message||error||'Không lấy được dữ liệu').slice(0,200);
 const type=code===429?'TikWM giới hạn tần suất':code===502||code===503?'Máy chủ TikTok/TikWM tạm lỗi':
  code===504||/timeout|abort|quá thời gian/i.test(raw)?'Quá thời gian chờ':
  code===401||code===403?'Không đủ quyền đăng nhập':
  /permission.denied/i.test(raw)?'Firebase từ chối ghi dữ liệu':'Không đọc được chỉ số';
 return {code,reason:type+' — '+raw};
}
function showVlogScanFailures(failures,testMode,canRetry){
 const all=Array.from(failures||[]);
 window.__TOPKEY_VLOG_SCAN_ERRORS=testMode?all:[];
 const report=$("tiktok-scan-errors");
 if(!report||typeof report.replaceChildren!=='function')return;
 if(!all.length){report.hidden=true;report.replaceChildren();return}
 const title=document.createElement('h3');title.textContent='⚠ '+all.length+' video cần kiểm tra thủ công';
 const summary=document.createElement('p');
 summary.textContent=testMode?'Có thể thử lại các URL lỗi một lượt trong TEST LAB. URL và nguyên nhân mới nhất hiển thị bên dưới.':'Các video lỗi giữ nguyên chỉ số đã lưu, không tự ghi số 0. Kiểm tra nguyên nhân và đường dẫn bên dưới; sau khi khắc phục, nhấn Quét tất cả để thử đồng bộ lại.';
 const retry=document.createElement('button');
 retry.type='button';retry.className='vlog-retry-failed';retry.textContent='↻ Kiểm tra tự động lại '+all.length+' link lỗi (1 lượt)';
 retry.disabled=!canRetry;retry.hidden=!testMode;
 if(typeof retry.addEventListener==='function'){
  retry.addEventListener('click',()=>run(retry,()=>runFailedVlogLinksOnce()));
 }
 const list=document.createElement('ol');list.className='vlog-scan-error-list';
 for(const f of all){
  const li=document.createElement('li'),name=document.createElement('strong'),reason=document.createElement('span'),url=document.createElement('a');
  name.textContent=f.name||f.id;
  reason.textContent=' — '+(f.reason||'Chưa xác định nguyên nhân')+
    ' · thử lại '+Number(f.retryCount||0)+' lần'+(f.lastCheckedAt?' · kiểm tra '+f.lastCheckedAt:'');
  url.textContent='TikTok ↗';url.href=f.url;url.target='_blank';url.rel='noopener noreferrer';
  li.append(name,reason,' ',url);list.appendChild(li);
 }
 report.replaceChildren(title,summary,retry,list);report.hidden=false;
}
async function runFailedVlogLinksOnce(){
 if(!window.__TOPKEY_VLOG_TEST_MODE)throw Error('Chỉ cho phép kiểm tra lại các link lỗi trong TEST LAB.');
 const auth=window.firebase?.auth?.(),user=auth?.currentUser;
 if(!user||!window.firebase?.database)throw Error('Cần đăng nhập ADMIN để kiểm tra lại link lỗi.');
 if(bulk.disabled)throw Error('Đang quét toàn bộ, không thể chạy song song.');
 const uid=user.uid,root='topkey_vlog2026_test/entries',db=firebase.database(),key='topkey_vlog2026_scan:'+root;
 const snapshot=await db.ref(root).once('value');
 const data=snapshot.val()||{},rows=Object.entries(data).filter(([,e])=>e&&validTikTokVideo(String(e.url||'').trim()));
 if(!rows.length)throw Error('TEST LAB chưa có URL hợp lệ.');
 const fingerprint=rows.length+':'+rows[0][0]+':'+rows[rows.length-1][0]+':'+String(rows[0][1].sampleCreatedAt||'');
 let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
 if(saved.fingerprint!==fingerprint||!Array.isArray(saved.failures)||!saved.failures.length)
  throw Error('Không có link lỗi thuộc bộ TEST hiện tại để kiểm tra lại.');
 const retryMap=new Map(saved.failures.filter(x=>x?.id&&x?.url).map(x=>[String(x.id),x]));
 const pending=[...retryMap.values()].filter(f=>data[f.id]&&
   String(data[f.id].url||'').trim()===f.url&&validTikTokVideo(f.url));
 if(!pending.length)throw Error('Các link lỗi không còn trong bộ TEST hiện tại.');
 const safe=()=>auth.currentUser?.uid===uid&&window.__TOPKEY_VLOG_TEST_MODE===true;
 if(!safe())throw Error('Phiên đăng nhập hoặc chế độ TEST đã thay đổi.');
 const count=5,spacing=300;let next=0,nextStart=0,success=0,finished=0,authFailure=null;
 const pause=async()=>{
  const now=Date.now(),wait=Math.max(0,nextStart-now);
  nextStart=Math.max(now,nextStart)+spacing;
  if(wait>0)await new Promise(resolve=>setTimeout(resolve,wait));
 };
 const commit=()=>{
  const result={...saved,failures:[...retryMap.values()]};
  try{localStorage.setItem(key,JSON.stringify(result));
   localStorage.setItem('topkey_vlog2026_scan_errors:'+root,JSON.stringify(result))}catch{}
  showVlogScanFailures(result.failures,true,true);
  window.TopkeyVlogSyncErrorsChanged?.(result.failures);
 };
 bulk.disabled=true;
 try{
  async function worker(){
   while(next<pending.length&&!authFailure){
    const f=pending[next++],entry=data[f.id];
    try{
     if(!safe())throw Object.assign(Error('Phiên đăng nhập đã thay đổi'),{status:403});
     await pause();
     if(!safe())throw Object.assign(Error('Phiên đăng nhập đã thay đổi'),{status:403});
     const res=await readEdgeOneMetadata(f.url),patch={};
     for(const metric of ['views','likes','shares']){
      const v=res.stats?.[metric];if(Number.isSafeInteger(v)&&v>=0&&v<=1e9)patch[metric]=v;
     }
     if(!Object.keys(patch).length)throw Error('Không có chỉ số hợp lệ');
     if(!safe()||authFailure)throw Object.assign(Error('Phiên đăng nhập đã thay đổi'),{status:403});
     const at=new Date().toISOString();
     const tx=await db.ref(root+'/'+f.id).transaction(current=>{
      if(!current||String(current.url||'').trim()!==f.url)return;
      return {...current,...patch,statsSource:String(res.source||'EdgeOne TikWM'),
       statsFetchedAt:at,statsLastAutoSyncAt:at};
     });
     if(!tx.committed)throw Error('URL đã thay đổi hoặc Firebase từ chối ghi');
     retryMap.delete(f.id);success++;
    }catch(error){
     const failure=vlogFailureReason(error);
     retryMap.set(f.id,{...f,...failure,retryCount:Number(f.retryCount||0)+1,lastCheckedAt:new Date().toISOString()});
     if(failure.code===401||failure.code===403||!safe())authFailure=error;
    }finally{
     finished++;info('KIỂM TRA LẠI '+finished+'/'+pending.length+' link lỗi · đã khôi phục '+success+
      ' · còn lỗi '+retryMap.size);
    }
   }
  }
  await Promise.all(Array.from({length:Math.min(count,pending.length)},()=>worker()));
  commit();
  if(authFailure){
   info('TẠM DỪNG kiểm tra lại: '+String(authFailure?.message||authFailure)+
    '. Giữ danh sách lỗi để kiểm tra sau khi đăng nhập lại.');
   return;
  }
  info('HOÀN TẤT kiểm tra lại '+pending.length+' link lỗi · khôi phục '+success+
   ' · còn '+retryMap.size+' link cần kiểm tra tay. Xem lý do mới nhất bên dưới.');
 }finally{bulk.disabled=false;showVlogScanFailures([...retryMap.values()],safe(),true)}
}
function errMessage(e){
 const code=String(e?.code||""),msg=String(e?.message||"");
 if(code.includes("not-found")||code.includes("unavailable")||code.includes("internal"))return "Dịch vụ TikTok chưa được triển khai hoặc chưa kết nối. BTC vẫn có thể nhập số liệu thủ công. ("+code+")";
 if(code.includes("permission-denied")||code.includes("unauthenticated"))return "Cần đăng nhập ADMIN/BTC DIY để thao tác.";
 return msg.slice(0,250)||"Không thể kết nối TikTok.";
}
function callable(name){
 if(!window.firebase?.functions||!firebase.auth().currentUser)throw Error("Cần đăng nhập ADMIN/BTC DIY trên trang Vlog.");
 return firebase.app().functions("asia-southeast1").httpsCallable(name);
}
async function run(button,fn){
 button.disabled=true;
 try{await fn()}catch(e){info(errMessage(e))}
 finally{button.disabled=false}
}
function validTikTokVideo(value){
 try{
  const u=new URL(value);
  if(u.protocol!=="https:")return false;
  const host=u.hostname.toLowerCase();
  if(!["tiktok.com","www.tiktok.com","m.tiktok.com","vm.tiktok.com","vt.tiktok.com"].includes(host))return false;
  return ["vm.tiktok.com","vt.tiktok.com"].includes(host)?u.pathname.length>1:/\/video\/\d+/.test(u.pathname);
 }catch{return false}
}
reader?.addEventListener("click",()=>run(reader,async()=>{
 const url=$("entry-url")?.value?.trim()||"";
 if(!validTikTokVideo(url))throw Error("Dán link video TikTok có /video/ID hoặc link rút gọn vm.tiktok.com / vt.tiktok.com trước.");
 info("Đang đọc metadata video TikTok. Vui lòng chờ...");
 let payload;
 try{payload=await readEdgeOneMetadata(url)}
 catch(e){throw Error(String(e?.message||e))}
 if(!payload?.ok)throw Error(payload?.message||"EdgeOne yt-dlp không đọc được link.");
 const s=payload?.stats||{};
 const fields=[["views","entry-views","lượt xem"],["likes","entry-likes","lượt thích"],["shares","entry-shares","lượt chia sẻ"]];
 let count=0;
 for(const [key,id] of fields){
  const value=s[key],field=$(id);
  if(field&&typeof value==="number"&&Number.isFinite(value)&&value>=0){
   field.value=String(Math.round(value));count++;
  }
 }
 if(!count){
  window.__topkeyTikTokStatsMeta=null;
  info((payload?.message||"Chưa lấy được số liệu từ link.")+" Không tự điền số 0 thay cho dữ liệu thiếu.");
  return;
 }
 window.__topkeyTikTokStatsMeta={url,source:String(payload.source||"TikTok public metadata"),fetchedAt:String(payload.fetchedAt||new Date().toISOString())};
 const fmt=n=>n==null?"chưa đọc được":new Intl.NumberFormat("vi-VN").format(n);
 info("Đã đọc "+count+"/3 chỉ số ("+window.__topkeyTikTokStatsMeta.source+"): xem "+fmt(s.views)+" · thích "+fmt(s.likes)+" · chia sẻ "+fmt(s.shares)+". Kiểm tra lại rồi bấm Lưu bài dự thi.");
}));
$("entry-url")?.addEventListener("input",()=>{
 const meta=window.__topkeyTikTokStatsMeta;
 if(meta&&$("entry-url").value.trim()!==meta.url)window.__topkeyTikTokStatsMeta=null;
});
connect?.addEventListener("click",()=>run(connect,async()=>{
 const entryId=$("entry-id")?.value;
 if(!entryId)throw Error("Bạn cần lưu bài dự thi trước, hoặc bấm Sửa tại bảng xếp hạng rồi chọn Kết nối chủ video.");
 const url=$("entry-url")?.value?.trim()||"";
 if(!/^https:\/\/(?:www\.|m\.)?tiktok\.com\/@[^/]+\/video\/\d{15,22}(?:[/?#]|$)/i.test(url))throw Error("Dùng đường link đầy đủ dạng https://www.tiktok.com/@ten/video/123... (không dùng link rút gọn).");
 info("Đang tạo liên kết xác nhận chủ video từ máy chủ...");
 const r=await callable("tiktokCreateCreatorLink")({entryId});
 const link=r.data?.url;
 if(!link||!link.startsWith("https://www.tiktok.com/v2/auth/authorize/"))throw Error("Không tạo được liên kết cấp quyền.");
 try{await navigator.clipboard.writeText(link);info("Đã sao chép liên kết TikTok. Gửi cho chủ video mở và đồng ý cấp quyền video.list. Liên kết hết hạn sau 15 phút.")}
 catch{info("Trình duyệt chặn sao chép. Hãy sao chép liên kết TikTok trong hộp thoại.");window.prompt("Sao chép liên kết gửi chủ video:",link)}
}));

async function runEdgeOneBatch(){
 if(!window.firebase?.database||!firebase.auth?.().currentUser)throw Error("Cần đăng nhập ADMIN/BTC Vlog.");
 const userId=firebase.auth().currentUser.uid;
 const testMode=window.__TOPKEY_VLOG_TEST_MODE===true;
 const db=firebase.database(),root=testMode?"topkey_vlog2026_test/entries":"topkey_vlog2026/entries";
 const snapshot=await db.ref(root).once("value");
 const entries=Object.entries(snapshot.val()||{}).filter(([,e])=>e&&validTikTokVideo(String(e.url||"").trim()));
 if(!entries.length){info("Không có video TikTok hợp lệ.");return;}
 const rootKey="topkey_vlog2026_scan:"+root,reportKey="topkey_vlog2026_scan_errors:"+root;
 const fingerprint=entries.length+":"+entries[0][0]+":"+entries[entries.length-1][0]+":"+String(entries[0][1].sampleCreatedAt||"");
 let saved={};try{saved=JSON.parse(localStorage.getItem(rootKey)||"{}")||{}}catch{}
 const offset=saved.fingerprint===fingerprint&&Number.isInteger(saved.offset)&&saved.offset>=0&&saved.offset<entries.length?saved.offset:0;
 // Conservative effective concurrency on free EdgeOne + unofficial TikWM:
 // 25 is the legacy UI preset, NOT 25 simultaneous upstream requests.
 const desired=Number($("tiktok-scan-concurrency")?.value||3);
 const concurrency=desired===3?3:5;
 const START_SPACING_MS=300;
 let nextStartAt=0;
 const pace=async()=>{
  const now=Date.now(),wait=Math.max(0,nextStartAt-now);
  nextStartAt=Math.max(now,nextStartAt)+START_SPACING_MS;
  if(wait>0)await new Promise(resolve=>setTimeout(resolve,wait));
 };
 const failed=new Map(),total=entries.length;
 if(saved.fingerprint===fingerprint && Array.isArray(saved.failures)){
  for(const f of saved.failures)if(f?.id&&f?.url)failed.set(String(f.id),f);
 }
 const canWrite=()=>firebase.auth().currentUser?.uid===userId&&(window.__TOPKEY_VLOG_TEST_MODE===true)===testMode;
 const csrf=()=>{
  if(!canWrite())throw Object.assign(Error("Phiên đăng nhập hoặc chế độ dữ liệu thay đổi; dừng ghi."),{status:403});
 };
 const rootStatus=$("tiktok-sync-status");
 const report=$("tiktok-scan-errors");
 let completed=offset,updated=0,partial=0,rejected=0,stopped=false,stopReason="";
 // Limit memory and avoid writing any TEST errors into production Firestore/RTDB.
 function syncFailedView(){
  showVlogScanFailures([...failed.values()],testMode,true);
 }
 const persist=(cursor)=>{
  const data={fingerprint,offset:cursor,failures:[...failed.values()]};
  try{localStorage.setItem(rootKey,JSON.stringify(data));localStorage.setItem(reportKey,JSON.stringify(data))}catch{}
 };
 const showProgress=()=>{
  info("ĐANG QUÉT "+completed+"/"+total+" URL · "+concurrency+" luồng thực tế · cập nhật "+updated+
       " · lỗi chưa khắc phục "+failed.size+" · tự động tiếp tục...");
 };
 if(report&&typeof report.replaceChildren==='function')report.hidden=true;
 if(testMode&&window.TopkeyVlogSyncErrorsChanged)window.TopkeyVlogSyncErrorsChanged([]);
 // Each queue item runs independently. TikWM 429, 502, 503, timeout, and
 // unreachable videos become explicit failures, never stop the remaining queue.
 // Only invalid authorization, lost sign-in or test/production mode switching
 // stops the whole run to prevent unsafe repeated calls or unauthorized writes.
 const WAVE_SIZE=25;
 for(let waveStart=offset;waveStart<total;waveStart+=WAVE_SIZE){
  if(!canWrite()){stopped=true;stopReason="Phiên đăng nhập hoặc chế độ dữ liệu đã thay đổi.";break}
  const wave=entries.slice(waveStart,waveStart+WAVE_SIZE);
  let next=0,globalStop=false,processed=0,authStopIndex=Infinity;
  const statuses=new Array(wave.length).fill(false);
  async function worker(){
   while(next<wave.length&&!globalStop){
    const index=next++, [id,entry]=wave[index],url=String(entry.url||"").trim();
    try{
     csrf();
     await pace();
     csrf();
     const response=await readEdgeOneMetadata(url),patch={};
     for(const key of ["views","likes","shares"]){
      const v=response.stats?.[key];
      if(Number.isSafeInteger(v)&&v>=0&&v<=1000000000)patch[key]=v;
     }
     if(!Object.keys(patch).length)throw Error("Không nhận được chỉ số hợp lệ từ TikTok/TikWM");
     if(globalStop)throw Object.assign(Error("Tạm dừng vì lỗi xác thực ở yêu cầu khác."),{status:401});
     csrf();
     const at=new Date().toISOString();
     const tx=await db.ref(root+"/"+id).transaction(current=>{
      if(!current||String(current.url||"").trim()!==url)return;
      return {...current,...patch,statsSource:String(response.source||"EdgeOne TikWM"),statsFetchedAt:at,statsLastAutoSyncAt:at};
     });
     if(!tx.committed)throw Error("Không ghi được Firebase: quyền hoặc URL bài dự thi đã thay đổi");
     failed.delete(id);updated++;if(Object.keys(patch).length<3)partial++;
    }catch(e){
     rejected++;
     const {code,reason}=vlogFailureReason(e);
     const prior=failed.get(id);
     failed.set(id,{id,name:String(entry.name||entry.title||id).slice(0,110),url,reason,code,
       retryCount:Number(prior?.retryCount||0),lastCheckedAt:new Date().toISOString()});
     // A broken token/account is a global authorization failure, not a video error.
     if((code===401||code===403)&&canWrite()){
      stopped=true;globalStop=true;stopReason=reason;authStopIndex=Math.min(authStopIndex,index);
     }else if(!canWrite()){
      stopped=true;globalStop=true;stopReason="Phiên đăng nhập thay đổi.";authStopIndex=Math.min(authStopIndex,index);
     }
    }finally{
     processed++;statuses[index]=true;completed++;showProgress();
    }
   }
  }
  await Promise.all(Array.from({length:Math.min(concurrency,wave.length)},()=>worker()));
  let confirmed=0;
  while(confirmed<wave.length&&statuses[confirmed])confirmed++;
  const resumePosition=waveStart+(stopped?Math.min(confirmed,authStopIndex):confirmed);
  persist(resumePosition>=total?0:resumePosition);
  syncFailedView();
  if(testMode&&typeof window.TopkeyVlogSyncErrorsChanged==="function")
   window.TopkeyVlogSyncErrorsChanged([...failed.values()]);
  if(stopped){
   info("TẠM DỪNG "+resumePosition+"/"+total+" URL vì quyền truy cập: "+stopReason+
        ". Đã lưu vị trí; không tự lặp lại các yêu cầu không được phép.");
   return;
  }
  if(waveStart+wave.length<total)await new Promise(resolve=>setTimeout(resolve,400));
 }
 persist(0);syncFailedView();
 if(testMode&&typeof window.TopkeyVlogSyncErrorsChanged==="function")
  window.TopkeyVlogSyncErrorsChanged([...failed.values()]);
 info("HOÀN TẤT "+total+"/"+total+" URL · cập nhật "+updated+" ("+partial+" thiếu chỉ số)"+
      " · lỗi chưa khắc phục "+failed.size+". Xem danh sách lỗi và nguyên nhân bên dưới; số liệu cũ được giữ nguyên khi lỗi.");
}
bulk.addEventListener("click",()=>run(bulk,async()=>{info("Đang quét liên tục qua EdgeOne TikWM...");await runEdgeOneBatch();}));
sync?.addEventListener("click",()=>run(sync,async()=>{
 info("Đang cập nhật số liệu các video đã được chủ video cấp quyền...");
 const r=await callable("tiktokSyncNow")({});
 const d=r.data||{};
 info("Đồng bộ xong: "+Number(d.updated||0)+" bài cập nhật; "+Number(d.failed||0)+" bài lỗi. Bảng xếp hạng sẽ tự cập nhật từ Firebase. Video chưa cấp quyền vẫn dùng nút Đọc số liệu từ link.");
}));
})();