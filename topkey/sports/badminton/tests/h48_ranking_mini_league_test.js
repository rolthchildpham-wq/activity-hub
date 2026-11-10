const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const idx=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const m=idx.match(/adminJs:'\.\/assets\/u122\/([^']+)'/);assert(m,'admin core ref');
const core=fs.readFileSync(path.join(__dirname,'../assets/u122',m[1].split('?')[0]),'utf8');
const a=core.indexOf(' ranking(arg={}){'), b=core.indexOf(' rankingEligible(arg={})',a);assert(a>=0&&b>a,'ranking method');
let fnSrc=core.slice(a,b).trim().replace(/^ranking\(arg=\{\}\)\{/,'function ranking(arg={}){').replace(/,\s*$/,'');
const T={DEFAULT_RULES:{winPoints:3,lossPoints:0,walkoverWinPoints:3,tieBreakers:['headToHead','setDiff','pointDiff','setsFor','pointsFor','name']},Scoring:{isSetWon:(a,b)=>a!==b}};
function run(teams,matches){const App={state:{teams,matches,config:{rules:{}}}};const ctx={T};vm.createContext(ctx);const ranking=vm.runInContext('('+fnSrc+')',ctx);return ranking.call(App,'MEN')}
let n=0;const teams={A:{id:'A',name:'A',category:'MEN'},B:{id:'B',name:'B',category:'MEN'},C:{id:'C',name:'C',category:'MEN'},D:{id:'D',name:'D',category:'MEN'}};const matches={};
function add(a,b,w,sets){const id='m'+(++n);matches[id]={id,stage:'GROUP',category:'MEN',teamAId:a,teamBId:b,status:'FINISHED',winnerId:w,sets:sets.map(([x,y])=>({a:x,b:y,finished:true}))}}
// Circular H2H: A>B, B>C, C>A. All three also beat D => same overall 2 wins.
add('A','B','A',[[21,10],[21,11]]);       // A +2 mini sets vs B
add('B','C','B',[[21,18],[17,21],[21,19]]); // B +1 mini sets vs C
add('C','A','C',[[21,8],[21,9]]);          // C +2 mini sets vs A
add('A','D','A',[[21,19],[21,19]]);add('B','D','B',[[21,5],[21,5]]);add('C','D','C',[[21,15],[21,15]]);
let rows=run(teams,matches).filter(r=>['A','B','C'].includes(r.id));
assert.deepStrictEqual(Array.from(rows,r=>r.id),['C','A','B'],'3+ tie must use transitive mini-league, not pairwise comparator');
assert(rows.every(r=>r.points===2),'points must remain one per win');

// Exact two-team tie: E beat F directly; F has much better overall set/point diff, but H2H must win first.
const teams2={E:{id:'E',name:'E',category:'MEN'},F:{id:'F',name:'F',category:'MEN'},G:{id:'G',name:'G',category:'MEN'},H:{id:'H',name:'H',category:'MEN'}};const matches2={};n=0;
function add2(a,b,w,sets){const id='x'+(++n);matches2[id]={id,stage:'GROUP',category:'MEN',teamAId:a,teamBId:b,status:'FINISHED',winnerId:w,sets:sets.map(([x,y])=>({a:x,b:y,finished:true}))}}
add2('E','F','E',[[30,29],[10,21],[30,29]]); // E wins H2H narrowly 2-1
add2('G','E','G',[[21,0],[21,0]]);           // hurts E overall diff
add2('F','G','F',[[21,0],[21,0]]);           // boosts F overall diff
add2('G','H','G',[[21,10],[21,10]]);          // G moves to 2 wins, leaving only E/F tied on 1 point
rows=run(teams2,matches2).filter(r=>['E','F'].includes(r.id));
assert.deepStrictEqual(Array.from(rows,r=>r.id),['E','F'],'2-team tie must use direct H2H before overall differences');
console.log('H48 ranking mini-league: PASS');
