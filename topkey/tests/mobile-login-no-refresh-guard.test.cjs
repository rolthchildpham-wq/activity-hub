'use strict';
/* Shared login no-native-refresh regression across badminton and all VNEXT sports. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const guard=fs.readFileSync(path.join(base,'topkey-login-guard.js'),'utf8');
const policy=fs.readFileSync(path.join(base,'topkey-platform-core.js'),'utf8');
const sports=['badminton','football','volleyball','running','handmade','shuttle','cooking'];
for(const sport of sports){
 const rel=sport==='badminton'?'sports/badminton/index.html':'sports/vnext/index.html';
 const html=fs.readFileSync(path.join(base,rel),'utf8');
 const script='<script src="../../topkey-login-guard.js?v=h139-unified-sports-login-20261114"></script>';
 assert.ok(html.includes(script),sport+' uses shared login guard');
 assert.ok(html.indexOf(script)<html.indexOf('src="../../topkey-platform-core.js?'),sport+' guard loads before platform');
 assert.ok(html.includes('topkey-platform-core.js?v=h138-mobile-login-20261114'),sport+' uses same unified platform core');
 assert.ok(!html.includes('id="topkey-login-native-refresh-guard"'),sport+' has no duplicated inline auth handler');
}
assert.match(policy,/bindLogin\(\{ensureCore:\(\)=>shellPromise\}\)/,'shared auth binding must be early');
const registered=[];
let hint='';let prevented=0;
const ctx={window:{},document:{addEventListener:(type,cb,capture)=>registered.push({type,cb,capture}),getElementById:()=>({set textContent(x){hint=x}})}};
vm.runInNewContext(guard,ctx,{filename:'topkey-login-guard.js'});
vm.runInNewContext(guard,ctx,{filename:'topkey-login-guard.js'});
assert.equal(registered.length,1,'guard must only install once');
assert.equal(registered[0].type,'submit');
assert.equal(registered[0].capture,true);
registered[0].cb({target:{id:'login-form'},preventDefault(){prevented++}});
assert.equal(prevented,1,'native form submit is blocked before Firebase loads');
assert.match(hint,/Đang tải/);
ctx.window.TopkeyPlatform={state:{loginBound:true}};
registered[0].cb({target:{id:'login-form'},preventDefault(){prevented++}});
assert.equal(prevented,2,'native form submit always prevented even after auth binds');
console.log('PASS H139 shared auth guard across all '+sports.length+' sports');
