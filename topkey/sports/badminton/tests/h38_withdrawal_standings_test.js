const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/../upgrade122-hotfix38.js','utf8');
const teams={
 w1:{id:'w1',name:'W1',category:'WOMEN',withdrawn:true},
 w2:{id:'w2',name:'W2',category:'WOMEN',withdrawn:false},
 w3:{id:'w3',name:'W3',category:'WOMEN',withdrawn:false},
 w4:{id:'w4',name:'W4',category:'WOMEN',withdrawn:false},
 m1:{id:'m1',name:'M1',category:'MEN',withdrawn:false},
 m2:{id:'m2',name:'M2',category:'MEN',withdrawn:false},
 x1:{id:'x1',name:'X1',category:'MIX',withdrawn:false},
 x2:{id:'x2',name:'X2',category:'MIX',withdrawn:false},
 x3:{id:'x3',name:'X3',category:'MIX',withdrawn:false},
};
const matches={
 // W1 played and won W2 before withdrawing
 g1:{id:'g1',code:'WG1',teamAId:'w1',teamBId:'w2',category:'WOMEN',stage:'GROUP',status:'FINISHED',sets:[{a:21,b:10,finished:true},{a:21,b:12,finished:true}],winnerId:'w1'},
 // future matches become WO 0-11,0-11 against withdrawn W1
 g2:{id:'g2',code:'WG2',teamAId:'w1',teamBId:'w3',category:'WOMEN',stage:'GROUP',status:'WALKOVER',sets:[{a:0,b:11,finished:true},{a:0,b:11,finished:true}],winnerId:'w3'},
 g3:{id:'g3',code:'WG3',teamAId:'w4',teamBId:'w1',category:'WOMEN',stage:'GROUP',status:'WALKOVER',sets:[{a:11,b:0,finished:true},{a:11,b:0,finished:true}],winnerId:'w4'},
 // normal women result
 g4:{id:'g4',code:'WG4',teamAId:'w2',teamBId:'w3',category:'WOMEN',stage:'GROUP',status:'FINISHED',sets:[{a:21,b:19,finished:true},{a:21,b:18,finished:true}],winnerId:'w2'},
 // knockout must NEVER affect group standings
 ko:{id:'ko',code:'WKO1',teamAId:'w2',teamBId:'w3',category:'WOMEN',stage:'KNOCKOUT',status:'FINISHED',sets:[{a:0,b:21,finished:true},{a:0,b:21,finished:true}],winnerId:'w3'},
 // ambiguous finished result must not default to B
 bad:{id:'bad',code:'WBAD',teamAId:'w2',teamBId:'w4',category:'WOMEN',stage:'GROUP',status:'FINISHED',sets:[{a:10,b:10,finished:false}]},
 // men must not contaminate women
 mg:{id:'mg',code:'MG1',teamAId:'m1',teamBId:'m2',category:'MEN',stage:'GROUP',status:'FINISHED',sets:[{a:21,b:5,finished:true},{a:21,b:4,finished:true}],winnerId:'m1'},
 // RETIRED: partial current set points count, but unfinished set must not count in set differential
 xr:{id:'xr',code:'XR',teamAId:'x1',teamBId:'x2',category:'MIX',stage:'GROUP',status:'RETIRED',sets:[{a:21,b:18,finished:true},{a:7,b:10,finished:false}],winnerId:'x2'},
 // CANCELLED must not count at all
 xc:{id:'xc',code:'XC',teamAId:'x2',teamBId:'x3',category:'MIX',stage:'GROUP',status:'CANCELLED',sets:[{a:11,b:0,finished:true}],winnerId:'x2'},
};
const App={state:{teams,matches,config:{rules:{}}},normalizeCategory(v){const x=String(v||'MIX').toUpperCase();return /WOM/.test(x)?'WOMEN':/MEN/.test(x)&&!/WOMEN/.test(x)?'MEN':'MIX';},renderStandings(){},quickStandingCategory:'WOMEN'};
const Topkey={App,U:{},DEFAULT_RULES:{winPoints:3,lossPoints:0,walkoverWinPoints:3,tieBreakers:['headToHead','setDiff','pointDiff','name']},Scoring:{isSetWon(a,b){return (a>=21&&a-b>=2)||a===30||(b>=21&&b-a>=2)||b===30;}}};
const document={documentElement:{dataset:{}},getElementById(){return null}};
const ctx={window:{Topkey},document,console};ctx.window.window=ctx.window;ctx.window.addEventListener=()=>{};
vm.createContext(ctx);vm.runInContext(src,ctx);
const H=ctx.window.TopkeyUpgrade122Hotfix38;assert(H&&H.installed);
const women=H.canonicalRanking({category:'WOMEN'});
assert.deepStrictEqual(Array.from(women, x=>x.id).sort(),['w2','w3','w4']); // withdrawn excluded
const by=Object.fromEntries(women.map(x=>[x.id,x]));
assert.equal(by.w2.played,2); // loss to W1 + win over W3; KO ignored; ambiguous ignored
assert.equal(by.w2.w,1);assert.equal(by.w2.l,1);assert.equal(by.w2.points,3);
assert.equal(by.w3.played,2); // WO vs W1 + loss to W2; KO ignored
assert.equal(by.w3.w,1);assert.equal(by.w3.l,1);assert.equal(by.w3.points,3);
assert.equal(by.w4.played,1);assert.equal(by.w4.w,1);assert.equal(by.w4.points,3);
assert.equal(by.w3.setsFor-by.w3.setsAgainst,0); // +2 WO, -2 vs W2
assert.equal(by.w3.pointsFor-by.w3.pointsAgainst,17); // +22 WO, then 37-42 = -5 => +17? Let's assert exact below
assert(women.anomalies.some(x=>x.type==='MISSING_WINNER'&&x.matchId==='bad'));
const allW=H.canonicalRanking({category:'WOMEN',includeWithdrawn:true});
assert(allW[allW.length-1].id==='w1'); // withdrawn always below active teams
const men=H.canonicalRanking({category:'MEN'});assert.equal(men[0].id,'m1');assert.equal(men[0].points,3);
const mix=H.canonicalRanking({category:'MIX'}), mx=Object.fromEntries(mix.map(x=>[x.id,x]));
assert.equal(mx.x2.w,1);assert.equal(mx.x1.l,1);assert.equal(mx.x2.points,3);
assert.equal(mx.x1.setsFor,1);assert.equal(mx.x2.setsAgainst,1); // unfinished 7-10 set is not a completed set
assert.equal(mx.x1.pointsFor,28);assert.equal(mx.x1.pointsAgainst,28); // actual points, including partial set
assert.equal(mx.x3.played,0); // CANCELLED excluded
console.log('H38 withdrawal standings: PASS',women.map(r=>({id:r.id,p:r.points,wl:`${r.w}-${r.l}`,sd:r.setsFor-r.setsAgainst,pd:r.pointsFor-r.pointsAgainst})),women.anomalies);
