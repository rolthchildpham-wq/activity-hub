const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(__dirname+'/../upgrade122-hotfix44.js','utf8');
const teams={c:{id:'c',name:'Chen',category:'MEN'},t:{id:'t',name:'TU',category:'MEN'},n:{id:'n',name:'TAN',category:'MEN'},b:{id:'b',name:'BAC',category:'MEN'},h:{id:'h',name:'HU',category:'MEN'},d:{id:'d',name:'DAT',category:'MEN'},q:{id:'q',name:'Q',category:'MEN'},z:{id:'z',name:'Z',category:'MEN'}};
let id=0;const M={};
function add(a,b,w,status='FINISHED',extra={}){const k='m'+(++id);M[k]={id:k,stage:'GROUP',category:'MEN',teamAId:a,teamBId:b,status,winnerId:w,sets:status==='WALKOVER'?[{a:11,b:0,finished:true},{a:11,b:0,finished:true}]:[{a:w===a?21:15,b:w===a?15:21,finished:true},{a:w===a?21:17,b:w===a?17:21,finished:true}],...extra};return k;}
// Chen has exactly four real wins. Legacy config says 2 points/win, but H44 must expose 4 points.
add('c','t','c');add('c','n','c');add('c','h','c');add('c','d','c');
// BAC = 5-1 across six unique opponents.
add('b','t','b');add('b','n','b');add('b','h','b');add('b','d','b');add('b','q','b','WALKOVER');add('b','z','z');
// Duplicate stale WO for Chen-TU must not count in addition to real FINISHED.
add('c','t','c','WALKOVER',{virtualStandingOnly:true,updatedAt:999999});
const App={state:{teams,matches:M,config:{rules:{winPoints:2,lossPoints:1,walkoverWinPoints:3,tieBreakers:['setDiff','pointDiff','name']}}},normalizeCategory:v=>String(v||'').toUpperCase()};
const Topkey={App,DEFAULT_RULES:{winPoints:3,lossPoints:0,walkoverWinPoints:3,tieBreakers:['setDiff','pointDiff','name']},Scoring:{isSetWon:(a,b)=>a!==b}};
const ctx={window:{Topkey},document:{documentElement:{dataset:{}},getElementById:()=>null},setTimeout:f=>f(),setInterval:()=>0,clearInterval(){}};ctx.window.addEventListener=()=>{};vm.createContext(ctx);vm.runInContext(code,ctx);
const rows=ctx.window.Topkey.App.ranking('MEN'),by=Object.fromEntries(rows.map(r=>[r.id,r]));
assert.equal(by.c.w,4);assert.equal(by.c.points,4);assert.equal(by.c.played,4); // exactly 4 real wins; duplicate c-t removed
assert.equal(by.b.w,5);assert.equal(by.b.l,1);assert.equal(by.b.points,5);assert.equal(by.b.played,6);
for(const r of rows)assert.equal(r.points,r.w);
const ca=ctx.window.Topkey.App.auditStandingTeam('c','MEN');assert.equal(ca.contributions.filter(x=>x.pair==='c|t').length,1);
console.log('H44 standings single-result: PASS',rows.map(r=>({id:r.id,p:r.played,wl:r.w+'-'+r.l,pts:r.points})));
