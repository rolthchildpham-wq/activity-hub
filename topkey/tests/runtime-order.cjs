const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../sports/vnext/production-loader.js'),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,30));
(async()=>{
 for(const order of ['auth-first','core-first']){
  const dom=new JSDOM('<body></body>',{url:'https://test.invalid/sports/badminton/',runScripts:'outside-only'}),w=dom.window,loaded=[];
  let clock=100000;w.Date.now=()=>clock;
  Object.defineProperty(w.document,'hidden',{configurable:true,value:false});
  w.requestIdleCallback=fn=>w.setTimeout(fn,0);
  const append=w.document.head.appendChild.bind(w.document.head);
  w.document.head.appendChild=node=>{const out=append(node);if(node.tagName==='SCRIPT'){loaded.push(node.dataset.topkeySrc);queueMicrotask(()=>node.onload?.())}return out};
  w.eval(source);clock+=5000;
  const send=which=>{w[which==='auth'?'__TOPKEY_ADMIN_READY':'__TOPKEY_CORE_READY']=true;w.dispatchEvent(new w.Event(which==='auth'?'topkey:admin-ready':'topkey:core-ready'))};
  send(order==='auth-first'?'auth':'core');await tick();assert.equal(loaded.length,0,'runtime must wait for both core and verified auth');
  send(order==='auth-first'?'core':'auth');await tick();await w.TopkeyProductionLoader.loadRuntime();
  assert.equal(loaded.length,w.TopkeyProductionLoader.runtimeSources.length);
  assert.equal(new Set(loaded).size,loaded.length,'modules installed once');
  send('auth');send('core');await tick();assert.equal(loaded.length,w.TopkeyProductionLoader.runtimeSources.length);
  dom.window.close();console.log('PASS runtime initialization',order);
 }
})().catch(e=>{console.error(e);process.exitCode=1});
