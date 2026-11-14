'use strict';
/* Smoke guard: the login form must never navigate/reload if the auth runtime is delayed. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
for(const rel of ['sports/badminton/index.html','sports/vnext/index.html']){
 const html=fs.readFileSync(path.join(__dirname,'..',rel),'utf8');
 const tag=html.match(/<script id="topkey-login-native-refresh-guard">([\s\S]*?)<\/script>/);
 assert.ok(tag,rel+' includes early auth submit guard');
 assert.ok(html.indexOf('id="topkey-login-native-refresh-guard"')<html.indexOf('src="../../topkey-platform-core.js?'),rel+' guard runs before async platform');
 assert.ok(html.includes('topkey-platform-core.js?v=h138-mobile-login-20261114'),rel+' busts stale platform core URL');
 const listeners=[];
 let hint='';let prevented=0;
 const ctx={
  document:{addEventListener:(event,cb,capture)=>{if(event==='submit'&&capture)listeners.push(cb)},getElementById:()=>({set textContent(x){hint=x}})},
  window:{}
 };
 vm.runInNewContext(tag[1],ctx);
 assert.equal(listeners.length,1);
 listeners[0]({target:{id:'login-form'},preventDefault(){prevented++}});
 assert.equal(prevented,1,'native form submit prevented while core not ready');
 assert.match(hint,/Đang tải/);
 ctx.window.TopkeyPlatform={state:{loginBound:true}};
 listeners[0]({target:{id:'login-form'},preventDefault(){prevented++}});
 assert.equal(prevented,2,'guard still prevents navigation and allows the bound core listener to handle login');
 console.log('PASS '+rel+' login no-native-refresh guard');
}
