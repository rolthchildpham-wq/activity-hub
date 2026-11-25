import test from 'node:test';import assert from 'node:assert/strict';
import {buildSportsAnalytics} from '../src/lib/entities/sports-analytics.ts';
const teams={a:{name:'Alpha'},b:{name:'Beta'},c:{name:'Gamma'}};
const matches={m1:{teamAId:'a',teamBId:'b',status:'FINISHED',scoreA:21,scoreB:18,date:'2026-11-20'},m2:{teamAId:'b',teamBId:'a',status:'FINISHED',scoreA:15,scoreB:21,date:'20/11/2026'},m3:{teamAId:'a',teamBId:'c',status:'LIVE',scoreA:8,scoreB:7,date:'2026-11-21'},m4:{teamAId:'a',teamBId:'c',status:'FINISHED',date:'2026-11-21'}};
test('analytics computes results only from completed matches with valid scores',()=>{const r=buildSportsAnalytics(matches,teams);const a=r.teamRecords.find(t=>t.id==='a');const b=r.teamRecords.find(t=>t.id==='b');assert.equal(r.matches,4);assert.equal(r.scoredCompleted,2);assert.equal(a.played,2);assert.equal(a.won,2);assert.equal(b.lost,2);assert.equal(a.pointsFor,42)});
test('analytics aggregates activity by normalized dates and status',()=>{const r=buildSportsAnalytics(matches,teams);assert.equal(r.activity.length,2);assert.equal(r.activity[0].date,'2026-11-20');assert.equal(r.activity[0].total,2);assert.equal(r.activity[1].live,1)});
test('analytics safely handles empty and null Firebase snapshots',()=>{const r=buildSportsAnalytics(null,null);assert.equal(r.teams,0);assert.equal(r.matches,0);assert.deepEqual(r.teamRecords,[])});
