"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const short=fs.readFileSync("topkey/l/index.html","utf8");
const html=fs.readFileSync("topkey/sports/vnext/index.html","utf8");
const vendor=fs.readFileSync("topkey/vendor/qrcode.min.js","utf8");
const script=short.match(/<script>([\s\S]*?)<\/script>/)[1];
const cases=[
 {url:"https://sample.edgeone.dev/l/?s=v&t=main_2026#v",suffix:"/sports/vnext/index.html?sport=volleyball&tid=main_2026#spectator"},
 {url:"https://sample.edgeone.dev/l/?s=v&t=main_2026&k=token123#r",suffix:"/sports/vnext/index.html?sport=volleyball&tid=main_2026&reg=token123#register"},
 {url:"https://sample.edgeone.dev/l/?s=b&t=main_2026#v",suffix:"/sports/badminton/index.html?tid=main_2026#spectator"},
 {url:"https://sample.edgeone.dev/l/?s=invalid&t=main_2026#v",suffix:null}
];
for(const c of cases){
 const current=new URL(c.url);
 const elements={message:{textContent:""}, "open-target":{href:"",hidden:true}};
 let cb=null,redirect=null;
 const doc={addEventListener:(name,fn)=>{if(name==="DOMContentLoaded")cb=fn},getElementById:id=>elements[id],visibilityState:"visible"};
 const location={href:current.href,search:current.search,hash:current.hash,replace:u=>{redirect=u}};
 const context={window:{},location,document:doc,URL,URLSearchParams,setTimeout:()=>0};
 vm.runInNewContext(script,context,{timeout:1000});
 assert.equal(typeof cb,"function","DOM handler must exist");
 cb();
 if(c.suffix){
  assert.equal(redirect,"https://sample.edgeone.dev"+c.suffix);
  assert.equal(elements["open-target"].href,redirect);
  assert.equal(elements["open-target"].hidden,false);
 }else{
  assert.equal(redirect,null);
  assert.match(elements.message.textContent,/không hợp lệ|thiếu thông tin/i);
 }
}
assert.ok(vendor.includes("var QRCode"));
assert.ok(html.indexOf('vendor/qrcode.min.js')<html.indexOf('production-loader.js'));
assert.ok(!html.includes("cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"));
console.log("H136 QR local + mobile short URL routing: 4/4 PASS");
