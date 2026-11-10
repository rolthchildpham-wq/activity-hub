'use strict';
// Firebase RTDB compat SDK cursor-based bounded queries, newest-first.
// A cursor is {key,value}; a missing cursor means first page.
function createPager(refFactory){
 async function page(path,{orderBy='key',size=100,cursor=null}={}){
  if(!['key','createdAt','updatedAt','date','status','category'].includes(orderBy))throw Error('Unsupported index');
  const limit=Math.max(1,Math.min(200,Math.trunc(Number(size)||100)));
  const base=refFactory(path);
  let query=orderBy==='key'?base.orderByKey():base.orderByChild(orderBy);
  if(cursor){if(typeof cursor.key!=='string')throw Error('Invalid cursor');query=orderBy==='key'?query.endAt(cursor.key):query.endAt(cursor.value,cursor.key)}
  const snap=await query.limitToLast(limit+2).once('value');
  let rows=[];snap.forEach(child=>rows.push({key:child.key,value:child.val()}));
  if(cursor)rows=rows.filter(row=>row.key!==cursor.key);
  const hasMore=rows.length>limit;
  if(hasMore)rows=rows.slice(-limit);
  const first=rows[0];
  return {items:rows.reverse(),hasMore,nextCursor:hasMore&&first?{key:first.key,value:orderBy==='key'?first.key:first.value?.[orderBy]??null}:null};
 }
 return {page};
}
if(typeof module!=='undefined')module.exports={createPager};
