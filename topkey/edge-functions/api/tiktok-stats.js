/* TOPKEY Vlog TikTok metadata bridge — EdgeOne Makers Edge Function.
 * Same-origin POST only; validates Firebase identity + TOPKEY roles via
 * Firebase Realtime Database REST Security Rules (no service-account key).
 * Neither bearer tokens nor private profile data go to TikWM/TikTok.
 * TikWM is an unofficial upstream; metrics may be missing/inaccurate.
 */
const FIREBASE_PROJECT='topkey-badminton';
const DB_ORIGIN='https://topkey-badminton-default-rtdb.asia-southeast1.firebasedatabase.app';
const ALLOWED_HOSTS=new Set(['tiktok.com','www.tiktok.com','m.tiktok.com','vt.tiktok.com','vm.tiktok.com']);
const INDIVIDUAL_VIDEO=/^\/@[^/]{1,100}\/video\/(\d{15,22})\/?$/;
const SHORT_VIDEO=/^\/[a-zA-Z0-9_-]{2,80}\/?$/;
const SUPPORTED_METRICS={views:'play_count',likes:'digg_count',shares:'share_count',comments:'comment_count'};

function reply(body,status=200){
 return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
function parseVideoUrl(value){
 if(typeof value!=='string'||value.length>500)throw Error('TikTok URL không hợp lệ');
 const u=new URL(value);
 const short=u.hostname==='vt.tiktok.com'||u.hostname==='vm.tiktok.com';
 if(u.protocol!=='https:'||!ALLOWED_HOSTS.has(u.hostname)||u.port||u.username||u.password||
   !(short?SHORT_VIDEO:INDIVIDUAL_VIDEO).test(u.pathname))throw Error('Chỉ hỗ trợ URL HTTPS video TikTok');
 return u.href;
}
function readUntrustedUid(token){
 // For selecting a Firebase self-readable path ONLY. The RTDB REST call
 // enforces the JWT signature/expiration, not this untrusted decode.
 if(typeof token!=='string'||token.length>11000||token.split('.').length!==3)throw Error('Token không hợp lệ');
 const payload=token.split('.')[1];
 const pad='='.repeat((4-payload.length%4)%4);
 const data=JSON.parse(atob((payload+pad).replace(/-/g,'+').replace(/_/g,'/')));
 if(data.aud!==FIREBASE_PROJECT||typeof data.sub!=='string'||!/^[-\w]{1,128}$/.test(data.sub))
  throw Error('Token không đúng dự án Firebase');
 return data.sub;
}
function permitted(profile){
 if(!profile||typeof profile!=='object')return false;
 const role=String(profile.role||'').trim().toUpperCase();
 const status=String(profile.status||'').toLowerCase();
 if(profile.active===false||profile.disabled===true||profile.locked===true||
   profile.enabled===false||profile.isActive===false||
   ['disabled','blocked','inactive','suspended'].includes(status))return false;
 const scopes=[profile.sportScope,profile.assignedSport,...(Array.isArray(profile.sportScopes)?profile.sportScopes:[])]
  .map(x=>String(x||'').trim().toLowerCase());
 const diy=scopes.some(x=>['diy','handmade','diy / handmade','🧶 diy / handmade'].includes(x))||
  profile.sportAccess?.handmade===true;
 return role==='ADMIN'||profile.permissions?.modules?.vlog==='edit'||
  role==='BTC'&&(diy||profile.sportAccess?.vlog===true||scopes.includes('vlog'));
}
async function getJson(url,{headers={},timeout=6000,method='GET',body}={}){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(new Error('UpstreamTimeout')),timeout);
 try{
  const r=await fetch(url,{method,headers,body,signal:controller.signal,redirect:'follow',cache:'no-store'});
  if(!r.ok)return {status:r.status,data:null};
  const type=r.headers.get('content-type')||'';
  if(!type.includes('json'))return {status:502,data:null};
  const len=Number(r.headers.get('content-length')||0);
  if(len>400000)return {status:502,data:null};
  const text=await r.text();
  if(text.length>400000)return {status:502,data:null};
  return {status:r.status,data:JSON.parse(text)};
 }finally{clearTimeout(timer)}
}
async function verifyAccess(bearer){
 const uid=readUntrustedUid(bearer);
 const url=DB_ORIGIN+'/topkey_badminton_vnext_2026/users/'+encodeURIComponent(uid)+'.json?auth='+encodeURIComponent(bearer);
 let answer;
 try{answer=await getJson(url,{timeout:4500})}
 catch{ return {code:503,message:'Firebase tạm thời không truy cập được'} }
 if(answer.status===401)return {code:401,message:'Firebase token không hợp lệ hoặc hết hạn'};
 if(answer.status===403)return {code:403,message:'Firebase Security Rules từ chối truy cập hồ sơ'};
 if(answer.status!==200)return {code:503,message:'Firebase xác minh không khả dụng'};
 if(!permitted(answer.data))return {code:403,message:'Tài khoản không có quyền quản trị Vlog'};
 return null;
}
function metric(value){
 if(typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=1e9)return value;
 if(typeof value==='string'&&/^\d{1,10}$/.test(value)){
  const n=Number(value);if(Number.isSafeInteger(n)&&n<=1e9)return n;
 }
 return null;
}
function pickCounts(obj,map){
 if(!obj||typeof obj!=='object')return null;
 const s={};
 for(const [key,field] of Object.entries(map))s[key]=metric(obj[field]);
 return Object.values(s).some(v=>v!==null)?s:null;
}
async function viaTikWM(videoUrl){
 const upstream='https://www.tikwm.com/api/?url='+encodeURIComponent(videoUrl);
 // Keep a strict per-attempt timeout and one retry for transient errors.
 // Never retry 4xx other than 429 and do not hammer a rate-limited service.
 for(let attempt=0;attempt<2;attempt++){
  let answer=null;
  try{answer=await getJson(upstream,{timeout:6500,headers:{Accept:'application/json'}})}
  catch(e){if(attempt===1)return null}
  if(answer?.status===200&&answer.data?.code===0&&answer.data?.data){
   const stats=pickCounts(answer.data.data,SUPPORTED_METRICS);
   if(stats)return {ok:true,stats,source:'tikwm-unofficial',videoId:String(answer.data.data.id||'')};
   return null; // no metrics: never interpret missing counters as zero
  }
  if(answer?.status===400||answer?.status===401||answer?.status===403||answer?.status===404)return null;
  if(attempt===0)await new Promise(resolve=>setTimeout(resolve,850));
 }
 return null;
}
async function viaTikTokPage(videoUrl){
 // Fallback only for canonical video URLs. Do not follow a short link to a
 // user-controlled redirect; TikTok may return CAPTCHA/blocked HTML.
 const u=new URL(videoUrl);
 if(!INDIVIDUAL_VIDEO.test(u.pathname)||(u.hostname!=='www.tiktok.com'&&u.hostname!=='tiktok.com'&&u.hostname!=='m.tiktok.com'))return null;
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(new Error('TikTokPageTimeout')),3500);
 try{
  const r=await fetch(videoUrl,{signal:ctrl.signal,headers:{Accept:'text/html'},cache:'no-store'});
  if(!r.ok||Number(r.headers.get('content-length')||0)>500000)return null;
  const html=await r.text();
  if(html.length>500000)return null;
  const match=html.match(/<script[^>]+id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i);
  if(!match)return null;
  const raw=JSON.parse(match[1]);
  const item=raw?.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct;
  const expected=INDIVIDUAL_VIDEO.exec(u.pathname)?.[1];
  if(item?.id && String(item.id)!==expected)return null;
  const stats=pickCounts(item?.stats,{views:'playCount',likes:'diggCount',shares:'shareCount',comments:'commentCount'});
  return stats?{ok:true,stats,source:'tiktok-page',videoId:String(item.id||'')}:null;
 }finally{clearTimeout(timer)}
}
async function viaTikTokEmbed(videoUrl){
 // Third fallback: official TikTok video embed HTML, only for canonical URLs.
 // No scraping of unrelated page counters; return only embedded video metrics.
 const u=new URL(videoUrl),match=INDIVIDUAL_VIDEO.exec(u.pathname);
 if(!match||!['www.tiktok.com','tiktok.com','m.tiktok.com'].includes(u.hostname))return null;
 const videoId=match[1],ctrl=new AbortController();
 const timer=setTimeout(()=>ctrl.abort(new Error('TikTokEmbedTimeout')),3500);
 try{
  const r=await fetch('https://www.tiktok.com/embed/v2/'+videoId,{
   headers:{Accept:'text/html'},signal:ctrl.signal,cache:'no-store',redirect:'error'
  });
  if(!r.ok||Number(r.headers.get('content-length')||0)>300000)return null;
  const html=await r.text();
  if(html.length>300000)return null;
  const script=html.match(/<script[^>]*id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i);
  if(!script)return null;
  const data=JSON.parse(script[1]);
  const item=data?.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct;
  if(String(item?.id||'')!==videoId)return null;
  const stats=pickCounts(item.stats,{views:'playCount',likes:'diggCount',shares:'shareCount',comments:'commentCount'});
  return stats?{ok:true,stats,source:'tiktok-embed',videoId}:null;
 }finally{clearTimeout(timer)}
}
export default async function onRequest({request}){
 if(request.method!=='POST')return reply({ok:false,message:'POST required'},405);
 const authorization=request.headers.get('Authorization')||'';
 if(!authorization.startsWith('Bearer ')||authorization.length>12020)
  return reply({ok:false,message:'Firebase sign-in required'},401);
 const length=Number(request.headers.get('content-length')||0);
 if(length>2048)return reply({ok:false,message:'Request too large'},413);
 let videoUrl;
 try{
  const body=await request.json();
  videoUrl=parseVideoUrl(body?.url);
 }catch{return reply({ok:false,message:'Invalid TikTok video URL'},422)}
 const authResult=await verifyAccess(authorization.slice(7));
 if(authResult)return reply({ok:false,...authResult},authResult.code);
 try{
  let data=await viaTikWM(videoUrl);
  if(!data){try{data=await viaTikTokPage(videoUrl)}catch{}}
  if(!data){try{data=await viaTikTokEmbed(videoUrl)}catch{}}
  if(!data)return reply({ok:false,code:'VIDEO_UNAVAILABLE',message:'Không đọc được số liệu TikTok/TikWM/Embed; video có thể bị giới hạn hoặc không còn công khai'},502);
  return reply(data);
 }catch(e){
  return reply({ok:false,message:e?.name==='AbortError'?'TikTok upstream timeout':'TikTok upstream unavailable'},502);
 }
}
