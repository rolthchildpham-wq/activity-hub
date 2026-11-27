import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 OPERATIONAL_SPORTS,normalizeSport,normalizeScope,normalizeRole,isBlocked,canAccess,canTab,canViewModule,policyMatchesOperationalSource
} from '../src/lib/platform-policy.ts';

const operational=readFileSync(new URL('../../topkey/topkey-platform-core.js',import.meta.url),'utf8');

test('new workspace policy stays aligned with the canonical TOPKEY platform policy',()=>{
 assert.equal(policyMatchesOperationalSource(operational),true);
});
test('all seven sports and Vietnamese aliases normalize consistently',()=>{
 assert.deepEqual([...OPERATIONAL_SPORTS],['badminton','football','volleyball','running','handmade','shuttle','cooking']);
 assert.equal(normalizeSport('Cầu lông'),'badminton');
 assert.equal(normalizeSport('Bóng chuyền'),'volleyball');
 assert.equal(normalizeSport('Đá cầu'),'shuttle');
 assert.equal(normalizeSport('Nấu ăn'),'cooking');
});
test('role normalization and blocked-account checks fail closed',()=>{
 assert.equal(normalizeRole('admin'),'ADMIN');
 assert.equal(normalizeRole('unknown'),'VIEWER');
 for(const profile of [null, {active:false},{disabled:true},{locked:true},{enabled:false},{isActive:false},{status:'SUSPENDED'}])assert.equal(isBlocked(profile),true);
 assert.equal(isBlocked({}),false);
 assert.equal(isBlocked({role:'VIEWER',active:true}),false);
});
test('sport-scope policy matches ADMIN, BTC, UMPIRE and VIEWER semantics',()=>{
 assert.equal(canAccess({role:'ADMIN',active:true},'football'),true);
 assert.equal(canAccess({role:'BTC',active:true,sportScope:'Bóng đá'},'football'),true);
 assert.equal(canAccess({role:'BTC',active:true,sportScope:'football'},'badminton'),false);
 assert.equal(canAccess({role:'UMPIRE',active:true},'volleyball'),true);
 assert.equal(canAccess({role:'VIEWER',active:true,sportScope:'Cầu lông'},'badminton'),true);
 assert.equal(canAccess({role:'VIEWER',active:true,sportScope:'Cầu lông'},'football'),false);
 assert.equal(canAccess({role:'ADMIN',active:false},'football'),false);
 assert.equal(canAccess({role:'ADMIN',active:true},'vlog'),false);
});
test('role tab permissions and module aliases preserve operational navigation access',()=>{
 assert.equal(canTab('VIEWER','schedule'),true);
 assert.equal(canTab('VIEWER','finance'),false);
 assert.equal(canTab('UMPIRE','umpire'),true);
 assert.equal(canTab('UMPIRE','teams'),false);
 assert.equal(canViewModule({role:'VIEWER',active:true},'schedule'),true);
 assert.equal(canViewModule({role:'VIEWER',active:true},'referee'),false);
 assert.equal(canViewModule({role:'ADMIN',active:true},'referee'),true);
 assert.equal(canViewModule({role:'ADMIN',active:true,permissions:{tabs:{finance:false}}},'finance'),false);
});
