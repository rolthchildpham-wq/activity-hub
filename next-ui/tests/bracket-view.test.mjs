import test from 'node:test';import assert from 'node:assert/strict';
import {bracketMatchView,bracketStatusLabel} from '../src/lib/entities/bracket-view.ts';
const teams={a:{name:'Alpha'},b:{name:'Beta'}};
test('bracket view highlights winner only for completed scored matches',()=>{const v=bracketMatchView('m1',{teamAId:'a',teamBId:'b',status:'FINISHED',scoreA:21,scoreB:17},teams);assert.equal(v.winnerId,'a');assert.equal(v.teamAName,'Alpha')});
test('bracket view does not guess winner for live, tied, walkover without scores',()=>{assert.equal(bracketMatchView('m',{teamAId:'a',teamBId:'b',status:'LIVE',scoreA:9,scoreB:8},teams).winnerId,null);assert.equal(bracketMatchView('m',{teamAId:'a',teamBId:'b',status:'FINISHED',scoreA:18,scoreB:18},teams).winnerId,null);assert.equal(bracketMatchView('m',{teamAId:'a',teamBId:'b',status:'WALKOVER'},teams).winnerId,null)});
test('bracket statuses are localized with unknown values preserved',()=>{assert.equal(bracketStatusLabel('FINISHED'),'HOÀN TẤT');assert.equal(bracketStatusLabel('CUSTOM'),'CUSTOM')});
