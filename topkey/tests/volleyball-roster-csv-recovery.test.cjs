'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'sports/vnext/src/roster-csv-recovery.js'),'utf8');
const html=fs.readFileSync(path.join(root,'sports/vnext/index.html'),'utf8');
function makeHarness(){
 const writes=[],toasts=[];
 const state={teams:{
  a:{id:'a',code:'T001',name:'MÀI NHÁM',p1:'Trưởng đội A',category:'NAM_6V6',roster:[],checkedIn:true},
  b:{id:'b',code:'T002',name:'VĂN PHÒNG',p1:'Trưởng đội B',category:'NAM_6V6',roster:[{name:'Cầu thủ B',jersey:'8'}],checkedIn:true}
 },matches:{m1:{id:'m1',teamAId:'a',teamBId:'b',status:'SCHEDULED'}}};
 const rows=[];
 const App={state,nextCode:()=> 'T099'};
 const U={parseCsv:()=>rows,id:()=> 'new-team',confirmDanger:async()=>true,toast:(message,level)=>toasts.push({message,level})};
 const T={SPORT:{key:'volleyball',categories:['NAM_6V6']},App,U,Data:{connected:true,path:value=>value,queueMulti:async updates=>{writes.push(structuredClone(updates));for(const [key,value] of Object.entries(updates)){const [rootKey,id,field]=key.split('/');if(rootKey==='teams'&&field){state.teams[id]??={id};state.teams[id][field]=value}else if(rootKey==='teams')state.teams[id]=value;}}}};
 const document={readyState:'complete',getElementById:()=>null,createElement:()=>({}),addEventListener(){}};
 const window={Topkey:T};
 vm.runInNewContext(source,{window,document,Date,Set,Map,JSON,Array,Object,String,Number,Error,Promise,console},{timeout:1500});
 return {App,T,U,state,rows,writes,toasts,api:window.TopkeyRosterCsvRecovery};
}
test('active VNext entry loads the roster recovery module, not the obsolete monolithic bundle',()=>{
 assert.match(html,/src\/roster-csv-recovery\.js\?v=20261117-roster-import-r1/);
 assert.doesNotMatch(html,/<script[^>]+src=["'][^"']*h97-vnext\.bundle\.js/i,'the obsolete bundle must not be loaded as a direct script; shared bootstrap owns core loading');
 assert.ok(source.includes('function plan(')&&source.includes('function parseRoster('));
});
test('recovery planner restores an empty existing roster without changing team ID or match links',()=>{
 const h=makeHarness();
 const result=h.api.plan([{Ma:'T001',Ten:'MÀI NHÁM',DoiTruong:'Trưởng đội A',DanhSachCauThu_JSON:JSON.stringify([{name:'Nguyễn Văn A',jersey:'10',employeeId:'NV001',shirtSize:'L'}])}],h.state.teams,()=> 'T099',()=> 'new-team','NAM_6V6');
 assert.equal(result.created,0);assert.equal(result.recovered,1);
 assert.ok(result.updates['teams/a/roster']);
 assert.equal(h.state.teams.a.id,'a');
 assert.equal(h.state.teams.a.checkedIn,true);
 assert.equal(h.state.matches.m1.teamAId,'a');
});
test('planner never overwrites populated rosters and rejects a mismatched team code',()=>{
 const h=makeHarness();
 const populated=h.api.plan([{Ma:'T002',Ten:'VĂN PHÒNG',DoiTruong:'Trưởng đội B',DanhSachCauThu_JSON:JSON.stringify([{name:'Other',jersey:'99'}])}],h.state.teams,()=> 'T099',()=> 'new-team','NAM_6V6');
 assert.equal(populated.recovered,0);assert.equal(populated.created,0);assert.equal(populated.skipped,1);
 assert.throws(()=>h.api.plan([{Ma:'T002',Ten:'ĐỘI KHÁC',DoiTruong:'X',DanhSachCauThu_JSON:'[]'}],h.state.teams,()=> 'T099',()=> 'new-team','NAM_6V6'),/đang thuộc đội khác/);
});
test('planner rejects duplicate rows and malformed roster JSON before any write',()=>{
 const h=makeHarness();
 const row={Ma:'T001',Ten:'MÀI NHÁM',DoiTruong:'Trưởng đội A',DanhSachCauThu_JSON:'[]'};
 assert.throws(()=>h.api.plan([row,row],h.state.teams,()=> 'T099',()=> 'new-team','NAM_6V6'),/Đội trùng/);
 assert.throws(()=>h.api.plan([{...row,DanhSachCauThu_JSON:'{invalid'}],h.state.teams,()=> 'T099',()=> 'new-team','NAM_6V6'),/JSON không hợp lệ/);
 assert.equal(h.writes.length,0);
});
test('CSV import writes only team roster paths and preserves scheduled matches',async()=>{
 const h=makeHarness();
 h.rows.push({Ma:'T001',Ten:'MÀI NHÁM',DoiTruong:'Trưởng đội A',DanhSachCauThu_JSON:JSON.stringify([{name:'Nguyễn Văn A',jersey:'10'}])});
 await h.App.importTeamsCSV({text:async()=>'ignored'},{value:'selected.csv'});
 assert.equal(h.writes.length,1);
 assert.ok(Object.keys(h.writes[0]).every(key=>key.startsWith('teams/')),'CSV recovery may only write teams');
 assert.equal(h.state.teams.a.id,'a');
 assert.equal(h.state.teams.a.checkedIn,true);
 assert.equal(h.state.matches.m1.status,'SCHEDULED');
 assert.equal(h.state.matches.m1.teamAId,'a');
 assert.equal(h.toasts.length,1);
});
test('CSV import clears file input after completion and never overwrites an existing roster',async()=>{
 const h=makeHarness();
 h.rows.push({Ma:'T002',Ten:'VĂN PHÒNG',DoiTruong:'Trưởng đội B',DanhSachCauThu_JSON:JSON.stringify([{name:'Other',jersey:'99'}])});
 const input={value:'selected.csv'};
 await h.App.importTeamsCSV({text:async()=>'ignored'},input);
 assert.equal(input.value,'');
 assert.equal(h.writes.length,0);
 assert.equal(h.state.teams.b.roster[0].name,'Cầu thủ B');
});
