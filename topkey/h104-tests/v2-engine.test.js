'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),V=require('../h104-v2-engine');
class Snap{constructor(entries){this.entries=entries}forEach(cb){for(const [key,val] of this.entries)cb({key,val:()=>val})}}
class Query{
 constructor(data,{start=null,end=null,first=0,last=0}={}){this.data=data;this.start=start;this.end=end;this.first=first;this.last=last}
 copy(extra){return new Query(this.data,{start:this.start,end:this.end,first:this.first,last:this.last,...extra})}
 orderByKey(){return this}startAt(k){return this.copy({start:k})}endAt(k){return this.copy({end:k})}
 limitToFirst(v){return this.copy({first:v,last:0})}limitToLast(v){return this.copy({last:v,first:0})}
 async once(event){assert.equal(event,'value');let entries=Object.entries(this.data).sort(([a],[b])=>a.localeCompare(b,'en'));
  if(this.start!==null)entries=entries.filter(([key])=>key>=this.start);
  if(this.end!==null)entries=entries.filter(([key])=>key<=this.end);
  if(this.first)entries=entries.slice(0,this.first);if(this.last)entries=entries.slice(-this.last);
  return new Snap(entries);
 }
}
async function test(){
 const N=12000,teams={},matches={},finance={};
 for(let i=0;i<N;i++){
   const id='team_'+String(i).padStart(5,'0');teams[id]={id,name:'Đội '+String(i).padStart(5,'0'),category:i%2?'MEN':'MIX',checkedIn:i%3===0};
   const mid='match_'+String(i).padStart(5,'0');matches[mid]={id:mid,teamAId:id,teamBId:'team_'+String((i+1)%N).padStart(5,'0'),date:'2026-11-'+String(1+i%28).padStart(2,'0'),time:String(i%24).padStart(2,'0')+':00',status:i%5?'FINISHED':'SCHEDULED',sets:[{a:21,b:14}]};
   const fid='fin_'+String(i).padStart(5,'0');finance[fid]={id:fid,date:'2026-11-'+String(1+i%28).padStart(2,'0'),time:'12:00',type:i%2?'EXPENSE':'INCOME',amount:1000+i,status:i%3?'PAID':'REQUESTED'};
 }
 const src={teams,matches,finance},model=V.createReadModel(src,'topkey_fixture'),verified=V.validateModel(src,model);
 assert.equal(verified.ok,true,verified.errors.slice(0,2).join(';'));
 for(const [branch,flt] of [['teams',{}],['teams',{category:'MEN'}],['teams',{search:'doi 000'}],['matches',{}],['matches',{day:'2026-11-03'}],['matches',{status:'FINISHED'}],['matches',{day:'2026-11-03',status:'FINISHED'}],['finance',{}],['finance',{day:'2026-11-03'}]]){
  const opt=V.pageOptions(branch,flt);const keys=opt.path.slice(4).split('/');let data=model;for(const k of keys)data=data?.[k];data=data||{};
  const expected=Object.keys(data).filter(key=>!opt.prefix||key.startsWith(opt.prefix));let cursor=null,seen=new Set(),n=0,pages=0,more=true;
  while(more){const page=await V.readPage(new Query(data),{size:123,direction:opt.direction,cursor,prefix:opt.prefix});
    for(const item of page.items){assert.equal(seen.has(item.key),false,`${branch}: duplicate ${item.key}`);seen.add(item.key);n++}
    more=page.hasMore;cursor=page.nextCursor;pages++;assert.ok(pages<120)}
  assert.equal(n,expected.length,`${branch} ${JSON.stringify(flt)} expected ${expected.length}, got ${n}`);
  console.log('PASS PAGE',branch,JSON.stringify(flt),`records=${n}`,`pages=${pages}`);
 }
 const changed={...matches.match_00012,status:'CANCELLED',date:'2026-11-30'};
 const delta=V.indexDelta('matches',matches.match_00012,changed,'root/tournaments/tid');
 assert.ok(Object.values(delta).includes(null));assert.ok(Object.values(delta).some(x=>x?.status==='CANCELLED'));
 assert.equal(delta['root/tournaments/tid/_v2/meta/aggregatesTrusted'],false);
 console.log('PASS status/date index mutation atomic delta');
 const changedFin={...finance.fin_00002,amount:999999};
 const finDelta=V.indexDelta('finance',finance.fin_00002,changedFin,'root/tournaments/tid');
 assert.equal(finDelta['root/tournaments/tid/_v2/meta/aggregatesTrusted'],false);
 console.log('PASS financial aggregate invalidation');
 assert.equal(model.aggregates.teams.total,12000);assert.equal(model.aggregates.matches.total,12000);assert.equal(model.aggregates.finance.count,12000);
 const corrupted=JSON.parse(JSON.stringify({teams:{a:{id:'a'}},matches:{b:{id:'b',teamAId:'unknown'}}}));
 assert.equal(V.validateModel(corrupted,V.createReadModel(corrupted)).ok,false);
 console.log('PASS referential integrity catches invalid match');
 const path=process.argv[2];if(path){const j=JSON.parse(fs.readFileSync(path));const d=j.data?.tournaments?.main_2026||j.data||j;const v=V.createReadModel(d,j.root||'');const res=V.validateModel(d,v);assert.ok(res.ok,res.errors.join('; '));console.log('PASS USER BACKUP',JSON.stringify(res.counts),JSON.stringify(res.aggregates.finance));}
 console.log('ALL TESTS PASS');
}
test().catch(e=>{console.error('FAIL',e);process.exitCode=1});
