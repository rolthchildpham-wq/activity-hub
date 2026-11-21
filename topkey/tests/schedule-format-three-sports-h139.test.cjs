'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const src=fs.readFileSync('topkey/sports/schedule-format-h139.js','utf8');
const football=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
const badminton=fs.readFileSync('topkey/sports/badminton/index.html','utf8');
const sandbox={window:{addEventListener(){}},setInterval:()=>0,clearInterval(){},console};
vm.runInNewContext(src,sandbox,{timeout:1000});
const pairs=sandbox.window.__TOPKEY_SCHEDULE_FORMAT_PLAN_PAIRS;
const teams=Array.from({length:6},(_,i)=>({id:'T'+i,name:'Team '+i}));
test('6 teams round robin => exactly 15 unique pairs',()=>{
 const result=pairs(teams,teams.map(t=>({id:t.id,group:'ALL'})),false);
 assert.equal(result.length,15);
 assert.equal(new Set(result.map(p=>[p.a.id,p.b.id].sort().join('|'))).size,15);
});
test('6 teams in two groups of 3 => exactly 6 internal group matches',()=>{
 const entries=teams.map((t,i)=>({id:t.id,group:i%2?'B':'A'}));
 const result=pairs(teams,entries,true);
 assert.equal(result.length,6);
 for(const p of result)assert.equal(entries.find(e=>e.id===p.a.id).group,entries.find(e=>e.id===p.b.id).group);
});
test('no cross-group matches, uneven groups create correct 3 + 1 pairs',()=>{
 const result=pairs(teams.slice(0,5),teams.slice(0,5).map((t,i)=>({id:t.id,group:i<3?'A':'B'})),true);
 assert.equal(result.length,4);
});
test('both badminton and VNext/football/volleyball pages install shared planner',()=>{
 for(const html of [football,badminton])assert.match(html,/schedule-format-h139\.js/);
 assert.match(src,/new Set\(\['football', 'volleyball', 'badminton'\]\)/);
 assert.match(src,/SCHEDULE_GROUP_ASSIGN/);
 assert.match(src,/SCHEDULE_FORMAT_CREATE/);
 assert.match(src,/T\.Data\.read\('config\/scheduleGroups\//);
});
