const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'../reset-u93.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);assert(scripts.length,'reset script missing');
const unreg=[],deleted=[];let replaced='';const status={textContent:''},go={href:''};
const regs=[
 {scope:'https://topkey.example/',unregister:async()=>{unreg.push('root');return true}},
 {scope:'https://topkey.example/sports/badminton/',unregister:async()=>{unreg.push('badminton');return true}},
 {scope:'https://other.example/',unregister:async()=>{unreg.push('other');return true}}
];
const caches={async keys(){return ['topkey-vnext-old','topkey-sports-hub-old','topkey-piper-runtime-ort122-phonemize100','topkey-natural-crowd-public-domain-v1','unrelated']},async delete(k){deleted.push(k);return true}};
const location={origin:'https://topkey.example',href:'https://topkey.example/sports/badminton/reset-u93.html',replace:u=>{replaced=String(u)}};
const sessionStorage={removeItem(){}};
const document={getElementById:id=>id==='s'?status:go};
const ctx={window:{caches},document,navigator:{serviceWorker:{getRegistrations:async()=>regs}},caches,sessionStorage,location,URL,Date,Promise,console,setTimeout:(fn)=>{Promise.resolve().then(fn);return 1}};ctx.window.location=location;
vm.runInNewContext(scripts.join('\n'),ctx,{filename:'reset-u93-inline.js'});
setTimeout(()=>{
 try{
  assert.deepStrictEqual(unreg.sort(),['badminton','root'],'reset must unregister root + badminton same-origin SW only');
  assert(deleted.includes('topkey-vnext-old')&&deleted.includes('topkey-sports-hub-old'),'TOPKEY shell caches must be deleted');
  assert(!deleted.includes('topkey-piper-runtime-ort122-phonemize100')&&!deleted.includes('topkey-natural-crowd-public-domain-v1'),'runtime audio caches must be preserved');
  assert(replaced.includes('__topkey_build=u93-20261030')&&replaced.includes('#spectator'),'reset must auto-redirect to Upgrade93 spectator');
  assert(go.href.includes('#spectator'),'manual fallback must target spectator');
  console.log('upgrade93_reset_vm: PASS · root+badminton SW cleared + redirect #spectator');
 }catch(e){console.error(e);process.exitCode=1}
},30);
