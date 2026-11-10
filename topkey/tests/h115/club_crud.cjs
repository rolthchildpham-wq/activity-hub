const fs=require('fs'),vm=require('vm'),assert=require('assert');
let src=fs.readFileSync(require('path').join(__dirname,'../..','club-planning.js'),'utf8');
src=src.replace('window.TopkeyClubPlanning={version:VERSION,build:BUILD,seedBadminton:deep(SEED_BADMINTON),planSummary};', 'window.TopkeyClubPlanning={version:VERSION,build:BUILD,seedBadminton:deep(SEED_BADMINTON),planSummary,readPlan,writePlan,writeSchedule,planPath,renderPlanTab,readEditor,scheduleRow,validateSchedule};');
const callbacks=[];const loc={search:''};
const c={window:{TopkeyRelease:{version:'H115',cacheTag:'u122h115-20261109'}},document:{readyState:'loading',addEventListener:(k,cb)=>callbacks.push([k,cb])},location:loc,console,Date,URLSearchParams,Intl,localStorage:{getItem:()=>'vi'},confirm:()=>true};
vm.runInNewContext(src,c,{filename:'club-planning.js'});
const mod=c.window.TopkeyClubPlanning;let results=[];
function ok(desc,v){assert.ok(v,desc);results.push('PASS '+desc)}
const db={data:{},ref(path){return{async once(){return{val:()=>structuredClone(db.data[path]??null)}},async transaction(fn){const cur=structuredClone(db.data[path]??null);const next=fn(cur);if(next===undefined)return{committed:false,snapshot:{val:()=>structuredClone(cur)}};db.data[path]=structuredClone(next);return{committed:true,snapshot:{val:()=>structuredClone(next)}}}}}};
(async()=>{
 const path=mod.planPath('badminton');ok('production clubPlan isolation',path==='topkey_badminton_vnext_2026/clubPlan');
 let plan={info:{title:'Badminton plan',location:'Hall A'},schedule:[{id:'one',label:{vi:'Đăng ký',en:'Registration',zh:'报名'},startDate:'2026-11-01',endDate:'2026-11-02'}],budget:{income:[{code:'IN',amount:100}],expense:[]},tasks:[],updatedAt:0};
 const saved=await mod.writePlan(db,'badminton',plan,'admin');ok('write full plan',saved.updatedAt>0&&saved.budget.income[0].amount===100);
 const updated=await mod.writeSchedule(db,'badminton',[{id:'one',label:{vi:'Vòng đấu',en:'Round',zh:'比赛轮'},startDate:'2026-11-03',endDate:'2026-11-04'}],saved.updatedAt,'admin');
 ok('schedule-only update persists',updated.schedule[0].label.vi==='Vòng đấu');ok('budget unchanged during schedule save',updated.budget.income[0].amount===100);
 let conflict=false;try{await mod.writeSchedule(db,'badminton',[],saved.updatedAt,'admin')}catch(e){conflict=e.message==='REVISION_CONFLICT'}ok('concurrent stale revision refused',conflict);
 const removed=await mod.writeSchedule(db,'badminton',[],updated.updatedAt,'admin');ok('delete all schedule persisted',removed.schedule.length===0);ok('delete schedule leaves budget intact',removed.budget.income[0].amount===100);
 const full=await mod.writePlan(db,'badminton',{...removed,info:{...removed.info,title:'Edited'}},'admin');ok('full plan save after schedule update',full.info.title==='Edited');
 let invalid=false;try{await mod.writeSchedule(db,'badminton',[{id:'x',label:{vi:'a'},startDate:'2026-12-02',endDate:'2026-11-03'}],full.updatedAt,'admin')}catch(e){invalid=e.message==='SCHEDULE_DATE_RANGE'}ok('invalid schedule date refused',invalid);
 const row=mod.scheduleRow({id:'stage_1',label:{vi:'Tiếng Việt',en:'English',zh:'中文'},startDate:'2026-11-01',endDate:'2026-11-02'},0);
 ok('milestone row keeps tri-language source',row.includes('data-stage-vi')&&row.includes('data-stage-zh')&&row.includes('data-stage-en'));ok('milestone row offers edit/delete',row.includes('data-edit-row')&&row.includes('data-del-row'));
 const tab=mod.renderPlanTab(plan);ok('schedule actions available',tab.includes('tk115-save-schedule')&&tab.includes('tk115-clear-schedule')&&tab.includes('tk115-reload-schedule'));
 loc.search='?testlab=1&tid=__testlab_u122_20261031_badminton_aa123';ok('testlab does not write production path',mod.planPath('badminton').includes('/tournaments/__testlab_'));
 let invalidTid=false;loc.search='?testlab=1&tid=main_2026';try{mod.planPath('badminton')}catch(e){invalidTid=e.message==='TESTLAB_TID_INVALID'}ok('testlab rejects production tournament ID',invalidTid);
 console.log(results.join('\n'));console.log('TOTAL',results.length+'/'+results.length);
})().catch(e=>{console.error(e);process.exitCode=1});
