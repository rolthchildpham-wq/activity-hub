import test from 'node:test';import assert from 'node:assert/strict';
import {headToHead,matchScoreLabel,matchStatusLabel} from '../src/lib/entities/match-center.ts';
const matches={one:{teamAId:'a',teamBId:'b',status:'FINISHED',scoreA:21,scoreB:17},two:{teamAId:'b',teamBId:'a',status:'FINISHED',scoreA:15,scoreB:21},live:{teamAId:'a',teamBId:'b',status:'LIVE',scoreA:9,scoreB:8},noScore:{teamAId:'a',teamBId:'b',status:'FINISHED'}};
test('head-to-head handles reversed sides and completed matches only',()=>{const r=headToHead(matches,{},'a','b');assert.equal(r.meetings,2);assert.equal(r.a.won,2);assert.equal(r.b.won,0);assert.equal(r.a.pointsFor,42);assert.equal(r.b.pointsFor,32)});
test('head-to-head ignores invalid selections',()=>{assert.equal(headToHead(matches,{},'a','a').available,false);assert.equal(headToHead(matches,{},'','b').available,false)});
test('score and status labels handle missing values',()=>{assert.equal(matchScoreLabel({scoreA:21,scoreB:19}),'21 : 19');assert.equal(matchScoreLabel({}),'—');assert.equal(matchStatusLabel('IN_PROGRESS'),'ĐANG THI ĐẤU')});
