"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const html=fs.readFileSync("topkey/sports/vnext/index.html","utf8");
const publicJs=fs.readFileSync("topkey/sports/vnext/src/public-viewer-h137.js","utf8");
const styles=fs.readFileSync("topkey/sports/vnext/public-viewer-h137.css","utf8");
assert.ok(html.includes('window.__TOPKEY_PUBLIC_ROUTE==="spectator"'));
assert.ok(html.includes('src/public-viewer-h137.js?v=h174-20261121'));
assert.ok(html.includes('public-viewer-h137.css?v=h173-20261121'));
assert.ok(publicJs.includes('{auth:false}'));
assert.ok(!publicJs.includes("queueSet("));
assert.ok(!publicJs.includes("ref.set("));
assert.ok(!publicJs.includes("ref.update("));
assert.ok(styles.includes("@media(max-width:760px)"));
new vm.Script(publicJs);
function element(){return {classList:{add(){},remove(){},toggle(){}},textContent:"",children:[],replaceChildren(){this.children=[]},appendChild(x){this.children.push(x)},append(...xs){this.children.push(...xs)},remove(){},after(){},querySelector(){return null},closest(){return null},setAttribute(){}}}
const nodes={"public-spectator":element(),"spectator-schedule":element(),"spectator-live":element(),"spectator-title":element(),"login-screen":element(),"app-shell":element()};
nodes["public-spectator"].querySelector=()=>({after(){}});
const callbacks={};
const dataset={
 matches:{m1:{id:"m1",code:"M001",teamAId:"a",teamBId:"b",status:"SCHEDULED",date:"2026-11-21",time:"17:15"}},
 teams:{a:{name:"Đội A"},b:{name:"Đội B"}},courts:{},activeMatches:{}
};
const ref={child:key=>({on:(ev,success)=>{callbacks[key]=success;success({val:()=>dataset[key]})}})};
const document={getElementById:id=>nodes[id],documentElement:{classList:{add(){}}},createElement:()=>element()};
const ctx={document,window:{TopkeyPlatform:{loadFirebase:()=>Promise.resolve()},Topkey:{FIREBASE_CONFIG:{apiKey:"test"}},firebase:{database:()=>({ref:()=>ref})},requestAnimationFrame:cb=>cb()},location:{search:"?sport=volleyball&tid=main_2026"},URLSearchParams,setTimeout:()=>0,console};
(async()=>{
 vm.runInNewContext(publicJs,ctx,{timeout:1000});
 await new Promise(setImmediate);
 assert.ok(nodes["spectator-schedule"].children.length>0,"public schedule must display one match");
 assert.match(nodes["spectator-schedule"].children[0].children[0].textContent,/Đội A vs Đội B/);
 assert.equal(nodes["login-screen"].classList?true:false,true);
 assert.equal(Object.keys(callbacks).length,4,"all public branches attached");
 console.log("H137 public mobile spectator integration mock PASS");
})().catch(e=>{console.error(e);process.exitCode=1});
