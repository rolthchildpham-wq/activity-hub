const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const idx=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const m=idx.match(/adminJs:'\.\/assets\/u122\/([^']+)'/);assert(m,'admin core ref');
const core=fs.readFileSync(path.join(__dirname,'../assets/u122',m[1].split('?')[0]),'utf8');
const a=core.indexOf(' ranking(arg={}){'), b=core.indexOf(' rankingEligible(arg={})',a);assert(a>=0&&b>a,'core ranking');
let fnSrc=core.slice(a,b).trim().replace(/^ranking\(arg=\{\}\)\{/,'function ranking(arg={}){').replace(/,\s*$/,'');
const teams={
 b:{id:'b',name:'BAC',category:'MEN'},
 x:{id:'x',name:'X',category:'MEN'},
 w1:{id:'w1',name:'WD1',category:'MEN',withdrawn:true,withdrawalPolicy:{mode:'KEEP_PLAYED_WO'}},
 w2:{id:'w2',name:'WD2',category:'MEN',withdrawn:true}
};
const matches={
 m1:{id:'m1',stage:'GROUP',category:'MEN',teamAId:'b',teamBId:'x',status:'FINISHED',winnerId:'b',sets:[{a:21,b:10,finished:true},{a:21,b:11,finished:true}]},
 // evidence for w2 policy only exists on an unrelated stale record / snapshot, simulating restore -> reschedule -> withdraw again
 m2:{id:'m2',stage:'GROUP',category:'MEN',teamAId:'w2',teamBId:'x',status:'CANCELLED',withdrawalPolicy:'KEEP_PLAYED_WO',withdrawnTeamId:'w2',teamASnapshot:{id:'w2',name:'WD2',category:'MEN',withdrawn:true,withdrawalPolicy:{mode:'KEEP_PLAYED_WO'}},teamBSnapshot:{id:'x',name:'X',category:'MEN'}}
};
const T={DEFAULT_RULES:{tieBreakers:['setDiff','pointDiff','name']},Scoring:{isSetWon:(a,b)=>a!==b}};
const App={state:{teams,matches,config:{rules:{tieBreakers:['setDiff','pointDiff','name']}}}};
const ctx={T};vm.createContext(ctx);const ranking=vm.runInContext('('+fnSrc+')',ctx);const rows=ranking.call(App,'MEN'),by=Object.fromEntries(rows.map(r=>[r.id,r]));
assert.equal(by.b.played,3,'BAC must count X + both withdrawn opponents');
assert.equal(by.b.w,3,'BAC must receive both withdrawal wins');
assert.equal(by.b.points,3,'1 point per win');
assert.equal(by.w1.played,2);assert.equal(by.w1.l,2);
assert.equal(by.w2.played,2);assert.equal(by.w2.l,2);
assert.equal(rows.virtualFixtures.length,4,'each withdrawn team must lose to every active opponent missing a result');
console.log('H46 withdrawal policy recovery: PASS',rows.map(r=>({id:r.id,p:r.played,wl:r.w+'-'+r.l,pts:r.points,wo:r.virtualWO})));
