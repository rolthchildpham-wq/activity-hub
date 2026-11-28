const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const js=fs.readFileSync('topkey/sports/badminton/upgrade122-hotfix5.js','utf8');
const loader=fs.readFileSync('topkey/sports/vnext/production-loader.js','utf8');
const legacy=fs.readFileSync('topkey/sports/badminton/index.html','utf8');
const html=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
assert.ok(!js.includes('location.replace('),'obsolete H47 self-heal MUST NOT force page reload');
assert.ok(js.includes('window.TopkeyRelease?.cacheTag'),'legacy code should honor current release');
assert.ok(loader.includes('../badminton/upgrade122-hotfix5.js?v=h128-no-auto-reload-20261113'),'shared feature loader must preserve the no-auto-reload safety module');
assert.ok(html.includes('./production-loader.js?v=h218-sports-redesign-20261124'),'shared VNext entry must load exactly one shared production loader');
assert.ok(legacy.includes("new URL('../vnext/index.html', location.href)"),'legacy route must redirect to shared VNext');
let redirects=0,swCalls=0,cacheDeletes=0,fetches=0;
const context={
 window:{TopkeyRelease:{version:'2026-h128',cacheTag:'h128'},addEventListener:()=>{}},
 document:{readyState:'complete',documentElement:{dataset:{}},getElementById:()=>null},
 location:{href:'https://site.test/sports/badminton/index.html',protocol:'https:',replace:()=>{redirects++}},
 navigator:{serviceWorker:{getRegistrations:async()=>{swCalls++;return[]}}},
 caches:{keys:async()=>[],delete:async()=>{cacheDeletes++;}},
 sessionStorage:{getItem:()=>null,setItem:()=>{}},
 fetch:async()=>{fetches++;return{ok:true,json:async()=>({version:'newer-release',cacheTag:'newer-release'})}},
 URL,Date,Promise,console,
 setTimeout:()=>1,clearTimeout:()=>{},CustomEvent:class{},performance:{now:()=>0}
};
vm.runInNewContext(js,context);
(async()=>{
 await context.window.TopkeyUpgrade122Hotfix5.healIfNeeded();
 assert.equal(fetches,1,'status may check server once');
 assert.equal(redirects,0,'no unexpected page navigation during tab usage');
 assert.equal(swCalls,0,'should not churn service workers on background version mismatch');
 assert.equal(cacheDeletes,0,'should not clear caches while user works');
 console.log('H128 background version mismatch cannot reload badminton or show Firebase splash.');
})().catch(error=>{console.error(error);process.exitCode=1});
