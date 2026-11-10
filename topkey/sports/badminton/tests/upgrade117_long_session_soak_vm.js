const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const refs=new Map();let maxHandlers=0;
function ref(path){
 if(!refs.has(path))refs.set(path,{handlers:{},on(ev,fn){(this.handlers[ev]??=[]).push(fn);const n=Object.values(this.handlers).reduce((a,x)=>a+x.length,0);maxHandlers=Math.max(maxHandlers,n)},off(ev,fn){this.handlers[ev]=(this.handlers[ev]||[]).filter(x=>x!==fn)}});
 return refs.get(path);
}
const currentHandlers=r=>Object.values(r.handlers).reduce((a,x)=>a+x.length,0);
const listeners={};const document={hidden:false,documentElement:{dataset:{}},getElementById(){return null},createElement(){return {style:{},appendChild(){},querySelector(){return null}}},addEventListener(ev,fn){listeners['doc:'+ev]=fn}};
let renders=0;
const App={state:{config:{},teams:{},matches:{},courts:{},activeMatches:{},announcements:{},finance:{},registrations:{},audit:{},commentary:{},users:{}},offs:[],currentTab:'overview',renderBranch(){renders++},renderOverview(){},renderTeams(){},renderCheckin(){},renderRegistrations(){},renderMatches(){},renderSelectors(){},renderStandings(){},renderSchedulerControls(){},renderControl(){},renderUmpire(){},renderLiveScore(){},renderFinance(){},renderAnnouncements(){},renderAudit(){},renderConfig(){},renderUsers(){},renderHealth(){},showTab(tab){this.currentTab=tab;return tab},score(){return Promise.resolve()}};
const Data={ready:true,connected:true,auth:{currentUser:{uid:'u'}},ref,db:{ref},queueMulti:async()=>({}),listeners:[]};
const T={ROOT:'root',App,Data,Auth:{role:()=> 'ADMIN'}};
const window={Topkey:T,TopkeyUpgrade90:{stopLegacyPolling(){}},performance:{now:()=>Date.now()},requestAnimationFrame:fn=>setTimeout(fn,0),addEventListener(ev,fn){listeners['win:'+ev]=fn}};window.window=window;window.document=document;
const sandbox={window,document,location:{hash:'',href:'https://x/sports/badminton/'},URL,Math,Date,console,setTimeout,clearTimeout,performance:window.performance,queueMicrotask};window.location=sandbox.location;
vm.createContext(sandbox);
vm.runInContext(read('src/core/ui-boundary.js'),sandbox);
vm.runInContext(read('src/core/data-runtime.js'),sandbox);
let tabHook=0,matchHook=0;window.TopkeyUIBoundary.onTab(()=>tabHook++,'soak:tab');window.TopkeyUIBoundary.afterMatches(()=>matchHook++,'soak:matches');window.TopkeyUIBoundary.install();
(async()=>{
 for(let i=0;i<100;i++)App.subscribe();
 assert.strictEqual(currentHandlers(ref('config')),1,'config value listener leaked across 100 subscribe cycles');
 for(const p of ['teams','matches','courts','activeMatches','announcements'])assert.strictEqual(currentHandlers(ref(p)),3,`${p} child listeners leaked across subscribe cycles`);
 const tabs=['overview','teams','schedule','control','umpire','live','finance','announcements','audit','settings','health'];
 let expectedMatches=0;for(let i=0;i<1200;i++){const tab=tabs[i%tabs.length];App.showTab(tab);if(tab==='schedule')expectedMatches++;if(i%8===0){App.renderMatches();expectedMatches++}}
 await sleep(250);
 assert.strictEqual(window.TopkeyUIBoundary.hooks.tab.length,1,'UI tab hook count changed during soak');
 assert.strictEqual(window.TopkeyUIBoundary.hooks.matches.length,1,'UI match hook count changed during soak');
 assert.strictEqual(tabHook,1200,'tab dispatcher lost or duplicated events');
 assert.strictEqual(matchHook,expectedMatches,'matches dispatcher lost or duplicated events');
 for(const p of ['finance','registrations','audit','commentary'])assert(currentHandlers(ref(p))<=3,`${p} dynamic listener leaked`);
 assert(currentHandlers(ref('root/users'))<=1,'settings users listener leaked');
 assert(maxHandlers<=3,'a single Firebase ref exceeded expected handler budget');
 assert(window.TopkeyCoreDataRuntime115.listenerState.coreOffs.length===6,'core listener ownership drifted');
 assert(window.TopkeyCoreDataRuntime115.listenerState.tabOffs.length<=1,'dynamic off list leaked');
 assert(renders>=0);
 console.log('PASS upgrade117 long-session UI/Firebase listener soak VM');
})().catch(e=>{console.error(e);process.exit(1)});
