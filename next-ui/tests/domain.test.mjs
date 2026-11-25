import test from 'node:test';
import assert from 'node:assert/strict';
import { sports, summarize, groupPhases, activeLiveMatches, isTestLab, legacyHref, normalizeScheduleDate, filterScheduleMatches } from '../src/lib/domain.ts';

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
test('KPI LIVE and live list count are identical when internal match id differs from Firebase key',()=>{
 const data={teams:{},matches:{firebaseKey:{id:'internal42',status:'LIVE'}},activeMatches:{court1:{matchId:'firebaseKey',started:true,finished:false}},config:{}};
 assert.equal(activeLiveMatches(data).length,1);
 assert.equal(summarize(data).live,1);
});

test('schedule dates normalize ISO and Vietnamese day-first formats safely',()=>{
 assert.equal(normalizeScheduleDate('2026-11-25T08:30:00'),'2026-11-25');
 assert.equal(normalizeScheduleDate('25/11/2026'),'2026-11-25');
 assert.equal(normalizeScheduleDate('5-2-2026'),'2026-02-05');
 assert.equal(normalizeScheduleDate('31/02/2026'),'');
 assert.equal(normalizeScheduleDate('unknown'),'');
});
test('schedule filters combine date range, category, status and team search without mutating source data',()=>{
 const matches={
  a:{code:'M-01',date:'25/11/2026',time:'09:00',status:'LIVE',category:'NAM_6V6',teamAId:'ta',teamBId:'tb',groupName:'Bảng A'},
  b:{code:'M-02',date:'2026-11-26',time:'10:00',status:'SCHEDULED',category:'NU_6V6',teamAId:'tc',teamBId:'td'},
  c:{code:'M-03',date:'2026-11-28',status:'FINISHED',category:'NAM_6V6'}
 };
 const teams={ta:{name:'TOPKEY A'},tb:{name:'Đội B'},tc:{name:'Đội C'},td:{name:'Đội D'}};
 const result=filterScheduleMatches(matches,teams,{from:'2026-11-25',to:'2026-11-27',category:'NAM_6V6',status:'LIVE',query:'topkey'});
 assert.deepEqual(result.map(([id])=>id),['a']);
 assert.equal(Object.keys(matches).length,3);
});
test('schedule filters treat missing status as scheduled and ignore undated matches only when date filtering',()=>{
 const matches={a:{date:'2026-11-25'},b:{status:'FINISHED'},c:null};
 assert.deepEqual(filterScheduleMatches(matches,{}, {status:'SCHEDULED'}).map(([id])=>id),['a']);
 assert.deepEqual(filterScheduleMatches(matches,{}, {from:'2026-11-25'}).map(([id])=>id),['a']);
});
