const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const m=html.match(/<script>(\(\(\)=>\{const pub=window\.__TOPKEY_IS_SPECTATOR[\s\S]*?\}\)\(\);)<\/script>/);const am=html.match(/window\.__TOPKEY_ASSETS=(\{[^;]+\});/);assert(am,'asset manifest missing');const assets=Function('return '+am[1])();
assert(m,'U109 route loader script not found');
async function run(pub){
  const requested=[];
  const body={appendChild(s){requested.push(s.src);queueMicrotask(()=>s.onload&&s.onload())}};
  const document={body,createElement(){return {src:'',onload:null,onerror:null}} ,getElementById(){return null}};
  const ctx={window:{__TOPKEY_IS_SPECTATOR:pub,__TOPKEY_ASSETS:assets},document,console,Error,Promise,queueMicrotask};
  vm.createContext(ctx);vm.runInContext(m[1],ctx);await new Promise(r=>setTimeout(r,10));return requested;
}
(async()=>{
 const viewer=await run(true),admin=await run(false);
 for(const x of ['firebase-app-compat.js','firebase-auth-compat.js','firebase-database-compat.js'])assert(viewer.some(u=>u.includes(x)),`viewer missing ${x}`);
 assert(viewer.some(u=>/assets\/u\d+\/viewer\.[a-f0-9]{12}\.js/.test(u)),'viewer bundle missing');
 for(const x of ['firebase-storage-compat.js','qrcode.min.js','upgrade73-preboot','/admin.'])assert(!viewer.some(u=>u.includes(x)),`viewer leaked ${x}`);
 assert(!admin.some(u=>u.includes('firebase-storage-compat.js')),'U111 admin boot must lazy Storage');
 assert(!admin.some(u=>u.includes('qrcode.min.js')),'U111 admin boot must lazy QR');
 assert(admin.some(u=>u.includes('upgrade73-preboot')),'admin preboot missing');
 assert(admin.some(u=>/assets\/u\d+\/admin(?:-core)?\.[a-f0-9]{12}\.js/.test(u)),'admin bundle missing');
 assert(!admin.some(u=>/assets\/u\d+\/viewer\./.test(u)),'admin should not request viewer bundle');
 console.log('upgrade109 route boot VM PASS',{viewer,admin});
})().catch(e=>{console.error(e);process.exit(1)});
