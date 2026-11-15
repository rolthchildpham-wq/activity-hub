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

let activeReaderFrame=null,activeBatchNonce=null,batchDb=null,batchSummary=null,pendingWrites=[],activeBatchRoot="topkey_vlog2026/entries";
let activeBatchItems=[],activeBatchOffset=0;
const READER_ORIGIN="https://topkey-tiktok-stats-reader-s90l8b.v2.appdeploy.ai";
const READER_CHUNK_SIZE=25;
function readerBatchUrl(items){
 const payload={nonce:activeBatchNonce,returnOrigin:window.location.origin,items};
 const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
 return READER_ORIGIN+"/?batch="+encodeURIComponent(encoded);
}
window.addEventListener("message",async event=>{
 if(event.origin!==READER_ORIGIN||event.source!==activeReaderFrame?.contentWindow||!activeBatchNonce)return;
 const message=event.data||{};
 if(message.nonce!==activeBatchNonce)return;
 if(message.type==="TOPKEY_VLOG_READER_RESULT"){
  batchSummary.processed++;
  const stats=message.stats||{},patch={};
  for(const key of ["views","likes","shares"])if(typeof stats[key]==="number"&&Number.isFinite(stats[key])&&stats[key]>=0)patch[key]=Math.round(stats[key]);
  const count=Object.keys(patch).length;
  if(count){
   patch.statsSource=String(message.source||"TikTok Reader V2");
   patch.statsFetchedAt=new Date().toISOString();
   patch.statsLastAutoSyncAt=new Date().toISOString();
   const write=batchDb.ref(activeBatchRoot+"/"+message.id).update(patch);
   pendingWrites.push(write);
   try{await write;batchSummary.updated++;if(count<3)batchSummary.partial++;}
   catch(e){batchSummary.failed++;batchSummary.failures.push(String(message.name||message.id)+": lỗi ghi Firebase - "+String(e?.message||e));}
  }else{
   batchSummary.noData++;
   batchSummary.failures.push(String(message.name||message.id)+": Reader V2 không lấy được số liệu"+(message.message?" ("+String(message.message).slice(0,120)+")":""));
  }
  info("Reader V2: "+batchSummary.processed+"/"+batchSummary.total+" link · cập nhật "+batchSummary.updated+" · chưa đọc được "+batchSummary.noData+" · lỗi ghi "+batchSummary.failed+".");
  return;
 }
 if(message.type==="TOPKEY_VLOG_READER_COMPLETE"){
  await Promise.allSettled(pendingWrites);
  pendingWrites=[];
  const nextOffset=activeBatchOffset+READER_CHUNK_SIZE;
  if(nextOffset<activeBatchItems.length){
   activeBatchOffset=nextOffset;
   const nextItems=activeBatchItems.slice(activeBatchOffset,activeBatchOffset+READER_CHUNK_SIZE);
   info("Đã xử lý "+batchSummary.processed+"/"+batchSummary.total+" link. Tự chuyển sang lô "+(Math.floor(activeBatchOffset/READER_CHUNK_SIZE)+1)+"...");
   activeReaderFrame.src=readerBatchUrl(nextItems);
   return;
  }
  const verify=(await batchDb.ref(activeBatchRoot).once("value")).val()||{};
  const count=Object.keys(verify).length;
  info("HOÀN TẤT READER V2: "+batchSummary.processed+"/"+batchSummary.total+" link · cập nhật "+batchSummary.updated+" bài ("+batchSummary.partial+" bài thiếu chỉ số) · không đọc được "+batchSummary.noData+" · lỗi ghi "+batchSummary.failed+" · Firebase đã kiểm tra lại "+count+" bài dự thi."+(batchSummary.failures.length?" Chi tiết: "+batchSummary.failures.slice(0,5).join(" | "):""));
  activeReaderFrame=null;activeBatchNonce=null;batchDb=null;pendingWrites=[];activeBatchItems=[];activeBatchOffset=0;
 }
});
bulk.addEventListener("click",()=>run(bulk,async()=>{
 if(!window.firebase?.database||!firebase.auth?.().currentUser)throw Error("Chưa đăng nhập Firebase. Hãy đăng nhập lại ADMIN/BTC DIY.");
 info("Đang kết nối Firebase và lấy danh sách link thí sinh...");
 const db=firebase.database(),root=window.__TOPKEY_VLOG_TEST_MODE?"topkey_vlog2026_test/entries":"topkey_vlog2026/entries";activeBatchRoot=root;
 const snap=await db.ref(root).once("value"),entries=snap.val()||{};
 const all=Object.entries(entries).filter(([id,e])=>e&&typeof e==="object");
 const items=all.filter(([id,e])=>validTikTokVideo(String(e.url||"").trim())).map(([id,e])=>({id,name:String(e.name||id),url:String(e.url).trim()}));
 if(!items.length){info("Đã đọc "+all.length+" bài dự thi trong Firebase nhưng không tìm thấy link video TikTok hợp lệ.");return;}
 activeBatchNonce=(window.crypto?.randomUUID?crypto.randomUUID():String(Date.now())+"-"+Math.random().toString(36).slice(2));
 batchDb=db;pendingWrites=[];activeBatchItems=items;activeBatchOffset=0;
 batchSummary={total:items.length,processed:0,updated:0,partial:0,noData:0,failed:0,failures:[]};
 const firstItems=items.slice(0,READER_CHUNK_SIZE);
 if(!activeReaderFrame){activeReaderFrame=document.createElement("iframe");activeReaderFrame.title="TOPKEY TikTok Reader V2";activeReaderFrame.setAttribute("aria-hidden","true");activeReaderFrame.tabIndex=-1;activeReaderFrame.style.cssText="position:fixed;width:1px;height:1px;left:-20px;bottom:0;opacity:0;pointer-events:none;border:0";document.body.appendChild(activeReaderFrame);}
 info("Đã lấy "+items.length+" link từ "+(window.__TOPKEY_VLOG_TEST_MODE?"TEST LAB riêng":"danh sách thí sinh production")+". Bắt đầu lô 1/"+Math.ceil(items.length/READER_CHUNK_SIZE)+"; Reader V2 đọc song song tối đa 3 link và tự chuyển lô.");
 activeReaderFrame.src=readerBatchUrl(firstItems);
}));
sync?.addEventListener("click",()=>run(sync,async()=>{
 info("Đang cập nhật số liệu các video đã được chủ video cấp quyền...");
 const r=await callable("tiktokSyncNow")({});
 const d=r.data||{};
 info("Đồng bộ xong: "+Number(d.updated||0)+" bài cập nhật; "+Number(d.failed||0)+" bài lỗi. Bảng xếp hạng sẽ tự cập nhật từ Firebase. Video chưa cấp quyền vẫn dùng nút Đọc số liệu từ link.");
}));
})();