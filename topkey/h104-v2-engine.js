/* TOPKEY H104 - indexed read model + bounded RTDB query engine.
 * Canonical teams/matches/finance remain authoritative. Read model may be activated only
 * after source checks and backfill succeed. No implicit production migration.
 */
(function(root, factory){
  'use strict';
  const api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  if(root)root.TopkeyV2=api;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:null),function(){
 'use strict';
 const VERSION=2, MAX_PAGE=200, DEFAULT_PAGE=80;
 const TERMINAL=new Set(['FINISHED','WALKOVER','RETIRED','DISQUALIFIED']);
 const invalidKey=/[.#$\[\]\/\u0000-\u001f\u007f]/g;
 function safe(v){return String(v??'').replace(invalidKey,'_').slice(0,256)}
 function date(v){return String(v||'').slice(0,10).replace(/[^0-9-]/g,'')||'undated'}
 function instant(row){return [date(row?.date), String(row?.time||'00:00').replace(/[^0-9:]/g,'')||'00:00',safe(row?.id)].join('~')}
 function fold(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().trim().replace(/\s+/g,' ')}
 function nameKey(row){return `${safe(fold(row?.name).slice(0,90))}~${safe(row?.id)}`}
 function rows(map){return Object.entries(map||{}).map(([id,v])=>({...(v||{}),id:String(v?.id||id)}));}
 function amount(r){return Number.isFinite(Number(r?.amount))?Number(r.amount):0}
 function isTerminal(r){return TERMINAL.has(String(r?.status||'').toUpperCase())}
 function summary(teams,matches,finance){
   const tt=rows(teams), mm=rows(matches), ff=rows(finance);
   const income=ff.reduce((s,r)=>s+(r.type==='INCOME'?amount(r):0),0);
   const expense=ff.reduce((s,r)=>s+(r.type==='EXPENSE'?amount(r):0),0);
   const paidIncome=ff.reduce((s,r)=>s+(r.type==='INCOME'&&r.status==='PAID'?amount(r):0),0);
   const paidExpense=ff.reduce((s,r)=>s+(r.type==='EXPENSE'&&r.status==='PAID'?amount(r):0),0);
   return {teams:{total:tt.length,checkin:tt.filter(r=>!!r.checkedIn).length,withdrawn:tt.filter(r=>!!r.withdrawn).length},
    matches:{total:mm.length,finished:mm.filter(isTerminal).length,live:mm.filter(r=>r.status==='LIVE').length},
    finance:{count:ff.length,income,expense,balance:income-expense,paidIncome,paidExpense,paidBalance:paidIncome-paidExpense,pending:ff.filter(r=>r.status!=='PAID').length}};
 }
 function put(obj,path,value){const keys=path.split('/');let ref=obj;for(const k of keys.slice(0,-1))ref=ref[k]||(ref[k]={});ref[keys.at(-1)]=value;}
 function projections(teams,matches,finance){
   const tables={teams:{byName:{},byCategoryName:{}},matches:{byTime:{},byDay:{},byStatus:{},byDayStatus:{}},finance:{byTime:{},byDay:{}}};
   for(const team of rows(teams)){
     const k=nameKey(team), cat=safe(team.category||'OPEN');
     put(tables,'teams/byName/'+k,team);put(tables,`teams/byCategoryName/${cat}/${k}`,team);
   }
   for(const match of rows(matches)){
     const k=instant(match),d=date(match.date),s=safe(match.status||'SCHEDULED');
     for(const p of ['matches/byTime/'+k,`matches/byDay/${d}/${k}`,`matches/byStatus/${s}/${k}`,`matches/byDayStatus/${d}/${s}/${k}`])put(tables,p,match);
   }
   for(const row of rows(finance)){
     const k=instant(row),d=date(row.date);
     put(tables,'finance/byTime/'+k,row);put(tables,`finance/byDay/${d}/${k}`,row);
   }
   return tables;
 }
 function createReadModel(src, rootPath=''){
   const t=src?.teams||{},m=src?.matches||{},f=src?.finance||{};
   const aggregates=summary(t,m,f),tables=projections(t,m,f);
   return {meta:{schemaVersion:VERSION,sourceRoot:rootPath,active:false,complete:false,aggregatesTrusted:true,rankingsTrusted:false,counts:{teams:aggregates.teams.total,matches:aggregates.matches.total,finance:aggregates.finance.count}},aggregates,tables};
 }
 function validateModel(src,v2){
   const actual=summary(src?.teams,src?.matches,src?.finance);
   const a=v2?.aggregates||{},errors=[];
   for(const branch of ['teams','matches','finance'])for(const [k,val] of Object.entries(actual[branch]))if(val!==a?.[branch]?.[k])errors.push(`${branch}.${k} expected ${val}, got ${a?.[branch]?.[k]}`);
   const tables=v2?.tables||{};
   const expect={teams:actual.teams.total,matches:actual.matches.total,finance:actual.finance.count};
   for(const [b,path] of [['teams','byName'],['matches','byTime'],['finance','byTime']]){const count=Object.keys(tables[b]?.[path]||{}).length;if(count!==expect[b])errors.push(`${b} index: ${count} vs ${expect[b]}`)}
   for(const [branch,records,leaf] of [['teams',src?.teams,'byName'],['matches',src?.matches,'byTime'],['finance',src?.finance,'byTime']]){
     const stored=tables[branch]?.[leaf]||{};
     for(const [id,r] of Object.entries(records||{})){
       const value={...(r||{}),id:String(r?.id||id)};
       const key=branch==='teams'?nameKey(value):instant(value);
       const got=stored[key];
       if(!got)errors.push(`${branch}.${id} missing projection`);
       else if(JSON.stringify(got)!==JSON.stringify(value))errors.push(`${branch}.${id} projection mismatch`);
     }
   }
   for(const [id,row] of Object.entries(src?.finance||{})){
     if(!Number.isFinite(Number(row?.amount)))errors.push(`finance ${id} invalid amount`);
     if(!['INCOME','EXPENSE'].includes(row?.type))errors.push(`finance ${id} invalid type`);
   }
   for(const m of rows(src?.matches)){
     if(!m.teamAId||!src?.teams?.[m.teamAId])errors.push(`match ${m.id} missing team A ${m.teamAId}`);
     if(m.teamBId&&!src?.teams?.[m.teamBId])errors.push(`match ${m.id} missing team B ${m.teamBId}`);
     if(m.winnerId&&m.winnerId!==m.teamAId&&m.winnerId!==m.teamBId)errors.push(`match ${m.id} winnerId unrelated`);
   }
   return {ok:errors.length===0,errors,counts:expect,aggregates:actual};
 }
 function tablePath(branch,{category='',search='',day='',status=''}={}){
   if(branch==='teams'){
     return `tables/teams/${category?'byCategoryName/'+safe(category):'byName'}`;
   }
   if(branch==='matches'){
     if(day&&status)return `tables/matches/byDayStatus/${date(day)}/${safe(status)}`;
     if(day)return `tables/matches/byDay/${date(day)}`;
     if(status)return `tables/matches/byStatus/${safe(status)}`;
     return 'tables/matches/byTime';
   }
   if(branch==='finance')return day?`tables/finance/byDay/${date(day)}`:'tables/finance/byTime';
   throw new Error('Unsupported branch');
 }
 function pageOptions(branch,filters={}){
   const p=tablePath(branch,filters);
   const prefix=branch==='teams'&&filters.search?fold(filters.search).slice(0,90):'';
   return {path:`_v2/${p}`,direction:branch==='teams'?'asc':'desc',prefix};
 }
 // Cursor is the last returned key in query order; fetch one overlapping key
 // and remove it to avoid boundary loss or a duplicate when record values tie.
 async function readPage(ref,{direction='desc',size=DEFAULT_PAGE,cursor=null,prefix=''}={}){
   const limit=Math.max(1,Math.min(MAX_PAGE,Math.floor(+size||DEFAULT_PAGE)));
   if(!ref||typeof ref.orderByKey!=='function')throw new Error('Firebase query ref missing');
   if(cursor!=null&&typeof cursor!=='string')throw new Error('Cursor must be a string');
   let q=ref.orderByKey();
   if(direction==='asc'){
     if(cursor!=null)q=q.startAt(cursor);
     else if(prefix)q=q.startAt(prefix);
     if(prefix)q=q.endAt(prefix+'\uf8ff');
     q=q.limitToFirst(limit+2);
   }else{
     if(cursor!=null)q=q.endAt(cursor);
     q=q.limitToLast(limit+2);
   }
   const snap=await q.once('value'),entries=[];
   snap.forEach(child=>{if(child.val()!=null)entries.push({key:child.key,value:child.val()})});
   if(direction==='desc')entries.reverse();
   const filtered=entries.filter(x=>x.key!==cursor&&(!prefix||x.key.startsWith(prefix)));
   const items=filtered.slice(0,limit),hasMore=filtered.length>limit;
   return {items,hasMore,nextCursor:hasMore&&items.length?items.at(-1).key:null,limit};
 }
 async function scan(ref,{batch=MAX_PAGE,maxRecords=200000,onPage}={}){
   let cursor=null,arr=[],pages=0,finished=false;
   do{
     const page=await readPage(ref,{direction:'asc',size:batch,cursor});
     if(!page.items.length)break;
     arr.push(...page.items);pages++;
     if(arr.length>maxRecords)throw new Error('Scan would exceed safety limit');
     await onPage?.(page.items,pages);
     finished=!page.hasMore;cursor=page.nextCursor;
     if(page.hasMore&&!cursor)throw new Error('Cursor missing for continuation');
   }while(!finished);
   return {items:arr,pages,count:arr.length};
 }
 function indexLocations(branch,row){
   if(!row)return[];
   if(branch==='teams'){
     const key=nameKey(row);return[`tables/teams/byName/${key}`,`tables/teams/byCategoryName/${safe(row.category||'OPEN')}/${key}`];
   }
   if(branch==='matches'){
     const k=instant(row),d=date(row.date),s=safe(row.status||'SCHEDULED');
     return[`tables/matches/byTime/${k}`,`tables/matches/byDay/${d}/${k}`,`tables/matches/byStatus/${s}/${k}`,`tables/matches/byDayStatus/${d}/${s}/${k}`];
   }
   if(branch==='finance'){
     const k=instant(row),d=date(row.date);return[`tables/finance/byTime/${k}`,`tables/finance/byDay/${d}/${k}`];
   }
   return[];
 }
 // Describes index updates, which must be applied in the SAME multi-path update
 // as the canonical row mutation. Never independently overwrite canonical data.
 function indexDelta(branch,before,after,basePath){
   const updates={},base=`${basePath}/_v2/`;
   for(const path of indexLocations(branch,before))updates[base+path]=null;
   for(const path of indexLocations(branch,after))updates[base+path]=after;
   updates[base+'meta/aggregatesTrusted']=false;
   updates[base+'meta/rankingsTrusted']=false;
   return updates;
 }
 return {VERSION,MAX_PAGE,DEFAULT_PAGE,TERMINAL,date,instant,fold,safe,rows,summary,projections,createReadModel,validateModel,tablePath,pageOptions,readPage,scan,indexDelta,indexLocations};
});
