const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(path.join(__dirname,'../src/upgrade88.js'),'utf8');
const writes=[],updates=[],removes=[];const now=Date.now();
const stream={getVideoTracks:()=>[{readyState:'live'}],getTracks:()=>[{kind:'video',readyState:'live'}]};
const els={
  'stream-court':{value:'court_1'},'stream-type':{value:'CAMERA'},
  'live-video':{srcObject:stream,classList:{add(){},remove(){}},play:()=>Promise.resolve(),pause(){},removeAttribute(){},load(){},muted:true},
  'stream-fallback':{classList:{add(){},remove(){}}},
};
function snap(val,key='',ref=null){return {key,val:()=>val,exists:()=>val!==null&&val!==undefined,ref,forEach(cb){if(val&&typeof val==='object')for(const [k,v] of Object.entries(val)){const r=makeRef('webrtc/court_1/sessions/'+k);cb(snap(v,k,r))}}};}
const existing={sid_waiting:{request:{uid:'viewer1',createdAt:now}}};
function makeRef(p){return {
  path:p,
  async set(v){writes.push([p,v]);},async update(v){updates.push([p,v]);},async remove(){removes.push(p);},
  push(v){writes.push([p+'/push',v]);return Promise.resolve();},
  async once(){if(p.endsWith('/sessions'))return snap(existing,'',this);if(p.endsWith('/broadcast'))return snap({status:'LIVE',heartbeatAt:Date.now()},'',this);return snap(null,'',this)},
  on(ev,cb){if(ev==='child_added'&&p.endsWith('/sessions'))setTimeout(()=>cb(snap(existing.sid_waiting,'sid_waiting',makeRef(p+'/sid_waiting'))),0);if(ev==='value'&&p.endsWith('/answer'))setTimeout(()=>cb(snap(null)),0);},off(){},child(k){return makeRef(p+'/'+k)}
};}
class FakePC{constructor(){this.connectionState='new';this.currentRemoteDescription=null;}addTrack(){}async createOffer(){return {type:'offer',sdp:'fake-sdp'}}async setLocalDescription(o){this.localDescription=o}async setRemoteDescription(o){this.currentRemoteDescription=o}async createAnswer(){return {type:'answer',sdp:'a'}}async addIceCandidate(){}close(){this.connectionState='closed'}}
const App={state:{courts:{court_1:{id:'court_1',stream:{type:'CAMERA',status:'LIVE'}}},activeMatches:{},matches:{}},currentCourt:'court_1',startLocalCamera:async()=>true,startWebRTCBroadcast:async()=>true,stopLive:async()=>true,makePC:()=>new FakePC(),setLiveState(){},teamName:x=>x,renderHealth(){}};
const T={App,U:{toast(){},id:()=> 'id1'},Auth:{role:()=> 'ADMIN',user:{uid:'admin1'},profile:{},can:()=>true},Data:{db:{ref:makeRef},path:x=>x,queueSet:()=>Promise.resolve(),audit:()=>Promise.resolve()}};
const noop=()=>{};const ctx={window:null,Topkey:T,document:{hidden:false,getElementById:id=>els[id]||null,addEventListener:noop,documentElement:{dataset:{}}},navigator:{},location:{hash:'',protocol:'https:'},fetch:async()=>({ok:false}),RTCPeerConnection:FakePC,RTCIceCandidate:function(x){return x},RTCSessionDescription:function(x){return x},setTimeout,clearTimeout,setInterval:()=>1,clearInterval:noop,console,URL,Date,Promise,Object,String,Number,Array};
ctx.window=ctx;ctx.window.TopkeyUpgrade77={state:{},stopAnalysisLoops(){}};ctx.window.TopkeyUpgrade78={evaluate(){}};ctx.window.TopkeyUpgrade85={};ctx.window.TopkeyUpgrade86={ensureLayout(){}};ctx.window.TopkeyUpgrade87={syncAudioButtons(){}};ctx.window.addEventListener=noop;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'upgrade88.js'});
(async()=>{const ok=await ctx.TopkeyUpgrade88.publishSharedCamera('court_1',stream);assert.strictEqual(ok,true);await new Promise(r=>setTimeout(r,30));assert.strictEqual(removes.filter(p=>p.endsWith('/sessions')).length,0,'must not remove sessions root');assert(writes.some(([p,v])=>p.endsWith('/sessions/sid_waiting/offer')&&v?.type==='offer'),'existing waiting Viewer must receive offer after broadcaster attaches');assert(updates.some(([p,v])=>p.endsWith('/broadcast')&&v?.heartbeatAt),'heartbeat update missing');console.log('upgrade101 webrtc signaling resilience VM: PASS')})().catch(e=>{console.error(e);process.exit(1)});
