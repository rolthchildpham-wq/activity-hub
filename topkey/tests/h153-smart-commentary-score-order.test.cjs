'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('topkey/sports/vnext/src/smart-commentary-h153.js','utf8');
const html=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
function load(){
 const window={addEventListener(){},__TOPKEY_PUBLIC_ROUTE:false};
 const ctx={window,document:{getElementById:()=>null},localStorage:{getItem:()=>null},console};
 vm.runInNewContext(source,ctx,{timeout:1000});
 return window.TopkeySmartBLVH153.format;
}
const names=id=>({A:'MÀI NHÁM',B:'SINTAI'}[id]);
const m={teamAId:'A',teamBId:'B'};
test('Volleyball last point awarded to B announces B and its new score first, no repeated set prefix',()=>{
 const format=load(),state={setIndex:0,sets:[{a:4,b:5}],history:[[{a:4,b:4}]]};
 const text=format(state,m,names,'sets','FULL');
 assert.equal(text,'SINTAI 5, MÀI NHÁM 4.');
 assert.doesNotMatch(text,/Set 1/);
});
test('Volleyball last point awarded to A announces A first even when B is leading',()=>{
 const format=load(),s={setIndex:0,sets:[{a:2,b:4}],history:[[{a:1,b:4}]]};
 assert.equal(format(s,m,names,'sets','FULL'),'MÀI NHÁM 2, SINTAI 4.');
});
test('Smart cadence suppresses routine point and narrates periodic score',()=>{
 const f=load();
 assert.equal(f({setIndex:0,sets:[{a:2,b:2}],history:[[{a:1,b:2}]]},m,names,'sets'),'MÀI NHÁM 2, SINTAI 2.');
 assert.equal(f({setIndex:0,sets:[{a:3,b:2}],history:[[{a:2,b:2}]]},m,names,'sets'),'');
 assert.equal(f({setIndex:0,sets:[{a:4,b:2}],history:[[{a:3,b:2}]]},m,names,'sets'),'MÀI NHÁM 4, SINTAI 2.');
});
test('Set is spoken on new set and when newly finished, not every rally',()=>{
 const f=load();
 assert.equal(f({setIndex:1,sets:[{a:25,b:20,finished:true},{a:1,b:0}],history:[[{a:25,b:20,finished:true},{a:0,b:0}]]},m,names,'sets'),
   'Bắt đầu set 2. MÀI NHÁM 1, SINTAI 0.');
 assert.equal(f({setIndex:0,sets:[{a:25,b:22,finished:true}],history:[[{a:24,b:22,finished:false}]]},m,names,'sets'),
   'Kết thúc set 1. MÀI NHÁM 25, SINTAI 22.');
});
test('Football awards to the scorer and never announces a set',()=>{
 const f=load();
 assert.equal(f({scoreA:1,scoreB:0,history:[{scoreA:0,scoreB:0}]},m,names,'score','FULL'),
   'MÀI NHÁM 1, SINTAI 0.');
 assert.equal(f({scoreA:0,scoreB:1,history:[{scoreA:0,scoreB:0}]},m,names,'score','FULL'),
   'SINTAI 1, MÀI NHÁM 0.');
});
test('Negative correction must never be narrated as new goal or point',()=>{
 const f=load();
 assert.equal(f({scoreA:2,scoreB:1,history:[{scoreA:3,scoreB:1}]},m,names,'score','FULL'),'');
 assert.equal(f({setIndex:0,sets:[{a:2,b:3}],history:[[{a:2,b:4}]]},m,names,'sets','FULL'),'');
});
test('Load one H153 announcer on VNext without Firebase writes',()=>{
 assert.equal((html.match(/smart-commentary-h153\.js/g)||[]).length,1);
 assert.doesNotMatch(source,/queueSet\(|queueMulti\(|\.ref\(|firebase\.database/);
});
