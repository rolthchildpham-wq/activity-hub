const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(path.join(__dirname,'../src/upgrade88.js'),'utf8');
let hbMode='stale'; const writes=[];
const els={
 'stream-court':{value:'court_1'},'stream-type':{value:'CAMERA'},
 'live-video':{srcObject:null,classList:{add(){},remove(){}},play:()=>Promise.resolve(),pause(){},removeAttribute(){},load(){},muted:true},
 'stream-fallback':{classList:{add(){},remove(){}}},
 'tk88-public-video':{srcObject:null,classList:{add(){},remove(){}},play:()=>Promise.resolve(),pause(){},removeAttribute(){},load(){},muted:true},
 'tk88-public-status':{textContent:'',dataset:{}},'tk88-public-placeholder':{classList:{add(){},remove(){}},textContent:''}
};
function snap(val,key=''){return {key,val:()=>val,exists:()=>val!=null,forEach(){}}}
function makeRef(p){return {async set(v){writes.push([p,v])},async update(){},async remove(){},push(){return Promise.resolve()},async once(){if(p.endsWith('/broadcast'))return snap({status:'LIVE',heartbeatAt:hbMode==='stale'?Date.now()-60000:Date.now()});return snap(null)},on(){},off(){}}}
class FakePC{constructor(){this.currentRemoteDescription=null;this.connectionState='new'}async setRemoteDescription(){}async createAnswer(){return{type:'answer',sdp:'a'}}async setLocalDescription(){}async addIceCandidate(){}close(){}}
const App={state:{courts:{court_1:{id:'court_1',stream:{type:'CAMERA',status:'LIVE',viewerType:'WEBRTC'}}},activeMatches:{},matches:{}},currentCourt:'court_1',startLocalCamera:async()=>{},startWebRTCBroadcast:async()=>{},stopLive:async()=>{},makePC:()=>new FakePC(),renderSpectator(){},startSpectator(){},startUmpire:async()=>{},score:async()=>{},applyRole(){},showTab(){},renderBranch(){},teamName:x=>x};
const T={App,U:{toast(){},id:()=> 'v1'},Auth:{role:()=> 'VIEWER',user:{uid:'viewer1'},profile:{},can:()=>true},Data:{db:{ref:makeRef},path:x=>x,queueSet:()=>Promise.resolve(),audit:()=>Promise.resolve()}};
const noop=()=>{};const ctx={window:null,Topkey:T,document:{hidden:false,getElementById:id=>els[id]||null,addEventListener:noop,documentElement:{dataset:{}}},navigator:{},location:{hash:'#spectator',protocol:'https:'},fetch:async()=>({ok:false}),RTCPeerConnection:FakePC,RTCIceCandidate:function(x){return x},RTCSessionDescription:function(x){return x},setTimeout:(fn,ms)=>{if(ms<100)fn();return 1},clearTimeout:noop,setInterval:()=>1,clearInterval:noop,console,URL,Date,Promise,Object,String,Number,Array};
ctx.window=ctx;ctx.window.TopkeyUpgrade77={state:{},stopAnalysisLoops(){}};ctx.window.TopkeyUpgrade78={evaluate(){}};ctx.window.TopkeyUpgrade85={};ctx.window.TopkeyUpgrade86={ensureLayout(){}};ctx.window.TopkeyUpgrade87={syncAudioButtons(){}};ctx.window.addEventListener=noop;
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'upgrade88.js'});
(async()=>{
 const u=ctx.TopkeyUpgrade88;assert(u?.connectPublicRtc,'connectPublicRtc export missing');
 let ok=await u.connectPublicRtc('court_1');assert.strictEqual(ok,false,'stale heartbeat must stop before session creation');assert(!writes.some(([p])=>p.endsWith('/request')),'stale heartbeat must not create Viewer session');assert(/ngắt\/reload/.test(els['tk88-public-status'].textContent),'stale diagnosis missing');
 hbMode='fresh';ok=await u.connectPublicRtc('court_1');assert.strictEqual(ok,true,'fresh heartbeat should proceed');assert(writes.some(([p,v])=>p.endsWith('/request')&&v.uid==='viewer1'),'fresh heartbeat must create Viewer request');console.log('upgrade101 viewer heartbeat VM: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
