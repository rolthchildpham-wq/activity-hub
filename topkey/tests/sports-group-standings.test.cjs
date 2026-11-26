'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('topkey/sports/vnext/src/app.js','utf8');
const start=app.indexOf(' ranking(options={}){'),end=app.indexOf(' setWinnerId',start);
assert.ok(start>=0&&end>start,'ranking method must exist');
const method=app.slice(start,end).trim().replace(/,\s*$/,'');
const ranking=vm.runInNewContext('({'+method+'}).ranking',{S:{mode:'sets',rules:{winPoints:3,lossPoints:0,tieBreakers:['points','setDiff','pointDiff','name']}},Object,Number,Math,Set});
const context={state:{teams:{
 A:{id:'A',name:'Alpha',category:'NAM_6V6'},B:{id:'B',name:'Bravo',category:'NAM_6V6'},C:{id:'C',name:'Charlie',category:'NAM_6V6'},
 D:{id:'D',name:'Delta',category:'NAM_6V6'},E:{id:'E',name:'Echo',category:'NAM_6V6'}
},matches:{
 ab:{id:'ab',category:'NAM_6V6',status:'FINISHED',teamAId:'A',teamBId:'B',winnerId:'A',sets:[{a:25,b:20},{a:20,b:25},{a:25,b:23},{a:20,b:25},{a:15,b:12}]},
 ca:{id:'ca',category:'NAM_6V6',status:'FINISHED',teamAId:'C',teamBId:'A',winnerId:'C',sets:[{a:25,b:10},{a:25,b:11},{a:25,b:12}]},
 de:{id:'de',category:'NAM_6V6',status:'FINISHED',teamAId:'D',teamBId:'E',winnerId:'D',sets:[{a:25,b:18},{a:25,b:20},{a:25,b:22}]}
},config:{rules:{winPoints:3,lossPoints:0,tieBreakers:['points','setDiff','pointDiff','name']}}},setWinnerId(m){let a=0,b=0;(m.sets||[]).forEach(s=>{if(s.a>s.b)a++;else if(s.b>s.a)b++});return a>b?m.teamAId:b>a?m.teamBId:''}};
test('volleyball standings filter to one saved group and apply set-difference tie break',()=>{
 const rows=ranking.call(context,{teamIds:['A','B','C'],category:'NAM_6V6'});
 assert.deepEqual(rows.map(x=>x.id),['C','A','B']);
 assert.equal(rows[0].points,3);
 assert.equal(rows[0].setsFor-rows[0].setsAgainst,3);
});
test('group B standings do not mix teams or match results from group A',()=>{
 const rows=ranking.call(context,{teamIds:['D','E'],category:'NAM_6V6'});
 assert.deepEqual(rows.map(x=>x.id),['D','E']);
 assert.equal(rows[0].played,1);
 assert.equal(rows[1].points,0);
});
test('rendering reads saved scheduleGroups and emits independent group tables',()=>{
 assert.match(app,/scheduleGroups/);
 assert.match(app,/m\.groupId\?\?m\.groupName\?\?m\.group\?\?m\.pool/);
 assert.match(app,/tk-group-standings/);
 assert.match(app,/this\.ranking\(\{teamIds:g\.teamIds,category:g\.category\}\)/);
});
