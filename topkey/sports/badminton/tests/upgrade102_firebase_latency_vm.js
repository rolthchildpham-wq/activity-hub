const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(path.resolve(__dirname,'../src/upgrade102.js'),'utf8');
const refs=new Map(),offCount={n:0};
function getRef(path){if(!refs.has(path))refs.set(path,{handlers:{},on(ev,fn){(this.handlers[ev]??=[]).push(fn)},off(ev,fn){offCount.n++;this.handlers[ev]=(this.handlers[ev]||[]).filter(x=>x!==fn)}});return refs.get(path)}
const App={state:{config:{},teams:{},matches:{},courts:{},activeMatches:{},announcements:{},finance:{},registrations:{},audit:{},commentary:{},users:{}},offs:[],spectatorOffs:[],spectatorStarted:false,currentTab:'overview',renderCount:0,spectatorRenderCount:0,renderBranch(){this.renderCount++},renderSpectator(){this.spectatorRenderCount++},renderUsers(){},showTab(tab){this.currentTab=tab;return tab},stopSpectator(){},teamName(id){return this.state.teams[id]?.name||id}};
const U94={state:{offs:[]},onActiveMatches(){},bindCourt(){}};
const U88={renderPublicLiveFirst(){U88.live=(U88.live||0)+1},ensureViewerAnnouncement(){}};
const T={ROOT:'root',App,Data:{ready:true,ref:getRef,db:{ref:getRef}},Auth:{role:()=> 'ADMIN'}};
const sandbox={window:{Topkey:T,TopkeyUpgrade88:U88,TopkeyUpgrade94:U94,requestAnimationFrame:fn=>setTimeout(fn,0),addEventListener(){}},document:{documentElement:{dataset:{}},getElementById(){return null}},location:{hash:'',href:'https://x/sports/badminton/'},URL,Math,Date,console,setTimeout,clearTimeout,requestAnimationFrame:fn=>setTimeout(fn,0)};sandbox.window.window=sandbox.window;sandbox.window.document=sandbox.document;sandbox.window.location=sandbox.location;sandbox.window.URL=URL;
vm.createContext(sandbox);vm.runInContext(code,sandbox);
App.subscribe();
const paths=[...refs.keys()];
assert(paths.some(x=>x==='config'||x.endsWith('/config')),'config core listener missing');
assert(paths.some(x=>x==='matches'||x.endsWith('/matches')),'matches core listener missing');
assert(!paths.some(x=>x==='finance'||x.endsWith('/finance')),'finance must not listen before finance tab');
assert(!paths.some(x=>x==='audit'||x.endsWith('/audit')),'audit must not listen before audit tab');
App.showTab('finance');
setTimeout(()=>{},0);
setTimeout(async()=>{},0);
// activateTab is asynchronous via setTimeout wrapper; call exported helper deterministically.
sandbox.window.TopkeyUpgrade102.activateTab('finance');
assert([...refs.keys()].some(x=>x==='finance'||x.endsWith('/finance')),'finance listener missing after finance tab');
const matchRef=[...refs.entries()].find(([k])=>k==='matches'||k.endsWith('/matches'))[1];
for(let i=0;i<25;i++){const s={key:'m'+i,val:()=>({id:'m'+i,status:'SCHEDULED'})};for(const f of matchRef.handlers.child_changed||[])f(s)}
setTimeout(()=>{
  assert(App.renderCount<=3,'25 Firebase child updates should be coalesced, got '+App.renderCount+' renders');
  sandbox.location.hash='#spectator';App.spectatorStarted=false;App.startSpectator();
  const publicPaths=[...refs.keys()];
  assert(!publicPaths.some(x=>/\/commentary$/.test(x)),'public Viewer must not subscribe whole commentary tree');
  assert(U94.state.offs.length===1,'Upgrade94 full-tree listener sentinel missing');
  console.log('upgrade102 firebase latency VM: PASS');
},35);
