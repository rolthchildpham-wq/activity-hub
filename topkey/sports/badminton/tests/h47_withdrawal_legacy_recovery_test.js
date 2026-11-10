const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const idx=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const m=idx.match(/adminJs:'\.\/assets\/u122\/([^']+)'/);assert(m,'admin core ref');
const core=fs.readFileSync(path.join(__dirname,'../assets/u122',m[1].split('?')[0]),'utf8');
const a=core.indexOf(' ranking(arg={}){'), b=core.indexOf(' rankingEligible(arg={})',a);assert(a>=0&&b>a,'core ranking');
let fnSrc=core.slice(a,b).trim().replace(/^ranking\(arg=\{\}\)\{/,'function ranking(arg={}){').replace(/,\s*$/,'');
const teams={
 b:{id:'b',name:'BAC',category:'MEN'},
 x:{id:'x',name:'ACTIVE_LOW',category:'MEN'},
 w1:{id:'w1',name:'WD_KEEP',category:'MEN',withdrawn:true,withdrawalPolicy:{mode:'KEEP_PLAYED_WO'}},
 w2:{id:'w2',name:'WD_LEGACY_BLANK',category:'MEN',withdrawn:true},
 ca:{id:'ca',name:'WD_CANCEL_ALL',category:'MEN',withdrawn:true,withdrawalPolicy:{mode:'CANCEL_ALL'}}
};
const matches={
 // real completed match against first withdrawn team: must be preserved
 bw1:{id:'bw1',stage:'GROUP',category:'MEN',teamAId:'b',teamBId:'w1',status:'FINISHED',winnerId:'b',sets:[{a:21,b:15,finished:true},{a:21,b:17,finished:true}]},
 // stale cancelled/hidden legacy record for second withdrawn team: no valid result => must become administrative WO
 bw2_old:{id:'bw2_old',stage:'GROUP',category:'MEN',teamAId:'b',teamBId:'w2',status:'CANCELLED',cancelReason:'ADMIN_EXCLUDE_STANDINGS',excludeFromStandings:true,manualNoStanding:true},
 // withdrawn team had a historical win; it should retain points but be sorted under all active teams
 w1x:{id:'w1x',stage:'GROUP',category:'MEN',teamAId:'w1',teamBId:'x',status:'FINISHED',winnerId:'w1',sets:[{a:21,b:12,finished:true},{a:21,b:13,finished:true}]},
 // active BAC beats active X
 bx:{id:'bx',stage:'GROUP',category:'MEN',teamAId:'b',teamBId:'x',status:'FINISHED',winnerId:'b',sets:[{a:21,b:10,finished:true},{a:21,b:11,finished:true}]}
};
const T={DEFAULT_RULES:{tieBreakers:['setDiff','pointDiff','name']},Scoring:{isSetWon:(a,b)=>a!==b}};
const App={state:{teams,matches,config:{rules:{tieBreakers:['setDiff','pointDiff','name']}}}};
const ctx={T};vm.createContext(ctx);const ranking=vm.runInContext('('+fnSrc+')',ctx);const rows=ranking.call(App,'MEN'),by=Object.fromEntries(rows.map(r=>[r.id,r]));
assert(!by.ca,'CANCEL_ALL withdrawn team must not appear in standings');
assert.equal(by.b.played,3,'BAC must count real WD1 + active X + blank-history WD2');
assert.equal(by.b.w,3,'BAC must receive administrative win for blank-history withdrawn opponent');
assert.equal(by.b.points,3,'points = wins');
assert.equal(by.b.virtualWO,1,'only missing WD2 fixture should be virtual WO');
assert(by.w1 && by.w1.points===1,'withdrawn KEEP policy retains earned points');
const firstWithdrawn=rows.findIndex(r=>r.withdrawn);const lastActive=Math.max(...rows.map((r,i)=>r.withdrawn?-1:i));
assert(firstWithdrawn>lastActive,'all withdrawn teams must sort below all active teams');
console.log('H47 withdrawal legacy recovery: PASS',rows.map(r=>({id:r.id,withdrawn:r.withdrawn,p:r.played,wl:r.w+'-'+r.l,pts:r.points,wo:r.virtualWO})));
