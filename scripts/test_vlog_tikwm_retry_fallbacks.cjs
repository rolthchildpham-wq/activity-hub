/* TOPKEY EdgeOne TikWM retry and three bounded fallback layers. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','topkey/edge-functions/api/tiktok-stats.js'),'utf8');
const jwtPart=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const token=jwtPart({alg:'RS256'})+'.'+jwtPart({aud:'topkey-badminton',sub:'test-user'})+'.sig';
const video='https://www.tiktok.com/@creator/video/7500000000000000123';
const videoId='7500000000000000123';
const originalFetch=global.fetch;
const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json'}});
const embed=({valid=true}={})=>{
 const raw={__DEFAULT_SCOPE__:{'webapp.video-detail':{itemInfo:{itemStruct:{id:valid?videoId:'7500000000000000999',stats:{playCount:998,diggCount:44,shareCount:7,commentCount:1}}}}}};
 return new Response('<html><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">'+JSON.stringify(raw)+'</script></html>',{status:200,headers:{'Content-Type':'text/html'}});
};
(async()=>{
 const {default:handler}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const send=()=>handler({request:new Request('https://topkey.example/api/tiktok-stats',{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({url:video})})});
 const scenario=async upstream=>{
  const destinations=[];global.fetch=async (url,opts)=>{
   url=String(url);destinations.push(url);
   if(url.includes('firebasedatabase.app'))return json({role:'ADMIN',active:true});
   return upstream(url,opts);
  };
  const response=await send();return {status:response.status,body:await response.json(),destinations};
 };
 let calls=0;
 let r=await scenario(url=>{
  if(url.includes('tikwm.com')){calls++;return calls===1?json({code:-1},429):json({code:0,data:{play_count:900,digg_count:50,share_count:8}})}
  throw Error('should not use fallback on successful retry');
 });
 assert.equal(calls,2);assert.equal(r.status,200);assert.equal(r.body.stats.views,900);assert.equal(r.body.source,'tikwm-unofficial');
 calls=0;
 r=await scenario(url=>{
  if(url.includes('tikwm.com')){calls++;return json({code:-1},429)}
  if(url.includes('/@creator/video/'))return embed();
  throw Error('unexpected '+url);
 });
 assert.equal(calls,2);assert.equal(r.body.stats.views,998);assert.equal(r.body.source,'tiktok-page');
 let count=0;
 r=await scenario(url=>{
  if(url.includes('tikwm.com'))return json({code:1});
  if(url.includes('/@creator/video/'))return new Response('<html>blocked</html>',{status:200,headers:{'Content-Type':'text/html'}});
  if(url.includes('/embed/v2/')){count++;return embed()}
  throw Error('unexpected '+url);
 });
 assert.equal(count,1);assert.equal(r.body.source,'tiktok-embed');assert.equal(r.body.stats.views,998);
 r=await scenario(url=>{
  if(url.includes('tikwm.com'))return json({code:1});
  if(url.includes('/@creator/video/'))return new Response('<html>blocked</html>',{status:200,headers:{'Content-Type':'text/html'}});
  if(url.includes('/embed/v2/'))return embed({valid:false});
  throw Error('unexpected '+url);
 });
 assert.equal(r.status,502);assert.equal(r.body.code,'VIDEO_UNAVAILABLE');
 assert(!r.destinations.some(u=>u.includes('evil.example')));
 global.fetch=async()=>{throw Error('never fetched')};
 let response=await handler({request:new Request('https://topkey.example/api/tiktok-stats',{method:'GET'})});
 assert.equal(response.status,405);assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
 console.log('PASS Edge retry: 429->success, 429->desktop, TikTok embed fallback, mismatched video ID blocked, 502 unavailable, private POST only');
})().then(()=>{global.fetch=originalFetch},e=>{global.fetch=originalFetch;console.error(e);process.exitCode=1});
