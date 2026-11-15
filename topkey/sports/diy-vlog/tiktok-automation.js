/* TOPKEY TikTok public-link reader + official owner-consent sync. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const status=$("tiktok-sync-status"),connect=$("tiktok-connect"),sync=$("tiktok-sync-now"),reader=$("tiktok-read-link"),bulk=$("tiktok-sync-all-links");
if(!status||!bulk)return;
const READER_ORIGIN="https://topkey-tiktok-stats-reader-s90l8b.v2.appdeploy.ai";
function readerJsonp(path,params,timeoutMs=30000){return new Promise((resolve,reject)=>{const callback="__topkeyReader_"+Date.now()+"_"+Math.random().toString(36).slice(2);const script=document.createElement("script");let done=false;const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);delete window[callback];script.remove();err?reject(err):resolve(data)};window[callback]=data=>finish(null,data);script.onerror=()=>finish(Error("Không tải được Reader V2 JSONP. Kiểm tra kết nối mạng hoặc trạng thái dịch vụ."));const query=new URLSearchParams({...params,callback});script.src=READER_ORIGIN+path+"?"+query.toString();const timer=setTimeout(()=>finish(Error("Reader V2 quá thời gian "+Math.round(timeoutMs/1000)+" giây.")),timeoutMs);document.head.appendChild(script);});}
window.__topkeyTikTokStatsMeta=null;
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
 try{payload=await readerJsonp("/api/read-link-jsonp",{url},25000)}
 catch(e){throw Error(String(e?.message||e))}
 if(!payload?.ok)throw Error(payload?.message||"Reader V2 không đọc được link.");
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

let activeBatchRoot="topkey_vlog2026/entries",activeBatchRun=false;
function encodeBatch(batch){
 const bytes=new TextEncoder().encode(JSON.stringify(batch));let binary="";
 for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
 return btoa(binary).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
}
async function runV2Batch(items,db,root,readerWindow){
 if(activeBatchRun)throw Error("Đang có một lượt đồng bộ chạy. Vui lòng chờ hoàn tất.");
 if(!readerWindow||readerWindow.closed)throw Error("Không mở được cửa sổ Reader V2. Cho phép trình duyệt mở cửa sổ bật lên rồi thử lại.");
 activeBatchRun=true;
 const batchItems=items.slice(0,25),nonce="tkvlog_"+Date.now()+"_"+Math.random().toString(36).slice(2);
 const summary={total:batchItems.length,processed:0,updated:0,partial:0,noData:0,failed:0,failures:[]};
 const pendingWrites=[];
 let finished=false;
 const finish=()=>{if(finished)return;finished=true;window.removeEventListener("message",onReaderMessage);activeBatchRun=false};
 const onReaderMessage=event=>{
  if(event.origin!==READER_ORIGIN||event.source!==readerWindow||!event.data||event.data.nonce!==nonce)return;
  const msg=event.data;
  if(msg.type==="TOPKEY_VLOG_READER_RESULT"){
   const task=(async()=>{
    const entry=items.find(([id])=>id===msg.id);
    if(!entry)return;
    const [id,value]=entry,stats=msg.stats||{},patch={};
    for(const key of ["views","likes","shares"]){const n=stats[key];if(typeof n==="number"&&Number.isFinite(n)&&n>=0)patch[key]=Math.round(n);}
    const count=Object.keys(patch).length;
    if(count){
     patch.statsSource=String(msg.source||"TikTok Reader V2");
     patch.statsFetchedAt=new Date().toISOString();
     patch.statsLastAutoSyncAt=new Date().toISOString();
     await db.ref(root+"/"+id).update(patch);
     summary.updated++;if(count<3)summary.partial++;
    }else{
     if(msg.ok===false)summary.failed++;else summary.noData++;
     summary.failures.push(String(value.name||id)+": "+String(msg.message||"Reader V2 không trả số liệu").slice(0,150));
    }
   })().catch(e=>{summary.failed++;summary.failures.push(String(msg.name||msg.id)+": "+String(e?.message||e).slice(0,150))}).finally(()=>{
    summary.processed++;
    info("Reader V2 trung gian: "+summary.processed+"/"+summary.total+" link · cập nhật "+summary.updated+" · thiếu dữ liệu "+summary.noData+" · lỗi "+summary.failed+".");
   });
   pendingWrites.push(task);
  }else if(msg.type==="TOPKEY_VLOG_READER_COMPLETE"){
   Promise.all(pendingWrites).then(async()=>{
    const verify=(await db.ref(root).once("value")).val()||{};
    info("HOÀN TẤT QUA READER V2: "+summary.processed+"/"+summary.total+" link · cập nhật "+summary.updated+" bài ("+summary.partial+" bài thiếu chỉ số) · không đọc được "+summary.noData+" · lỗi "+summary.failed+" · Firebase có "+Object.keys(verify).length+" bản ghi."+(items.length>batchItems.length?" · Còn "+(items.length-batchItems.length)+" link chưa quét; mỗi lượt tối đa 25 link.":"")+(summary.failures.length?" Chi tiết: "+summary.failures.slice(0,6).join(" | "):""));
   }).catch(e=>info("Reader V2 đã quét xong nhưng không xác minh được Firebase: "+String(e?.message||e))).finally(finish);
  }
 };
 window.addEventListener("message",onReaderMessage);
 const payload={nonce,returnOrigin:location.origin,items:batchItems.map(([id,e])=>({id,name:String(e.name||id),url:String(e.url||"").trim()}))};
 readerWindow.location.href=READER_ORIGIN+"/?batch="+encodeURIComponent(encodeBatch(payload));
 info("Đã chuyển "+batchItems.length+" link sang cửa sổ Reader V2 riêng. Reader sẽ tự đọc và gửi từng kết quả về Vlog để lưu Firebase.");
}
// Configure only after deploying the authenticated worker backend.
// Example: window.__TOPKEY_TIKTOK_WORKER_API = "https://secure-worker.example";
const configuredWorkerOrigin=String(window.__TOPKEY_TIKTOK_WORKER_API||"").trim();
const WORKER_API=configuredWorkerOrigin.endsWith("/")?configuredWorkerOrigin.slice(0,-1):configuredWorkerOrigin;
async function runAuthenticatedWorkerBatch(){
 const user=firebase.auth?.().currentUser;
 if(!user)throw Error("Cần đăng nhập ADMIN/BTC Vlog trước khi đồng bộ.");
 const root=window.__TOPKEY_VLOG_TEST_MODE?"topkey_vlog2026_test/entries":"topkey_vlog2026/entries";
 const snap=await firebase.database().ref(root).once("value"), entries=snap.val()||{};
 const items=Object.entries(entries).filter(([,e])=>e&&validTikTokVideo(String(e.url||"").trim()));
 if(!items.length){info("Không có video TikTok hợp lệ để đồng bộ.");return}
 const token=await user.getIdToken();
 let queued=0;
 for(let offset=0;offset<items.length;offset+=100){
  const batch=items.slice(offset,offset+100).map(([id,e])=>({id,url:String(e.url||"").trim()}));
  const response=await fetch(WORKER_API+"/v1/jobs",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({entries:batch})});
  let result={};try{result=await response.json()}catch{}
  if(!response.ok)throw Error("Worker trả lỗi "+response.status+": "+String(result.detail||"Không thể tạo hàng đợi"));
  if(String(result.root||"")!==root.split("/")[0])throw Error("Worker đang trỏ sai nhánh Firebase, dừng đồng bộ để bảo vệ dữ liệu.");
  queued+=Number(result.queued||0);
  info("Đã đưa "+Math.min(offset+100,items.length)+"/"+items.length+" link vào hàng đợi.");
 }
 const response=await fetch(WORKER_API+"/v1/jobs",{headers:{"Authorization":"Bearer "+token}});
 const report=response.ok?await response.json():{};
 info("Đã nhận "+queued+" công việc mới từ "+items.length+" link. Worker chạy trên máy chủ; Firebase sẽ tự cập nhật khi xử lý xong. Trạng thái: "+JSON.stringify(report.status||{})+".");
}
bulk.addEventListener("click",()=>run(bulk,async()=>{
 if(WORKER_API){info("Đang đưa các link TikTok vào hàng đợi máy chủ...");await runAuthenticatedWorkerBatch();return;}

 if(!window.firebase?.database||!firebase.auth?.().currentUser)throw Error("Chưa đăng nhập Firebase. Hãy đăng nhập lại ADMIN/BTC DIY.");
 const readerWindow=window.open("about:blank","topkeyV2Reader","popup,width=520,height=760");
 if(!readerWindow)throw Error("Trình duyệt đang chặn cửa sổ Reader V2. Hãy cho phép pop-up cho trang Vlog.");
 info("Đang kết nối Firebase và lấy danh sách link TikTok...");
 const db=firebase.database(),root=window.__TOPKEY_VLOG_TEST_MODE?"topkey_vlog2026_test/entries":"topkey_vlog2026/entries";activeBatchRoot=root;
 const snap=await db.ref(root).once("value"),entries=snap.val()||{};
 const allItems=Object.entries(entries).filter(([id,e])=>e&&typeof e==="object"&&validTikTokVideo(String(e.url||"").trim()));
 if(!allItems.length){readerWindow.close();info("Đã đọc "+Object.keys(entries).length+" bản ghi nhưng không tìm thấy link video TikTok hợp lệ.");return;}
 await runV2Batch(allItems,db,root,readerWindow);
}));
sync?.addEventListener("click",()=>run(sync,async()=>{
 info("Đang cập nhật số liệu các video đã được chủ video cấp quyền...");
 const r=await callable("tiktokSyncNow")({});
 const d=r.data||{};
 info("Đồng bộ xong: "+Number(d.updated||0)+" bài cập nhật; "+Number(d.failed||0)+" bài lỗi. Bảng xếp hạng sẽ tự cập nhật từ Firebase. Video chưa cấp quyền vẫn dùng nút Đọc số liệu từ link.");
}));
})();