'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'../..');
let src=fs.readFileSync(path.join(root,'club-planning.js'),'utf8');
src=src.replace('window.TopkeyClubPlanning={version:VERSION,build:BUILD,seedBadminton:deep(SEED_BADMINTON),planSummary};',
 'window.TopkeyClubPlanning={version:VERSION,build:BUILD,seedBadminton:deep(SEED_BADMINTON),planSummary,readPlan,writePlan,writeSchedule,planPath,normalizePlan,planTemplate,watchPlans};');
const location={search:''},handlers=[],window={TopkeyRelease:{version:'H117',cacheTag:'u122h117-20261109'}};
vm.runInNewContext(src,{window,document:{readyState:'loading',addEventListener:(...args)=>handlers.push(args)},location,console,Date,Intl,URLSearchParams,localStorage:{getItem:()=> 'vi'},confirm:()=>true},{filename:'club-planning.js'});
const m=window.TopkeyClubPlanning;
const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
const db={data:{},ref(key){return{async once(){return{val:()=>copy(db.data[key]??null)}},async transaction(fn){const cur=copy(db.data[key]??null),res=fn(cur);if(res===undefined)return{committed:false,snapshot:{val:()=>copy(cur)}};db.data[key]=copy(res);return{committed:true,snapshot:{val:()=>copy(res)}}}}}};
let passed=0;
function ok(x,msg){assert(x,msg);passed++;console.log('PASS',msg)}
(async()=>{
 // First-save regression: a displayed seed MUST persist even if user did not edit any input.
 const seed=m.seedBadminton;
 const notSaved=await m.readPlan(db,'badminton');
 ok(notSaved.tasks.length===0&&notSaved.budget.income.length===0,'unsaved Excel sample not shown as persisted dashboard finance');
 const seeded=await m.writePlan(db,'cooking',m.planTemplate('cooking'),'first-admin',m.planTemplate('cooking'));
 ok(seeded.updatedAt>0&&db.data['topkey_cooking_vnext_2026/clubPlan']?.updatedAt>0,'first Save writes previously unpersisted template');
 const init=m.planTemplate('badminton');init.info.title='Cầu lông';init.info.location='Hall A';
 init.budget.income=[{id:'1',code:'A',item:'Funding',amount:1000}];
 init.schedule=[{id:'reg',label:{vi:'Đăng ký',en:'Registration',zh:'报名'},endDate:'2026-11-01'}];
 let v=await m.writePlan(db,'badminton',init,'admin');ok(v.info.title==='Cầu lông','initial create');
 const baseA=copy(v),baseB=copy(v);
 v.info.title='Cầu lông 2026';const a=await m.writePlan(db,'badminton',v,'adminA',baseA);
 const draftB=copy(baseB);draftB.budget.income[0].amount=1500;
 const b=await m.writePlan(db,'badminton',draftB,'adminB',baseB);
 ok(b.info.title==='Cầu lông 2026'&&b.budget.income[0].amount===1500,'nonoverlapping concurrent edits merge without data loss');
 ok(b.history.length>=3&&b.history.at(-1).changed.includes('budget.income'),'changes logged with modified field keys');
 const baseC=copy(b),baseD=copy(b);
 const draftC=copy(baseC);draftC.info.location='Hall C';
 await m.writePlan(db,'badminton',draftC,'adminC',baseC);
 const draftD=copy(baseD);draftD.info.location='Hall D';
 let conflict=false;try{await m.writePlan(db,'badminton',draftD,'adminD',baseD)}catch(e){conflict=e.message==='REVISION_CONFLICT:info.location'}
 ok(conflict,'overlapping same-field concurrent edits rejected');
 ok((await m.readPlan(db,'badminton')).info.location==='Hall C','collision did not overwrite winner');
 let current=await m.readPlan(db,'badminton');const revision=current.updatedAt,baseSchedule=copy(current.schedule);
 const update=copy(current);update.budget.expense.push({code:'E',amount:42});await m.writePlan(db,'badminton',update,'admin',current);
 const scheduled=[...baseSchedule,{id:'group',label:{vi:'Vòng bảng'},startDate:'2026-11-02',endDate:'2026-11-03'}];
 const merged=await m.writeSchedule(db,'badminton',scheduled,revision,'adminSchedule',baseSchedule);
 ok(merged.budget.expense[0].amount===42&&merged.schedule.length===2,'schedule save preserves concurrent budget edit');
 const staleSchedule=copy(merged.schedule),before=merged.updatedAt;
 const first=[...staleSchedule,{id:'final',label:{vi:'Chung kết'},endDate:'2026-11-04'}];
 await m.writeSchedule(db,'badminton',first,before,'admin1',staleSchedule);
 conflict=false;
 try{await m.writeSchedule(db,'badminton',[],before,'admin2',staleSchedule)}catch(e){conflict=e.message==='REVISION_CONFLICT:schedule'}
 ok(conflict,'stale schedule cannot delete concurrent schedule changes');
 const final=await m.readPlan(db,'badminton');ok(final.schedule.length===3&&final.budget.income[0].amount===1500,'schedule and finance remain intact');
 location.search='?testlab=1&tid=__testlab_u122_20261031_badminton_h1170';
 const testpath=m.planPath('badminton');ok(testpath.includes('/tournaments/__testlab_')&&testpath!==m.planPath('badminton').replace(/__testlab_/,'production_'),'separate Test Lab namespace');
 const testcopy=m.planTemplate('badminton');testcopy.info.title='TEST ONLY';await m.writePlan(db,'badminton',testcopy,'tester');
 ok((await m.readPlan(db,'badminton')).info.title==='TEST ONLY','Test Lab writes own plan');
 location.search='';ok((await m.readPlan(db,'badminton')).info.title==='Cầu lông 2026','production plan not changed by Test Lab');
 // A delete or write on a different sport must not cross the defined root.
 const planFB=m.planTemplate('football');planFB.info.title='Football only';await m.writePlan(db,'football',planFB,'admin');
 ok((await m.readPlan(db,'badminton')).info.title==='Cầu lông 2026','sport scopes isolated');
 console.log('H117 CLUB CONCURRENCY',passed+'/'+passed,'PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
