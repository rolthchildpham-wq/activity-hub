/* Offline DOM integration tests. Run with Node, jsdom and jszip available.
 * No Firebase or production requests are made. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const JSZip = require('jszip');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [];
const pass = name => { checks.push(name); console.log('PASS', name); };
const flush = async () => { for(let i=0;i<30;i++) await new Promise(r=>setImmediate(r)); };
function dom(html='<button id="tk65-download-current">Export</button>') {
 const d=new JSDOM(html,{url:'https://test.invalid/sports/badminton/index.html',runScripts:'outside-only'}),w=d.window;
 w.__timers=[];w.__intervals=[];w.setTimeout=fn=>(w.__timers.push(fn),w.__timers.length);
 w.setInterval=fn=>(w.__intervals.push(fn),w.__intervals.length);w.clearTimeout=w.clearInterval=()=>{};
 w.Blob=Blob;w.JSZip={loadAsync:async data=>JSZip.loadAsync(data instanceof Blob?await data.arrayBuffer():data)};w.console=console;w.alert=()=>{};w.confirm=()=>true;
 w.fetch=async url=>({ok:true,arrayBuffer:async()=>{const key=/report-templates\/([^?]+)/.exec(url)?.[1];assert(key,'Only local templates may be fetched');const b=fs.readFileSync(path.join(root,'../reference-assets/ppt/report-templates',key));return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}});
 return d;
}
const fixture=()=>{
 const rankings={};for(const c of ['WOMEN','MIX','MEN'])rankings[c]=Array.from({length:5},(_,i)=>({rank:i+1,name:`${c} Team ${i+1}`,points:5-i,played:4,w:4-i,d:0,l:i}));
 return {sport:'badminton',mode:'sets',sportName:'Cầu lông',tid:'qa',title:'TOPKEY & Kiểm thử',generatedAt:1794380000000,location:'TOPKEY',summary:{teams:15,participants:30,matches:9,finished:8,cancelled:1,categories:3},rankings,top4:Object.fromEntries(Object.entries(rankings).map(([c,rs])=>[c,rs.slice(0,4)])),matches:Array.from({length:9},(_,i)=>({id:'match'+i,category:i%2?'MEN':'MIX',date:'2026-11-11',time:'17:15',teamA:'MatchA '+i,teamB:'MatchB '+i,result:'21-19 | 21-17',status:i===8?'CANCELLED':'FINISHED'})),prizeStructure:Array.from({length:5},(_,i)=>({name:'Giải '+i,quantity:1,reward:'Quà '+i})),finance:{income:10000,expense:3000,balance:7000,rows:Array.from({length:5},(_,i)=>({date:'2026-11-11',category:'Ledger '+i,type:'EXPENSE',amount:600,status:'PAID'}))}};
};
async function slideTexts(w,result){
 const zip=await JSZip.loadAsync(await result.blob.arrayBuffer());
 const pre=new w.DOMParser().parseFromString(await zip.file('ppt/presentation.xml').async('string'),'application/xml');
 const rel=new w.DOMParser().parseFromString(await zip.file('ppt/_rels/presentation.xml.rels').async('string'),'application/xml');
 const map={};for(const e of rel.documentElement.children)map[e.getAttribute('Id')]=e.getAttribute('Target');
 const slides=[];for(const e of pre.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main','sldId')){
  const file='ppt/'+map[e.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')];
  const xml=await zip.file(file).async('string'),doc=new w.DOMParser().parseFromString(xml,'application/xml');assert.equal(doc.querySelector('parsererror'),null);
  slides.push([...doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main','t')].map(x=>x.textContent).join('\n'));
 }
 return {zip,slides,text:slides.join('\n')};
}
async function templateTests(){
 const d=dom(),w=d.window;w.eval(read('h112-ppt-template.js'));w.eval(read('h116-report-integrity.js'));
 for(const sport of ['badminton','football','volleyball','running','handmade','shuttle','cooking']){
  const r=fixture();r.sport=sport;
  const result=await w.TopkeyPptxTemplateH112.build(r,{sport});if(process.env.TOPKEY_REVIEW_OUTPUT&&sport==='badminton'){fs.mkdirSync(process.env.TOPKEY_REVIEW_OUTPUT,{recursive:true});fs.writeFileSync(path.join(process.env.TOPKEY_REVIEW_OUTPUT,'template-fixture.pptx'),Buffer.from(await result.blob.arrayBuffer()));}await w.TopkeyReportIntegrityH116.assertPpt(result,r,sport);
  const {zip,slides,text}=await slideTexts(w,result);
  assert(text.includes(r.title));for(const rows of Object.values(r.rankings))for(const row of rows)assert(text.includes(row.name),row.name);
  for(const m of r.matches)assert(text.includes(m.teamA),m.id);
  for(const row of r.finance.rows)assert(text.includes(row.category),row.category);
  for(const row of r.prizeStructure)assert(text.includes(row.name),row.name);
  const source=await JSZip.loadAsync(fs.readFileSync(path.join(root,'../reference-assets/ppt/report-templates',sport+'-topkey-report.pptx')));
  for(const file of Object.keys(source.files).filter(x=>/^ppt\/(media|theme)\//.test(x)&&!source.files[x].dir))assert.deepEqual(await zip.file(file).async('uint8array'),await source.file(file).async('uint8array'),'Preserve template '+file);
  const resultIndexes=slides.map((x,i)=>x.includes('MatchA')?i:-1).filter(x=>x>=0);assert.equal(resultIndexes.at(-1)-resultIndexes[0]+1,resultIndexes.length,'Schedule pages stay adjacent');
  assert(text.includes('Đã hủy'));assert(text.includes('Đôi nữ'));assert.equal(result.stats.displaySlides,slides.length);
  pass('template, complete data and section order: '+sport);
 }
 const r=fixture(),filtered=await w.TopkeyPptxTemplateH112.build(r,{sport:'badminton',plan:{champions:{enabled:false},rankings:{enabled:false},results:{enabled:false},finance:{enabled:false},prizes:{enabled:false}}});
 const t=await slideTexts(w,filtered);assert(!t.text.includes('MatchA'));assert(!t.text.includes('Ledger'));assert(!t.text.includes('WOMEN Team'));pass('disabled sections remove all overflow pages');
 d.window.close();
}
async function exportFlowTests(){
 for(const source of ['sports/badminton/','sports/vnext/src/']){
  const d=dom('<form id="rules-form"><input id="cfg-location"></form><button id="tk65-download-current">Export</button><div id="tk9-archive-list"></div>'),w=d.window,r=fixture(),toasts=[];
  w.Topkey={SPORT:{key:'badminton',name:'Cầu lông',mode:'sets'},App:{state:{config:{prizeStructure:[]}}},U:{toast:(...xs)=>toasts.push(xs)},Data:{tid:'qa'}};
  w.TopkeyUpgrade9={archives:{}};w.TopkeyUpgrade122Hotfix65={buildReport:()=>r};w.TopkeyLifecycle={bind:fn=>w.__intervals.push(fn)};
  w.eval(read('ppt-report-wizard.js'));w.eval(read('h116-report-integrity.js'));w.PptxGenJS=require('pptxgenjs');
  let downloads=0,fail=false;
  const engine=w.TopkeyPptWizard;w.TopkeyPptWizard={...engine,build:async(...xs)=>{if(fail)throw Error('simulated template failure');return engine.build(...xs)},download:()=>downloads++};
  w.eval(read(source+'upgrade122-hotfix76.js'));w.eval(read(source+'upgrade122-hotfix80.js'));
  for(const fn of w.__timers.splice(0))fn();
  // Reproduce the legacy 400 ms assignment after the modern module settles.
  for(const fn of w.__intervals)fn();
  w.document.getElementById('tk65-download-current').click();
  assert(!w.document.getElementById('tk79-modal').classList.contains('tk79-hidden'));assert(w.document.getElementById('tk76-modal').classList.contains('tk76-hidden'));
  await w.TopkeyUpgrade122Hotfix79.exportPpt();await w.TopkeyUpgrade122Hotfix79.exportPpt();assert.equal(downloads,2,'Second export must release busy state');
  fail=true;await w.TopkeyUpgrade122Hotfix79.exportPpt();fail=false;await w.TopkeyUpgrade122Hotfix79.exportPpt();assert.equal(downloads,3,'Retry after failure');
  assert(toasts.some(x=>x[1]==='err'));pass('legacy timer, repeated export and retry: '+source);d.window.close();
 }
}
async function loaderTests(){
 const d=dom('<button id="tk65-download-current"><span>Export</span></button><button class="tk65-archive-report">Archive</button>'),w=d.window;
 w.requestIdleCallback=fn=>fn();const append=w.document.head.appendChild.bind(w.document.head);const sources=[];
 w.document.head.appendChild=el=>{const out=append(el);if(el.tagName==='SCRIPT'){sources.push(el.src);queueMicrotask(()=>el.onload())}return out};
 w.eval(read('sports/badminton/production-loader.js'));
 const loader=w.TopkeyProductionLoader;
 assert.equal(loader.featureFor(w.document.querySelector('#tk65-download-current span')),'reports');assert.equal(loader.featureFor(w.document.querySelector('.tk65-archive-report')),'reports');
 await Promise.all([loader.loadFeature('reports'),loader.loadFeature('reports')]);assert.equal(sources.length,loader.featureSources.reports.length);assert(sources.some(s=>s.includes('ppt-report-wizard.js?v=ppt-upload-20261111')));
 pass('current and archived reports load template dependencies once');d.window.close();
}
async function lifecycleTests(){
 for(const source of ['sports/badminton/','sports/vnext/src/']){
  const d=dom('<div id="tk9-lifecycle-card"><div id="tk9-lifecycle-status"></div></div>'),w=d.window;
  const state={config:{title:'Lifecycle QA'},teams:{a:{id:'a',name:'A',category:'MEN'},b:{id:'b',name:'B',category:'MEN'}},matches:{a:{id:'a',status:'FINISHED',teamAId:'a',teamBId:'b'},b:{id:'b',status:'SCHEDULED',teamAId:'a',teamBId:'b'}},finance:{}};
  w.Topkey={SPORT:{key:'badminton',name:'Cầu lông',mode:'sets'},App:{state,ranking:()=>[{id:'a',name:'A',points:1},{id:'b',name:'B',points:0}]},Auth:{role:()=>'ADMIN'},Data:{tid:'qa1'},U:{toast(){}}};w.TopkeyUpgrade9={};w.TopkeyLifecycle={bind:fn=>w.__intervals.push(fn)};
  w.eval(read(source+'upgrade122-hotfix65.js'));for(const fn of w.__intervals)fn();await flush();
  assert.equal(w.document.getElementById('tk65-download-current').style.display,'none');
  state.matches.b.status='CANCELLED';for(const fn of w.__intervals)fn();await flush();
  const r=await w.TopkeyUpgrade122Hotfix65.ensureReport();assert.equal(r.summary.finished,1);assert.equal(r.summary.cancelled,1);assert.equal(r.summary.resolved,2);assert.equal(w.document.getElementById('tk65-download-current').style.display,'inline-flex');
  w.Topkey.Data.tid='qa2';state.config.title='New tournament';for(const fn of w.__intervals)fn();await flush();const next=await w.TopkeyUpgrade122Hotfix65.ensureReport();assert.equal(next.tid,'qa2');assert.equal(next.title,'New tournament');assert.notEqual(next.signature,r.signature);
  pass('auto report after last match, cancelled count and tournament switch: '+source);d.window.close();
 }
}
async function adminTests(){
 const d=dom(read('system-admin.html')),w=d.window,base='topkey_badminton_vnext_2026',data={},writes=[];
 data[base+'/users']={admin:{email:'admin@test',role:'ADMIN'},bob:{email:'bob@test',displayName:'Bob',role:'BTC',sportScope:'football',active:true,permissions:{modules:{finance:'edit'},details:{'finance:export':'view','future:keep':'view'}}},ann:{email:'ann@test',displayName:'Ann',role:'LEADER',active:true,permissions:{modules:{schedule:'view'},details:{'schedule:smart':'none'}}}};
 data[base+'/rolePresets']={LEADER:{name:'Leader',baseRole:'BTC',permissions:{modules:{schedule:'view'}}}};
 for(const [uid,u]of Object.entries(data[base+'/users']))data[base+'/users/'+uid]=u;
 const snap=v=>({val:()=>v?JSON.parse(JSON.stringify(v)):null});let onAuth;
 const auth={currentUser:{uid:'admin'},onAuthStateChanged:fn=>onAuth=fn,signOut:async()=>{}};
 w.firebase={apps:[{}],auth:()=>auth,database:()=>({ref:p=>({once:async()=>snap(data[p]),update:async v=>{writes.push({p,v});data[p]={...data[p],...v};if(p.startsWith(base+'/users/'))data[base+'/users'][p.split('/').at(-1)]=data[p]},set:async v=>{writes.push({p,v});data[p]=v}})})};
 w.HTMLElement.prototype.scrollIntoView=()=>{};w.eval(read('system-admin.js'));await onAuth(auth.currentUser);await flush();
 assert.equal(w.document.querySelectorAll('#editSport option').length,8);
 w.document.querySelector('[data-user="bob"]').click();await flush();
 assert.equal(w.document.getElementById('editDisplayName').value,'Bob');assert.equal(w.document.getElementById('editSport').value,'football');assert.equal(w.document.querySelector('[data-det="finance:export"]').value,'view');
 w.document.getElementById('editSport').value='badminton';w.document.getElementById('saveSelectedAccount').click();await flush();
 assert.equal(data[base+'/users/bob'].sportScope,'badminton');assert.equal(data[base+'/users/bob'].permissions.details['future:keep'],'view');assert(w.document.getElementById('selectedAccountEditor').classList.contains('hidden'));pass('full account load, sport choices, save and close');
 w.document.querySelector('[data-user="ann"]').click();await flush();assert(!w.document.getElementById('editSportWrap').classList.contains('hidden'));assert.equal(w.document.getElementById('editRole').value,'LEADER');
 w.document.getElementById('roleSelect').value='LEADER';w.document.getElementById('roleLoad').click();await flush();const before=writes.length;w.document.getElementById('permSaveUser').click();await flush();assert.equal(writes.length,before);pass('custom BTC role and account/role editors stay separate');
 data[base+'/users/admin'].active=false;await onAuth(auth.currentUser);assert(w.document.getElementById('app').classList.contains('hidden'));pass('disabled admin cannot open management');
 d.window.close();
}
(async()=>{await templateTests();await exportFlowTests();await lifecycleTests();await loaderTests();await adminTests();console.log(JSON.stringify({passed:checks.length,checks},null,2));})().catch(e=>{console.error(e);process.exitCode=1});
