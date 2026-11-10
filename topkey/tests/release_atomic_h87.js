const fs=require('fs'),vm=require('vm'),assert=require('assert');
const SRC=fs.readFileSync('release-coordinator.js','utf8');
const BUILD='u122h87-20261107',VERSION='2026.11.07-vnext-upgrade122-hotfix87-schedule-group-parity';
function classList(){const s=new Set(['hidden']);return{add:x=>s.add(x),remove:x=>s.delete(x),contains:x=>s.has(x)}}
function link(href){return{href,_attrs:{href},dataset:{},style:{},title:'',setAttribute(k,v){this._attrs[k]=v},getAttribute(k){return this._attrs[k]||''},removeAttribute(k){delete this._attrs[k]}}}
function run({vn=BUILD,bad=BUILD,root=BUILD}){
  const links=[link('./sports/badminton/index.html'),link('./sports/vnext/index.html?sport=football'),link('./sports/vnext/index.html?sport=volleyball')];
  const panel={id:'topkey-release-health',className:'panel hidden',style:{},classList:classList(),innerHTML:'',scrollIntoView(){}};
  const main={prepend(){}};
  const document={body:{prepend(){}},getElementById(id){return id==='topkey-release-health'?panel:id==='testlab-sport'?{value:'badminton'}:null},querySelector(sel){return sel==='main.wrap'?main:null},querySelectorAll(sel){return sel==='a.sport'?links:[]},createElement(){return panel},addEventListener(){}};
  const stateMap={
    './release.json':{cacheTag:root,version:root===BUILD?VERSION:'old-root'},
    './sports/badminton/build.json':{cacheTag:bad,version:bad===BUILD?VERSION:'old-bad'},
    './sports/vnext/build.json':{cacheTag:vn,version:vn===BUILD?VERSION:'old-vn'},
  };
  const fetch=async input=>{const u=String(input);const key=Object.keys(stateMap).find(k=>u.includes(k.replace('./','/'))||u.includes(k));return{ok:true,async json(){return stateMap[key]}}};
  const location={href:'https://example.test/index.html',search:'',pathname:'/index.html'};
  const ctx={console,URL,URLSearchParams,Date,Math,Promise,setTimeout:(f)=>{f();return 1},clearTimeout(){},fetch,document,location,window:null};ctx.window=ctx;ctx.window.addEventListener=()=>{};vm.createContext(ctx);vm.runInContext(SRC,ctx);return ctx.TopkeyReleaseHealth.ready.then(()=>({ctx,links,panel}));
}
(async()=>{
 let r=await run({});assert.equal(r.ctx.TopkeyReleaseHealth.state.status,'OK');assert(r.links.every(x=>x.dataset.releaseBlocked==='0'));console.log('PASS atomic all branches H87');
 r=await run({vn:'u122h84-20261107'});assert.equal(r.ctx.TopkeyReleaseHealth.state.status,'MISMATCH');assert.equal(r.links[0].dataset.releaseBlocked,'0');assert.equal(r.links[1].dataset.releaseBlocked,'1');assert.equal(r.links[2].dataset.releaseBlocked,'1');assert(/VNext/.test(r.panel.innerHTML));console.log('PASS VNext mismatch blocks only VNext');
 r=await run({bad:'u122h83-20261107'});assert.equal(r.links[0].dataset.releaseBlocked,'1');assert.equal(r.links[1].dataset.releaseBlocked,'0');assert(/Cầu lông/.test(r.panel.innerHTML));console.log('PASS Badminton mismatch blocks only Badminton');
 r=await run({root:'u122h83-20261107'});assert(r.links.every(x=>x.dataset.releaseBlocked==='1'));console.log('PASS root mismatch blocks all sports');
 console.log('RELEASE_ATOMIC_H87_OK 4');
})().catch(e=>{console.error(e);process.exit(1)});
