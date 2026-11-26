'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const h58=fs.readFileSync('topkey/sports/vnext/src/upgrade122-hotfix58.js','utf8');
const bundle=fs.readFileSync('topkey/sports/vnext/h97-vnext.bundle.js','utf8');
const h12=fs.readFileSync('topkey/sports/vnext/src/upgrade12.js','utf8');
const state={teams:{
 A:{id:'A',name:'Alpha',category:'NAM_6V6'},B:{id:'B',name:'Bravo',category:'NAM_6V6'},C:{id:'C',name:'Charlie',category:'NAM_6V6'},
 D:{id:'D',name:'Delta'},E:{id:'E',name:'Echo'}
},matches:{
 ab:{id:'ab',category:'NAM_6V6',stage:'GROUP',group:'A',status:'FINISHED',teamAId:'A',teamBId:'B',winnerId:'A',sets:[{a:25,b:20},{a:20,b:25},{a:25,b:23},{a:20,b:25},{a:15,b:12}]},
 ca:{id:'ca',category:'NAM_6V6',stage:'GROUP',group:'A',status:'FINISHED',teamAId:'C',teamBId:'A',winnerId:'C',sets:[{a:25,b:10},{a:25,b:11},{a:25,b:12}]},
 de:{id:'de',category:'NAM_6V6',stage:'GROUP',group:'B',status:'FINISHED',teamAId:'D',teamBId:'E',winnerId:'D',sets:[{a:25,b:18},{a:25,b:20},{a:25,b:22}]}
},config:{rules:{winPoints:3,lossPoints:0,tieBreakers:['points','setDiff','pointDiff','headToHead','name']},scheduleGroups:{NAM_6V6:{format:'GROUP',entries:[
 {id:'A',group:'A'},{id:'B',group:'A'},{id:'C',group:'A'},{id:'D',group:'B'},{id:'E',group:'B'}
]}}}};
const App={state,formatTime:value=>String(value)};
const T={App,SPORT:{key:'volleyball',mode:'sets',categories:['NAM_6V6'],rules:{winPoints:3,lossPoints:0,tieBreakers:['points','setDiff','pointDiff','headToHead','name']}},U:{toast(){}}};
const documentStub={readyState:'complete',head:{appendChild(){}},createElement(){return{id:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},appendChild(){},setAttribute(){}}},getElementById(){return null},addEventListener(){},querySelector(){return null},querySelectorAll(){return[]}};
const sandbox={window:{Topkey:T,addEventListener(){}},document:documentStub,location:{hash:''},console,Intl,Date,Map,Set,Object,Array,String,Number,Math,JSON,Promise,setTimeout:()=>0,clearTimeout(){}};
vm.runInNewContext(h58,sandbox,{timeout:3000});
const api=sandbox.window.TopkeyUpgrade122Hotfix58;
test('legacy category tabs insert relative to their actual DOM parent, not an assumed card child',()=>{
 assert.match(h12,/const anchor=body\.closest\('\.table-wrap'\)\|\|body\.closest\('table'\)\|\|body/);
 assert.match(h12,/parent\.insertBefore\(h,anchor\)/);
 assert.doesNotMatch(h12,/body\.closest\('\.card'\)\?\.insertBefore\(h,body\.closest\('\.table-wrap'\)\)/);
 assert.match(bundle,/parent\.insertBefore\(h,anchor\)/);
});
test('runtime H58 builds exactly two saved round-robin groups',()=>{
 const groups=api.groupBuckets('NAM_6V6');
 assert.equal(groups.length,2);
 assert.equal(groups.map(g=>g.group).join(','),'A,B');
 assert.equal(groups[0].teamIds.join(','),'A,B,C');
 assert.equal(groups[1].teamIds.join(','),'D,E');
});
test('final runtime ranking filters each group and uses volleyball set-difference tie break',()=>{
 const groupA=App.ranking({category:'NAM_6V6',teamIds:['A','B','C']});
 assert.equal(groupA.map(x=>x.id).join(','),'C,A,B');
 assert.equal(groupA[0].points,3);
 assert.equal(groupA[0].setsFor-groupA[0].setsAgainst,3);
 const groupB=App.ranking({category:'NAM_6V6',teamIds:['D','E']});
 assert.equal(groupB.map(x=>x.id).join(','),'D,E');
 assert.equal(groupB[0].played,1);
 assert.equal(groupB[1].points,0);
});
test('the final H58 module owns the active renderer and emits independent group sections',()=>{
 assert.equal((h58.match(/function renderStandings\(\)/g)||[]).length,1);
 assert.match(h58,/App\.renderStandings=renderStandings/);
 assert.match(h58,/className='subcard tk-group-standings'/);
 assert.match(h58,/ranking\(\{category:g\.category,teamIds:g\.teamIds\}\)/);
 assert.match(h58,/function renderPublicStandings\(\)/);
 assert.match(bundle,/H97 module src\/upgrade122-hotfix58\.js/);
 assert.match(bundle,/className='subcard tk-group-standings'/);
});
