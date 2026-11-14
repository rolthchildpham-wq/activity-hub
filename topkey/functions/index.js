"use strict";
/* TOPKEY Vlog 2026: Firebase Functions v2 + official TikTok Display API.
 * TikTok only returns statistics for videos owned by consenting accounts.
 * No scraping, demo metrics or client-side credentials.
 */
const {onCall,HttpsError,onRequest}=require("firebase-functions/v2/https");
const {onSchedule}=require("firebase-functions/v2/scheduler");
const {defineSecret}=require("firebase-functions/params");
const admin=require("firebase-admin");
const {randomBytes}=require("node:crypto");
if(!admin.apps.length)admin.initializeApp({databaseURL:"https://topkey-badminton-default-rtdb.asia-southeast1.firebasedatabase.app"});
const db=admin.database(),ROOT="topkey_handmade_vnext_2026/vlog2026";
const PRIVATE="_topkey_private/tiktok2026";
const CLIENT_KEY=defineSecret("TIKTOK_CLIENT_KEY");
const CLIENT_SECRET=defineSecret("TIKTOK_CLIENT_SECRET");
const REDIRECT_URI=defineSecret("TIKTOK_REDIRECT_URI");
const secrets=[CLIENT_KEY,CLIENT_SECRET,REDIRECT_URI];
const urlId=url=>{try{
 const u=new URL(String(url||""));
 if(u.protocol!=="https:"||!["www.tiktok.com","m.tiktok.com","tiktok.com"].includes(u.hostname))return "";
 const m=u.pathname.match(/\/video\/(\d{15,22})(?:\/|$)/);return m?m[1]:"";
}catch{return ""}};
const n=x=>Number.isSafeInteger(x)&&x>=0&&x<=1000000000?x:null;
const err=(code,msg)=>new HttpsError(code,msg);
async function authorized(uid){
 if(!uid)throw err("unauthenticated","Cần đăng nhập Firebase TOPKEY.");
 const profile=(await db.ref("topkey_badminton_vnext_2026/users/"+uid).get()).val()||{};
 const role=String(profile.role||"").toUpperCase(),scope=String(profile.sportScope||profile.assignedSport||"").toLowerCase();
 if(!((role==="ADMIN")||(role==="BTC"&&scope==="handmade"))||profile.active===false||profile.disabled===true||profile.locked===true||profile.enabled===false||profile.isActive===false||["disabled","blocked","suspended","inactive"].includes(String(profile.status||"").toLowerCase()))throw err("permission-denied","Tài khoản không có quyền Vlog.");
 return profile;
}
function config(){const key=CLIENT_KEY.value(),secret=CLIENT_SECRET.value(),redirect=REDIRECT_URI.value();
 if(!key||!secret||!redirect||!redirect.startsWith("https://"))throw Error("TikTok Developer API chưa được cấu hình.");
 return {key,secret,redirect};
}
async function api(url,opts){
 const response=await fetch(url,{...opts,signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error("TikTok API HTTP "+response.status);
 const val=await response.json();
 if(val.error&&(val.error.code!==0&&val.error.code!=="ok"))throw Error("TikTok API: "+String(val.error.code).slice(0,80));
 return val;
}
async function exchange(params){
 const {key,secret}=config();
 return api("https://open.tiktokapis.com/v2/oauth/token/",{
 method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
 body:new URLSearchParams({client_key:key,client_secret:secret,...params}).toString()
 });
}
async function tokens(owner){
 const ref=db.ref(PRIVATE+"/accounts/"+owner);
 let t=(await ref.get()).val();
 if(!t||!t.refreshToken)throw Error("Chủ video chưa kết nối TikTok.");
 if(t.accessToken&&t.accessUntil>Date.now()+300000)return t.accessToken;
 const response=await exchange({grant_type:"refresh_token",refresh_token:t.refreshToken});
 if(!response.access_token||!response.refresh_token||response.open_id!==owner)throw Error("Không thể làm mới quyền TikTok.");
 // Refresh tokens rotate; persist newest token before doing any video query.
 t={...t,accessToken:response.access_token,refreshToken:response.refresh_token,
 accessUntil:Date.now()+Number(response.expires_in||0)*1000,scope:response.scope||t.scope};
 await ref.set(t);
 return t.accessToken;
}
async function query(owner,ids){
 if(!ids.length)return [];
 const accessToken=await tokens(owner);
 const response=await api("https://open.tiktokapis.com/v2/video/query/?fields=id,view_count,like_count,share_count,share_url",{
 method:"POST",headers:{"Authorization":"Bearer "+accessToken,"Content-Type":"application/json"},
 body:JSON.stringify({filters:{video_ids:ids.slice(0,20)}})
 });
 return response.data?.videos||[];
}
async function updateEntry(entryId,entry,video){
 if(String(video.id)!==String(entry.videoId))return false;
 const views=n(Number(video.view_count)),likes=n(Number(video.like_count)),shares=n(Number(video.share_count));
 if(views===null||likes===null||shares===null)throw Error("TikTok trả về dữ liệu không hợp lệ.");
 const ref=db.ref(ROOT+"/entries/"+entryId);
 const result=await ref.transaction(current=>{
 if(!current||current.videoId!==entry.videoId||current.tiktokOwner!==entry.tiktokOwner)return;
 return {...current,views,likes,shares,source:"tiktok_api",lastSyncedAt:Date.now()};
 },undefined,false);
 return result.committed;
}
async function syncAll(){
 const records=(await db.ref(ROOT+"/entries").get()).val()||{};
 const groups={};
 for(const [id,entry] of Object.entries(records)){
  if(!entry||!entry.tiktokOwner||!entry.videoId||urlId(entry.url)!==entry.videoId)continue;
  (groups[entry.tiktokOwner]??=[]).push({id,entry});
 }
 let updated=0,failed=0;
 for(const [owner,list] of Object.entries(groups)){
  for(let start=0;start<list.length;start+=20){
   const batch=list.slice(start,start+20);
   try{const videos=await query(owner,batch.map(x=>x.entry.videoId));
    const byId=new Map(videos.map(v=>[String(v.id),v]));
    for(const item of batch){const v=byId.get(String(item.entry.videoId));if(v&&await updateEntry(item.id,item.entry,v))updated++}
   }catch(e){failed+=batch.length;console.error("TikTok sync batch",owner,e.message)}
  }
 }
 return {updated,failed,connectedAccounts:Object.keys(groups).length};
}
exports.tiktokCreateCreatorLink=onCall({region:"asia-southeast1",secrets,timeoutSeconds:45},async request=>{
 await authorized(request.auth?.uid);
 const entryId=String(request.data?.entryId||"");
 if(!/^[-A-Za-z0-9_]{8,128}$/.test(entryId))throw err("invalid-argument","Mã bài dự thi không hợp lệ.");
 const entry=(await db.ref(ROOT+"/entries/"+entryId).get()).val();
 if(!entry||!urlId(entry.url))throw err("failed-precondition","Lưu bài dự thi bằng URL TikTok đầy đủ trước khi kết nối.");
 const {key,redirect}=config(),state=randomBytes(32).toString("hex");
 await db.ref(PRIVATE+"/states/"+state).set({entryId,videoId:urlId(entry.url),expires:Date.now()+15*60000});
 const url=new URL("https://www.tiktok.com/v2/auth/authorize/");
 url.search=new URLSearchParams({client_key:key,scope:"video.list,user.info.basic",response_type:"code",redirect_uri:redirect,state}).toString();
 return {url:url.toString(),expiresMinutes:15};
});
exports.tiktokCreatorCallback=onRequest({region:"asia-southeast1",secrets,timeoutSeconds:60},async(req,res)=>{
 const html=(msg)=>res.status(200).set("Content-Type","text/html; charset=utf-8").send('<!doctype html><meta charset="utf-8"><title>TOPKEY TikTok</title><main style="font:18px system-ui;max-width:560px;margin:70px auto;padding:20px"><h2>TOPKEY Vlog 2026</h2><p>'+msg+'</p><p>Có thể đóng trang này.</p></main>');
 const state=String(req.query.state||""),code=String(req.query.code||"");
 if(!/^[a-f0-9]{64}$/.test(state)||!code)return html("Liên kết cấp quyền không hợp lệ hoặc đã bị hủy.");
 const stateRef=db.ref(PRIVATE+"/states/"+state),saved=(await stateRef.get()).val();
 if(!saved||saved.expires<Date.now())return html("Liên kết đã hết hạn. Hãy yêu cầu BTC tạo liên kết mới.");
 await stateRef.remove();
 try{
  const response=await exchange({grant_type:"authorization_code",code,redirect_uri:config().redirect});
  if(!response.open_id||!response.refresh_token||!String(response.scope||"").includes("video.list"))throw Error("Thiếu quyền video.list");
  const entry=(await db.ref(ROOT+"/entries/"+saved.entryId).get()).val();
  if(!entry||urlId(entry.url)!==saved.videoId)throw Error("Bài dự thi đã thay đổi");
  const owner=response.open_id;
  const result=await api("https://open.tiktokapis.com/v2/video/query/?fields=id,view_count,like_count,share_count",{
    method:"POST",headers:{"Authorization":"Bearer "+response.access_token,"Content-Type":"application/json"},
    body:JSON.stringify({filters:{video_ids:[saved.videoId]}})
  });
  const video=(result.data?.videos||[]).find(v=>String(v.id)===saved.videoId);
  if(!video)throw Error("Video không thuộc tài khoản vừa cấp quyền.");
  await db.ref(PRIVATE+"/accounts/"+owner).set({accessToken:response.access_token,refreshToken:response.refresh_token,
   accessUntil:Date.now()+Number(response.expires_in||0)*1000,scope:response.scope});
  await db.ref(ROOT+"/entries/"+saved.entryId).update({videoId:saved.videoId,tiktokOwner:owner});
  await updateEntry(saved.entryId,{...entry,videoId:saved.videoId,tiktokOwner:owner},video);
  return html("Đã kết nối TikTok và cập nhật số liệu bài dự thi thành công.");
 }catch(e){console.error("TikTok OAuth callback:",e.message);return html("Chưa kết nối được. Video phải thuộc tài khoản TikTok vừa cấp quyền. Liên hệ BTC để thử lại.")}
});
exports.tiktokSyncNow=onCall({region:"asia-southeast1",secrets,timeoutSeconds:120},async request=>{
 await authorized(request.auth?.uid);
 return await syncAll();
});
exports.tiktokScheduledSync=onSchedule({schedule:"every 6 hours",timeZone:"Asia/Ho_Chi_Minh",region:"asia-southeast1",secrets,timeoutSeconds:360},async()=>{
 const result=await syncAll();console.info("TOPKEY TikTok sync",result);
});
exports._internal={urlId,n};
