const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('topkey/sports/badminton/index.html','utf8');
const match=html.match(/<script id="topkey-auth-boot-cleanup">([\s\S]*?)<\/script>/);
assert.ok(match,'Independent auth overlay cleanup script exists');
const listeners={};
const removed=[];
let appHidden=false;
const pending={remove(){removed.push('pending')}};
const app={classList:{contains(key){return key==='hidden'&&appHidden}}};
const document={
 getElementById(id){return id==='app-shell'?app:null},
 querySelectorAll(selector){assert.equal(selector,'[id="topkey-auth-boot-pending"]');return [pending]},
 addEventListener(name,handler){listeners['document:'+name]=handler}
};
const window={
 addEventListener(name,handler){listeners[name]=handler},
 Topkey:{Auth:{_profileVerifiedUid:''}},
 __TOPKEY_ADMIN_READY:false
};
vm.runInNewContext(match[1],{window,document});
listeners.pageshow();
assert.equal(removed.length,0,'not removed before authorization');
appHidden=true;
listeners['topkey:auth-state']({detail:{state:'AUTHENTICATED',verified:true}});
assert.equal(removed.length,0,'not removed until app visible');
appHidden=false;
listeners.pageshow();
assert.equal(removed.length,1,'removed after verified app becomes visible');
console.log('Badminton authenticated app removes stale boot overlay');
