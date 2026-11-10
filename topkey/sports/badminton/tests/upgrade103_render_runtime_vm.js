const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const code102=fs.readFileSync(path.resolve(__dirname,'../src/upgrade102.js'),'utf8');
const code103=fs.readFileSync(path.resolve(__dirname,'../src/upgrade103.js'),'utf8');
const refs=new Map();function ref(path){if(!refs.has(path))refs.set(path,{handlers:{},on(ev,fn){(this.handlers[ev]??=[]).push(fn)},off(ev,fn){this.handlers[ev]=(this.handlers[ev]||[]).filter(x=>x!==fn)}});return refs.get(path)}
let hidden=true,renderBranchCount=0,overviewCount=0,umpireCount=0,queueScoreCalls=0;
const els={};const doc={documentElement:{dataset:{}},get hidden(){return hidden},getElementById(id){return els[id]||null},createElement(){return {id:'',className:'',style:{},innerHTML:'',appendChild(){},querySelector(){return null}}},addEventListener(){}};
const App={state:{config:{},teams:{},matches:{},courts:{},activeMatches:{},announcements:{},finance:{},registrations:{},audit:{},commentary:{},users:{}},offs:[],spectatorOffs:[],spectatorStarted:false,currentTab:'finance',renderBranch(){renderBranchCount++},renderOverview(){overviewCount++},renderUmpire(){umpireCount++},renderHealth(){},renderFinance(){},renderUsers(){},showTab(tab){this.currentTab=tab;return tab},score(){this.renderUmpire();return Promise.resolve('ok')},stopSpectator(){}};
const Data={ready:true,ref,db:{ref},__u103QueueWrapped:false,queueMulti:async(up,meta)=>{if(meta?.type==='SCORE')queueScoreCalls++;return {up,meta}}};
const U94={state:{offs:[]},onActiveMatches(){},bindCourt(){}};const U88={renderPublicLiveFirst(){},ensureViewerAnnouncement(){}};const T={ROOT:'root',App,Data,Auth:{role:()=> 'ADMIN'},VERSION:'x'};
const listeners={};const win={Topkey:T,TopkeyUpgrade88:U88,TopkeyUpgrade94:U94,TopkeyUpgrade90:{stopLegacyPolling(){this.stopped=true}},performance:{now:(()=>{let n=0;return()=>n+=5})()},requestAnimationFrame:fn=>setTimeout(fn,0),addEventListener(ev,fn){listeners[ev]=fn}};
const sandbox={window:win,document:doc,location:{hash:'',href:'https://x/sports/badminton/'},URL,Math,Date,console,setTimeout,clearTimeout,performance:win.performance};win.window=win;win.document=doc;win.location=sandbox.location;win.URL=URL;
vm.createContext(sandbox);vm.runInContext(code102,sandbox);App.subscribe();renderBranchCount=0;overviewCount=0;
const matchRef=[...refs.entries()].find(([k])=>k==='matches'||k.endsWith('/matches'))[1];const snap={key:'m1',val:()=>({id:'m1'})};for(const f of matchRef.handlers.child_changed||[])f(snap);
setTimeout(()=>{
  assert.strictEqual(renderBranchCount,0,'hidden document must defer admin DOM render');
  assert(sandbox.window.TopkeyUpgrade102.state.metrics.hiddenRenderDefers>0,'hidden render defer metric missing');
  hidden=false;sandbox.window.TopkeyUpgrade102.flushAdminRender();
  setTimeout(async()=>{
    // finance tab: matches is inactive, so state updates without hidden DOM rendering.
    assert.strictEqual(renderBranchCount,0,'inactive matches branch must not render on finance tab');
    assert(sandbox.window.TopkeyUpgrade102.state.metrics.inactiveBranchSkips>0,'inactive branch skip metric missing');
    vm.runInContext(code103,sandbox);
    App.renderOverview();assert.strictEqual(overviewCount,0,'overview DOM must stay skipped off Overview tab');
    App.currentTab='umpire';await App.score('A',1);assert(umpireCount>=1,'score must still render umpire UI');assert(queueScoreCalls===0,'mock score does not use queueMulti by design');
    await T.Data.queueMulti({}, {type:'SCORE'});assert(queueScoreCalls===1,'wrapped queueMulti must preserve SCORE write');
    assert(sandbox.window.TopkeyUpgrade103.state.metrics.localScoreRenderMs>0,'local score render latency not measured');
    assert(sandbox.window.TopkeyUpgrade103.state.metrics.firebaseScoreWriteMs>0,'Firebase SCORE write latency not measured');
    console.log('upgrade103 render/runtime VM: PASS');
  },20);
},20);
