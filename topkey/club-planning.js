(()=>{'use strict';
const AUTH_ROOT='topkey_badminton_vnext_2026';
const BUILD=window.TopkeyRelease?.cacheTag||'UNAVAILABLE_RELEASE_RUNTIME';
const VERSION=window.TopkeyRelease?.version||'UNAVAILABLE_RELEASE_RUNTIME';
const SPORTS={
 badminton:{name:'Cầu lông',icon:'🏸',root:'topkey_badminton_vnext_2026'},
 football:{name:'Bóng đá',icon:'⚽',root:'topkey_football_vnext_2026'},
 volleyball:{name:'Bóng chuyền',icon:'🏐',root:'topkey_volleyball_vnext_2026'},
 running:{name:'Chạy bộ',icon:'🏃',root:'topkey_running_vnext_2026'},
 handmade:{name:'DIY / Handmade',icon:'🧶',root:'topkey_handmade_vnext_2026'},
 shuttle:{name:'Đá cầu',icon:'🪶',root:'topkey_shuttle_vnext_2026'},
 cooking:{name:'Nấu ăn',icon:'👨‍🍳',root:'topkey_cooking_vnext_2026'}
};
const TXT={
 vi:{calendar:'Lịch & kế hoạch CLB',calendarSub:'Kế hoạch hoạt động đang được BTC quản lý và tổng hợp lên Dashboard Hub.',noPlan:'Chưa có kế hoạch CLB.',editor:'Hồ sơ kế hoạch CLB · BTC',editorSub:'Dữ liệu kế hoạch, ngân sách và phân công được lưu theo từng CLB để Hub tổng hợp báo cáo.',sport:'CLB / môn',plan:'Lịch & kế hoạch',budget:'Ngân sách',tasks:'Phân công',save:'Lưu hồ sơ BTC',seed:'Nạp mẫu Excel Cầu lông',add:'Thêm dòng',title:'Tên hoạt động',period:'Thời gian',location:'Địa điểm',participants:'Số người dự kiến',organizer:'Chủ trì',coOrganizer:'Phối hợp',registration:'Hạn đăng ký',contact:'Đầu mối đăng ký',email:'Thư điện tử',objectives:'Mục tiêu',intro:'Giới thiệu',stage:'Mốc hoạt động',from:'Từ ngày',to:'Đến ngày',income:'Thu dự kiến',expense:'Chi dự kiến',balance:'Cân đối dự kiến',code:'Mã',item:'Hạng mục',amount:'Số tiền',description:'Diễn giải',type:'Loại',owner:'Phụ trách',start:'Bắt đầu',due:'Dự kiến',actual:'Thực tế',note:'Ghi chú',status:'Trạng thái',done:'Hoàn tất',overdue:'Quá hạn',open:'Đang làm',totalTasks:'Tổng việc',saved:'Đã lưu hồ sơ CLB. Dashboard Hub sẽ dùng dữ liệu mới ở lần cập nhật tiếp theo.',saveFail:'Không lưu được hồ sơ CLB',seedNote:'Dữ liệu mẫu được dựng từ workbook kế hoạch Cầu lông bạn cung cấp.',remove:'Xóa',planned:'Kế hoạch',today:'Hôm nay',next:'Sắp tới',past:'Đã qua',reportSummary:'Tóm tắt BTC',emptyBudget:'Chưa có dữ liệu ngân sách.',emptyTasks:'Chưa có dữ liệu phân công.'},
 en:{calendar:'Club calendar & plan',calendarSub:'Activity plans managed by organizers and summarized on the Hub Dashboard.',noPlan:'No club plan yet.',editor:'Club planning workspace · Organizer',editorSub:'Plan, budget and task-assignment data are saved per club for Hub reporting.',sport:'Club / sport',plan:'Calendar & plan',budget:'Budget',tasks:'Task assignment',save:'Save organizer file',seed:'Load Badminton Excel sample',add:'Add row',title:'Activity title',period:'Period',location:'Location',participants:'Expected participants',organizer:'Organizer',coOrganizer:'Co-organizer',registration:'Registration deadline',contact:'Registration contact',email:'Email',objectives:'Objectives',intro:'Introduction',stage:'Milestone',from:'From',to:'To',income:'Planned income',expense:'Planned expense',balance:'Planned balance',code:'Code',item:'Item',amount:'Amount',description:'Description',type:'Type',owner:'Owner',start:'Start',due:'Due',actual:'Actual',note:'Notes',status:'Status',done:'Done',overdue:'Overdue',open:'Open',totalTasks:'Tasks',saved:'Club file saved. Hub Dashboard will use the new data on the next refresh.',saveFail:'Could not save club file',seedNote:'Sample data is based on the Badminton planning workbook you provided.',remove:'Remove',planned:'Plan',today:'Today',next:'Upcoming',past:'Past',reportSummary:'Organizer summary',emptyBudget:'No budget data.',emptyTasks:'No task data.'},
 zh:{calendar:'社团日程与计划',calendarSub:'由组委会维护活动计划，并汇总到 Hub 仪表板。',noPlan:'尚无社团计划。',editor:'社团计划档案 · 组委会',editorSub:'各社团的计划、预算和工作分配数据会独立保存，并用于 Hub 汇总报告。',sport:'社团 / 项目',plan:'日程与计划',budget:'预算',tasks:'工作分配',save:'保存组委会档案',seed:'载入羽毛球 Excel 样例',add:'新增一行',title:'活动名称',period:'活动时间',location:'活动地点',participants:'预计人数',organizer:'主办单位',coOrganizer:'协办单位',registration:'报名截止',contact:'报名窗口',email:'电子邮箱',objectives:'活动目的',intro:'活动简介',stage:'活动节点',from:'开始日期',to:'结束日期',income:'预计收入',expense:'预计支出',balance:'预计余额',code:'编号',item:'项目',amount:'金额',description:'说明',type:'收支',owner:'负责人',start:'开始日期',due:'预计日期',actual:'实际日期',note:'备注',status:'状态',done:'已完成',overdue:'已逾期',open:'进行中',totalTasks:'工作总数',saved:'社团档案已保存。Hub 仪表板将在下次刷新时使用新数据。',saveFail:'无法保存社团档案',seedNote:'样例数据来自您提供的羽毛球社活动计划 Excel。',remove:'删除',planned:'计划',today:'今天',next:'即将开始',past:'已结束',reportSummary:'组委会汇总',emptyBudget:'暂无预算数据。',emptyTasks:'暂无工作分配数据。'}
};
Object.assign(TXT.vi,{saveSchedule:'💾 Lưu lịch',reloadSchedule:'↻ Tải lại lịch',clearSchedule:'🗑 Xóa toàn bộ lịch',editSchedule:'Sửa mốc lịch',unsavedSchedule:'Đã sửa lịch; bấm Lưu lịch để ghi vào Firebase.',confirmDeleteRow:'Xóa mốc lịch này khỏi bản nháp? Bạn cần bấm Lưu lịch để áp dụng.',confirmClearSchedule:'Xóa TẤT CẢ các mốc lịch của CLB đang chọn? Thao tác sẽ lưu vào Firebase và ghi lịch sử cập nhật.',confirmDiscard:'Bỏ các thay đổi lịch chưa lưu và tải lại từ Firebase?',scheduleSaved:'Đã lưu lịch CLB vào Firebase.',scheduleCleared:'Đã xóa lịch CLB trên Firebase.',conflict:'Dữ liệu đã thay đổi trên thiết bị khác. Hãy tải lại để tránh ghi đè.',dateError:'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.',saving:'Đang lưu…'});
Object.assign(TXT.en,{saveSchedule:'💾 Save schedule',reloadSchedule:'↻ Reload schedule',clearSchedule:'🗑 Delete full schedule',editSchedule:'Edit milestone',unsavedSchedule:'Schedule edited; click Save schedule to persist to Firebase.',confirmDeleteRow:'Remove this milestone from the draft? Click Save schedule to apply.',confirmClearSchedule:'Delete ALL milestones for the selected club? This is saved to Firebase.',confirmDiscard:'Discard unsaved changes and reload from Firebase?',scheduleSaved:'Schedule saved to Firebase.',scheduleCleared:'Schedule cleared in Firebase.',conflict:'This record changed on another device. Reload before saving to avoid overwriting.',dateError:'Start date must be on/before end date.',saving:'Saving…'});
Object.assign(TXT.zh,{saveSchedule:'💾 保存日程',reloadSchedule:'↻ 重新加载日程',clearSchedule:'🗑 清空全部日程',editSchedule:'编辑节点',unsavedSchedule:'日程已修改；请点击「保存日程」写入 Firebase。',confirmDeleteRow:'从草稿中删除该节点？点击「保存日程」后生效。',confirmClearSchedule:'确定删除选定社团的全部日程？这将保存到 Firebase。',confirmDiscard:'放弃未保存修改并重新从 Firebase 加载？',scheduleSaved:'日程已保存到 Firebase。',scheduleCleared:'日程已在 Firebase 清空。',conflict:'其他设备已修改数据。请重新加载，避免覆盖。',dateError:'开始日期不得晚于结束日期。',saving:'正在保存…'});
const SEED_BADMINTON={schemaVersion:1,source:'2026-09-羽毛球社-社团活动计划书.xlsx',info:{title:'羽毛球社活動',startDate:'2026-10-20',endDate:'2026-11-20',activityTimeText:'預計2026.10.20至  2026.11.20',location:'公司B4-2F',participantsText:'限公司員工；約40人',participantEstimate:40,organizer:'羽毛球社',coOrganizer:'總團、工會',registrationDeadline:'2026-10-17',contact:{department:'总务',name:'邓泰英书',phone:'0339226804',email:'tkvntk04@topkey.com.tw'},objectives:['丰富员工业余文化生活，缓解日常工作压力，提升全员身心健康水平。','打破部门沟通壁垒，促进跨部门、跨岗位员工的交流协作，增强团队凝聚力。','弘扬拼搏进取、团结协作的体育精神，传递积极向上的企业文化。'],intro:'组织第8届羽毛球双打比赛\n3项目：男雙、女雙、混雙',estimatedBudget:15000000},schedule:[{id:'registration',label:{vi:'Đăng ký',en:'Registration',zh:'报名'},startDate:'',endDate:'2026-10-17'},{id:'group',label:{vi:'Vòng bảng',en:'Group stage',zh:'小组赛'},startDate:'2026-10-20',endDate:'2026-11-15'},{id:'semifinal',label:{vi:'Bán kết',en:'Semifinal',zh:'半决赛'},startDate:'2026-11-16',endDate:'2026-11-19'},{id:'final',label:{vi:'Chung kết',en:'Final',zh:'决赛'},startDate:'2026-11-20',endDate:'2026-11-20'}],budget:{income:[{code:'1.1',item:'申請公司補助',amount:15000000,description:'公司补助'}],expense:[{code:'2.1',item:'羽毛球衫 (含标志印刷)',amount:4500000,description:'125,000VND/件*40人'},{code:'2.2',item:'冠軍',amount:2400000,description:'現金*3将'},{code:'2.3',item:'亞軍',amount:1500000,description:'現金*3将'},{code:'2.4',item:'李軍',amount:900000,description:'現金*3将'},{code:'2.5',item:'鼓励奖',amount:600000,description:'現金*6将'},{code:'2.6',item:'饮用水 + 功能饮料',amount:650000,description:'2箱aquafina+2箱revive'},{code:'2.7',item:'赛事背景板',amount:500000,description:'1个'},{code:'2.8',item:'紀念獎牌',amount:540000,description:'18个'},{code:'2.9',item:'旗',amount:225000,description:'9个'},{code:'2.10',item:'羽毛球',amount:2500000,description:'»13.盒'}]},tasks:[{id:'1',item:'費用請款',owner:'鄧泰英書',startDate:'2026-08-25',dueDate:'2026-09-04',actualDate:'',note:''},{id:'2',item:'报名统计',owner:'邓泰英书',startDate:'2026-10-09',dueDate:'2026-10-09',actualDate:'',note:''},{id:'3',item:'活动奖品购买',owner:'邓泰英书',startDate:'2026-10-09',dueDate:'2026-11-01',actualDate:'',note:''},{id:'4',item:'羽毛球购买',owner:'范河北',startDate:'2026-09-04',dueDate:'2026-09-30',actualDate:'',note:''},{id:'5',item:'海报制作',owner:'范河北',startDate:'2026-10-09',dueDate:'2026-10-19',actualDate:'',note:''}],updatedAt:0,updatedBy:'SEED_XLSX'};
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const deep=v=>JSON.parse(JSON.stringify(v));
function lang(){try{const x=localStorage.getItem('topkey_ui_language_v1')||window.TopkeyI18n?.language||'vi';return String(x).startsWith('zh')?'zh':String(x).startsWith('en')?'en':'vi'}catch{return'vi'}}
function t(k){return TXT[lang()]?.[k]||TXT.vi[k]||k}
function roleKey(v){return String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]+/g,'_')}
function sportKey(v){let s=String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim();const m={'cau long':'badminton','badminton':'badminton','bong da':'football','football':'football','bong chuyen':'volleyball','volleyball':'volleyball','chay bo':'running','running':'running','diy handmade':'handmade','handmade':'handmade','da cau':'shuttle','shuttle':'shuttle','nau an':'cooking','cooking':'cooking'};return m[s]||s.replace(/ /g,'_')}
function money(n){const locale=lang()==='zh'?'zh-CN':lang()==='en'?'en-US':'vi-VN';return new Intl.NumberFormat(locale,{maximumFractionDigits:0}).format(Number(n)||0)+' ₫'}
function fmtDate(s){if(!s)return '—';const d=new Date(String(s).slice(0,10)+'T00:00:00');if(isNaN(d))return esc(s);const locale=lang()==='zh'?'zh-CN':lang()==='en'?'en-GB':'vi-VN';return d.toLocaleDateString(locale)}
function stageLabel(x){return x?.label?.[lang()]||x?.label?.vi||x?.label?.en||x?.label?.zh||x?.title||x?.name||'—'}
function planTemplate(sport){return{schemaVersion:1,source:'TOPKEY',info:{title:SPORTS[sport]?.name||sport,startDate:'',endDate:'',activityTimeText:'',location:'',participantsText:'',participantEstimate:0,organizer:'',coOrganizer:'',registrationDeadline:'',contact:{department:'',name:'',phone:'',email:''},objectives:[],intro:'',estimatedBudget:0},schedule:[],budget:{income:[],expense:[]},tasks:[],updatedAt:0,updatedBy:''}}
function normalizePlan(v,sport){const p=v&&typeof v==='object'?deep(v):planTemplate(sport);p.info=p.info||{};p.schedule=Array.isArray(p.schedule)?p.schedule:Object.values(p.schedule||{});p.budget=p.budget||{};p.budget.income=Array.isArray(p.budget.income)?p.budget.income:Object.values(p.budget.income||{});p.budget.expense=Array.isArray(p.budget.expense)?p.budget.expense:Object.values(p.budget.expense||{});p.tasks=Array.isArray(p.tasks)?p.tasks:Object.values(p.tasks||{});return p}
function planSummary(p){p=normalizePlan(p,'');const inc=p.budget.income.reduce((a,x)=>a+(Number(x.amount)||0),0),exp=p.budget.expense.reduce((a,x)=>a+(Number(x.amount)||0),0);const today=new Date();today.setHours(0,0,0,0);let done=0,overdue=0,open=0;p.tasks.forEach(x=>{if(x.actualDate)done++;else{const d=x.dueDate?new Date(x.dueDate+'T00:00:00'):null;if(d&&!isNaN(d)&&d<today)overdue++;else open++;}});return{income:inc,expense:exp,balance:inc-exp,tasks:p.tasks.length,done,overdue,open,schedule:p.schedule.length}}
function scheduleState(x){const today=new Date();today.setHours(0,0,0,0);const a=x.startDate?new Date(x.startDate+'T00:00:00'):null,b=x.endDate?new Date(x.endDate+'T23:59:59'):a;if(a&&!isNaN(a)&&today<a)return'next';if(b&&!isNaN(b)&&today>b)return'past';return'today'}
function planPath(sport){
 const root=SPORTS[sport]?.root;
 if(!root)throw new Error('SPORT_NOT_FOUND');
 const q=new URLSearchParams(location.search),tid=q.get('tid')||'';
 if(q.get('testlab')==='1'){
  if(!/^__testlab_[A-Za-z0-9_]{5,128}$/.test(tid))throw new Error('TESTLAB_TID_INVALID');
  if(!tid.includes('_'+sport+'_'))throw new Error('TESTLAB_SPORT_MISMATCH');
  return `${root}/tournaments/${tid}/clubPlan`;
 }
 return `${root}/clubPlan`;
}
async function readPlan(db,sport){
 const path=planPath(sport);
 try{const snap=await db.ref(path).once('value'),v=snap.val();if(v)return normalizePlan(v,sport)}
 catch(e){console.warn('ClubPlan read',sport,e?.message||e);throw e}
 // Never show the local Excel seed as already saved production data.
 return planTemplate(sport)
}
async function transactPlan(db,sport,expectedRevision,transform,uid,action='SAVE_PLAN'){
 const ref=db.ref(planPath(sport));let conflict=false;
 const result=await ref.transaction(current=>{
  const revision=Number(current?.updatedAt)||0;
  if(revision!==Number(expectedRevision||0)){conflict=true;return;}
  const next=normalizePlan(transform(current),sport);
  next.updatedAt=Math.max(Date.now(),revision+1);next.updatedBy=uid||'';
  const prevHistory=Array.isArray(current?.history)?current.history:[];
  next.history=[...prevHistory.slice(-49),{type:action,at:next.updatedAt,by:uid||'',beforeScheduleCount:Array.isArray(current?.schedule)?current.schedule.length:0,afterScheduleCount:next.schedule.length}];
  return next;
 },undefined,false);
 if(!result?.committed)throw new Error(conflict?'REVISION_CONFLICT':'WRITE_NOT_COMMITTED');
 return normalizePlan(result.snapshot.val(),sport);
}
// H117: optimistic three-way merge. A second organizer may edit another field or section
// while this form is open. Only overlapping edits are conflicts, never silently overwrite.
function sameValue(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function getField(obj,path){return path.split('.').reduce((o,k)=>o==null?undefined:o[k],obj)}
function setField(obj,path,value){const keys=path.split('.');let o=obj;for(let i=0;i<keys.length-1;i++)o=o[keys[i]]??={};o[keys[keys.length-1]]=deep(value)}
const PLAN_MERGE_FIELDS=['info.title','info.location','info.startDate','info.endDate',
 'info.activityTimeText','info.participantsText','info.participantEstimate','info.organizer',
 'info.coOrganizer','info.registrationDeadline','info.contact.department','info.contact.name',
 'info.contact.phone','info.contact.email','info.objectives','info.intro','info.estimatedBudget',
 'schedule','budget.income','budget.expense','tasks','source','schemaVersion'];
async function writePlan(db,sport,plan,uid,basePlan){
 if(!basePlan){const expected=Number(plan?.updatedAt)||0;return transactPlan(db,sport,expected,()=>plan,uid)}
 const base=normalizePlan(basePlan,sport),draft=normalizePlan(plan,sport);
 const touched=PLAN_MERGE_FIELDS.filter(key=>!sameValue(getField(base,key),getField(draft,key)));
 if(!touched.length){
  // A first-save of the Excel seed is NOT a no-op: write it once so Hub and
  // other devices receive the same persisted record instead of a local fallback.
  const exists=await db.ref(planPath(sport)).once('value');
  if(exists.val())return normalizePlan(exists.val(),sport);
  return transactPlan(db,sport,0,()=>base,uid,'CREATE_PLAN_FROM_SEED');
 }
 const ref=db.ref(planPath(sport));let conflictKey='';
 const result=await ref.transaction(current=>{
  // When the user opens the Excel seed before the first save, keep its other fields.
  const server=normalizePlan(current||(base.updatedAt?planTemplate(sport):base),sport);
  for(const key of touched){
   const onServer=getField(server,key),atOpen=getField(base,key),edited=getField(draft,key);
   if(!sameValue(onServer,atOpen)&&!sameValue(onServer,edited)){conflictKey=key;return}
  }
  const next=deep(server);
  for(const key of touched)setField(next,key,getField(draft,key));
  const revision=Number(server.updatedAt)||0;
  next.updatedAt=Math.max(Date.now(),revision+1);next.updatedBy=uid||'';
  const history=Array.isArray(server.history)?server.history:[];
  next.history=[...history.slice(-49),{type:'SAVE_PLAN_MERGED',at:next.updatedAt,by:uid||'',changed:touched.slice(),beforeScheduleCount:server.schedule.length,afterScheduleCount:next.schedule.length}];
  return next;
 },undefined,false);
 if(!result?.committed)throw new Error(conflictKey?'REVISION_CONFLICT:'+conflictKey:'WRITE_NOT_COMMITTED');
 return normalizePlan(result.snapshot.val(),sport);
}
function validateSchedule(rows){
 for(const x of rows){
  const label=x.label?.vi||x.label?.en||x.label?.zh||'';
  if(!String(label).trim())throw new Error('SCHEDULE_LABEL_REQUIRED');
  if(x.startDate&&x.endDate&&x.startDate>x.endDate)throw new Error('SCHEDULE_DATE_RANGE');
 }
 return rows;
}
async function writeSchedule(db,sport,schedule,revision,uid,baseSchedule){
 validateSchedule(schedule);
 if(!baseSchedule)return transactPlan(db,sport,revision,current=>{
  const p=normalizePlan(current||planTemplate(sport),sport);
  p.schedule=deep(schedule);return p;
 },uid,schedule.length?'SAVE_SCHEDULE':'CLEAR_SCHEDULE');
 const ref=db.ref(planPath(sport));let conflict=false;
 const result=await ref.transaction(current=>{
  const p=normalizePlan(current||planTemplate(sport),sport);
  // A parallel budget/info update does not invalidate an unchanged schedule.
  if(Number(p.updatedAt||0)!==Number(revision||0)&&!sameValue(p.schedule,baseSchedule)){
   conflict=true;return;
  }
  p.schedule=deep(schedule);const previous=Number(p.updatedAt)||0;
  p.updatedAt=Math.max(Date.now(),previous+1);p.updatedBy=uid||'';
  const history=Array.isArray(p.history)?p.history:[];
  p.history=[...history.slice(-49),{type:schedule.length?'SAVE_SCHEDULE':'CLEAR_SCHEDULE',at:p.updatedAt,by:uid||'',beforeScheduleCount:Array.isArray(current?.schedule)?current.schedule.length:0,afterScheduleCount:schedule.length}];
  return p;
 },undefined,false);
 if(!result?.committed)throw new Error(conflict?'REVISION_CONFLICT:schedule':'WRITE_NOT_COMMITTED');
 return normalizePlan(result.snapshot.val(),sport);
}
function mount(){let cal=$('#club-plan-calendar');const hub=$('#executive-dashboard');if(hub&&!cal){cal=document.createElement('section');cal.id='club-plan-calendar';cal.className='panel club-plan-calendar hidden';cal.setAttribute('data-tk28-no-translate','1');hub.parentNode?.insertBefore(cal,hub.nextSibling);}let ed=$('#club-plan-admin');if(ed){ed.classList.add('club-plan-btc');ed.setAttribute('data-tk28-no-translate','1');}return{cal:cal||null,ed:ed||null}}
function renderCalendar(host,plans,canEdit){const rows=Object.entries(plans).filter(([,p])=>p&&((p.schedule||[]).length||(p.tasks||[]).length||(p.budget?.income||[]).length||(p.budget?.expense||[]).length||p.info?.startDate||p.info?.endDate||p.info?.location||p.info?.participantEstimate));const sums=rows.map(([,p])=>planSummary(p));const agg=sums.reduce((a,x)=>({income:a.income+x.income,expense:a.expense+x.expense,tasks:a.tasks+x.tasks,done:a.done+x.done,overdue:a.overdue+x.overdue}),{income:0,expense:0,tasks:0,done:0,overdue:0});host.innerHTML=`<div class="club-plan-head"><div><h2>📅 ${t('calendar')}</h2><div class="muted">${t('calendarSub')}</div></div>${canEdit?`<span class="pill">${esc(VERSION)}</span>`:''}</div>${rows.length?`<div class="club-plan-kpis club-plan-hub-kpis"><div><span>${t('income')}</span><strong>${money(agg.income)}</strong></div><div><span>${t('expense')}</span><strong>${money(agg.expense)}</strong></div><div><span>${t('balance')}</span><strong class="${agg.income-agg.expense<0?'bad':''}">${money(agg.income-agg.expense)}</strong></div><div><span>${t('done')}</span><strong>${agg.done}/${agg.tasks}</strong></div><div><span>${t('overdue')}</span><strong class="${agg.overdue?'bad':''}">${agg.overdue}</strong></div></div><div class="club-plan-calendar-grid">${rows.map(([sport,p])=>{const s=SPORTS[sport]||{icon:'•',name:sport};const sum=planSummary(p);const info=p.info||{};return `<article class="club-plan-club"><div class="club-plan-club-title"><b>${s.icon} ${esc(s.name)}</b><span>${fmtDate(info.startDate)} → ${fmtDate(info.endDate)}</span></div><div class="club-plan-meta">${esc(info.location||'—')} · ${Number(info.participantEstimate)||esc(info.participantsText||'—')}</div><div class="club-plan-timeline">${(p.schedule||[]).slice().sort((a,b)=>String(a.startDate||a.endDate||'').localeCompare(String(b.startDate||b.endDate||''))).map(x=>`<div class="club-plan-step ${scheduleState(x)}"><span class="dot"></span><div><b>${esc(stageLabel(x))}</b><small>${x.startDate&&x.endDate&&x.startDate!==x.endDate?`${fmtDate(x.startDate)} – ${fmtDate(x.endDate)}`:fmtDate(x.endDate||x.startDate)}</small></div></div>`).join('')}</div><div class="club-plan-mini-kpi"><span>💰 ${t('income')}: <b>${money(sum.income)}</b></span><span>🧾 ${t('expense')}: <b>${money(sum.expense)}</b></span><span>✅ ${t('done')}: <b>${sum.done}/${sum.tasks}</b></span>${sum.overdue?`<span class="bad">⚠ ${t('overdue')}: <b>${sum.overdue}</b></span>`:''}</div></article>`}).join('')}</div>`:`<div class="exec-empty">${t('noPlan')}</div>`}`}
function input(label,key,value,type='text',extra=''){return `<label class="club-plan-field"><span>${esc(label)}</span><input data-field="${key}" type="${type}" value="${esc(value??'')}" ${extra}></label>`}
function renderPlanTab(p){const i=p.info||{},contact=i.contact||{};return `<div class="club-plan-form-grid">${input(t('title'),'info.title',i.title)}${input(t('location'),'info.location',i.location)}${input(t('from'),'info.startDate',i.startDate,'date')}${input(t('to'),'info.endDate',i.endDate,'date')}${input(t('participants'),'info.participantEstimate',i.participantEstimate||'','number','min="0"')}${input(t('registration'),'info.registrationDeadline',i.registrationDeadline,'date')}${input(t('organizer'),'info.organizer',i.organizer)}${input(t('coOrganizer'),'info.coOrganizer',i.coOrganizer)}${input(t('contact'),'info.contact.name',contact.name)}${input(t('email'),'info.contact.email',contact.email,'email')}<label class="club-plan-field span2"><span>${t('intro')}</span><textarea data-field="info.intro">${esc(i.intro||'')}</textarea></label><label class="club-plan-field span2"><span>${t('objectives')}</span><textarea data-field="info.objectives">${esc((i.objectives||[]).join('\n'))}</textarea></label></div><div class="club-plan-section-head tk115-schedule-head"><b>📅 ${t('stage')}</b><div class="tk115-schedule-actions"><button type="button" class="club-plan-add" data-add="schedule">＋ ${t('add')}</button><button type="button" id="tk115-edit-schedule" class="club-plan-add">✏ ${t('editSchedule')}</button><button type="button" id="tk115-save-schedule" class="club-plan-btn primary">${t('saveSchedule')}</button><button type="button" id="tk115-reload-schedule" class="club-plan-btn">${t('reloadSchedule')}</button><button type="button" id="tk115-clear-schedule" class="club-plan-btn danger">${t('clearSchedule')}</button></div></div><div id="club-plan-schedule-rows" class="club-plan-rows">${(p.schedule||[]).map((x,idx)=>scheduleRow(x,idx)).join('')}</div>`}
function scheduleRow(x,idx){
 const id=String(x.id||`stage_${idx+1}`),labels=x.label&&typeof x.label==='object'?x.label:{vi:String(x.label||'')};
 return `<div class="club-plan-row schedule" data-row="${idx}" data-stage-id="${esc(id)}" data-stage-vi="${esc(labels.vi||'')}" data-stage-en="${esc(labels.en||'')}" data-stage-zh="${esc(labels.zh||'')}"><input data-k="label" value="${esc(stageLabel(x))}" placeholder="${esc(t('stage'))}" aria-label="${esc(t('stage'))}"><input data-k="startDate" type="date" value="${esc(x.startDate||'')}"><input data-k="endDate" type="date" value="${esc(x.endDate||'')}"><button type="button" data-edit-row title="${esc(t('editSchedule'))}" aria-label="${esc(t('editSchedule'))}">✎</button><button type="button" data-del-row title="${esc(t('remove'))}" aria-label="${esc(t('remove'))}">×</button></div>`;
}
function budgetRow(type,x,idx){return `<div class="club-plan-row budget" data-type="${type}" data-row="${idx}"><input data-k="code" value="${esc(x.code||'')}" placeholder="${esc(t('code'))}"><input data-k="item" value="${esc(x.item||'')}" placeholder="${esc(t('item'))}"><input data-k="amount" type="number" min="0" step="1" value="${Number(x.amount)||0}"><input data-k="description" value="${esc(x.description||'')}" placeholder="${esc(t('description'))}"><button type="button" data-del-row>×</button></div>`}
function renderBudgetTab(p){const s=planSummary(p);return `<div class="club-plan-kpis"><div><span>${t('income')}</span><strong>${money(s.income)}</strong></div><div><span>${t('expense')}</span><strong>${money(s.expense)}</strong></div><div><span>${t('balance')}</span><strong class="${s.balance<0?'bad':''}">${money(s.balance)}</strong></div></div><div class="club-plan-section-head"><b>＋ ${t('income')}</b><button type="button" class="club-plan-add" data-add="income">＋ ${t('add')}</button></div><div id="club-plan-income-rows" class="club-plan-rows">${(p.budget?.income||[]).map((x,idx)=>budgetRow('income',x,idx)).join('')||`<div class="exec-empty">${t('emptyBudget')}</div>`}</div><div class="club-plan-section-head"><b>− ${t('expense')}</b><button type="button" class="club-plan-add" data-add="expense">＋ ${t('add')}</button></div><div id="club-plan-expense-rows" class="club-plan-rows">${(p.budget?.expense||[]).map((x,idx)=>budgetRow('expense',x,idx)).join('')}</div>`}
function taskStatus(x){if(x.actualDate)return'done';if(x.dueDate){const d=new Date(x.dueDate+'T00:00:00'),n=new Date();n.setHours(0,0,0,0);if(!isNaN(d)&&d<n)return'overdue'}return'open'}
function taskRow(x,idx){const st=taskStatus(x);return `<div class="club-plan-row task ${st}" data-row="${idx}"><input data-k="item" value="${esc(x.item||'')}" placeholder="${esc(t('item'))}"><input data-k="owner" value="${esc(x.owner||'')}" placeholder="${esc(t('owner'))}"><input data-k="startDate" type="date" value="${esc(x.startDate||'')}"><input data-k="dueDate" type="date" value="${esc(x.dueDate||'')}"><input data-k="actualDate" type="date" value="${esc(x.actualDate||'')}"><input data-k="note" value="${esc(x.note||'')}" placeholder="${esc(t('note'))}"><span class="club-plan-status">${t(st)}</span><button type="button" data-del-row>×</button></div>`}
function renderTasksTab(p){const s=planSummary(p);return `<div class="club-plan-kpis"><div><span>${t('totalTasks')}</span><strong>${s.tasks}</strong></div><div><span>${t('done')}</span><strong>${s.done}</strong></div><div><span>${t('overdue')}</span><strong class="${s.overdue?'bad':''}">${s.overdue}</strong></div><div><span>${t('open')}</span><strong>${s.open}</strong></div></div><div class="club-plan-section-head"><b>🧩 ${t('tasks')}</b><button type="button" class="club-plan-add" data-add="task">＋ ${t('add')}</button></div><div id="club-plan-task-rows" class="club-plan-rows">${(p.tasks||[]).map((x,idx)=>taskRow(x,idx)).join('')||`<div class="exec-empty">${t('emptyTasks')}</div>`}</div>`}
function renderEditor(host,state){const activeTab=['plan','budget','tasks'].includes(state.tab)?state.tab:'plan';const options=Object.entries(SPORTS).map(([k,s])=>`<option value="${k}" ${state.sport===k?'selected':''}>${s.icon} ${esc(s.name)}</option>`).join('');host.innerHTML=`<div class="club-plan-head"><div><h2>📋 ${t('editor')}</h2><div class="muted">${t('editorSub')}</div></div><div class="club-plan-actions"><select id="club-plan-sport" ${state.isAdmin?'':'disabled'}>${options}</select>${state.sport==='badminton'?`<button type="button" id="club-plan-seed" class="club-plan-btn alt">↺ ${t('seed')}</button>`:''}<button type="button" id="club-plan-save" class="club-plan-btn primary">💾 ${t('save')}</button></div></div><div class="club-plan-tabs"><button data-tab="plan" class="${activeTab==='plan'?'active':''}">📅 ${t('plan')}</button><button data-tab="budget" class="${activeTab==='budget'?'active':''}">💰 ${t('budget')}</button><button data-tab="tasks" class="${activeTab==='tasks'?'active':''}">🧩 ${t('tasks')}</button></div><div id="club-plan-editor-body">${activeTab==='budget'?renderBudgetTab(state.plan):activeTab==='tasks'?renderTasksTab(state.plan):renderPlanTab(state.plan)}</div><div id="club-plan-msg" class="club-plan-msg">${state.plan.source&&state.plan.updatedBy==='SEED_XLSX'?t('seedNote'):''}</div>`;bindEditor(host,state)}
function pathSet(obj,path,value){const a=path.split('.');let cur=obj;for(let i=0;i<a.length-1;i++)cur=cur[a[i]]??=(a[i]==='objectives'?[]:{});cur[a[a.length-1]]=value}
function readCommonFields(host,p){host.querySelectorAll('[data-field]').forEach(el=>{let v=el.value;if(el.dataset.field==='info.participantEstimate')v=Number(v)||0;if(el.dataset.field==='info.objectives')v=String(v).split(/\n+/).map(s=>s.trim()).filter(Boolean);pathSet(p,el.dataset.field,v)});return p}
function rowsData(host,selector,keys){return [...host.querySelectorAll(selector)].map((row,idx)=>{const x={};keys.forEach(k=>{const el=row.querySelector(`[data-k="${k}"]`);let v=el?.value??'';if(k==='amount')v=Number(v)||0;x[k]=v});if(!x.id)x.id=String(idx+1);return x}).filter(x=>Object.values(x).some(v=>String(v||'').trim()))}
function readEditor(host,state){const p=deep(state.plan);readCommonFields(host,p);if(host.querySelector('#club-plan-schedule-rows')){
 p.schedule=[...host.querySelectorAll('#club-plan-schedule-rows .club-plan-row')].map((row,i)=>{
  const value=row.querySelector('[data-k="label"]')?.value?.trim()||'';
  const label={vi:row.dataset.stageVi||'',en:row.dataset.stageEn||'',zh:row.dataset.stageZh||''};
  const original=stageLabel({label});
  if(value!==original){label[lang()]=value;if(lang()==='vi'){label.en='';label.zh='';}}
  return {id:row.dataset.stageId||`stage_${i+1}`,label,startDate:row.querySelector('[data-k="startDate"]')?.value||'',endDate:row.querySelector('[data-k="endDate"]')?.value||''};
 }).filter(x=>Object.values(x.label).some(v=>String(v).trim())||x.startDate||x.endDate);
}if(host.querySelector('#club-plan-income-rows'))p.budget.income=rowsData(host,'#club-plan-income-rows .club-plan-row',['code','item','amount','description']);if(host.querySelector('#club-plan-expense-rows'))p.budget.expense=rowsData(host,'#club-plan-expense-rows .club-plan-row',['code','item','amount','description']);if(host.querySelector('#club-plan-task-rows'))p.tasks=rowsData(host,'#club-plan-task-rows .club-plan-row',['item','owner','startDate','dueDate','actualDate','note']).map((x,i)=>({...x,id:String(i+1)}));return normalizePlan(p,state.sport)}
function scheduleError(e){if(e?.message==='OTHER_FIELDS_UNSAVED')return 'Bạn còn chỉnh sửa mục ngoài lịch. Hãy bấm Lưu hồ sơ BTC để lưu tất cả trước.';const code=String(e?.code||e?.message||'');if(/PERMISSION_DENIED|permission_denied/i.test(code))return 'Firebase từ chối quyền ghi. Kiểm tra vai trò, quyền CLB và Rules đang triển khai.';if(/NETWORK|DISCONNECTED|unavailable/i.test(code))return 'Mạng bị gián đoạn; dữ liệu chưa được lưu. Kiểm tra kết nối và thử lại.';return e?.message||String(e)}
function scheduleMessage(host,msg){const el=host.querySelector('#club-plan-msg');if(el)el.textContent=msg;}
function markScheduleDirty(host,state){state.scheduleDirty=true;scheduleMessage(host,'⚠ '+t('unsavedSchedule'));}
function bindRows(host,state){
 // Event delegation on the persistent host: no new listeners for each redraw / added row.
 host.__tk115ActiveState=state;
 if(host.__tk115RowsBound)return;
 host.__tk115RowsBound=true;
 host.addEventListener('input',ev=>{const state=host.__tk115ActiveState;state.formDirty=true;const row=ev.target.closest?.('.club-plan-row.schedule');if(row)markScheduleDirty(host,state);});
 host.addEventListener('click',ev=>{
  const current=host.__tk115ActiveState;
  const edit=ev.target.closest?.('[data-edit-row]');
  if(edit){edit.closest('.club-plan-row')?.querySelector('[data-k="label"]')?.focus();return}
  const del=ev.target.closest?.('[data-del-row]');
  if(del){const isSchedule=!!del.closest('.club-plan-row.schedule');if(isSchedule&&!confirm(t('confirmDeleteRow')))return;del.closest('.club-plan-row')?.remove();current.formDirty=true;if(isSchedule)markScheduleDirty(host,current);return;}
  const add=ev.target.closest?.('[data-add]');if(!add)return;
  const kind=add.dataset.add;
  const rows=host.querySelector('#club-plan-'+(kind==='schedule'?'schedule':kind==='task'?'task':kind)+'-rows');
  if(!rows)return;
  current.formDirty=true;
  if(kind==='schedule'){
   rows.insertAdjacentHTML('beforeend',scheduleRow({id:'stage_'+Date.now(),label:{vi:'',en:'',zh:''}},Date.now()));
   markScheduleDirty(host,current);
  }else if(kind==='income'||kind==='expense'){
   rows.querySelector('.exec-empty')?.remove();rows.insertAdjacentHTML('beforeend',budgetRow(kind,{},Date.now()));
  }else if(kind==='task'){
   rows.querySelector('.exec-empty')?.remove();rows.insertAdjacentHTML('beforeend',taskRow({},Date.now()));
  }
 });
}
function bindEditor(host,state){
 const body=host.querySelector('#club-plan-editor-body');
 const show=tab=>{state.plan=readEditor(host,state);host.querySelectorAll('.club-plan-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));body.innerHTML=tab==='budget'?renderBudgetTab(state.plan):tab==='tasks'?renderTasksTab(state.plan):renderPlanTab(state.plan);state.tab=tab;bindRows(host,state);bindScheduleActions(host,state)};
 host.querySelectorAll('.club-plan-tabs button').forEach(b=>b.onclick=()=>show(b.dataset.tab));
 bindRows(host,state);bindScheduleActions(host,state);
 const sel=host.querySelector('#club-plan-sport');if(sel&&new URLSearchParams(location.search).get('testlab')==='1')sel.disabled=true;if(sel)sel.onchange=async()=>{
  if((state.scheduleDirty||state.formDirty)&&!confirm(t('confirmDiscard'))){sel.value=state.sport;return;}
  state.plan=readEditor(host,state);state.sport=sel.value;state.plan=await readPlan(state.db,state.sport);state.basePlan=deep(state.plan);state.scheduleDirty=false;state.formDirty=false;renderEditor(host,state);if(!state.cal)watchPlans(state);
 };
 const seed=host.querySelector('#club-plan-seed');if(seed)seed.onclick=()=>{if(!confirm(t('confirmDiscard')))return;state.plan=deep(SEED_BADMINTON);state.scheduleDirty=true;state.formDirty=true;renderEditor(host,state)};
 const save=host.querySelector('#club-plan-save');save.onclick=async()=>{
  if(state.saving)return;state.saving=true;save.disabled=true;
  try{
   state.plan=readEditor(host,state);scheduleMessage(host,t('saving'));
   state.plan=await writePlan(state.db,state.sport,state.plan,state.user.uid,state.basePlan);
   state.basePlan=deep(state.plan);state.scheduleDirty=false;state.formDirty=false;scheduleMessage(host,'✓ '+t('saved'));
   await renderCalendarForState(state,state.plan);
  }catch(e){scheduleMessage(host,'⚠ '+(String(e?.message||'').startsWith('REVISION_CONFLICT')?t('conflict')+' ('+String(e.message).split(':')[1]+')':t('saveFail')+': '+scheduleError(e)))}
  finally{state.saving=false;save.disabled=false}
 };
}
function bindScheduleActions(host,state){
 const save=host.querySelector('#tk115-save-schedule'),load=host.querySelector('#tk115-reload-schedule'),clear=host.querySelector('#tk115-clear-schedule'),edit=host.querySelector('#tk115-edit-schedule');
 if(edit)edit.onclick=()=>host.querySelector('#club-plan-schedule-rows [data-k="label"]')?.focus();
 if(save)save.onclick=async()=>{
  if(state.saving)return;state.saving=true;save.disabled=true;
  try{
   const current=readEditor(host,state);
   if(!sameValue(current.info,state.basePlan?.info)||!sameValue(current.budget,state.basePlan?.budget)||!sameValue(current.tasks,state.basePlan?.tasks))throw new Error('OTHER_FIELDS_UNSAVED');
   scheduleMessage(host,t('saving'));
   const persisted=await writeSchedule(state.db,state.sport,current.schedule,Number(state.basePlan?.updatedAt)||0,state.user.uid,state.basePlan?.schedule||[]);
   state.plan=persisted;state.basePlan=deep(persisted);state.scheduleDirty=false;state.formDirty=false;
   renderEditor(host,state);scheduleMessage(host,'✓ '+t('scheduleSaved'));
   await renderCalendarForState(state,state.plan);
  }catch(e){scheduleMessage(host,'⚠ '+(String(e?.message||'').startsWith('REVISION_CONFLICT')?t('conflict')+' ('+String(e.message).split(':')[1]+')':e?.message==='SCHEDULE_DATE_RANGE'?t('dateError'):scheduleError(e)))}
  finally{state.saving=false;if(save.isConnected)save.disabled=false;}
 };
 if(load)load.onclick=async()=>{
  if((state.scheduleDirty||state.formDirty)&&!confirm(t('confirmDiscard')))return;
  try{state.plan=await readPlan(state.db,state.sport);state.basePlan=deep(state.plan);state.scheduleDirty=false;state.formDirty=false;renderEditor(host,state)}
  catch(e){scheduleMessage(host,'⚠ '+(e?.message||e));}
 };
 if(clear)clear.onclick=async()=>{
  if(!confirm(t('confirmClearSchedule'))||state.saving)return;
  state.saving=true;clear.disabled=true;
  try{
   const persisted=await writeSchedule(state.db,state.sport,[],Number(state.basePlan?.updatedAt)||0,state.user.uid,state.basePlan?.schedule||[]);
   state.plan=persisted;state.basePlan=deep(persisted);state.scheduleDirty=false;state.formDirty=false;
   renderEditor(host,state);scheduleMessage(host,'✓ '+t('scheduleCleared'));
   await renderCalendarForState(state,state.plan);
  }catch(e){scheduleMessage(host,'⚠ '+(String(e?.message||'').startsWith('REVISION_CONFLICT')?t('conflict')+' ('+String(e.message).split(':')[1]+')':scheduleError(e)))}
  finally{state.saving=false;if(clear.isConnected)clear.disabled=false;}
 };
}

// H117: small, scoped realtime listeners. Production & Test Lab share the same code;
// testlab is strictly restricted to its own sport/Tournament ID.
function watchPlans(state){
 if(!state.cal&&!state.ed)return;
 for(const w of state.planWatches||[])w.ref.off('value',w.handler);
 const keys=(state.testlab||!state.cal)?[state.sport]:(state.viewAll?Object.keys(SPORTS):[state.sport]);
 state.planCache={};state.planWatches=[];state.watchSportKeys=keys.slice();
 for(const sport of keys){
  const ref=state.db.ref(planPath(sport));
  const handler=snap=>{
   if(state.disposed)return;
   const remote=snap.val()?normalizePlan(snap.val(),sport):planTemplate(sport);
   state.planCache[sport]=remote;
   if(state.cal){if(Object.keys(state.planCache).length===keys.length)renderCalendar(state.cal,state.planCache,state.isAdmin);else state.cal.innerHTML='<div class="exec-empty">Đang đồng bộ dữ liệu kế hoạch CLB…</div>';state.cal.classList.remove('hidden')}
   if(sport!==state.sport||state.saving)return;
   if(Number(remote.updatedAt||0)===Number(state.basePlan?.updatedAt||0))return;
   if(state.formDirty||state.scheduleDirty){
    scheduleMessage(state.ed,'⚠ Dữ liệu trên Firebase vừa thay đổi. Bấm Lưu để hợp nhất các mục không trùng nhau; mục cùng sửa sẽ yêu cầu tải lại.');
   }else if(state.ed&&!state.ed.classList.contains('hidden')){
    state.plan=remote;state.basePlan=deep(remote);renderEditor(state.ed,state);
   }
  };
  const error=e=>{if(state.ed&&sport===state.sport)scheduleMessage(state.ed,'⚠ '+scheduleError(e))};
  ref.on('value',handler,error);state.planWatches.push({ref,handler});
 }
}

async function renderCalendarForState(state,overridePlan=null){if(!state.cal)return;if(overridePlan)state.planCache??={},state.planCache[state.sport]=overridePlan;if(state.planCache&&Object.keys(state.planCache).length===(state.watchSportKeys||[]).length){renderCalendar(state.cal,state.planCache,state.isAdmin);state.cal.classList.remove('hidden');return;}const keys=state.testlab?[state.sport]:(state.viewAll?Object.keys(SPORTS):[state.sport]);const entries=await Promise.all(keys.map(async sport=>[sport,await readPlan(state.db,sport)]));if(state.disposed)return;renderCalendar(state.cal,Object.fromEntries(entries),state.isAdmin);state.cal.classList.remove('hidden')}
async function boot(){
 const {cal,ed}=mount();if((!cal&&!ed)||!window.firebase)return;
 const auth=firebase.auth(),db=firebase.database();
 let authEpoch=0,activeState=null,languageHandler=null;
 const dispose=()=>{authEpoch++;if(activeState){activeState.disposed=true;for(const w of activeState.planWatches||[])w.ref.off('value',w.handler)}activeState=null;if(languageHandler){window.removeEventListener('topkey:languagechange',languageHandler);languageHandler=null}};
 const unsubscribe=auth.onAuthStateChanged(async user=>{
  dispose();const epoch=authEpoch;
  if(!user){cal?.classList.add('hidden');ed?.classList.add('hidden');return}
  let profile={};try{profile=(await db.ref(`${AUTH_ROOT}/users/${user.uid}`).once('value')).val()||{}}catch{}
  if(epoch!==authEpoch)return;
  const role=roleKey(profile.role),isAdmin=role==='ADMIN',scope=sportKey(profile.sportScope||profile.sport||''),perm=profile.permissions||{};
  const execAccess=[perm.modules?.executiveDashboard,perm.details?.['executiveDashboard:view'],perm.details?.['dashboard:executive'],perm.modules?.systemAdmin,perm.details?.['systemAdmin:access']].some(x=>['view','edit'].includes(String(x||'').toLowerCase()));
  const canEdit=isAdmin||role==='BTC',viewAll=isAdmin||(!canEdit&&execAccess);
  if(!canEdit&&!viewAll){cal?.classList.add('hidden');ed?.classList.add('hidden');return}
  const query=new URLSearchParams(location.search),trial=query.get('testlab')==='1';
  const requested=query.get('sport')||'';
  if(trial&&!isAdmin){cal?.classList.add('hidden');ed?.classList.add('hidden');return;}
  const sport=trial?(SPORTS[requested]?requested:''):(canEdit?(isAdmin?(scope&&SPORTS[scope]?scope:'badminton'):(SPORTS[scope]?scope:'')):'badminton');
  if(canEdit&&!sport){cal?.classList.add('hidden');ed?.classList.add('hidden');return}
  const plan=ed?await readPlan(db,sport):planTemplate(sport);if(epoch!==authEpoch)return;
  const state={user,profile,role,isAdmin,viewAll,sport,db,cal,ed,plan,basePlan:deep(plan),tab:'plan',testlab:trial,disposed:false,formDirty:false,scheduleDirty:false,saving:false};activeState=state;
  // Show editor immediately: do not wait for seven other club Firebase requests.
  if(ed&&canEdit){ed.classList.remove('hidden');renderEditor(ed,state)}else ed?.classList.add('hidden');
  watchPlans(state);
  let running=false,dirty=false;
  const rerender=async()=>{
   if(state.disposed)return;
   if(running){dirty=true;return}
   running=true;
   try{do{dirty=false;if(ed&&!ed.classList.contains('hidden'))state.plan=readEditor(ed,state);if(cal)await renderCalendarForState(state,state.plan);if(state.disposed)break;if(ed)renderEditor(ed,state)}while(dirty&&!state.disposed)}catch(e){console.warn('Club plan language refresh',e)}finally{running=false}
  };
  languageHandler=rerender;window.addEventListener('topkey:languagechange',languageHandler);
 });
 window.addEventListener('pagehide',()=>{dispose();unsubscribe()},{once:true});
}

window.TopkeyClubPlanning={version:VERSION,build:BUILD,seedBadminton:deep(SEED_BADMINTON),planSummary};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
