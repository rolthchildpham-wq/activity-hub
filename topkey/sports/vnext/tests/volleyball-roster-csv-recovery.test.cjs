'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),src=fs.readFileSync(path.join(root,'src/roster-csv-recovery.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.match(html,/src\/roster-csv-recovery\.js\?v=20261117-roster-import-r1/);
assert.match(src,/football','volleyball/);
const writes=[],toasts=[];let accept=true,rows=[];
const teams={
 legacy1:{id:'legacy1',code:'T001',name:'MÀI NHÁM',category:'NAM_6V6',p1:'Đinh Văn A',checkedIn:true},
 filled:{id:'filled',code:'T002',name:'VĂN PHÒNG',category:'NAM_6V6',p1:'B',roster:[{name:'Đã có cầu thủ',jersey:'8'}]}
};
const T={SPORT:{key:'volleyball',categories:['NAM_6V6']},
 U:{parseCsv:()=>rows,id:()=> 'generated1',toast:(...a)=>toasts.push(a),confirmDanger:async()=>accept},
 Data:{connected:true,path:k=>'root/main_2026/'+k,queueMulti:async(up,meta)=>{writes.push({up,meta});}},
 App:{state:{teams,matches:{match1:{id:'match1',teamAId:'legacy1',teamBId:'filled'}}},nextCode:()=> 'T003'}
};
const doc={readyState:'complete',getElementById:()=>null};
const window={Topkey:T,__TOPKEY_VNEXT_BOOT:null};
const ctx={window,document:doc,console,Date,JSON,Set,Object,Array,String,Number,Error,Promise};
vm.createContext(ctx);new vm.Script(src,{filename:'roster-csv-recovery.js'}).runInContext(ctx);
const api=window.TopkeyRosterCsvRecovery;
assert(api);
const originalTeam=JSON.stringify(teams.legacy1),originalMatch=JSON.stringify(T.App.state.matches);
const exportedRow={Ma:'T001',Ten:'MÀI NHÁM',DoiTruong:'Đinh Văn A',HLV:'HLV C',DonVi:'Xưởng',NoiDung:'NAM_6V6',DanhSachCauThu_JSON:JSON.stringify([{name:'Nguyễn Văn A',jersey:'9',employeeId:'NV9',shirtSize:'M'},{name:'Lê Văn B',jersey:'10',employeeId:'NV10',shirtSize:'L'}])};
const p=api.plan([exportedRow],teams,()=> 'T003',()=> 'generated1','NAM_6V6');
assert.equal(p.recovered,1);assert.equal(p.created,0);
assert.equal(Object.keys(p.updates).filter(k=>!k.endsWith('/updatedAt')).join(''),'teams/legacy1/roster');
assert.equal(JSON.parse(JSON.stringify(p.updates['teams/legacy1/roster'])).length,2);
assert.equal(JSON.stringify(teams.legacy1),originalTeam,'Planning must not mutate existing team');
assert.equal(JSON.stringify(T.App.state.matches),originalMatch,'Planning must not touch the schedule');
const full=api.plan([exportedRow,{...exportedRow,Ma:'T003',Ten:'PHÂN XƯỞNG',DoiTruong:'Trần Văn C'}],teams,()=> 'T004',()=> 'generated1','NAM_6V6');
assert.equal(full.created,1);assert.equal(full.recovered,1);assert.equal(full.updates['teams/generated1'].roster.length,2);
const preserved=api.plan([{...exportedRow,Ma:'T002',Ten:'VĂN PHÒNG'}],teams,()=> 'T003',()=> 'x','NAM_6V6');
assert.equal(preserved.skipped,1);assert.equal(Object.keys(preserved.updates).length,0,'Never overwrite populated rosters');
assert.throws(()=>api.plan([{...exportedRow,DanhSachCauThu_JSON:'broken'}],teams,()=> 'T003',()=> 'x','NAM_6V6'),/JSON không hợp lệ/);
assert.throws(()=>api.plan([{...exportedRow,Ten:'SAI TÊN'}],teams,()=> 'T003',()=> 'x','NAM_6V6'),/đang thuộc đội khác/);
assert.throws(()=>api.plan([exportedRow,exportedRow],teams,()=> 'T003',()=> 'x','NAM_6V6'),/Đội trùng/);
assert.throws(()=>api.plan([{...exportedRow,DanhSachCauThu_JSON:JSON.stringify([{name:'A',jersey:'10'},{name:'B',jersey:'10'}])}],teams,()=> 'T003',()=> 'x','NAM_6V6'),/Trùng số áo/);
const noRoster=api.plan([{...exportedRow,Ma:'T003',Ten:'NEW',DanhSachCauThu_JSON:''}],teams,()=> 'T003',()=> 'generated1','NAM_6V6');
assert.equal(noRoster.missingRoster,1,'Do not invent player names from leader');
(async()=>{
 rows=[exportedRow];
 const input={value:'file.csv'};
 await T.App.importTeamsCSV({text:async()=> 'mock csv'},input);
 assert.equal(writes.length,1);assert.deepEqual(Object.keys(writes[0].up).sort(),['root/main_2026/teams/legacy1/roster','root/main_2026/teams/legacy1/updatedAt']);
 assert.equal(writes[0].up['root/main_2026/teams/legacy1/roster'].length,2);
 assert.equal(input.value,'');
 accept=false;await T.App.importTeamsCSV({text:async()=> 'mock csv'},input);
 assert.equal(writes.length,1,'Cancel must prevent all writes');
 rows=[{...exportedRow,DanhSachCauThu_JSON:'broken'}];accept=true;
 await T.App.importTeamsCSV({text:async()=> 'mock csv'},input);
 assert.equal(writes.length,1,'Malformed CSV must never be written');
 assert.equal(JSON.stringify(teams.legacy1),originalTeam);
 assert.equal(JSON.stringify(T.App.state.matches),originalMatch);
 console.log('PASS volleyball roster CSV: export schema, existing-team recovery, matching IDs, no schedule changes, validation, cancel and no fabricated players');
})().catch(err=>{console.error(err);process.exitCode=1});
