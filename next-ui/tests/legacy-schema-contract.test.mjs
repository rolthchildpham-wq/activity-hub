import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');
const source=read('../src/lib/shared/api/limited-branch.ts');
const finance=read('../src/routes/sports/[slug]/[tid]/finance/+page.svelte');
const history=read('../src/routes/sports/[slug]/[tid]/history/+page.svelte');
const operational=read('../../topkey/sports/vnext/h97-vnext.bundle.js');

test('finance route matches production finance child and schema',()=>{
 assert.ok(operational.includes("T.Data.queueSet('finance/'+id"));
 assert.ok(operational.includes("status:'REQUESTED'"));
 assert.ok(finance.includes(",'finance',"));
 assert.ok(!finance.includes(",'transactions',"));
});
test('history route matches production audit child and timestamp',()=>{
 assert.ok(operational.includes("return this.queueSet(") && operational.includes("audit/"));
 assert.ok(operational.includes('clientAt: Date.now()'));
 assert.ok(history.includes(",'audit',"));
 assert.ok(history.includes('.clientAt'));
 assert.ok(!history.includes(",'logs',"));
});
test('totals use all records while audit sorts by clientAt before limiting',()=>{
 assert.ok(source.includes("onValue(ref(db,roots[sport]+'/tournaments/'+tid+'/'+branch)"));
 assert.ok(source.includes('snap=>{'));
 assert.ok(!source.includes('limitToLast(200)'));
 assert.ok(history.includes('.slice(0,200)'));
});
test('sensitive listeners start only after shared account and sport-scope authorization',()=>{
 assert.ok(source.includes('getAuth(db.app).currentUser'));
 assert.ok(source.includes('get(profileRef).then(snapshot=>'));
 assert.ok(source.indexOf('isBlocked(profile)||!canAccess(profile,sport)') < source.indexOf('start();'));
 assert.ok(source.includes('profileStop=onValue(profileRef'));
 assert.ok(source.includes('Quyền truy cập dữ liệu'));
});
test('navigating between tournaments replaces old finance/audit listeners',()=>{
 for(const route of [finance,history]){
  assert.ok(route.includes('afterNavigate('));
  assert.ok(route.includes('unsubscribe?.()'));
  assert.ok(route.includes('onDestroy('));
 }
});
