'use strict';
/* Current same-origin EdgeOne reader: auth token, partial counts and URL invalidation. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.join(__dirname,'../sports/diy-vlog');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const source=fs.readFileSync(path.join(dir,'tiktok-automation.js'),'utf8');
for(const id of ['tiktok-read-link','tiktok-sync-status'])
 assert.match(html,new RegExp('id="'+id+'"'),'Missing '+id);
assert.match(source,/\/api\/tiktok-stats/);
assert.match(html,/obj\.statsSource=metricMeta\.source/);
assert.match(html,/obj\.statsFetchedAt=metricMeta\.fetchedAt/);
function element(id){return {id,value:id==='entry-url'?'https://www.tiktok.com/@topkey/video/1234567890123456789':id==='entry-shares'?'77':'',style:{},textContent:'',hidden:false,disabled:false,listeners:{},addEventListener(type,fn){this.listeners[type]=fn}}}
const ids=['tiktok-sync-all-links','tiktok-sync-status','tiktok-connect','tiktok-sync-now','tiktok-read-link','entry-url','entry-views','entry-likes','entry-shares'];
const els=Object.fromEntries(ids.map(id=>[id,element(id)]));
const user={uid:'test-btc',getIdToken:async()=> 'mock-id-token'};
const window={__topkeyTikTokStatsMeta:null,firebase:{auth:()=>({currentUser:user})}};
let fetchCalls=0;
const context={window,document:{getElementById:id=>els[id]||null},URL,AbortController,setTimeout,clearTimeout,Intl,Date,Number,JSON,Error,String,
 fetch:async(url,options)=>{fetchCalls++;assert.equal(url,'/api/tiktok-stats');assert.equal(options.headers.Authorization,'Bearer mock-id-token');assert.equal(JSON.parse(options.body).url,els['entry-url'].value);
 return {ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>({ok:true,stats:{views:1200,likes:155,shares:null},source:'tikwm-unofficial',fetchedAt:'2026-11-16T00:00:00.000Z'})};}};
vm.runInNewContext(source,context);
(async()=>{
 await els['tiktok-read-link'].listeners.click();
 assert.equal(fetchCalls,1);
 assert.equal(els['entry-views'].value,'1200');
 assert.equal(els['entry-likes'].value,'155');
 assert.equal(els['entry-shares'].value,'77','Missing metric cannot erase existing value');
 assert.equal(window.__topkeyTikTokStatsMeta.source,'tikwm-unofficial');
 els['entry-url'].value='https://www.tiktok.com/@topkey/video/9876543210987654321';
 els['entry-url'].listeners.input();
 assert.equal(window.__topkeyTikTokStatsMeta,null,'URL changes invalidate old metadata');
 console.log('PASS Vlog same-origin EdgeOne reader: auth, partial metrics and invalidation');
})().catch(e=>{console.error(e);process.exitCode=1});
