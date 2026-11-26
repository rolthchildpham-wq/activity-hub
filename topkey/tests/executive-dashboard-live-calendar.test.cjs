'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('topkey/executive-dashboard.js','utf8');
const sandbox={window:{},document:{readyState:'loading',addEventListener(){}},console,Intl,Date,Map,Set,Object,Array,String,Number,Math,JSON,Promise};
vm.runInNewContext(source,sandbox,{timeout:3000});
const api=sandbox.window.TopkeyExecutiveDashboard;
const dbRows={
 'topkey_volleyball_vnext_2026/matches':{mSat:{id:'mSat',code:'V001',teamAId:'a',teamBId:'b',date:'2026-11-28',time:'09:00',status:'SCHEDULED'}},
 'topkey_volleyball_vnext_2026/teams':{a:{id:'a',name:'Volley Alpha'},b:{id:'b',name:'Volley Beta'}},
 'topkey_volleyball_vnext_2026/config':{title:'Giải bóng chuyền TOPKEY'}
};
const db={ref(path){return{once:async()=>({val:()=>dbRows[path]??null})}}};
test('executive calendar reads live sport-scoped fixtures, not only archived tournamentIndex',async()=>{
 const raw=await api.readRaw(db),data=api.compute(raw,{clubs:{}});
 const row=data.calendarEvents.find(x=>x.date==='2026-11-28'&&x.sport==='Bóng chuyền');
 assert.ok(row,'Saturday match must enter the live calendar');
 assert.match(row.label,/V001/);
 assert.match(row.label,/Volley Alpha/);
 assert.match(row.label,/Volley Beta/);
});
test('Saturday fixture renders into the correct Saturday cell with match details',async()=>{
 const raw=await api.readRaw(db),data=api.compute(raw,{clubs:{}}),html=api.calendarMarkup(data.calendarEvents);
 assert.equal(new Date('2026-11-28T12:00:00').getDay(),6);
 assert.match(html,/data-date="2026-11-28"/);
 assert.match(html,/V001/);
 assert.match(html,/Volley Alpha/);
 assert.match(html,/T7/);
});
test('calendar avoids duplicating a match already present in archived tournament reports',async()=>{
 const merged={...dbRows,'topkey_badminton_vnext_2026/tournamentIndex':{volleyball:{old:{title:'Archive',finalReport:{matches:{mSat:{id:'mSat',code:'V001',date:'2026-11-28',status:'SCHEDULED'}},teams:{},finance:{rows:{}}}}}}};
 const raw=await api.readRaw({ref(path){return{once:async()=>({val:()=>merged[path]??null})}}});
 assert.equal(raw.__liveCalendarEvents.filter(x=>x.matchId==='mSat').length,0);
});
