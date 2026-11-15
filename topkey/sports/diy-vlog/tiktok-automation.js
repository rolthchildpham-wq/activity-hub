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
  const timer=setTimeout(()=>controller.abort(),12000);
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
 const desired=Number($("tiktok-scan-concurrency")?.value||3),concurrency=desired===25?25:desired===10?10:3;
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
  const all=[...failed.values()];
  window.__TOPKEY_VLOG_SCAN_ERRORS=testMode?all:[];
  if(!report)return;
  if(!all.length){report.hidden=true;report.replaceChildren();return}
  const title=document.createElement("h3");title.textContent="⚠ "+all.length+" video cần kiểm tra thủ công";
  const sub=document.createElement("p");sub.textContent="Các video này được xếp cuối bảng TEST. Kiểm tra URL và nguyên nhân bên dưới khi quét hoàn tất.";
  const list=document.createElement("ol");list.className="vlog-scan-error-list";
  for(const f of all){
   const item=document.createElement("li"),name=document.createElement("strong"),
    reason=document.createElement("span"),link=document.createElement("a");
   name.textContent=f.name||f.id;reason.textContent=" — "+f.reason;
   link.textContent="TikTok ↗";link.href=f.url;link.target="_blank";link.rel="noopener noreferrer";
   item.append(name,reason," ",link);list.appendChild(item);
  }
  report.replaceChildren(title,sub,list);report.hidden=false;
 }
 const persist=(cursor)=>{
  const data={fingerprint,offset:cursor,failures:[...failed.values()]};
  try{localStorage.setItem(rootKey,JSON.stringify(data));localStorage.setItem(reportKey,JSON.stringify(data))}catch{}
 };
 const showProgress=()=>{
  info("ĐANG QUÉT "+completed+"/"+total+" URL · "+concurrency+" luồng · cập nhật "+updated+
       " · lỗi "+failed.size+" · tự động tiếp tục...");
 };
 if(report)report.hidden=true;
 if(testMode&&window.TopkeyVlogSyncErrorsChanged)window.TopkeyVlogSyncErrorsChanged([]);
 // Each queue item runs independently. TikWM 429, 502, 503, timeout, and
 // unreachable videos become explicit failures, never stop the remaining queue.
 // Only invalid authorization, lost sign-in or test/production mode switching
 // stops the whole run to prevent unsafe repeated calls or unauthorized writes.
 const WAVE_SIZE=25;
 for(let waveStart=offset;waveStart<total;waveStart+=WAVE_SIZE){
  if(!canWrite()){stopped=true;stopReason="Phiên đăng nhập hoặc chế độ dữ liệu đã thay đổi.";break}
  const wave=entries.slice(waveStart,waveStart+WAVE_SIZE);
  let next=0,globalStop=false,processed=0;
  const statuses=new Array(wave.length).fill(false);
  async function worker(){
   while(next<wave.length&&!globalStop){
    const index=next++, [id,entry]=wave[index],url=String(entry.url||"").trim();
    try{
     csrf();
     const response=await readEdgeOneMetadata(url),patch={};
     for(const key of ["views","likes","shares"]){
      const v=response.stats?.[key];
      if(Number.isSafeInteger(v)&&v>=0&&v<=1000000000)patch[key]=v;
     }
     if(!Object.keys(patch).length)throw Error("Không nhận được chỉ số hợp lệ từ TikTok/TikWM");
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
     const code=Number(e?.status||0),reason=String(e?.message||e).slice(0,220);
     failed.set(id,{id,name:String(entry.name||entry.title||id).slice(0,110),url,reason,code});
     // A broken token/account is a global authorization failure, not a video error.
     if((code===401||code===403)&&canWrite()){
      stopped=true;globalStop=true;stopReason=reason;
     }else if(!canWrite()){
      stopped=true;globalStop=true;stopReason="Phiên đăng nhập thay đổi.";
     }
    }finally{
     processed++;statuses[index]=true;completed++;showProgress();
    }
   }
  }
  await Promise.all(Array.from({length:Math.min(concurrency,wave.length)},()=>worker()));
  let confirmed=0;
  while(confirmed<wave.length&&statuses[confirmed])confirmed++;
  const resumePosition=waveStart+confirmed;
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
      " · lỗi "+failed.size+". Danh sách lỗi màu đỏ bên dưới để kiểm tra thủ công.");
}
bulk.addEventListener("click",()=>run(bulk,async()=>{info("Đang quét liên tục qua EdgeOne TikWM...");await runEdgeOneBatch();}));
sync?.addEventListener("click",()=>run(sync,async()=>{
 info("Đang cập nhật số liệu các video đã được chủ video cấp quyền...");
 const r=await callable("tiktokSyncNow")({});
 const d=r.data||{};
 info("Đồng bộ xong: "+Number(d.updated||0)+" bài cập nhật; "+Number(d.failed||0)+" bài lỗi. Bảng xếp hạng sẽ tự cập nhật từ Firebase. Video chưa cấp quyền vẫn dùng nút Đọc số liệu từ link.");
}));
})();