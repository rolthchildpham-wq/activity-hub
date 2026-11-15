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

bulk.addEventListener("click",()=>run(bulk,async()=>{
 status.hidden=false;
 if(!window.firebase?.database||!firebase.auth?.().currentUser)throw Error("Chưa đăng nhập Firebase. Hãy đăng nhập lại ADMIN/BTC DIY.");
 const db=firebase.database(),root="topkey_vlog2026/entries";
 info("Đang kết nối Firebase và tải danh sách thí sinh...");
 const snap=await db.ref(root).once("value"),entries=snap.val()||{};
 const all=Object.entries(entries).filter(([id,e])=>e&&typeof e==="object");
 const items=all.filter(([id,e])=>validTikTokVideo(String(e.url||"").trim()));
 if(!items.length){
  info("Đã đọc "+all.length+" bài dự thi trong Firebase nhưng tìm thấy 0 link video TikTok hợp lệ. Kiểm tra trường đường dẫn video của từng bài.");
  return;
 }
 let updated=0,partial=0,failed=0,noData=0;
 const failures=[];
 for(let i=0;i<items.length;i++){
  const [id,entry]=items[i],url=String(entry.url).trim();
  info("Đang quét "+(i+1)+"/"+items.length+" · "+String(entry.name||id)+" · đang gọi bộ đọc V2...");
  try{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),40000);
   let response,raw,payload;
   try{
    response=await fetch(READER_API,{method:"POST",mode:"cors",credentials:"omit",cache:"no-store",signal:controller.signal,headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({url})});
    raw=await response.text();
   }finally{clearTimeout(timer)}
   try{payload=JSON.parse(raw)}catch{throw Error("API trả dữ liệu không phải JSON (HTTP "+response.status+").")}
   if(!response.ok)throw Error(payload?.message||("HTTP "+response.status));
   const s=payload?.stats||{},patch={};
   for(const key of ["views","likes","shares"])if(typeof s[key]==="number"&&Number.isFinite(s[key])&&s[key]>=0)patch[key]=Math.round(s[key]);
   const count=Object.keys(patch).length;
   if(!count){noData++;failures.push(String(entry.name||id)+": V2 không trả số liệu");continue;}
   patch.statsSource=String(payload.source||"TikTok Reader V2");
   patch.statsFetchedAt=String(payload.fetchedAt||new Date().toISOString());
   patch.statsLastAutoSyncAt=new Date().toISOString();
   await db.ref(root+"/"+id).update(patch);
   updated++;if(count<3)partial++;
   info("Đã cập nhật "+updated+"/"+items.length+" · vừa xong "+String(entry.name||id)+": "+count+"/3 chỉ số.");
  }catch(e){
   failed++;const message=e?.name==="AbortError"?"Quá 40 giây, hết thời gian chờ":String(e?.message||e);
   failures.push(String(entry.name||id)+": "+message);
  }
 }
 info("HOÀN TẤT QUÉT V2: "+items.length+" link · cập nhật "+updated+" bài ("+partial+" bài thiếu chỉ số) · V2 không có số liệu "+noData+" · lỗi kết nối/ghi "+failed+(failures.length?" · Chi tiết: "+failures.slice(0,4).join(" | "):"")+".");
 const verify=(await db.ref(root).once("value")).val()||{};
 const count=Object.keys(verify).length;
 info(status.textContent+" Đã kiểm tra lại Firebase: "+count+" bài dự thi.");
}));
sync?.addEventListener("click",()=>run(sync,async()=>{
 info("Đang cập nhật số liệu các video đã được chủ video cấp quyền...");
 const r=await callable("tiktokSyncNow")({});
 const d=r.data||{};
 info("Đồng bộ xong: "+Number(d.updated||0)+" bài cập nhật; "+Number(d.failed||0)+" bài lỗi. Bảng xếp hạng sẽ tự cập nhật từ Firebase. Video chưa cấp quyền vẫn dùng nút Đọc số liệu từ link.");
}));
})();