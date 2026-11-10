/* H104: paged read-side adapter for the six VNext sports and Badminton.
 * Does not rewrite canonical scoring, schedules or permissions.
 * Incomplete sets never feed total rankings/finance figures.
 */
(function(global){
'use strict';
const V=global.TopkeyV2,T=global.Topkey,App=T?.App;
if(!V||!T?.Data||!App||App.__h104Installed)return;
if((location.hash||'').startsWith('#spectator')||(location.hash||'').startsWith('#register')||(location.hash||'').startsWith('#judge'))return;
const D=T.Data,AUTH=T.Auth, SPORT=T.SPORT?.key||'badminton';
const $=id=>document.getElementById(id);
const TS=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
const pageSize=120, subs=[], tabs={teams:'teams',schedule:'matches',finance:'finance'};
const P={teams:{},matches:{},finance:{}};
const M={teams:{hasMore:false,loaded:false,cursor:null,loading:false},matches:{hasMore:false,loaded:false,cursor:null,loading:false},finance:{hasMore:false,loaded:false,cursor:null,loading:false}};
let active=false,disposed=false,initPromise=null,meta=null,aggregate=null,rankingSnapshot=null,tabSerial=0,firstReadPending=true;
let commandLoad=null,serialWrite=Promise.resolve(),watchOff=[],watchBranch='',watchFrame=0,auxOffs=[],auxTab='',liveOffs=new Map();
const prev={ranking:App.ranking?.bind(App),renderAll:App.renderAll?.bind(App),renderMatches:App.renderMatches?.bind(App),renderTeams:App.renderTeams?.bind(App),renderFinance:App.renderFinance?.bind(App),renderOverview:App.renderOverview?.bind(App),renderStandings:App.renderStandings?.bind(App),showTab:App.showTab?.bind(App),queueMulti:D.queueMulti.bind(D)};
const safeRun=(cb,...a)=>{try{return cb?.(...a)}catch(e){console.warn('H104 optional render',e)}};
const abs=path=>D.path(path), hasV2=()=>meta?.active===true&&meta?.complete===true&&Number(meta?.schemaVersion)===2;
const trusted=()=>hasV2()&&meta?.aggregatesTrusted===true&&aggregate;
function unsubscribe(){while(subs.length){try{subs.pop()?.()}catch{}}}
function subscribeBranch(branch,callback){if(!D.ready)return;const off=D.listen(branch,callback);subs.push(off)}
function resetState(branch){const st=M[branch];P[branch]={};App.state[branch]={};Object.assign(st,{cursor:null,hasMore:false,loaded:false,complete:false,mode:null,filterSignature:'',generation:(st.generation||0)+1,pendingReload:!!st.loading||!!st.pendingReload})}
function applySnapshot(branch,items,reset){
 if(reset)P[branch]={};for(const {key,value} of items){if(value===null)continue;const id=String(value?.id||key.split('~').at(-1));P[branch][id]={...value,id}};
 App.state[branch]=P[branch];
 if(branch==='teams'){safeRun(App.renderTeams);safeRun(App.renderCheckin);safeRun(App.renderSelectors)}
 else if(branch==='matches'){safeRun(App.renderMatches);safeRun(App.renderSelectors);safeRun(App.renderLiveScore)}
 else safeRun(App.renderFinance);
 updateDerived();drawMore(branch); if(branch==='matches')decorateWinners();
}
function filters(branch){
 if(branch==='teams')return {search:$('h104-team-search')?.value?.trim()||'',category:$('h104-team-category')?.value||''};
 if(branch==='matches')return {day:$('h104-match-day')?.value||'',status:$('h104-match-status')?.value||''};
 return {day:$('h104-finance-day')?.value||''};
}
function notify(text){const e=$('h104-data-note');if(e)e.textContent=text;}
function invalidateSnapshots(){for(const b of ['teams','matches','finance'])M[b].complete=false;updateDerived()}
function statusCounts(){
 if(M.teams.complete&&M.matches.complete){const t=V.summary(P.teams,P.matches,P.finance);return t}
 return null;
}
function updateDerived(){
 const s=trusted()?aggregate:statusCounts();
 if(!s){if($('kpi-teams'))$('kpi-teams').textContent='…';if($('kpi-live'))$('kpi-live').textContent='…';if($('kpi-finished'))$('kpi-finished').textContent='…';if($('kpi-ready'))$('kpi-ready').textContent='…';}
 else{
  if($('kpi-teams'))$('kpi-teams').textContent=String(s.teams?.total??'…');
  if($('kpi-ready'))$('kpi-ready').textContent=String(s.teams?.checkin??'…');
  if($('kpi-live'))$('kpi-live').textContent=String(s.matches?.live??'…');
  if($('kpi-finished'))$('kpi-finished').textContent=String(s.matches?.finished??'…');
 }
 const f=trusted()?aggregate.finance:(M.finance.complete?V.summary({}, {},P.finance).finance:null);
 for(const [id,key] of [['tk86-fin-income','income'],['tk86-fin-expense','expense'],['tk86-fin-balance','balance'],['tk86-fin-pending','pending']]){
  const node=$(id);if(node)node.textContent=f?(key==='pending'?String(f[key]):(T.U?.money?.(f[key])||String(f[key]))):'—';
 }
 for(const [id,key] of [['finance-income','income'],['finance-expense','expense'],['finance-balance','balance']]){const node=$(id);if(node)node.textContent=f?(T.U?.money?.(f[key])||String(f[key])):'—';}
 const tc=$('team-count');if(tc)tc.textContent=String((trusted()?aggregate.teams?.total:null)??(M.teams.hasMore?`${Object.keys(P.teams).length}+`:Object.keys(P.teams).length));
 const warn=$('h104-aggregate-state');if(warn)warn.textContent=trusted()?'Tổng hợp v2 đã được đối chiếu':M.matches.hasMore||M.teams.hasMore||M.finance.hasMore?'Dữ liệu phân trang; không tính tổng từ trang hiện tại':'Dữ liệu toàn bộ trang đã nạp';
}
function maybeInitControls(){if($('h104-data-note'))return;
 const msg=document.createElement('div');msg.id='h104-data-note';msg.style.cssText='margin:8px 0;color:#95adc6;font-size:12px';msg.textContent='Dữ liệu tải theo trang · các phép tính toàn giải chỉ chạy khi đã đủ dữ liệu.';
 const find=()=>document.querySelector('#page-overview .card')||document.getElementById('app-shell');find()?.prepend(msg);
 const make=(branch,id,controls)=>{
   const el=branch==='finance'?$('finance-list'):$((branch==='teams'?'teams':'matches')+'-list');if(!el)return;
   const panel=document.createElement('div');panel.id=id;panel.style.cssText='display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0';
   for(const field of controls){const input=document.createElement(field.type==='select'?'select':'input');input.id=field.id;input.setAttribute('aria-label',field.label);input.title=field.label;input.style.cssText='width:auto;max-width:240px;min-height:34px;background:#0b2237;color:#e4f2ff;border:1px solid #31536a;border-radius:8px;padding:6px';
    if(field.type==='select')for(const [v,l] of field.options){const option=new Option(l,v);input.appendChild(option)}else{input.type=field.type||'search';input.placeholder=field.label};
    input.addEventListener(field.type==='search'?'input':'change',()=>{clearTimeout(input.__h104Debounce);input.__h104Debounce=setTimeout(()=>{resetState(branch);loadPage(branch,true)},field.type==='search'?250:0)});
    panel.appendChild(input);
   }
   if(branch==='matches'||branch==='finance'){
     const full=document.createElement('button');full.type='button';full.className='btn mini';full.textContent=branch==='matches'?'Xác minh BXH toàn giải':'Xác minh tổng thu / chi';
     full.onclick=async()=>{full.disabled=true;try{
       await requireFull(branch==='matches'?['teams','matches']:['finance'],branch==='matches'?'tính bảng xếp hạng':'đối chiếu tổng tài chính');
       if(branch==='matches')safeRun(App.renderStandings?.bind(App));else safeRun(App.renderFinance?.bind(App));
     }catch(e){notify('Không thể xác minh: '+(e?.message||e))}finally{full.disabled=false}};
     panel.appendChild(full);
   }
   const info=document.createElement('span');info.id='h104-info-'+branch;info.className='muted';panel.appendChild(info);
   const target=el.closest('.table-wrap')||el;target.parentElement?.insertBefore(panel,target);
 };
 make('teams','h104-teams-controls',[{id:'h104-team-search',type:'search',label:'Tìm tên đội (đầu tên)'},{id:'h104-team-category',type:'select',label:'Lọc nội dung',options:[['','Tất cả nội dung'],...(T.SPORT?.categories||[]).map(x=>[x,x])]}]);
 make('matches','h104-matches-controls',[{id:'h104-match-day',type:'date',label:'Ngày thi đấu'},{id:'h104-match-status',type:'select',label:'Trạng thái',options:[['','Mọi trạng thái'],...['SCHEDULED','READY','LIVE','FINISHED','WALKOVER','CANCELLED'].map(x=>[x,x])]}]);
 make('finance','h104-finance-controls',[{id:'h104-finance-day',type:'date',label:'Ngày giao dịch'}]);
 const sum=document.createElement('small');sum.id='h104-aggregate-state';sum.style.cssText='display:block;margin:6px;color:#95adc6';$('finance-list')?.parentElement?.appendChild(sum);
}
function drawMore(branch){const el=branch==='finance'?$('finance-list'):$((branch==='teams'?'teams':'matches')+'-list');if(!el)return;
 let bar=$('h104-more-'+branch);if(!bar){bar=document.createElement('div');bar.id='h104-more-'+branch;bar.style.cssText='margin:10px 0;display:flex;gap:12px;align-items:center';const target=el.closest('.table-wrap')||el;target.parentElement?.insertBefore(bar,target.nextSibling)}
 bar.replaceChildren();const state=M[branch],b=document.createElement('button');b.type='button';b.className='btn mini';b.textContent=state.loading?'Đang tải…':state.hasMore?'Tải thêm '+pageSize+' bản ghi':'Đã tải hết trang';b.disabled=!state.hasMore||state.loading;b.onclick=()=>loadPage(branch,false);
 bar.appendChild(b);const s=document.createElement('small');s.className='muted';s.textContent=`Đã tải ${Object.keys(P[branch]).length} ${branch==='teams'?'đội':branch==='matches'?'trận':'giao dịch'}`;bar.appendChild(s);
}
async function loadPage(branch,reset=false){
 if(disposed||!D.ready||M[branch].loading)return;
 maybeInitControls();const state=M[branch],f=filters(branch),sig=JSON.stringify(f);
 if(reset||state.filterSignature!==sig)resetState(branch);
 state.loading=true;state.filterSignature=sig;drawMore(branch);const started=Date.now(),generation=state.generation||0;
 try{
   const indexed=hasV2();let ref,direction,prefix='';
   if(indexed){const q=V.pageOptions(branch,f);ref=D.ref(q.path);direction=q.direction;prefix=q.prefix}
   else{
    if(f.search||f.day||f.status||f.category){notify('Bộ lọc phía Firebase yêu cầu chỉ mục v2 đã xác minh. Không hiển thị kết quả giả từ một phần dữ liệu.');return}
    ref=D.ref(branch);direction='desc';
   }
   const page=await V.readPage(ref,{direction,size:pageSize,cursor:state.cursor,prefix});
   // Ignore a stale response when the user has changed filters in flight.
   if(generation!==(state.generation||0)||state.filterSignature!==JSON.stringify(filters(branch)))return;
   state.cursor=page.nextCursor;state.hasMore=page.hasMore;state.loaded=true;state.complete=!page.hasMore&&!Object.values(f).some(Boolean);state.mode=indexed?'v2':'legacy';
   applySnapshot(branch,page.items,reset);if(tabs[App.currentTab]===branch)watchVisible(branch);
   const info=$('h104-info-'+branch);if(info)info.textContent=`${indexed?'v2':'legacy'} · ${Math.max(0,Date.now()-started)} ms`;
 }catch(err){console.warn('H104 page',branch,err);notify('Không tải được trang '+branch+': '+(err.message||err))}
 finally{state.loading=false;drawMore(branch);if(state.pendingReload){state.pendingReload=false;void loadPage(branch,true)}}
}
function clearWatch(){for(const off of watchOff.splice(0))try{off()}catch{};watchBranch=''}
function watchVisible(branch){
 if(!M[branch]?.loaded||!D.ready)return;
 const f=filters(branch),signature=branch+'|'+JSON.stringify(f)+'|'+(hasV2()?'v2':'legacy');
 if(watchBranch===signature)return;clearWatch();watchBranch=signature;
 let ref,dir='desc',prefix='';
 if(hasV2()){const q=V.pageOptions(branch,f);ref=D.ref(q.path);dir=q.direction;prefix=q.prefix}
 else {if(Object.values(f).some(Boolean))return;ref=D.ref(branch)}
 if(!ref||typeof ref.orderByKey!=='function')return;
 let q=ref.orderByKey();if(prefix)q=q.startAt(prefix).endAt(prefix+'\uf8ff');
 q=dir==='asc'?q.limitToFirst(pageSize):q.limitToLast(pageSize);
 const doRender=()=>{if(watchFrame)return;watchFrame=requestAnimationFrame(()=>{watchFrame=0;if(branch==='teams'){safeRun(App.renderTeams);safeRun(App.renderCheckin)}else if(branch==='matches'){safeRun(App.renderMatches);decorateWinners()}else safeRun(App.renderFinance);updateDerived()})};
 const update=s=>{const row=s.val(),id=String(row?.id||s.key.split('~').at(-1));if(row!=null){const old=P[branch][id];if(old&&JSON.stringify(old)===JSON.stringify(row))return;P[branch][id]={...row,id};App.state[branch]=P[branch];doRender()}};
 const removed=s=>{const id=String(s.val()?.id||s.key.split('~').at(-1));if(P[branch][id]){delete P[branch][id];App.state[branch]=P[branch];doRender()}};
 for(const [ev,handler] of [['child_added',update],['child_changed',update],['child_removed',removed]]){q.on(ev,handler);watchOff.push(()=>q.off(ev,handler))}
}

function clearAux(){while(auxOffs.length)try{auxOffs.pop()?.()}catch{};auxTab=''}
function subscribeAux(tab){
 const role=T.Auth?.role?.()||'';
 const key=tab+'|'+role;
 if(auxTab===key)return;
 clearAux();auxTab=key;
 // H95 retains a tab subscription method that otherwise reinstalls full branch listeners.
 if(tab==='teams')auxOffs.push(D.listen('registrations',v=>{App.state.registrations=v||{};safeRun(App.renderRegistrations?.bind(App))}));
 if(['umpire','live'].includes(tab))auxOffs.push(D.listen('commentary',v=>{App.state.commentary=v||{};safeRun(App.renderCommentary?.bind(App))}));
 if(tab==='audit'){if(typeof App.loadAuditPage==='function')void App.loadAuditPage(true);else auxOffs.push(D.listen('audit',v=>{App.state.audit=v||{};safeRun(App.renderAudit?.bind(App))}));}
 if(['settings','control'].includes(tab)&&role==='ADMIN'){
   if(typeof D.listenAuthUsers==='function')auxOffs.push(D.listenAuthUsers(v=>{App.state.users=v||{};safeRun(App.renderUsers?.bind(App));safeRun(App.renderCourts?.bind(App))}));
   else if(typeof D.listenGlobal==='function')auxOffs.push(D.listenGlobal('users',v=>{App.state.users=v||{};safeRun(App.renderUsers?.bind(App));safeRun(App.renderCourts?.bind(App))}));
 }
}
function refreshBranch(branch){const d=M[branch];if(!d.loaded)return loadPage(branch,true);return loadPage(branch,true)}
function coreRender(b){if(document.hidden)return;safeRun(App.renderBranch?.bind(App),b);updateDerived()}
function decorateWinners(){const list=$('matches-list');if(!list)return;
 for(const tr of list.querySelectorAll('tr')){
   const mid=tr.dataset.matchId||tr.querySelector('[data-match-id]')?.dataset.matchId;
   const rowCode=tr.querySelector('td')?.textContent?.trim();
   const m=mid?P.matches[mid]:Object.values(P.matches).find(x=>x.code===rowCode);
   if(!m||!TS.has(m.status)||tr.querySelector('.h104-winner'))continue;
   let winner=m.winnerId;
   if(!winner&&typeof App.setWinnerId==='function'&&Array.isArray(m.sets))winner=App.setWinnerId(m);
   if(!winner&&Number.isFinite(m.scoreA)&&Number.isFinite(m.scoreB)&&m.scoreA!==m.scoreB)winner=m.scoreA>m.scoreB?m.teamAId:m.teamBId;
   if(!winner||![m.teamAId,m.teamBId].includes(winner))continue;
   const td=tr.querySelectorAll('td')[1];if(!td)continue;
   const name=P.teams[winner]?.name||(winner===m.teamAId?m.teamASnapshot?.name:m.teamBSnapshot?.name)||winner;
   const badge=document.createElement('strong');badge.className='h104-winner';badge.textContent=' 🏆 THẮNG: '+name;badge.style.cssText='color:#42ebbb;font-weight:800;margin-left:8px;white-space:nowrap';td.appendChild(badge);
 }
}
function requireFull(names,action){
 if(commandLoad)return commandLoad;
 commandLoad=(async()=>{
  notify('Đang xác minh dữ liệu toàn giải trước khi '+action+'…');
  for(const branch of names){if(M[branch].complete)continue;
   const r=await V.scan(D.ref(branch),{batch:200,maxRecords:150000});
   P[branch]=Object.fromEntries(r.items.map(x=>[x.key,x.value]));App.state[branch]=P[branch];
   // This is an explicit full-operation snapshot, not a permanent full-branch listener.
   M[branch].loaded=true;M[branch].hasMore=false;M[branch].complete=true;M[branch].cursor=null;
  }
  notify('Đã xác minh dữ liệu toàn giải cho thao tác '+action);updateDerived();
 })().finally(()=>{commandLoad=null});return commandLoad;
}
function operations(){
 for(const [method,branches] of Object.entries({exportTeamsCSV:['teams'],generateRoundRobin:['teams','matches'],generateKnockout:['teams','matches'],previewScheduleDelete:['teams','matches'],openScheduleDelete:['teams','matches'],bulkWithdrawTeams:['teams','matches'],autoSchedule:['teams','matches'],generateSchedule:['teams','matches'],previewSchedule:['teams','matches'],executeScheduleDelete:['teams','matches'],executeDelete:['teams','matches'],exportMatchesCSV:['teams','matches'],exportFinanceZip:['finance'],exportBackup:['teams','matches','finance'],importMatchesCSV:['teams','matches'],importTeamsCSV:['teams'],deleteTeam:['teams','matches'],toggleWithdraw:['teams','matches'],addMatch:['teams','matches'],endMatch:['teams','matches']})){
   const base=App[method];if(typeof base!=='function'||base.__h104Wrapped)continue;
   const fn=function(...args){const needs=branches.filter(x=>M[x].hasMore||!M[x].loaded);if(!needs.length)return base.apply(this,args);
    return requireFull(needs,method).then(()=>base.apply(this,args));};fn.__h104Wrapped=true;App[method]=fn;
 }
}
// Synchronize v2 read-side indexes within the same canonical multi-location update.
function dualWrite(){
 D.queueMulti=function(updates,opts={}){
  const job=async()=>{
   const extra={},changes=[];
   if(hasV2()&&updates&&typeof updates==='object'){
    const root=abs(''),grouped=new Map();
    for(const [path,val] of Object.entries(updates)){
     if(!path.startsWith(root+'/'))continue;
     const m=path.slice(root.length+1).match(/^(teams|matches|finance)(?:\/([^/]+))?(?:\/(.*))?$/);
     if(!m)continue;
     const [_,branch,id,subpath]=m;
     if(!id){extra[abs('_v2/meta/complete')]=false;extra[abs('_v2/meta/aggregatesTrusted')]=false;extra[abs('_v2/meta/rankingsTrusted')]=false;continue}
     const gkey=branch+'/'+id;
     if(!grouped.has(gkey))grouped.set(gkey,{branch,id,patches:[]});
     grouped.get(gkey).patches.push({subpath,value:val});
    }
    if(!D.connected){extra[abs('_v2/meta/complete')]=false;extra[abs('_v2/meta/aggregatesTrusted')]=false;extra[abs('_v2/meta/rankingsTrusted')]=false;grouped.clear()}
    for(const {branch,id,patches} of grouped.values()){
     const snapshot=await D.read(branch+'/'+id),before=snapshot||null;
     let next=before?JSON.parse(JSON.stringify(before)):{id};
     for(const p of patches){if(!p.subpath){next=p.value===null?null:JSON.parse(JSON.stringify(p.value))}else if(next){const ks=p.subpath.split('/');let ref=next;for(const k of ks.slice(0,-1)){ref[k]=ref[k]||{};ref=ref[k]}if(p.value===null)delete ref[ks.at(-1)];else ref[ks.at(-1)]=p.value}}
     Object.assign(extra,V.indexDelta(branch,before,next,root));changes.push({branch,id,next});
    }
   }
   const result=await prev.queueMulti({...updates,...extra},opts);
   for(const c of changes){if(c.next)P[c.branch][c.id]=c.next;else delete P[c.branch][c.id];App.state[c.branch]=P[c.branch];}
   if(changes.length||extra[abs('_v2/meta/complete')]===false){if(meta){meta={...meta,complete:extra[abs('_v2/meta/complete')]===false?false:meta.complete,aggregatesTrusted:false,rankingsTrusted:false}};invalidateSnapshots()}
   return result;
  };
  const task=serialWrite.then(job,job);serialWrite=task.catch(()=>{});return task;
 };
}
function standings(){
 if(!M.teams.complete||!M.matches.complete){
  const box=$('standings-list');if(box){box.replaceChildren();const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=9;td.textContent='BXH toàn giải đang được bảo vệ: cần dữ liệu đầy đủ hoặc bản tổng hợp v2 đã xác minh.';tr.appendChild(td);box.appendChild(tr)}
  return;
 }
 return prev.renderStandings?.();
}
function ensureLiveRows(){
 const activeIds=new Set(Object.values(App.state.activeMatches||{}).map(v=>String(v?.matchId||'')).filter(Boolean));
 // Only the few live court matches get realtime listeners; never the full matches branch.
 for(const mid of activeIds){if(liveOffs.has(mid)||!D.ready)continue;
   const off=D.listen('matches/'+mid,row=>{
      if(row){P.matches[mid]={...row,id:row.id||mid};App.state.matches=P.matches;safeRun(App.renderLiveScore?.bind(App));}
   });liveOffs.set(mid,off);
 }
 for(const [mid,off] of [...liveOffs])if(!activeIds.has(mid)){
   try{off()}catch{}liveOffs.delete(mid);
   // Preserve the authoritative final result when the court is closed.
   D.read('matches/'+mid).then(row=>{if(row){P.matches[mid]={...row,id:row.id||mid};App.state.matches=P.matches;if(App.currentTab==='schedule')safeRun(App.renderMatches?.bind(App));}}).catch(()=>{});
 }
}
function clearLive(){for(const off of liveOffs.values())try{off()}catch{}liveOffs.clear()}

function install(){
 if(App.__h104Installed)return;
 App.__h104Installed=true;global.TopkeyH104={installed:true,SPORT,V,loadPage,requireFull,state:M,resetState,validate:V.validateModel};
 App.renderAll=function(...args){safeRun(prev.renderAll,...args);maybeInitControls();updateDerived()};
 App.subscribe=function(){
   if(active)return;active=true;disposed=false;
   const legacy=global.TopkeyCoreDataRuntime115?.listenerState;if(legacy){
    for(const oldOff of [...(legacy.coreOffs||[]),...(legacy.tabOffs||[])])try{oldOff?.()}catch{};
    legacy.coreOffs=[];legacy.tabOffs=[];legacy.subscribed=false;legacy.activeTab='';
   }
   try{(this.offs||[]).forEach(fn=>fn?.());(this.__h95CoreOffs||[]).forEach(fn=>fn?.());(this.__h95TabOffs||[]).forEach(fn=>fn?.())}catch{};
   this.offs=[];this.__h95CoreOffs=[];this.__h95TabOffs=[];this.__h95TabKey='';clearAux();clearLive();
   for(const b of ['config','courts','activeMatches','announcements'])subscribeBranch(b,v=>{App.state[b]=v||{};if(b==='activeMatches')ensureLiveRows();coreRender(b)});
   subscribeBranch('_v2/meta',m=>{const was=hasV2(),wasTrusted=meta?.aggregatesTrusted;meta=m||null;if(firstReadPending)return;if(was!==hasV2()){clearWatch();for(const b of ['teams','matches','finance'])resetState(b);loadPage('teams',true);loadPage('matches',true);if(App.currentTab==='finance')loadPage('finance',true)}else if(wasTrusted&&!meta?.aggregatesTrusted)invalidateSnapshots();updateDerived()});
   subscribeBranch('_v2/aggregates',v=>{aggregate=v||null;updateDerived()});
   this.offs=[...subs];
   firstReadPending=true;
   initPromise=Promise.resolve().then(()=>D.read('_v2/meta')).then(m=>{meta=m||null},()=>{meta=null}).then(()=>{
     firstReadPending=false;if(disposed||!active)return;
     loadPage('teams',true);loadPage('matches',true);
     if((this.currentTab||'overview')==='finance')loadPage('finance',true);
   });
 };
 // Override H95's tab hook. Its default mapping re-subscribes to whole teams/matches.
 App.syncTabSubscriptions=function(){for(const old of this.__h95TabOffs||[])try{old?.()}catch{};this.__h95TabOffs=[];this.__h95TabKey='h104';subscribeAux(this.currentTab||'overview');};
 App.showTab=function(tab,...a){const result=prev.showTab?.(tab,...a);tabSerial++;subscribeAux(this.currentTab||tab);
   const branch=tabs[tab];clearWatch();if(branch){if(!M[branch].loaded)loadPage(branch,true);else watchVisible(branch)}
   if(['umpire','control'].includes(tab)&&(M.matches.hasMore||M.teams.hasMore))requireFull(['teams','matches'],tab).then(()=>safeRun(App.renderSelectors)).catch(e=>notify('Lỗi nạp dữ liệu điều hành: '+e.message));
   if(tab==='overview')updateDerived();return result;
 };
 App.renderTeams=function(...a){const x=prev.renderTeams?.(...a);drawMore('teams');return x};
 App.renderMatches=function(...a){const x=prev.renderMatches?.(...a);decorateWinners();drawMore('matches');return x};
 App.renderFinance=function(...a){const x=prev.renderFinance?.(...a);updateDerived();drawMore('finance');return x};
 App.renderOverview=function(...a){const x=prev.renderOverview?.(...a);updateDerived();return x};
 App.renderStandings=standings;
 if(prev.ranking)App.ranking=function(...a){if(!M.teams.complete||!M.matches.complete)return [];return prev.ranking(...a)};
 const lifecycle=global.TopkeyUpgrade9;if(lifecycle?.finishTournament&&!lifecycle.__h104FinalGuard){const original=lifecycle.finishTournament.bind(lifecycle);lifecycle.finishTournament=async function(...a){await requireFull(['teams','matches','finance'],'chốt giải và tạo báo cáo');return original(...a)};lifecycle.__h104FinalGuard=true}
 dualWrite();operations();maybeInitControls();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateDerived()}, {passive:true});
 global.addEventListener('pagehide',()=>{clearWatch();clearAux();clearLive();unsubscribe();active=false;disposed=true}, {passive:true});
}
install();
})(window);
