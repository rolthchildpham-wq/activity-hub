import test from 'node:test';import assert from 'node:assert/strict';import {headToHead} from '../src/lib/entities/match-center.ts';
test('live match center regression: score orientation remains correct',()=>{const r=headToHead({m:{teamAId:'b',teamBId:'a',status:'FINISHED',scoreA:10,scoreB:21}},null,'a','b');assert.equal(r.a.won,1);assert.equal(r.a.pointsFor,21)});
