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
   const response=await fetch("/api/tiktok-metadata",{
    method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
    body:JSON.stringify({url}),signal:controller.signal,cache:"no-store"
   });
   if(!(response.headers.get("content-type")||"").includes("application/json"))
    throw Error("EdgeOne API yt-dlp không trả JSON, kiểm tra deployment.");
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
 const db=firebase.database(),root=window.__TOPKEY_VLOG_TEST_MODE?"topkey_vlog2026_test/entries":"topkey_vlog2026/entries";
 const snapshot=await db.ref(root).once("value");
 const entries=Object.entries(snapshot.val()||{}).filter(([,e])=>e&&validTikTokVideo(String(e.url||"").trim()));
 if(!entries.length){info("Không có video TikTok hợp lệ.");return;}
 const storageKey="topkey_vlog2026_scan:"+root;
 const fingerprint=entries.length+":"+entries[0][0]+":"+entries[entries.length-1][0]+":"+String(entries[0][1].sampleCreatedAt||"");
 let saved={};
 try{saved=JSON.parse(localStorage.getItem(storageKey)||"{}")||{}}catch{}
 const offset=saved.fingerprint===fingerprint&&Number.isInteger(saved.offset)&&saved.offset>=0&&saved.offset<entries.length?saved.offset:0;
 const batch=entries.slice(offset,offset+25);
 const desired=Number($("tiktok-scan-concurrency")?.value||10);
 const concurrency=desired===25?25:10;
 let cursor=0,done=0,updated=0,partial=0,errors=0,stop=false;
 const details=[],completed=new Set(),retry=new Set();
 const fatal=e=>{
  const code=Number(e?.status||0),message=String(e?.message||e);
  return [401,403,429,503].includes(code)||e?.name==="AbortError"||e?.name==="TypeError"||
         /network error|failed to fetch|permission.denied|quá thời gian|timeout/i.test(message);
 };
 async function scanOne(idx){
  const [id,entry]=batch[idx],url=String(entry.url||"").trim();
  try{
   const result=await readEdgeOneMetadata(url),patch={};
   for(const key of ["views","likes","shares"]){
    const v=result.stats?.[key];
    if(Number.isSafeInteger(v)&&v>=0&&v<=1000000000)patch[key]=v;
   }
   if(!Object.keys(patch).length)throw Error("Không có chỉ số hợp lệ");
   const at=new Date().toISOString();
   const tx=await db.ref(root+"/"+id).transaction(current=>{
    if(!current||String(current.url||"").trim()!==url)return;
    return {...current,...patch,statsSource:"EdgeOne yt-dlp",statsFetchedAt:at,statsLastAutoSyncAt:at};
   });
   if(!tx.committed)throw Error("URL thay đổi hoặc không đủ quyền ghi Firebase");
   updated++;if(Object.keys(patch).length<3)partial++;
   completed.add(idx);
  }catch(e){
   errors++;
   details.push(id+": "+String(e?.message||e).slice(0,100));
   if(fatal(e)){stop=true;retry.add(idx)}
   else completed.add(idx); // unavailable video: record and continue to next link
  }finally{
   done++;
   info("EdgeOne yt-dlp · "+(offset+done)+"/"+entries.length+
        " · đồng thời "+Math.min(concurrency,batch.length)+
        " · cập nhật "+updated+" · lỗi "+errors+(stop?" · đang dừng do lỗi API":""));
  }
 }
 async function worker(){
  while(!stop&&cursor<batch.length){
   const idx=cursor++;
   await scanOne(idx);
  }
 }
 await Promise.all(Array.from({length:Math.min(concurrency,batch.length)},()=>worker()));
 // On a fatal error, resume from the earliest item that was not safely completed.
 // In-flight requests may finish out of order; repeating a successful item is safe
 // because URL-checked Firebase transactions are idempotent for identical metrics.
 let advanced=0;
 while(advanced<batch.length&&completed.has(advanced))advanced++;
 const processed=offset+(stop?advanced:batch.length),finished=processed>=entries.length;
 try{localStorage.setItem(storageKey,JSON.stringify({fingerprint,offset:finished?0:processed}))}catch{}
 info((stop?"TẠM DỪNG":"ĐÃ QUÉT")+" "+processed+"/"+entries.length+" URL · "+
      "đồng thời "+Math.min(concurrency,batch.length)+" · cập nhật "+updated+
      " ("+partial+" thiếu chỉ số) · lỗi "+errors+"."+
      (stop?" Lỗi hệ thống: giữ vị trí để thử lại.":finished?" Đã đến cuối danh sách.":" Bấm quét lần nữa để tiếp tục từ URL "+(processed+1)+".")+
      (details.length?" Chi tiết: "+details.slice(0,4).join(" | "):""));
}
bulk.addEventListener("click",()=>run(bulk,async()=>{info("Đang đọc số liệu qua EdgeOne yt-dlp...");await runEdgeOneBatch();}));
sync?.addEventListener("click",()=>run(sync,async()=>{
 info("Đang cập nhật số liệu các video đã được chủ video cấp quyền...");
 const r=await callable("tiktokSyncNow")({});
 const d=r.data||{};
 info("Đồng bộ xong: "+Number(d.updated||0)+" bài cập nhật; "+Number(d.failed||0)+" bài lỗi. Bảng xếp hạng sẽ tự cập nhật từ Firebase. Video chưa cấp quyền vẫn dùng nút Đọc số liệu từ link.");
}));
})();