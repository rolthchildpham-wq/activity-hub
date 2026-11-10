'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
async function check(file,prefix,other){
 const listeners={},deleted=[],names=['topkey-h105-r1-sports-badminton-shell','topkey-h106-r1-sports-badminton-shell','topkey-h108-r1-sports-vnext-shell','topkey-h107-hub-shell','topkey-h108-hub-shell','topkey-h109-'+prefix+'-shell','unrelated-cache'];
 const caches={keys:async()=>names,delete:async x=>(deleted.push(x),true),open:async()=>({add:async()=>{},match:async()=>null,put:async()=>{}})};
 const self={location:{origin:'https://example.invalid'},clients:{claim:async()=>true},skipWaiting:()=>{throw new Error('SW auto skipWaiting not allowed')},addEventListener:(name,fn)=>listeners[name]=fn};
 const context={self,caches,URL,Promise,Response,fetch:async()=>({ok:true,clone(){return this}})};vm.createContext(context);vm.runInContext(read(file),context);
 let pending;listeners.activate({waitUntil:p=>pending=p});await pending;
 assert(!deleted.includes('unrelated-cache'),'must not delete unrelated caches');
 assert(!deleted.includes('topkey-h114-'+prefix+'-shell'),'must preserve own current cache');
 assert(deleted.some(x=>x.startsWith('topkey-h10')&&(prefix==='hub'?x.includes('hub-shell'):x.includes('sports-'+prefix+'-'))),'must clear old same-app caches');
 assert(deleted.every(x=> (prefix==='hub'?x.includes('hub-shell'):(x.includes('sports-'+prefix+'-')||x.includes(prefix+'-shell')))|| (prefix==='hub'&&x==='topkey-h98-sw.js')),'cannot delete another app scope');
 listeners.install({waitUntil:p=>pending=p});await pending;
 return {file,deleted,install:'non-disruptive'};
}
(async()=>{const results=[];for(const [file,scope] of [['sw.js','hub'],['sports/badminton/sw.js','badminton'],['sports/vnext/sw.js','vnext']])results.push(await check(file,scope));console.log('PASS H114 service worker 3 scopes cache deletion without cross-scope disruption',JSON.stringify(results));fs.writeFileSync(path.join(root,'H114_SW_TEST_RESULTS.json'),JSON.stringify({pass:true,results},null,2));})().catch(e=>{console.error(e);process.exit(1)});
