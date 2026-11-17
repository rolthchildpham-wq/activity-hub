'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const modulePath='sports/vnext/src/upgrade11.js';
const source=fs.readFileSync(path.join(root,modulePath),'utf8');
const bundle=fs.readFileSync(path.join(root,'sports/vnext/h97-vnext.bundle.js'),'utf8');
const html=fs.readFileSync(path.join(root,'sports/vnext/index.html'),'utf8');
const utils=fs.readFileSync(path.join(root,'sports/vnext/src/utils.js'),'utf8');
const between=(s,a,b)=>{const i=s.indexOf(a),j=s.indexOf(b,i);assert(i>=0&&j>i,'Missing source section: '+a);return s.slice(i,j);};
const parser=between(utils,'parseCsv(text){','    slug(s){');
const parseCsv=vm.runInNewContext('({'+parser+'}).parseCsv');
const validate=between(source,'function validateRoster(roster){','function injectRosterUI()');
const resolver=between(source,'function rosterForEdit(team,registrations){','function openRoster(id){');
const importer=between(source,'  App.importTeamsCSV=async function(file,input){','  App.exportTeamsCSV=function(){');
assert(bundle.includes(validate.trim()),'Bundled roster validation differs from source');
assert(bundle.includes(resolver.trim()),'Bundled recovery logic differs from source');
assert(bundle.includes(importer.trim()),'Bundled CSV importer differs from source');
assert.match(html,/h97-vnext\.bundle\.js\?v=roster-csv-recovery-20261117-r1/);
let nextId=5,writeCalls=[],toasts=[];
const state={teams:{
 a:{id:'a',code:'T001',name:'MÀI NHÁM',p1:'Trưởng đội A',roster:[],checkedIn:true,category:'NAM_6V6'},
 b:{id:'b',code:'T002',name:'VĂN PHÒNG',p1:'Trưởng đội B',roster:[{name:'Cầu thủ B',jersey:'8'}],checkedIn:true},
 c:{id:'c',code:'T003',name:'TRANG TRÍ',p1:'Trưởng đội C',registrationId:'reg-ok',roster:[]},
 d:{id:'d',code:'T004',name:'PHỐI TRỘN',p1:'Trưởng đội D',registrationId:'reg-mismatch',roster:[]}
},matches:{m1:{id:'m1',teamAId:'a',teamBId:'b',status:'SCHEDULED'}}};
const ctx={
 App:{state},
 U:{parseCsv,id:()=> 'teamnew'+(nextId++),toast:(msg,level)=>toasts.push({msg,level})},
 T:{Data:{path:x=>x,queueMulti:async updates=>{writeCalls.push(JSON.parse(JSON.stringify(updates)));for(const [key,record] of Object.entries(updates)){assert.match(key,/^teams\//,'No writes to matches, registrations or rules');state.teams[key.slice(6)]=record;}}}},
 S:{categories:['NAM_6V6']},
 Date,JSON,Set,String,Object,Array,Number
};
vm.createContext(ctx);
vm.runInContext(validate+resolver+importer,ctx);
const testCsv=(rows)=>{
 const keys=['Ma','Ten','DoiTruong','HLV','DonVi','NoiDung','DanhSachCauThu_JSON'];
 const cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 return '\uFEFF'+keys.join(',')+'\n'+rows.map(r=>keys.map(k=>cell(r[k])).join(',')).join('\n')+'\n';
};
const file=text=>({text:async()=>text});
const sourceRoster=[{name:'Nguyễn Văn A',jersey:'10',employeeId:'NV001',shirtSize:'L'},{name:'Trần Văn B',jersey:'11',employeeId:'NV002',shirtSize:'XL'}];
(async()=>{
 const csv=testCsv([{Ma:'T001',Ten:'MÀI NHÁM',DoiTruong:'Trưởng đội A',DanhSachCauThu_JSON:JSON.stringify(sourceRoster)}]);
 assert.equal(parseCsv(csv)[0].DanhSachCauThu_JSON,JSON.stringify(sourceRoster),'Quoted roster JSON must roundtrip');
 const input={value:'selected.csv'};
 await ctx.App.importTeamsCSV(file(csv),input);
 assert.equal(writeCalls.length,1);
 assert.equal(Object.keys(state.teams).length,4,'Must not create duplicate teams');
 assert.deepStrictEqual(JSON.parse(JSON.stringify(state.teams.a.roster)),sourceRoster);
 assert.equal(state.teams.a.checkedIn,true,'Must preserve check-in state');
 assert.equal(state.matches.m1.teamAId,'a','Schedule links must remain unchanged');
 assert.equal(input.value,'');
 await ctx.App.importTeamsCSV(file(csv),{value:'selected.csv'});
 assert.equal(writeCalls.length,1,'Reimport must not rewrite or duplicate teams');
 const existingCSV=testCsv([{Ma:'T002',Ten:'VĂN PHÒNG',DoiTruong:'Trưởng đội B',DanhSachCauThu_JSON:JSON.stringify([{name:'Unknown',jersey:'33'}])}]);
 await ctx.App.importTeamsCSV(file(existingCSV),{value:'x'});
 assert.equal(writeCalls.length,1,'Never overwrite a populated roster');
 assert.equal(state.teams.b.roster[0].name,'Cầu thủ B');
 const malformed=testCsv([{Ma:'T003',Ten:'TRANG TRÍ',DoiTruong:'Trưởng đội C',DanhSachCauThu_JSON:'{invalid json'}]);
 await ctx.App.importTeamsCSV(file(malformed),{value:'x'});
 assert.equal(writeCalls.length,1,'Malformed CSV cannot write');
 assert(toasts.some(x=>x.level==='err'&&x.msg.includes('không hợp lệ')),'Malformed JSON must be surfaced');
 const newCSV=testCsv([{Ma:'T005',Ten:'ĐỘI MỚI',DoiTruong:'Đội trưởng E',DanhSachCauThu_JSON:JSON.stringify([{name:'Cầu thủ E',jersey:'5'}])}]);
 await ctx.App.importTeamsCSV(file(newCSV),{value:'x'});
 assert.equal(Object.keys(state.teams).length,5);
 assert.equal(state.matches.m1.status,'SCHEDULED');
 assert.equal(state.teams.teamnew5.roster[0].name,'Cầu thủ E');
 const reg={
  'reg-ok':{status:'APPROVED',teamId:'c',roster:[{name:'Cầu thủ C',jersey:'4'}]},
  'reg-mismatch':{status:'APPROVED',teamId:'different-id',roster:[{name:'Bad'}]}
 };
 assert.equal(ctx.rosterForEdit(state.teams.c,reg).source,'registration');
 assert.equal(ctx.rosterForEdit(state.teams.d,reg).source,'missing');
 assert.equal(ctx.rosterForEdit(state.teams.a,reg).source,'team');
 assert.equal(ctx.rosterForEdit({...state.teams.c,id:'c',registrationId:'pending'}, {'pending':{status:'PENDING',roster:[{name:'Do not use'}]}}).source,'missing');
 console.log('PASS volleyball roster recovery: CSV roundtrip, no duplicate teams, schedule preserved, malformed JSON rejected, approved registration fallback');
})().catch(e=>{console.error(e);process.exitCode=1});
