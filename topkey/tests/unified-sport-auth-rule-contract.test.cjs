'use strict';
/* Source-level contract only; Firebase emulator / deployed-rule tests remain required. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const rules=JSON.parse(fs.readFileSync(path.join(root,'firebase.database.rules.json'),'utf8')).rules;
const authSource=fs.readFileSync(path.join(root,'topkey-shared-auth.js'),'utf8');
const platform=fs.readFileSync(path.join(root,'topkey-platform-core.js'),'utf8');
const sports=['badminton','football','volleyball','running','handmade','shuttle','cooking'];
assert.equal(rules['.write'],false);
assert.equal(rules['.read'],false);
assert.ok(rules.topkey_badminton_vnext_2026.users.$uid['.read'].includes('auth.uid'));
for(const sport of sports){
 const key='topkey_'+sport+'_vnext_2026';
 assert.ok(rules[key],sport+' must have existing sport-specific data root');
 assert.ok(rules[key].tournaments,sport+' must retain sport-specific tournament data');
 assert.ok(platform.includes("'"+sport+"'"),sport+' must be registered by shared platform');
}
// Every module reads its account role from the shared badminton/users root, but
// sport-specific tournament score permissions must still be enforced by RTDB.
for(const sport of sports.filter(x=>x!=='badminton')){
 const key='topkey_'+sport+'_vnext_2026';
 assert.ok(rules[key]['.write'].includes("topkey_badminton_vnext_2026/users"),sport+' must use central account registry');
 assert.ok(rules[key]['.write'].includes("sportScope"),sport+' must retain scoped BTC authorization');
}
assert.ok(authSource.includes('policy.canAccess(profile,sport())'),'shared account policy controls sport access');
console.log('PASS source-only unified auth registry and distinct tournament roots for 7 sports');
