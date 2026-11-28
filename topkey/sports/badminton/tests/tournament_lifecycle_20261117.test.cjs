'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.join(__dirname,'..');
const wizardSource=fs.readFileSync(path.join(root,'upgrade122-hotfix80.js'),'utf8');
const reportSource=fs.readFileSync(path.join(root,'upgrade122-hotfix65.js'),'utf8');
const archiveSource=fs.readFileSync(path.join(root,'src/upgrade9.js'),'utf8');
const loader=fs.readFileSync(path.join(root,'production-loader.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const name of ['upgrade122-hotfix65.js','upgrade122-hotfix80.js'])for(const file of [html,loader])assert(file.includes(name+'?v=tourney-lifecycle-20261117-r1'),'Cache version missing for '+name);
assert(html.includes('production-loader.js?v=tourney-lifecycle-20261117-r1'));
const wizard=wizardSource.slice(wizardSource.indexOf('const DEFAULT_NEW_PRIZES='),wizardSource.indexOf('if(G&&!G.__tk79CreateTournament)'));
const reportWrapper=reportSource.slice(reportSource.indexOf('const baseFinish=G.finishTournament?.bind(G);'),reportSource.indexOf('const maintain=()=>'));
assert(wizard.startsWith('const DEFAULT_NEW_PRIZES=')&&wizard.includes('function showNewTournamentWizard()'));
assert(reportWrapper.includes('G.finishTournament=async function'));
assert(!wizard.includes('location.reload()'),'Wizard must not call reload on a shadowed location string');
assert(wizard.includes('location:venue'),'Venue must be stored in config without shadowing window.location');
assert(wizard.includes('existing.tid'),'Duplicate retry must reopen existing tournament');
assert(archiveSource.includes('async loadArchives(more=false)')&&archiveSource.includes('renderArchives(){'),'History view must exist');
assert(archiveSource.includes('TopkeyArchivePage'),'Tournament history must paginate');
assert(reportSource.includes('function buildReport()'),'Final report compiler must exist');
function dbFactory(){
 const store={},updates=[];
 const setPath=(key,val)=>{store[key]=val};
 const getPath=key=>{if(Object.prototype.hasOwnProperty.call(store,key))return store[key];let parts=key.split('/');while(parts.length){const parent=parts.join('/'),source=store[parent];if(source!==undefined){const rest=key.slice(parent.length+1).split('/');return rest.reduce((o,k)=>o?.[k],source)??null}parts.pop()}return null};
 const ref=(key='')=>({
  async once(){return {val:()=>getPath(key)}},
  child(child){return ref(key+'/'+child)},
  async set(val){setPath(key,val)},
  async update(val){
   updates.push({key,val});
   if(!key){for(const [path,x] of Object.entries(val))setPath(path,x)}
   else store[key]={...(store[key]||{}),...val};
  }
 });
 return {ref,store,updates};
}
async function wizardTest(){
 const db=dbFactory(),authRoot='auth',sport='badminton',rootPath='sportroot',indexKey=authRoot+'/tournamentIndex/'+sport;
 db.store[indexKey]={};
 const writes=db.updates;
 const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{url:'https://example.com/sports/badminton/index.html?v=1'});
 const document=dom.window.document;
 const $=id=>document.getElementById(id);
 let next='',redirects=0;
 const context={
  T:{Auth:{role:()=> 'ADMIN'},Data:{db},ROOT:rootPath,DEFAULT_RULES:{},SCHEMA_VERSION:1,VERSION:'test'},
  App:{state:{config:{location:'Topkey'}}},AUTH_ROOT:authRoot,SPORT:sport,
  S:{name:'Cầu lông',mode:'court',venueLabel:'Sân'},G:{randomToken:()=> 'testtoken'},
  $,esc:x=>String(x),normalizePrize:x=>({...x,id:x.id||'p1'}),clone:x=>JSON.parse(JSON.stringify(x)),ensureCss(){},
  U:{toast(){}},document,
  localStorage:{setItem(){}},
  window:{location:{href:'https://example.com/sports/badminton/index.html?v=1',assign:url=>{next=url;redirects++}}},
  URL,Date,Math,console
 };
 vm.createContext(context);
 vm.runInContext(wizard+';this.testWizard=showNewTournamentWizard;',context);
 context.testWizard();
 $('tk79-new-title').value='Cầu lông 2027';
 $('tk79-new-location').value='Sân cầu lông Công ty Topkey';
 const firstPrize=$('tk79-new-prizes').querySelector('.tk79-new-prize');
 firstPrize.querySelector('.n-name').value='Giải Nhất';
 firstPrize.querySelector('.n-qty').value='1';
 firstPrize.querySelector('.n-reward').value='1000000';
 firstPrize.querySelector('.n-note').value='Mỗi giải';
 await $('tk79-new-create').onclick();
 assert.equal(db.updates.length,1,'Exactly one Firebase multi-update should create a tournament');
 const created=db.updates[0].val;
 const cpath=Object.keys(created).find(k=>k.endsWith('/config'));
 const tid=cpath.split('/').at(-2);
 assert.equal(created[cpath].location,'Sân cầu lông Công ty Topkey');
 assert.equal(created[cpath].prizeStructure[0].reward,'1000000');
 assert(created[indexKey+'/'+tid]&&created[indexKey+'/'+tid].status==='ACTIVE');
 assert(next.includes('?tid='+tid),'Newly created tournament must open by tid');
 db.store[indexKey]={[tid]:created[indexKey+'/'+tid]};
 $('tk79-new-tournament-modal').remove();
 context.testWizard();
 $('tk79-new-title').value='Cầu lông 2027';
 await $('tk79-new-create').onclick();
 assert.equal(writes.length,1,'Retrying same title must not create a duplicate tournament');
 assert($('tk79-new-status').textContent.includes('đã có'),'Existing tournament must be reported');
 const open=[...$('tk79-new-status').querySelectorAll('button')].find(x=>x.textContent==='Mở giải đã tạo');
 assert(open&&typeof open.onclick==='function');
 open.onclick();
 assert.equal(redirects,2);
 dom.window.close();
}
async function closeTest({online=true,saveError=false,cancel=false}={}){
 const db=dbFactory(),tid='t_test2027',idx='auth/tournamentIndex/badminton/'+tid;
 const cfg='sportroot/tournaments/'+tid+'/config';
 const report={tid,generatedAt:1730000000000,signature:'good',summary:{matches:1,finished:1}};
 db.store[idx]={tid,title:'Giải test',status:'ACTIVE'};
 db.store[cfg]={tournamentStatus:'ACTIVE'};
 const current={report};
 let finished=0,toasts=[],archiveLoads=0;
 const original=db.ref;
 db.ref=(key='')=>{
  const r=original(key);
  if(saveError&&key===idx+'/finalReport')r.set=async()=>{throw Error('permission_denied')};
  return r;
 };
 const G={async finishTournament(){
  finished++;
  if(cancel)return;
  db.store[cfg]={...db.store[cfg],tournamentStatus:'CLOSED',closedAt:Date.now()};
  db.store[idx]={tid,status:'CLOSED',closedAt:Date.now(),top3:{MEN:[{name:'A'}]}};
 },async loadArchives(){archiveLoads++}};
 const T={Data:{tid,db,connected:online,pending:0,path:k=>'sportroot/tournaments/'+tid+'/'+k}};
 const App={state:{matches:{m1:{status:'DONE'}},config:{tournamentStatus:'ACTIVE'}}};
 const context={T,G,App,AUTH_ROOT:'auth',SPORT:'badminton',U:{toast:(...args)=>toasts.push(args)},
  isAdmin:()=>true,allFinished:()=>true,ensureReport:async()=>report,
  currentReport:report,console,Date,Error};
 vm.createContext(context);vm.runInContext(reportWrapper,context);
 await G.finishTournament();
 if(!online||saveError){
  assert.equal(finished,0,'Refuse to close before report is verifiably saved');
  assert(toasts.some(x=>x[1]==='err'),'Failed preflight needs visible error');
 }else if(cancel){
  assert.equal(finished,1);assert.equal(db.store[idx].status,'ACTIVE');
 }else{
  assert.equal(finished,1);
  assert.equal(db.store[idx].status,'CLOSED');
  assert.equal(db.store[idx].reportReady,true);
  assert.equal(db.store[idx].finalReport.tid,tid,'Closing must retain finalReport in history index');
  assert.equal(db.store[idx].top3.MEN[0].name,'A','Top 3 retained');
  assert.equal(archiveLoads,1);
 }
}
async function historyRenderTest(){
 const fragment=reportSource.slice(reportSource.indexOf('const baseRenderArchives=G.renderArchives?.bind(G);'),reportSource.indexOf('const baseFinish=G.finishTournament?.bind(G);'));
 assert(fragment.startsWith('const baseRenderArchives='));
 const report={tid:'hist1',generatedAt:1700000000000,title:'Giải trước'};
 const cards=[{children:[],appendChild(node){this.children.push(node)}},{children:[],appendChild(node){this.children.push(node)}}];
 const box={querySelectorAll(sel){return sel==='.list-card'?cards:[]}};
 let calls=0,downloaded=null;
 const G={archives:{hist1:{tid:'hist1',title:'Giải trước',closedAt:1700000000000,status:'CLOSED',finalReport:report,reportReady:true},
  active2:{tid:'active2',title:'Giải đang thi',createdAt:1600000000000,status:'ACTIVE',reportReady:false}},
  renderArchives(){calls++}};
 const context={G,document:{getElementById:id=>id==='tk9-archive-list'?box:null,createElement:()=>({style:{},remove(){}})},
  T:{Data:{db:dbFactory(),tid:'active2'}},AUTH_ROOT:'auth',SPORT:'badminton',
  downloadReport:r=>{downloaded=r},U:{toast(){}}};
 vm.createContext(context);vm.runInContext(fragment,context);G.renderArchives();
 assert.equal(calls,1);
 assert.equal(cards[0].children.length,1,'Closed archive must show report action');
 assert.equal(cards[0].children[0].disabled,false);
 assert.equal(cards[1].children[0].disabled,true,'Unfinished tournament has no final report');
 await cards[0].children[0].onclick();
 assert.equal(downloaded.tid,'hist1','Historical report must download its own snapshot');
}
(async()=>{
 await wizardTest();
 await historyRenderTest();
 await closeTest();
 await closeTest({online:false});
 await closeTest({saveError:true});
 await closeTest({cancel:true});
 console.log('PASS badminton tournament lifecycle: create->navigation, venue/prizes, duplicate retry, finish->archived report, Top 3, offline/denied/cancel');
})().catch(err=>{console.error(err);process.exitCode=1});
