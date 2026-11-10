const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8');
function el(){const s=new Set(['hidden']);return {classList:{add:x=>s.add(x),remove:x=>s.delete(x),contains:x=>s.has(x),toggle(){}},_classes:s};}
const els={'login-screen':el(),'app-shell':el(),'public-spectator':el()};
const htmlClasses=new Set();let domCb=null,started=0,bound=0,sw=0,dataInit=0,authInit=0;
const never=new Promise(()=>{});
const Topkey={DEFAULT_RULES:{},ROLES:{VIEWER:[]},U:{debounce:f=>f},Data:{async init(){dataInit++;},listen(){return()=>{}},ready:false},Auth:{init(){authInit++;return never;}}};
const document={
  readyState:'loading',
  documentElement:{classList:{add:x=>htmlClasses.add(x),remove:x=>htmlClasses.delete(x)}},
  getElementById:id=>els[id]||(els[id]=el()),
  querySelectorAll:()=>[],querySelector:()=>el(),createElement:()=>el(),
  addEventListener(){}
};
const window={Topkey,addEventListener:(ev,cb)=>{if(ev==='DOMContentLoaded')domCb=cb;}};
const ctx={window,document,location:{hash:'#spectator',protocol:'https:'},navigator:{},console,setTimeout,clearTimeout,Promise,URL,URLSearchParams,localStorage:{getItem(){return null},setItem(){}},speechSynthesis:undefined,Blob:function(){},FileReader:function(){}};
vm.runInNewContext(code,ctx,{filename:'app.js'});
Topkey.App.bindStatic=()=>{bound++};Topkey.App.registerSW=()=>{sw++};Topkey.App.startSpectator=()=>{started++};
(async()=>{
  const resolved=await Promise.race([Topkey.App.init().then(()=>true),new Promise(r=>setTimeout(()=>r(false),100))]);
  assert.strictEqual(resolved,true,'public App.init must resolve even when Auth.init never resolves');
  assert.strictEqual(dataInit,1);assert.strictEqual(authInit,1);assert.strictEqual(bound,1);assert.strictEqual(sw,1);assert.strictEqual(started,1);
  assert(htmlClasses.has('tk-public-spectator-boot'),'spectator html class missing');
  assert(els['login-screen']._classes.has('hidden'),'login must stay hidden');
  assert(!els['public-spectator']._classes.has('hidden'),'public spectator must be visible');
  console.log('upgrade93_public_bootstrap_vm: PASS · Auth stalled but Viewer surface/init resolves');
})().catch(e=>{console.error(e);process.exitCode=1});
