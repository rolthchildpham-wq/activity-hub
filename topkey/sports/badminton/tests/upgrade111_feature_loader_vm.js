const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),src=fs.readFileSync(path.join(root,'src/upgrade111.js'),'utf8');
const requested=[];const scripts=[];const styleSheets=[];
const windowMock={};
const elements={};
const head={appendChild(el){
  if(el.tagName==='LINK'){requested.push(el.href);styleSheets.push({href:new URL(el.href,'https://example.test/sports/badminton/').href});queueMicrotask(()=>el.onload?.());return}
  requested.push(el.src);scripts.push(el);
  if(el.src.includes('firebase-storage-compat.js'))firebase.storage=()=>({ref(){return{put:async()=>({ref:{getDownloadURL:async()=>''}})}}});
  if(el.src.includes('qrcode.min.js'))windowMock.QRCode=function(){};
  if(el.src.includes('jszip.min.js'))windowMock.JSZip=function(){};
  if(el.src.includes('feature-replay.')){windowMock.TopkeyUpgrade77={installed:true};windowMock.TopkeyUpgrade84={ensureLayout(){}};windowMock.TopkeyUpgrade86={ensureLayout(){}}}
  queueMicrotask(()=>el.onload?.());
}};
const documentMock={
  head,scripts,styleSheets,
  createElement(tag){return {tagName:String(tag).toUpperCase(),src:'',href:'',rel:'',dataset:{},async:false,crossOrigin:'',onload:null,onerror:null}},
  querySelector(){return null},getElementById(id){return elements[id]||null},documentElement:{dataset:{}}
};
const App={currentTab:'overview',showTab(tab){this.currentTab=tab;return tab},renderHealth(){},exportFinanceZip:async()=>true};
const Data={storage:null,uploadReceipt:async()=>true};
const U9={saveAppearance:async()=>true,removeBackground:async()=>true,renderRegistrationQR(){}};
const Topkey={App,Data,U:{toast(){}},VERSION:'',CONFIG_VERSION:'',RUNTIME_BUILD:''};
windowMock.Topkey=Topkey;windowMock.TopkeyUpgrade9=U9;windowMock.JSZip=undefined;windowMock.QRCode=undefined;
const firebase={};
const ctx={window:windowMock,document:documentMock,location:{href:'https://example.test/sports/badminton/'},firebase,URL,Promise,Map,setTimeout:(fn)=>{queueMicrotask(fn);return 1},clearTimeout(){},queueMicrotask,console};
windowMock.window=windowMock;vm.createContext(ctx);vm.runInContext(src,ctx);
(async()=>{
  await new Promise(r=>setTimeout(r,0));assert.strictEqual(requested.length,0,'feature SDK/chunk must be idle after admin core boot');
  App.showTab('live');await new Promise(r=>setTimeout(r,5));assert.strictEqual(requested.filter(x=>x.includes('feature-replay.')).length,2,'Live should load replay JS+CSS once');
  App.showTab('live');await new Promise(r=>setTimeout(r,5));assert.strictEqual(requested.filter(x=>x.includes('feature-replay.')).length,2,'Replay must not reload');
  App.showTab('finance');await new Promise(r=>setTimeout(r,5));assert.strictEqual(requested.filter(x=>x.includes('firebase-storage-compat.js')).length,1,'Finance should lazy-load Storage once');
  App.showTab('settings');await new Promise(r=>setTimeout(r,5));assert.strictEqual(requested.filter(x=>x.includes('firebase-storage-compat.js')).length,1,'Storage must not reload');
  App.showTab('teams');await new Promise(r=>setTimeout(r,5));assert.strictEqual(requested.filter(x=>x.includes('qrcode.min.js')).length,1,'Teams should lazy-load QR once');
  App.showTab('teams');await new Promise(r=>setTimeout(r,5));assert.strictEqual(requested.filter(x=>x.includes('qrcode.min.js')).length,1,'QR must not reload');
  console.log('upgrade111 feature loader VM PASS',requested);
})().catch(e=>{console.error(e);process.exit(1)});
