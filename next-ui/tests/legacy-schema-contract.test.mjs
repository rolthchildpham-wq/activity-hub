import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');
const legacy=read('../../topkey/sports/vnext/h97-vnext.bundle.js');
const source=read('../src/lib/shared/api/limited-branch.ts');
const finance=read('../src/routes/sports/[slug]/[tid]/finance/+page.svelte');
const history=read('../src/routes/sports/[slug]/[tid]/history/+page.svelte');

test('finance route matches production finance child and schema',()=>{
 assert.ok(legacy.includes("T.Data.queueSet('finance/'+id"));
 assert.ok(legacy.includes("status:'REQUESTED'"));
 assert.ok(finance.includes(",'finance',"));
 assert.ok(!finance.includes(",'transactions',"));
});
test('history route matches production audit child and timestamp',()=>{
 assert.ok(legacy.includes("return this.queueSet(") && legacy.includes("audit/"));
 assert.ok(legacy.includes('clientAt: Date.now()'));
 assert.ok(history.includes(",'audit',"));
 assert.ok(history.includes('.clientAt'));
 assert.ok(!history.includes(",'logs',"));
});
test('totals use all records while audit sorts by clientAt before limiting',()=>{
 assert.ok(source.includes("return onValue(node,snap=>"));
 assert.ok(!source.includes('limitToLast(200)'));
 assert.ok(history.includes('.slice(0,200)'));
});
test('navigating between tournaments replaces old finance/audit listeners',()=>{
 for(const route of [finance,history]){
  assert.ok(route.includes('afterNavigate('));
  assert.ok(route.includes('unsubscribe?.()'));
  assert.ok(route.includes('onDestroy('));
 }
});
