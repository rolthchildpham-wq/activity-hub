'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('topkey/sports/vnext/src/webrtc-client-h154.js','utf8');
function harness({enabled=true}={}){
 const calls=[];
 class Peer{
  constructor(){this.iceGatheringState='complete';this.connectionState='connected';this.localDescription=null;this.remoteDescription=null}
  addTrack(track){this.track=track}addTransceiver(){}
  createOffer(){return Promise.resolve({type:'offer',sdp:'v=0\r\na=browser-local-offer\r\n'})}
  async setLocalDescription(o){this.localDescription=o}
  async setRemoteDescription(a){this.remoteDescription=a}
  addEventListener(){}removeEventListener(){}close(){this.connectionState='closed'}
 }
 const window={};
 const context={window,URL,JSON,Promise,RTCPeerConnection:Peer,
  fetch:async(url,opts)=>{
   calls.push({url,opts});
   if(url==='./live-services-h154.json')return {ok:true,json:async()=>({enabled,apiBase:'https://media.example.test'})};
   return {ok:true,json:async()=>({answer:'v=0\r\na=server-answer\r\n'})};
  },
  setTimeout,clearTimeout
 };
 vm.runInNewContext(source,context,{timeout:1000});
 return {api:window.TopkeyWebRTCH154,calls};
}
test('WebRTC fails closed if media backend is not configured',async()=>{
 const h=harness({enabled:false});
 await assert.rejects(()=>h.api.loadConfig(),/chưa được kích hoạt/);
 assert.equal(h.calls.length,1);
});
test('publishing sends verified SDP with user Firebase token',async()=>{
 const h=harness();
 const stream={getTracks:()=>[{kind:'video'}]};
 const connection=await h.api.publish({sport:'volleyball',tid:'test_2026',court:'court_1',stream,token:'short-firebase-token'});
 assert.equal(connection.status(),'connected');
 const request=h.calls.find(x=>x.url.endsWith('/api/rtc/offer'));
 assert.equal(request.opts.headers.Authorization,'Bearer short-firebase-token');
 assert.equal(JSON.parse(request.opts.body).mode,'publish');
 connection.close();
});
test('spectator WHEP has no Admin bearer token and no Firebase writes',async()=>{
 const h=harness();
 await h.api.play({sport:'football',tid:'test_2026',court:'court_1',ontrack:()=>{}});
 const request=h.calls.find(x=>x.url.endsWith('/api/rtc/offer'));
 assert.equal(request.opts.headers.Authorization,undefined);
 assert.equal(JSON.parse(request.opts.body).mode,'play');
 assert.doesNotMatch(source,/queueSet|queueMulti|firebase\.database/);
});
test('refuses path traversal tournament/court identifiers',async()=>{
 const h=harness();
 await assert.rejects(()=>h.api.play({sport:'football',tid:'../prod',court:'c1'}),/không hợp lệ/);
});
test('viewer source and publisher are loaded by sports entrypoint',()=>{
 const html=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
 const viewer=fs.readFileSync('topkey/sports/vnext/src/public-viewer-h137.js','utf8');
 assert.match(html,/webrtc-client-h154\.js\?v=h154-20261121/);
 assert.match(html,/live-publisher-h154\.js\?v=h154-20261121/);
 assert.match(viewer,/type==="WEBRTC"/);
 assert.match(viewer,/node\.rtc/);
});
