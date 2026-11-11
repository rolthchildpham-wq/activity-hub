// Synthetic fixtures only; this test never connects to production Firebase.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {performance}=require('node:perf_hooks');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const {JSDOM}=require('jsdom');
const fixture=i=>({tid:`cup_${String(i).padStart(4,'0')}`,title:`TOPKEY mô phỏng ${i}`,closedAt:1794380000000+Math.floor(i/3),finalReport:{
 title:`TOPKEY mô phỏng ${i}`,generatedAt:1794380000000,teams:Array.from({length:26},(_,j)=>({id:`t${j}`,name:`Đội ${j+1}`,p1:`VĐV ${j%32+1}`,p2:`VĐV ${(j+6)%32+1}`,category:['MEN','WOMEN','MIX'][j%3]})),
 matches:Array.from({length:100},(_,j)=>({id:`m${j}`,teamAId:`t${j%26}`,teamBId:`t${(j+1)%26}`,status:'FINISHED',date:'2026-11-11',sets:[{a:21,b:17},{a:21,b:19}],result:'21-17 | 21-19'})),
 finance:{rows:Array.from({length:20},(_,j)=>({id:`f${j}`,type:j%2?'INCOME':'EXPENSE',amount:100000,status:'PAID'}))},top4:{MEN:[{name:'Đội 1'}]}
}});
const data=Object.fromEntries(Array.from({length:1000},(_,i)=>{const r=fixture(i);return[r.tid,r]}));
const bytes=x=>Buffer.byteLength(JSON.stringify(x));
let transferred=0,queries=0;
function ref(rows,order='closedAt',end=null,limit=Infinity){return{
 orderByChild:k=>ref(rows,k,end,limit),endAt:(v,k)=>ref(rows,order,{v,k},limit),limitToLast:n=>ref(rows,order,end,n),
 async once(){queries++;const all=Object.entries(rows).sort((a,b)=>(a[1][order]??0)-(b[1][order]??0)||a[0].localeCompare(b[0]));
 const filtered=all.filter(([k,v])=>!end||(v[order]??0)<(end.v??0)||((v[order]??0)===(end.v??0)&&k<=end.k)).slice(-limit);
 const payload=JSON.parse(JSON.stringify(Object.fromEntries(filtered)));transferred+=bytes(payload);
 return{val:()=>payload,forEach:fn=>filtered.forEach(([key])=>fn({key,val:()=>payload[key]}))};
 }}}
async function main(){
 const ctx={window:{},console};vm.runInNewContext(read('sports/badminton/src/core/archive-pagination.js'),ctx);
 const timings=[];let first;
 for(let n=0;n<30;n++){const t=performance.now();first=await ctx.window.TopkeyArchivePage(ref(data));timings.push(performance.now()-t)}
 assert.equal(Object.keys(first.rows).length,25);assert(first.hasMore);
 const pageBytes=transferred/30;transferred=0;queries=0;
 const seen=new Set();let cursor=null,pages=0;
 do{const page=await ctx.window.TopkeyArchivePage(ref(data),cursor);pages++;for(const key of Object.keys(page.rows)){assert(!seen.has(key),'duplicate cursor row');seen.add(key)}cursor=page.hasMore?page.cursor:null;}while(cursor);
 assert.equal(seen.size,1000);assert.equal(pages,40);
 // No hidden archive download may return to the login path.
 const source=read('sports/badminton/src/upgrade9.js');
 const after=source.match(/async afterLogin\(\)\{([^\n]+)\},/)[1];
 let archiveReads=0;
 await new Function('return (async function(){'+after+'})')().call({renderAll(){},applyPermissionsDom(){},ensureRegistrationToken:async()=>{},loadArchives(){archiveReads++}});
 assert.equal(archiveReads,0);
 // Actual dashboard computation: 1000 tournaments, 26k team entries, 100k matches.
 const dom=new JSDOM('<div></div>',{runScripts:'outside-only',url:'https://test.invalid/'});
 dom.window.eval(read('executive-dashboard.js'));
 const raw={badminton:Object.fromEntries(Object.entries(data).map(([id,e])=>[id,{config:{title:e.title,closedAt:e.closedAt,finalTop3:e.finalReport.top4},teams:e.finalReport.teams,matches:e.finalReport.matches,finance:e.finalReport.finance.rows}]))};
 const t=performance.now(),dashboard=dom.window.TopkeyExecutiveDashboard.compute(raw,{}),computeMs=performance.now()-t;
 assert.equal(dashboard.kpi.events,1000);assert.equal(dashboard.kpi.entries,26000);assert.equal(dashboard.kpi.uniquePeople,32);
 // Exercise actual dashboard boot with a cached snapshot and count archive reads.
 const cached=new JSDOM('<section id="executive-dashboard"></section>',{runScripts:'outside-only',url:'https://test.invalid/'});
 let authCallback,indexReads=0;
 cached.window.firebase={auth:()=>({onAuthStateChanged:fn=>{authCallback=fn}}),database:()=>({ref:p=>({once:async()=>{if(p.endsWith('/tournamentIndex'))indexReads++;return{val:()=>p.includes('/users/')?{role:'ADMIN'}:p.endsWith('/associationDashboard')?{snapshot:dashboard}:{badminton:data}}},update:async()=>{}})})};
 cached.window.eval(read('executive-dashboard.js'));
 await new Promise(resolve=>cached.window.addEventListener('DOMContentLoaded',resolve,{once:true}));
 await authCallback({uid:'admin'});
 assert.equal(indexReads,0,'cached dashboard must not fetch archives at boot');
 const cachedBootArchiveBytes=indexReads*bytes(data);
 await cached.window.document.querySelector('#exec-refresh').onclick();
 assert.equal(indexReads,1,'manual refresh fetches once');
 await authCallback(null);
 assert(cached.window.document.querySelector('#executive-dashboard').classList.contains('hidden'));
 cached.window.close();
 timings.sort((a,b)=>a-b);
 const report={fixture:{tournaments:1000,teamEntries:26000,uniquePeople:32,matches:100000,financeRows:20000,synthetic:true},archive:{beforeLoginBytes:bytes(data),afterLoginBytes:0,firstPageBytes:pageBytes,firstPageRows:25,pagesToVisitAll:pages,uniqueVisited:seen.size,queryCpuP50Ms:timings[15],queryCpuP95Ms:timings[28]},dashboard:{compute1000Ms:computeMs,cachedSnapshotBytes:bytes(dashboard),cachedBootArchiveBytes},limitations:'Local Node simulation, not production network latency or concurrent-user load. 100 matches and 20 finance rows per tournament are assumptions; 26 team entries / 32 people match the supplied dashboard.'};
 console.log(JSON.stringify(report,null,2));dom.window.close();
}
main().catch(e=>{console.error(e);process.exitCode=1});
