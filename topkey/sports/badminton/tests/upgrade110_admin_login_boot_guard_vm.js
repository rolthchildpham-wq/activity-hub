const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');

function bus(){const m={};return {add(n,f){(m[n]??=[]).push(f)},emit(n,e={}){for(const f of m[n]||[])f(e)},count(n){return (m[n]||[]).length}}}

// 1) Early guard: scrub credentials + prevent native GET before Admin READY.
const gm=html.match(/<script>(\(\(\)=>\{try\{const u=new URL\(location\.href\)[\s\S]*?\}\)\(\);)<\/script>/);
assert(gm,'U110 early admin guard not found');
const wb=bus(),db=bus();let replaced='',requestSubmit=0;
const button={disabled:false,textContent:'Đăng nhập an toàn',dataset:{}};
const form={id:'login-form',querySelector(){return button},requestSubmit(){requestSubmit++}};
const document={addEventListener:(n,f)=>db.add(n,f),getElementById:id=>id==='login-form'?form:null};
const windowObj={__TOPKEY_ADMIN_READY:undefined,__TOPKEY_PENDING_LOGIN:undefined,addEventListener:(n,f)=>wb.add(n,f)};
const location={href:'https://example.test/sports/badminton/index.html?email=user%40example.test&password=secret123&__topkey_build=u110#x',pathname:'/sports/badminton/index.html',search:'?email=user%40example.test&password=secret123&__topkey_build=u110',hash:'#x'};
const history={state:null,replaceState(_s,_t,u){replaced=u}};
const ctx={window:windowObj,document,location,history,URL,queueMicrotask,console};vm.createContext(ctx);vm.runInContext(gm[1],ctx);
assert(replaced&&!replaced.includes('email=')&&!replaced.includes('password='),'credential query params not scrubbed');
assert(replaced.includes('__topkey_build=u110'),'non-credential query param should survive');
let prevented=0,stopped=0;db.emit('submit',{target:form,preventDefault(){prevented++},stopImmediatePropagation(){stopped++}});
assert.strictEqual(prevented,1,'pre-ready login must prevent native submit');assert.strictEqual(stopped,1,'pre-ready login must stop native handler chain');assert.strictEqual(windowObj.__TOPKEY_PENDING_LOGIN,true);assert.strictEqual(button.disabled,true);
wb.emit('topkey:admin-ready');
setImmediate(()=>{});
assert.strictEqual(windowObj.__TOPKEY_ADMIN_READY,true);assert.strictEqual(button.disabled,false);assert.strictEqual(requestSubmit,0,'requestSubmit is queued as microtask');

// 2) readyState-safe Admin boot: if DOMContentLoaded already fired, boot must still run exactly once.
const bm=app.match(/async function bootTopkeyAdmin\(\)[\s\S]*?if\(document\.readyState==='loading'\)[\s\S]*?else Promise\.resolve\(\)\.then\(\(\)=>bootTopkeyAdmin\(\)\.catch\(\(\)=>\{\}\)\);/);
assert(bm,'readyState-safe boot block missing');
async function testReadyState(state){
 let init=0,reg=0,ready=0,domcb=null;
 const App={async init(){init++},renderRegistrationPublic(){reg++}};
 const document={readyState:state,getElementById(){return null}};
 const w={__TOPKEY_ADMIN_READY:false,dispatchEvent(e){if(e.type==='topkey:admin-ready')ready++},addEventListener(n,f){if(n==='DOMContentLoaded')domcb=f}};
 const c={App,document,window:w,queueMicrotask,CustomEvent:class{constructor(type,o){this.type=type;this.detail=o?.detail}},console};vm.createContext(c);vm.runInContext(bm[0],c);
 if(state==='loading'){assert.strictEqual(init,0);assert(domcb,'DOMContentLoaded handler missing');await domcb()}
 await new Promise(r=>setTimeout(r,0));
 assert.strictEqual(init,1,`App.init count ${state}`);assert.strictEqual(reg,1);assert.strictEqual(ready,1);assert.strictEqual(w.__TOPKEY_ADMIN_READY,true);
 await w.TopkeyBootAdmin?.();
 assert.strictEqual(init,1,'boot must be idempotent');
}

(async()=>{
 await new Promise(r=>setTimeout(r,0));assert.strictEqual(requestSubmit,1,'pending login must replay once after admin-ready');
 await testReadyState('complete');await testReadyState('loading');
 console.log('upgrade110 admin login boot guard VM PASS');
})().catch(e=>{console.error(e);process.exit(1)});
