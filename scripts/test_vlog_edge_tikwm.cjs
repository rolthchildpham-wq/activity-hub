/* Standalone, no external deps: node scripts/test_vlog_edge_tikwm.cjs */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','topkey','edge-functions','api','tiktok-stats.js'),'utf8');
const jwtPart=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const uid='test-user';
const token=jwtPart({alg:'RS256'})+'.'+jwtPart({aud:'topkey-badminton',sub:uid})+'.sig';
const video='https://vt.tiktok.com/ZSpqUnyWQ/';
const originalFetch=global.fetch;
async function run(){
 const {default:handler}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const req=(method='POST',bearer=token,url=video)=>new Request('https://topkey.example/api/tiktok-stats',{
  method,headers:{'Content-Type':'application/json',...bearer?{'Authorization':'Bearer '+bearer}:{}},
  ...(method==='POST'?{body:JSON.stringify({url})}:{})
 });
 async function test(t,handlerFetch){global.fetch=handlerFetch;const r=await handler({request:t});return {status:r.status,body:await r.json(),headers:r.headers}}
 let calls=[],profile={role:'ADMIN',active:true},tikwm={code:0,data:{id:'7707908008235355412',play_count:1469,digg_count:155,share_count:13,comment_count:0}};
 const goodFetch=async (url,options)=>{
  calls.push({url:String(url),method:options?.method||'GET'});
  if(String(url).includes('firebaseio.com')||String(url).includes('firebasedatabase.app')){
   assert(String(url).includes('/users/'+uid+'.json?auth='));
   return new Response(JSON.stringify(profile),{status:200,headers:{'Content-Type':'application/json'}});
  }
  if(String(url).includes('tikwm.com/api/')){
   assert(!String(url).includes('Bearer '));
   assert(!options?.headers?.Authorization);
   return new Response(JSON.stringify(tikwm),{status:200,headers:{'Content-Type':'application/json'}});
  }
  throw Error('Unexpected network destination '+url);
 };
 let x=await test(req(),goodFetch);
 assert.equal(x.status,200);assert.deepEqual(x.body.stats,{views:1469,likes:155,shares:13,comments:0});
 assert.equal(x.body.source,'tikwm-unofficial');assert.equal(x.headers.get('Access-Control-Allow-Origin'),null);
 assert.equal(calls.length,2);assert(calls[0].url.includes('auth='));
 // Deny unauthenticated requests without any network activity.
 calls=[];x=await test(req('POST',''),goodFetch);assert.equal(x.status,401);assert.equal(calls.length,0);
 calls=[];x=await test(req('GET'),goodFetch);assert.equal(x.status,405);assert.equal(calls.length,0);
 calls=[];x=await test(req('POST',token,'https://evil.example/'),goodFetch);assert.equal(x.status,422);assert.equal(calls.length,0);
 calls=[];profile={role:'VIEWER',active:true};x=await test(req(),goodFetch);assert.equal(x.status,403);assert.equal(calls.length,1);
 calls=[];profile={role:'BTC',active:false,sportAccess:{vlog:true}};x=await test(req(),goodFetch);assert.equal(x.status,403);
 calls=[];profile={role:'BTC',active:true,sportAccess:{vlog:true}};x=await test(req(),goodFetch);assert.equal(x.status,200);
 // Upstream omits counters: must fail, not zero-out historical metrics.
 calls=[];profile={role:'ADMIN',active:true};tikwm={code:0,data:{id:'7707908008235355412'}};x=await test(req(),goodFetch);assert.equal(x.status,502);
 // Missing shares stays null so caller does not overwrite previous value.
 calls=[];tikwm={code:0,data:{play_count:100,digg_count:22}};x=await test(req(),goodFetch);
 assert.equal(x.status,200);assert.equal(x.body.stats.shares,null);assert.equal(x.body.stats.views,100);
 // Server-side Firebase Rules denial. Must never call TikWM.
 calls=[];x=await test(req(),async url=>{
  calls.push(String(url));return new Response(JSON.stringify({error:'Permission denied'}),{status:401,headers:{'Content-Type':'application/json'}});
 });assert.equal(x.status,401);assert.equal(calls.length,1);
 console.log('PASS Edge JS: TikWM counters, 401/403/405/422, BTC scope, missing stats, no public CORS, no network on invalid input');
}
run().then(()=>{global.fetch=originalFetch},e=>{global.fetch=originalFetch;console.error(e);process.exitCode=1});
