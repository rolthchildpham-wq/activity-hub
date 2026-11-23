import test from 'node:test';
import assert from 'node:assert/strict';
import { sports, summarize, groupPhases, activeLiveMatches, isTestLab, legacyHref } from '../src/lib/domain.ts';

const fixture={
 teams:{a:{name:'A',checkedIn:true},b:{name:'B'},c:{name:'C',checkedIn:true}},
 matches:{
  m1:{id:'m1',status:'FINISHED',stage:'GROUP',group:'A',category:'NAM_6V6'},
  m2:{id:'m2',status:'LIVE',stage:'GROUP',group:'A',category:'NAM_6V6'},
  m3:{id:'m3',status:'SCHEDULED',stage:'GROUP',group:'B',category:'NAM_6V6'}
 },
 activeMatches:{court1:{matchId:'m2',started:true,finished:false}},
 config:{title:'Test tournament'}
};

test('all eight sport entrypoints have existing operational links',()=>{
 assert.equal(sports.length,8);
 for(const sport of sports)assert.ok(legacyHref(sport.key).startsWith('/sports/'));
});
test('score and active sessions agree without double counting live matches',()=>{
 assert.deepEqual(summarize(fixture),{teams:3,checkedIn:2,scheduled:3,live:1,completed:1});
});
test('stage progress groups by actual category and table',()=>{
 const groups=groupPhases(fixture.matches);
 assert.deepEqual(groups,[{name:'NAM_6V6 / A',done:1,total:2},{name:'NAM_6V6 / B',done:0,total:1}]);
});
test('test lab never mistaken for main production',()=>{
 assert.equal(isTestLab('__testlab_u122_20261031_volleyball_demo'),true);
 assert.equal(isTestLab('main_2026'),false);
});
test('no data remains empty rather than simulated',()=>{
 assert.deepEqual(summarize({teams:{},matches:{},activeMatches:{},config:{}}),{teams:0,checkedIn:0,scheduled:0,live:0,completed:0});
});

test('null/invalid Firebase records are ignored safely',()=>{
 const incomplete={teams:{ok:{checkedIn:true},missing:null},matches:{m1:null,m2:{status:'FINISHED',stage:'GROUP',group:'A'}},activeMatches:{x:null},config:{}};
 assert.deepEqual(summarize(incomplete),{teams:1,checkedIn:1,scheduled:1,live:0,completed:1});
 assert.equal(groupPhases(incomplete.matches).length,1);
});
test('LIVE match missing internal id is counted by Firebase key',()=>{
 assert.equal(summarize({teams:{},matches:{abc:{status:'LIVE'}},activeMatches:{},config:{}}).live,1);
});

test('live page includes started court sessions even when match status is still scheduled',()=>{
 const data={teams:{},matches:{m2:{id:'m2',status:'SCHEDULED'},m3:{id:'m3',status:'FINISHED'}},activeMatches:{courtA:{matchId:'m2',started:true,finished:false},courtB:{matchId:'m3',started:true,finished:true}},config:{}};
 assert.deepEqual(activeLiveMatches(data).map(([id])=>id),['m2']);
});
test('live page deduplicates Firebase match key and internal id',()=>{
 assert.deepEqual(activeLiveMatches(fixture).map(([id])=>id),['m2']);
});
test('operational handoff retains the tournament id without changing production',()=>{
 assert.equal(legacyHref('volleyball','__testlab_example'),'/sports/vnext/index.html?sport=volleyball&tid=__testlab_example&testlab=1');
 assert.equal(legacyHref('badminton','main_2026'),'/sports/badminton/index.html?tid=main_2026');
 assert.equal(legacyHref('football'),'/sports/vnext/index.html?sport=football');
});
test('handoff ignores untrusted tournament IDs',()=>{
 assert.equal(legacyHref('football','bad/../evil'),'/sports/vnext/index.html?sport=football');
});
