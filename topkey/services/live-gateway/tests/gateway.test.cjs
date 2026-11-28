'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {Readable}=require('node:stream');
const source=fs.readFileSync('topkey/services/live-gateway/server.cjs','utf8');
function harness(){
 const requests=[];
 const db={ref:path=>({get:async()=>({
  exists:()=>path.includes('/courts/')||path.endsWith('/users/admin'),
  val:()=>path.endsWith('/users/admin')?{role:'ADMIN'}:{stream:{type:'WEBRTC',status:'LIVE'}}
 })})};
 const mockAdmin={apps:[],credential:{applicationDefault:()=>({})},
  initializeApp(){this.apps.push({})},database:()=>db,
  auth:()=>({verifyIdToken:async token=>{if(token!=='valid')throw Error('invalid');return {uid:'admin'}}})
 };
 const fakeRequire=name=>name==='node:http'?{}:name==='node:url'?{URL}:name==='firebase-admin'?mockAdmin:require(name);
 fakeRequire.main=null;
 const module={exports:{}};
 const sandbox={require:fakeRequire,module,process:{env:{FIREBASE_DATABASE_URL:'https://example.firebaseio.com',
   ALLOWED_ORIGINS:'https://topkey-activity-management.edgeone.dev',
   SRS_API_TOKEN:'private-token',NEURAL_VOICE_VI:'vi_voice',KOKOROTTS_API_KEY:'tts-secret'}},
   URL,Buffer,AbortSignal,Date,JSON,setInterval:()=>({unref(){}}),
   fetch:async(url,init)=>{
    requests.push({url,init});
    return url.includes('/rtc/')?
      {ok:true,text:async()=> 'v=0\r\na=answer\r\n'}:
      {ok:true,arrayBuffer:async()=>Buffer.from('RIFFcontent')};
   }};
 vm.runInNewContext(source,sandbox,{timeout:1000});
 async function call(path,payload,token){
  const req=Readable.from([Buffer.from(JSON.stringify(payload))]);
  req.method='POST';req.url=path;req.socket={remoteAddress:'test-visitor'};
  req.headers={origin:'https://topkey-activity-management.edgeone.dev',
   ...(token?{authorization:'Bearer '+token}:{})};
  const result={status:0,headers:{},body:null};
  const res={writeHead(status,headers){result.status=status;result.headers=headers},
   end(body){result.body=body}};
  await module.exports.handler(req,res);
  return result;
 }
 return {call,requests,api:module.exports};
}
const request={sport:'volleyball',tid:'test_demo',court:'c1',mode:'publish',sdp:'v=0\r\na=offer-padding-for-sdp-12345678901234567890\r\n'};
test('public spectator can WHEP-play an explicitly LIVE stream',async()=>{
 const h=harness();
 const r=await h.call('/api/rtc/offer',{...request,mode:'play'});
 assert.equal(r.status,200);
 assert.match(JSON.parse(r.body).answer,/v=0/);
 assert.match(h.requests[0].url,/whep/);
});
test('publish requires verified ADMIN identity and forwards SRS secret only server-side',async()=>{
 const h=harness();
 assert.equal((await h.call('/api/rtc/offer',request)).status,401);
 const ok=await h.call('/api/rtc/offer',request,'valid');
 assert.equal(ok.status,200);
 assert.equal(h.requests[0].init.headers.Authorization,'Bearer private-token');
 assert.doesNotMatch(ok.body,/private-token/);
});
test('neural TTS requires Firebase authentication and privately forwards WAV',async()=>{
 const h=harness();
 const b={text:'Xin chào TOPKEY',language:'vi'};
 assert.equal((await h.call('/api/tts/speak',b)).status,401);
 const result=await h.call('/api/tts/speak',b,'valid');
 assert.equal(result.status,200);
 assert.equal(result.headers['Content-Type'],'audio/wav');
 assert.ok(result.body);
 assert.equal(h.requests[0].init.headers.Authorization,'Bearer tts-secret');
});
test('unsafe stream identifiers are rejected before contacting private SRS',async()=>{
 const h=harness();
 const result=await h.call('/api/rtc/offer',{...request,court:'../../other'},'valid');
 assert.equal(result.status,400);
 assert.equal(h.requests.length,0);
});
test('stream name is namespaced by sport/tournament/court',()=>{
 const h=harness();
 assert.equal(h.api.streamName('volleyball','test','c1'),'tk_volleyball_test_c1');
 assert.equal(h.api.idOk('../unauthorized'),false);
});
