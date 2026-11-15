/* TOPKEY TikTok public-link reader + official owner-consent sync. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const status=$("tiktok-sync-status"),connect=$("tiktok-connect"),sync=$("tiktok-sync-now"),reader=$("tiktok-read-link"),bulk=$("tiktok-sync-all-links");
if(!status||!bulk)return;
const READER_API="https://topkey-tiktok-stats-reader-s90l8b.v2.appdeploy.ai/api/read-link";
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
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),25000);
 let payload;
 try{
  const response=await fetch(READER_API,{
   method:"POST",mode:"cors",credentials:"omit",cache:"no-store",signal:controller.signal,
   headers:{"Content-Type":"application/json","Accept":"application/json"},
   body:JSON.stringify({url})
  });
  const raw=await response.text();
  try{payload=JSON.parse(raw)}catch{throw Error("Dịch vụ đọc link trả về dữ liệu không hợp lệ (HTTP "+response.status+").")}
  if(!response.ok)throw Error(payload?.message||"Dịch vụ đọc link lỗi HTTP "+response.status+".");
 }catch(e){
  if(e?.name==="AbortError")throw Error("Đọc link quá thời gian 25 giây. Thử lại hoặc dùng OCR ảnh.");
  if(e instanceof TypeError)throw Error("Không kết nối được dịch vụ đọc link từ trình duyệt (có thể bị CORS/mạng chặn). Hãy mở công cụ TikTok Reader riêng hoặc thử lại.");
  throw e;
 }finally{clearTimeout(timeout)}
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
const READER_ORIGIN="https://topkey-tiktok-stats-reader-s90l8b.v2.appdeploy.ai";
async function readWithV2(url){
 let lastError;
 for(let attempt=0;attempt<2;attempt++){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{
   const response=await fetch(READER_ORIGIN+"/api/read-link",{
    method:"POST",mode:"cors",credentials:"omit",cache:"no-store",signal:controller.signal,
    headers:{"Content-Type":"application/json","Accept":"application/json"},
    body:JSON.stringify({url})
   });
   const raw=await response.text();let payload;
   try{payload=JSON.parse(raw)}catch{throw Error("Reader V2 trả dữ liệu không hợp lệ (HTTP "+response.status+").")}
   if(!response.ok)throw Error(payload?.message||"Reader V2 HTTP "+response.status);
   return payload;
  }catch(e){
   lastError=e;
   if(e?.name==="AbortError")lastError=Error("Reader V2 quá thời gian 30 giây.");
   if(attempt===0)await new Promise(resolve=>setTimeout(resolve,900));
  }finally{clearTimeout(timer)}
 }
 throw lastError||Error("Không kết nối được Reader V2.");
}
async function runV2Batch(items,db,root){
 if(activeBatchRun)throw Error("Đang có một lượt đồng bộ chạy. Vui lòng chờ hoàn tất.");
 activeBatchRun=true;
 const summary={total:items.length,processed:0,updated:0,partial:0,noData:0,failed:0,failures:[]};
 let cursor=0;
 const worker=async()=>{
  while(true){
   const index=cursor++;
   if(index>=items.length)return;
   const [id,entry]=items[index];
   try{
    const payload=await readWithV2(String(entry.url||"").trim()),stats=payload?.stats||{},patch={};
    for(const key of ["views","likes","shares"]){
     const value=stats[key];
     if(typeof value==="number"&&Number.isFinite(value)&&value>=0)patch[key]=Math.round(value);
    }
    const count=Object.keys(patch).length;
    if(!count){
     summary.noData++;
     summary.failures.push(String(entry.name||id)+": "+String(payload?.message||"Reader V2 không trả số liệu").slice(0,150));
    }else{
     patch.statsSource=String(payload.source||"TikTok Reader V2");
     patch.statsFetchedAt=new Date().toISOString();
     patch.statsLastAutoSyncAt=new Date().toISOString();
     await db.ref(root+"/"+id).update(patch);
     summary.updated++;if(count<3)summary.partial++;
    }
   }catch(e){
    summary.failed++;
    summary.failures.push(String(entry.name||id)+": "+String(e?.message||e).slice(0,150));
   }finally{
    summary.processed++;
    info("Reader V2 chạy nền: "+summary.processed+"/"+summary.total+" link · cập nhật "+summary.updated+" · thiếu dữ liệu "+summary.noData+" · lỗi "+summary.failed+".");
   }
  }
 };
 try{
  await Promise.all(Array.from({length:Math.min(3,items.length)},()=>worker()));
  const verify=(await db.ref(root).once("value")).val()||{};
  const verifyCount=Object.keys(verify).length;
  info("HOÀN TẤT READER V2: "+summary.processed+"/"+summary.total+" link · cập nhật "+summary.updated+" bài ("+summary.partial+" bài thiếu chỉ số) · không đọc được "+summary.noData+" · lỗi "+summary.failed+" · Firebase đã kiểm tra lại "+verifyCount+" bản ghi."+(summary.failures.length?" Chi tiết: "+summary.failures.slice(0,8).join(" | "):""));
 }finally{activeBatchRun=false}
}
bulk.addEventListener("click",()=>run(bulk,async()=>{
 if(!window.firebase?.database||!firebase.auth?.().currentUser)throw Error("Chưa đăng nhập Firebase. Hãy đăng nhập lại ADMIN/BTC DIY.");
 info("Đang kết nối Firebase và lấy danh sách link TikTok...");
 const db=firebase.database(),root=window.__TOPKEY_VLOG_TEST_MODE?"topkey_vlog2026_test/entries":"topkey_vlog2026/entries";activeBatchRoot=root;
 const snap=await db.ref(root).once("value"),entries=snap.val()||{};
 const items=Object.entries(entries).filter(([id,e])=>e&&typeof e==="object"&&validTikTokVideo(String(e.url||"").trim()));
 if(!items.length){info("Đã đọc "+Object.keys(entries).length+" bản ghi nhưng không tìm thấy link video TikTok hợp lệ.");return;}
 info("Đã lấy "+items.length+" link. Bắt đầu gọi trực tiếp API Reader V2 theo 3 luồng nền; không mở tab hoặc iframe.");
 await runV2Batch(items,db,root);
}));
sync?.addEventListener("click",()=>run(sync,async()=>{
 info("Đang cập nhật số liệu các video đã được chủ video cấp quyền...");
 const r=await callable("tiktokSyncNow")({});
 const d=r.data||{};
 info("Đồng bộ xong: "+Number(d.updated||0)+" bài cập nhật; "+Number(d.failed||0)+" bài lỗi. Bảng xếp hạng sẽ tự cập nhật từ Firebase. Video chưa cấp quyền vẫn dùng nút Đọc số liệu từ link.");
}));
})();