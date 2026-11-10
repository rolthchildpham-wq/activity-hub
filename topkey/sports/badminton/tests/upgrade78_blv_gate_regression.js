const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),src=fs.readFileSync(path.join(root,'src/upgrade78.js'),'utf8');
const store=new Map();const listeners={};let focused=true,hidden=false,cancelCount=0,piperStops=0,zhStops=0,fxStops=0,enqueued=[];
const els={
 'auto-commentary':{checked:true,disabled:false,title:'',addEventListener(){},closest(){return null}},
 'umpire-court':{value:'court_1',addEventListener(){}},'stream-court':{value:'court_1',addEventListener(){}},
 'live-caption':{textContent:''},'health-version':{textContent:''},'health-audio':{textContent:''}
};
const document={
 get hidden(){return hidden},visibilityState:'visible',hasFocus:()=>focused,
 getElementById:id=>els[id]||null,querySelectorAll:()=>[],addEventListener:(n,fn)=>(listeners['d:'+n]??=[]).push(fn),documentElement:{dataset:{}}
};
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const Engine={queue:[],seen:new Set(),speaking:false,current:null,status(){},enqueue(item){enqueued.push(item);this.queue.push(item);return true},drain(){const x=this.queue.shift();if(x)enqueued.push({drained:x.id});return x}};
const Piper={audio:null,stop(){piperStops++}};
const App={
 state:{matches:{},courts:{},activeMatches:{},commentary:{}},currentTab:'overview',currentCourt:'court_1',audioUnlocked:true,
 showTab(tab){this.currentTab=tab;return tab},renderBranch(){},applyRole(){},afterLogin:async()=>{},bindStatic(){},renderHealth(){},
 comment:async(text,meta={})=>({text,...meta}),speakCommentary(row){enqueued.push({remote:row.id})},renderCommentary(){},
};
const Auth={user:{uid:'u1'},profile:{role:'UMPIRE'},role(){return this.profile.role},can(tab){return ['overview','control','umpire','live','health'].includes(tab)}};
const ctx={console,setTimeout:(fn)=>{fn();return 1},clearTimeout(){},Date,Math,Promise,Event:function(){},URL,Blob,performance:{now:()=>0},
 globalThis:null,window:null,document,localStorage,navigator:{},location:{protocol:'file:'},crypto:{randomUUID:()=> 'tab_test'},
 speechSynthesis:{cancel(){cancelCount++}},Topkey:{App,U:{setText(id,t){if(els[id])els[id].textContent=t},toast(){}},Auth},TopkeyUpgrade46:{Engine},TopkeyUpgrade47:{Piper},TopkeyUpgrade75:{stopMandarin(){zhStops++}},TopkeyUpgrade76:{stopAll(){fxStops++}},BroadcastChannel:undefined};
ctx.globalThis=ctx;ctx.window=ctx;ctx.addEventListener=(n,fn)=>(listeners['w:'+n]??=[]).push(fn);ctx.removeEventListener=()=>{};
vm.createContext(ctx);vm.runInContext(src,ctx,{filename:'upgrade78.js'});
const U78=ctx.TopkeyUpgrade78;
assert(U78&&U78.installed,'Upgrade78 not installed');
assert.strictEqual(App.audioUnlocked,false,'BOOT must be muted');
assert.strictEqual(store.get('topkey_auto_blv'),'0','BOOT must force auto BLV off');
function liveState({status='LIVE',started=true,umpireUid='u1',match=true,courtStatus='LIVE',activeMatchId='m1'}={}){
 App.state.activeMatches={court_1:{matchId:'m1',started,sets:[{a:1,b:0}],setIndex:0}};
 App.state.matches=match?{m1:{id:'m1',code:'M01',status,courtId:'court_1'}}:{};
 App.state.courts={court_1:{id:'court_1',name:'Sân 1',status:courtStatus,activeMatchId,umpireUid}};
 App.state.commentary={court_1:{latest:{id:'old1',courtId:'court_1',text:'câu cũ',createdAt:100}}};
}
liveState();
assert.strictEqual(U78.canSpeakNow(),false,'Overview must never speak');
App.currentTab='umpire';liveState({umpireUid:''});assert.strictEqual(U78.gateSnapshot().reason,'UMPIRE_UNASSIGNED');
liveState({umpireUid:'u2'});assert.strictEqual(U78.gateSnapshot().reason,'WRONG_UMPIRE');
liveState();let g=U78.evaluate();assert(g.ok&&U78.state.active,'Valid umpire LIVE must arm');assert.strictEqual(U78.state.baselineId,'old1','Existing commentary must become baseline');
const armed=U78.state.armedAt;
assert.strictEqual(U78.itemAllowed({id:'old1',court:'court_1',source:'REMOTE',createdAt:armed+10}),false,'Baseline old commentary must never speak');
assert.strictEqual(U78.itemAllowed({id:'old2',court:'court_1',source:'REMOTE',createdAt:armed-1}),false,'Remote commentary older than arm must not speak');
assert.strictEqual(U78.itemAllowed({id:'new1',court:'court_1',source:'REMOTE',createdAt:armed+20}),true,'New commentary after arm should speak');
assert.strictEqual(U78.itemAllowed({id:'new2',court:'court_2',source:'REMOTE',createdAt:armed+30}),false,'Other court commentary must not speak');
Engine.enqueue({id:'old1',court:'court_1',source:'REMOTE',createdAt:armed+50,text:'old'});assert(!enqueued.some(x=>x.id==='old1'),'Final enqueue guard leaked baseline');
Engine.enqueue({id:'new3',court:'court_1',source:'REMOTE',createdAt:armed+60,text:'new'});assert(enqueued.some(x=>x.id==='new3'),'Final enqueue guard blocked fresh LIVE event');
App.audioUnlocked=true;App.state.matches={};g=U78.evaluate();assert(!g.ok&&g.reason==='MATCH_DELETED','Deleted match must close gate');assert.strictEqual(App.audioUnlocked,false,'Deleted match must lock audio');assert.strictEqual(Engine.queue.length,0,'Deleted match must clear queue');assert(piperStops>0&&cancelCount>0&&zhStops>0&&fxStops>0,'Hard stop must cancel all commentary transports/FX');
App.currentTab='umpire';liveState({status:'FINISHED'});assert.strictEqual(U78.gateSnapshot().reason,'MATCH_NOT_LIVE');
liveState({started:false});assert.strictEqual(U78.gateSnapshot().reason,'MATCH_NOT_STARTED');
liveState({courtStatus:'AVAILABLE',activeMatchId:''});assert.strictEqual(U78.gateSnapshot().reason,'COURT_NOT_LIVE');
Auth.profile.role='LIVE_ONLY';Auth.can=tab=>tab==='live';App.currentTab='live';liveState({umpireUid:''});assert.strictEqual(U78.canSpeakNow(),true,'LIVE_ONLY may hear a valid selected LIVE match without umpire assignment');
App.state.activeMatches={};assert.strictEqual(U78.itemAllowed({source:'MANUAL',kind:'TEST',text:'test'}),true,'Explicit manual voice test should remain available on Live/Umpire even without a match');liveState({umpireUid:''});
hidden=true;document.visibilityState='hidden';assert.strictEqual(U78.gateSnapshot().reason,'BROWSER_BACKGROUND','Background browser tab must be silent');hidden=false;document.visibilityState='visible';focused=false;assert.strictEqual(U78.gateSnapshot().reason,'BROWSER_BACKGROUND','Unfocused browser tab must be silent');focused=true;
Auth.profile.role='UMPIRE';Auth.can=tab=>['overview','control','umpire','live','health'].includes(tab);App.currentTab='umpire';liveState();U78.evaluate();App.audioUnlocked=true;App.showTab('overview');assert.strictEqual(U78.state.active,false,'Leaving umpire/live must close gate');assert.strictEqual(App.audioUnlocked,false,'Leaving umpire/live must stop audio');

for(const f of ['upgrade49.js','upgrade50.js','upgrade72.js']){const x=fs.readFileSync(path.join(root,'src',f),'utf8');assert(x.includes('TopkeyUpgrade78')&&x.includes('outputAllowed'),'legacy voice layer '+f+' is not gated by Upgrade78')}
assert(fs.readFileSync(path.join(root,'src/upgrade75.js'),'utf8').includes('stopMandarin'),'Mandarin transport hard-stop missing');
assert(fs.readFileSync(path.join(root,'src/upgrade76.js'),'utf8').includes('stopAll'),'Crowd FX hard-stop missing');

console.log('upgrade78 BLV live-session gate regression: PASS · boot mute + no stale replay + LIVE/tab/court/umpire gate + hard stop');
