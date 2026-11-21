'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('topkey/sports/vnext/src/schedule-delete-h138.js','utf8');
const html = fs.readFileSync('topkey/sports/vnext/index.html','utf8');
function setup(role='ADMIN',connected=true){
 const match = {id:'match_1',code:'M001',date:'',time:'',teamAId:'A',teamBId:'B',
   category:'NAM_6V6',stage:'GROUP',status:'SCHEDULED',sets:[]};
 const data={'matches/match_1':structuredClone(match)};
 const updates=[],downloads=[],messages=[];
 const input={value:'undated'};
 const app={
   state:{matches:{match_1:structuredClone(match)},activeMatches:{}},
   renderMatches(){return 'rendered'},
   resultLabel(){return '—'},
   matchLabel(){return 'A vs B'},
   openDelete(){},
   deletePlan(){return {deletable:[],skipped:[]}},
   previewDelete(){return this.deletePlan()}
 };
 const T={
   SPORT:{key:'volleyball'},VERSION:'test',
   U:{id:()=> 'audit_1',download:(...a)=>downloads.push(a),
     confirmDanger:async()=>true,toast:(...a)=>messages.push(a)},
   Auth:{role:()=>role,user:{uid:'admin'},profile:{displayName:'Admin'}},
   idb:{all:async()=>[]},
   Data:{connected,auth:{currentUser:{uid:'admin'}},tid:'test_schedule',
     path:p=>'root/tournaments/test_schedule/'+p,
     flushQueue:async()=>{},
     ref:p=>({once:async()=>({val:()=>data[p]||null,exists:()=>!!data[p]})}),
     db:{ref:()=>({update:async u=>{updates.push(u);
       for(const [path,value] of Object.entries(u)){
         const k=path.replace('root/tournaments/test_schedule/','');
         if(value===null)delete data[k];else data[k]=value;
       }
     }})}
   }
 };
 const document={
  querySelector:s=>s==='input[name="delete-scope"]:checked'?input:null,
  querySelectorAll:()=>[],
  getElementById:id=>({
    value:id==='delete-category'||id==='delete-stage'?'ALL':'',
    classList:{add(){}}
  })
 };
 const window={Topkey:{...T,App:app},addEventListener(){}};
 vm.runInNewContext(source,{window,document,Blob,Date,JSON,Object,Set,Promise,console},{timeout:1000});
 return {app,T,document,input,data,downloads,messages,updates};
}
test('undated scope selects M001 even though date is empty',()=>{
 const x=setup();
 const p=x.app.deletePlan();
 assert.equal(p.deletable.length,1);
 assert.equal(p.deletable[0].code,'M001');
});
test('ADMIN deletes a single unplayed match by persisted RTDB update with audit',async()=>{
 const x=setup();
 await x.app.deleteMatch('match_1');
 assert.equal(x.data['matches/match_1'],undefined);
 assert.equal(x.updates.length,1);
 assert.ok(x.data['audit/audit_1']);
 assert.equal(x.downloads.length,1);
});
test('non-admin and disconnected sessions cannot delete a match',async()=>{
 for(const [role,connected] of [['VIEWER',true],['ADMIN',false]]){
  const x=setup(role,connected);
  await x.app.deleteMatch('match_1');
  assert.ok(x.data['matches/match_1']);
  assert.equal(x.updates.length,0);
 }
});
test('single-match deletion protects already finished results',async()=>{
 const x=setup();
 x.app.state.matches.match_1.status='FINISHED';
 await x.app.deleteMatch('match_1');
 assert.equal(x.updates.length,0);
});
test('UI includes undated scope and loaded delete controller',()=>{
 assert.match(html,/name="delete-scope" value="undated"/);
 assert.match(html,/schedule-delete-h138\.js/);
});
