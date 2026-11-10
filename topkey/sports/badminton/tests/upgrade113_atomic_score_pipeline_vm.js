const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const root=path.resolve(__dirname,'..'),src=fs.readFileSync(path.join(root,'src/upgrade113.js'),'utf8');
let calls=[];const state={activeMatches:{court_1:{version:1}}};
const Data={queueMulti:(updates,meta)=>{calls.push({updates,meta});return Promise.resolve({updates,meta})}};
const app={state,renderHealth(){}};
const sandbox={window:{Topkey:{App:app,Data},TopkeyUpgrade105:{state:{}}},document:{getElementById(){return null},documentElement:{dataset:{}}},performance:{now:()=>1},Promise,setTimeout:(f)=>f(),addEventListener(){}};
sandbox.window.window=sandbox.window;sandbox.window.document=sandbox.document;sandbox.window.performance=sandbox.performance;sandbox.window.addEventListener=()=>{};
vm.createContext(sandbox);vm.runInContext(src,sandbox);
(async()=>{
 const active='topkey_badminton_vnext_2026/tournaments/main_2026/activeMatches/court_1',event='topkey_badminton_vnext_2026/tournaments/main_2026/events/court_1/e1',comment='topkey_badminton_vnext_2026/tournaments/main_2026/commentary/court_1/latest';
 const p=Data.queueMulti({[active]:{version:2},[event]:{id:'e1',type:'POINT_AWARDED'}},{type:'SCORE',eventId:'e1'});
 const cp=Data.queueMulti({[comment]:{id:'c1',text:'Điểm mới',kind:'SCORE'}},{type:'COMMENTARY_LOCAL_U48_RT'});
 await Promise.all([p,cp]);assert.strictEqual(calls.length,1);assert(calls[0].updates[active]);assert(calls[0].updates[event]);assert(calls[0].updates[comment]);assert.strictEqual(calls[0].meta.atomicCommentary,true);
 calls=[];await Data.queueMulti({[active]:{version:3},[event]:{id:'e2',type:'POINT_CORRECTED'}},{type:'SCORE',eventId:'e2'});assert.strictEqual(calls.length,1);assert(!calls[0].updates[comment]);
 calls=[];await Data.queueMulti({[comment]:{id:'c2',text:'Ngoài score'}},{type:'COMMENTARY'});assert.strictEqual(calls.length,1);
 console.log('upgrade113 atomic score pipeline VM: PASS');
})().catch(e=>{console.error(e);process.exit(1)});