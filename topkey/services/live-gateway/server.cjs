'use strict';
/* TOPKEY H154: private SRS WHIP/WHEP + Kokoro gateway.
 * All publish and TTS requests require verified Firebase identity and sport rights.
 * SRS API and Kokoro are private Docker-network services, never public endpoints.
 */
const http=require('node:http');
const {URL}=require('node:url');
const admin=require('firebase-admin');
if(!admin.apps.length)admin.initializeApp({credential:admin.credential.applicationDefault(),databaseURL:process.env.FIREBASE_DATABASE_URL});
const db=admin.database();
const PORT=Number(process.env.PORT||3000);
const origins=(process.env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
const sportRoots={football:'topkey_football_vnext_2026',volleyball:'topkey_volleyball_vnext_2026'};
const idOk=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v);
const limiter=new Map();
function limit(key,count=40,windowMs=60000){
 const now=Date.now(),prev=limiter.get(key);
 if(!prev||now-prev.start>windowMs){limiter.set(key,{start:now,n:1});return true}
 return ++prev.n<=count;
}
setInterval(()=>{for(const [k,v] of limiter)if(Date.now()-v.start>120000)limiter.delete(k)},120000).unref();
function send(res,status,data,origin){
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
 ...(origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})});
 res.end(JSON.stringify(data));
}
async function body(req,max=50000){
 let chunks=[],size=0;for await(const part of req){size+=part.length;if(size>max)throw Object.assign(new Error('Request too large'),{status:413});chunks.push(part)}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}
 catch{throw Object.assign(new Error('Invalid JSON'),{status:400})}
}
async function auth(req){
 const token=/^Bearer (.+)$/i.exec(req.headers.authorization||'')?.[1];
 if(!token)throw Object.assign(new Error('Firebase login required'),{status:401});
 let decoded;try{decoded=await admin.auth().verifyIdToken(token,true)}
 catch{throw Object.assign(new Error('Invalid Firebase identity'),{status:401})}
 const snap=await db.ref('topkey_badminton_vnext_2026/users/'+decoded.uid).get();
 if(!snap.exists()||snap.val()?.disabled===true)throw Object.assign(new Error('Account disabled'),{status:403});
 return {uid:decoded.uid,user:snap.val()};
}
async function checkPublish(identity,sport,tid,court){
 const {uid,user}=identity,role=String(user.role||'').toUpperCase();
 if(role==='ADMIN')return;
 if(role==='BTC'&&(user.sportScope===sport||user.sportAccess?.[sport]===true)&&
   (user.permissions?.modules?.live==='edit'||user.permissions?.modules?.control==='edit'))return;
 if(role==='UMPIRE' && (user.permissions?.modules?.live==='edit'||user.permissions?.modules?.umpire==='edit'||!user.permissions?.modules?.umpire)){
   const snap=await db.ref(sportRoots[sport]+'/tournaments/'+tid+'/courts/'+court+'/umpireUid').get();
   if(snap.val()===uid)return;
 }
 throw Object.assign(new Error('Missing Live publishing permission'),{status:403});
}
async function gatewayRequest(path,sdp){
 const url=(process.env.SRS_PRIVATE_URL||'http://srs:1985')+path;
 const reply=await fetch(url,{method:'POST',headers:{'Content-Type':'application/sdp',
  ...(process.env.SRS_API_TOKEN?{'Authorization':'Bearer '+process.env.SRS_API_TOKEN}:{})},
  body:sdp,signal:AbortSignal.timeout(12000)});
 const text=await reply.text();if(!reply.ok)throw Object.assign(new Error('Media server rejected offer ('+reply.status+')'),{status:502});
 if(!text.includes('v=0'))throw Object.assign(new Error('Media server response is not SDP'),{status:502});
 return text;
}
function streamName(sport,tid,court){return ['tk',sport,tid,court].join('_')}
async function handler(req,res){
 const origin=req.headers.origin||'',allowed=origins.includes(origin)?origin:null;
 if(origin&&!allowed){send(res,403,{error:'Origin not allowed'});return}
 if(req.method==='OPTIONS'){
  res.writeHead(204,{'Access-Control-Allow-Origin':allowed||'null',
   'Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'POST, GET, OPTIONS',
   'Access-Control-Max-Age':'300','Vary':'Origin'});res.end();return;
 }
 if(req.method==='GET'&&req.url==='/health'){
   send(res,200,{ok:true,service:'topkey-h154-live-gateway'},allowed);return
 }
 if(req.method!=='POST'||!['/api/rtc/offer','/api/tts/speak'].includes(req.url)){
   send(res,404,{error:'Not found'},allowed);return
 }
 if(!limit(req.socket.remoteAddress||'unknown',50)){
   send(res,429,{error:'Rate limit exceeded'},allowed);return
 }
 try{
  const data=await body(req);
  if(req.url==='/api/rtc/offer'){
   const {sport,tid,court,mode,sdp}=data;
   if(!sportRoots[sport]||!idOk(tid)||!idOk(court)||!['publish','play'].includes(mode)||
      typeof sdp!=='string'||sdp.length>35000||sdp.length<40||!sdp.startsWith('v=0'))
     throw Object.assign(new Error('Invalid WebRTC request'),{status:400});
   const courtRef=db.ref(sportRoots[sport]+'/tournaments/'+tid+'/courts/'+court);
   const snap=await courtRef.get();
   if(!snap.exists())throw Object.assign(new Error('Court not found'),{status:404});
   if(mode==='publish')await checkPublish(await auth(req),sport,tid,court);
   else if(snap.val().stream?.type!=='WEBRTC'||snap.val().stream?.status!=='LIVE')
     throw Object.assign(new Error('Broadcast is not active'),{status:404});
   const path='/rtc/v1/'+(mode==='publish'?'whip':'whep')+'/?app=live&stream='+encodeURIComponent(streamName(sport,tid,court));
   const answer=await gatewayRequest(path,sdp);
   send(res,200,{answer},allowed);return;
  }
  const identity=await auth(req);
  const role=String(identity.user.role||'').toUpperCase();
  if(!['ADMIN','UMPIRE','BTC','LIVE_ONLY'].includes(role))
    throw Object.assign(new Error('TTS operator required'),{status:403});
  const {text,language}=data;
  if(typeof text!=='string'||!text.trim()||text.length>400||!['vi','en','zh'].includes(language))
    throw Object.assign(new Error('Invalid TTS request'),{status:400});
  const voices={vi:process.env.NEURAL_VOICE_VI,en:process.env.NEURAL_VOICE_EN,zh:process.env.NEURAL_VOICE_ZH};
  const voice=voices[language];if(!voice)throw Object.assign(new Error('Neural voice not configured: '+language),{status:503});
  const ttsURL=process.env.TTS_PRIVATE_URL||'http://tts:7860';
  const response=await fetch(ttsURL+'/v1/audio/speech',{method:'POST',
   headers:{'Content-Type':'application/json',...(process.env.KOKOROTTS_API_KEY?{'Authorization':'Bearer '+process.env.KOKOROTTS_API_KEY}:{})},
   body:JSON.stringify({model:'kokoro',input:text,voice,response_format:'wav',speed:1}),
   signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Object.assign(new Error('Neural TTS failed ('+response.status+')'),{status:502});
  const audio=Buffer.from(await response.arrayBuffer());
  if(audio.length>5000000)throw Object.assign(new Error('Audio result exceeded 5MB'),{status:502});
  res.writeHead(200,{'Content-Type':'audio/wav','Cache-Control':'no-store',
   ...(allowed?{'Access-Control-Allow-Origin':allowed,'Vary':'Origin'}:{})});
  res.end(audio);
 }catch(e){send(res,e.status||500,{error:e.status?e.message:'Backend unavailable'},allowed)}
}
if(require.main===module)http.createServer((req,res)=>{void handler(req,res)}).listen(PORT,'0.0.0.0');
module.exports={handler,streamName,idOk,checkPublish};
