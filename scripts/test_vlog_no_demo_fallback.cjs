'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','topkey/sports/diy-vlog/index.html'),'utf8');
const begin=html.indexOf("const root='topkey_vlog2026'"),end=html.indexOf('const esc=',begin);
assert(begin>=0&&end>begin);
const init=html.slice(begin,end);
assert(!html.includes('Đội Sài Gòn Rực Rỡ'),'No bundled fake contestant names');
assert(!html.includes('Nguyễn Minh Anh'),'No bundled fake names');
assert(!html.includes('entries:sample'),'Never populate production ranking from sample data');
assert(!html.includes('chỉ hiển thị mẫu'),'Firebase error must not show examples');
assert(html.includes('id="warning" hidden'),'No demo warning at startup');
assert(!html.includes("'<span class=\"demo\">DỮ LIỆU MẪU</span>'"),'No fake-data badges');
assert(html.includes('if(testMode||shareMode||!remoteLoaded.weights||!remoteLoaded.entries)return;'),'Wait for both Firebase streams and private share isolation');
assert(html.includes('remoteLoaded[key]=true'),'Track real Firebase stream completion');
const applyStart=html.indexOf('function apply(raw){'),applyEnd=html.indexOf('function setTestLabVisibility',applyStart);
assert(applyStart>0&&applyEnd>applyStart);
const applySource=html.slice(applyStart,applyEnd);
function scenario(query){
 const ctx={URLSearchParams,location:{search:query},renderCount:0};
 vm.createContext(ctx);
 vm.runInContext(init+applySource+"\nthis.expose=()=>({data,real,shareMode,remoteLoaded,renderCount});this.setLoaded=(k,v)=>{remote[k]=v;remoteLoaded[k]=true;apply(remote)};",ctx);
 return ctx;
}
function withRender(query){
 const ctx={URLSearchParams,location:{search:query},renderCount:0};
 vm.createContext(ctx);
 vm.runInContext('const render=()=>this.renderCount++;\n'+init+applySource+
 "\nthis.expose=()=>({data,real,shareMode,remoteLoaded,renderCount});this.setLoaded=(k,v)=>{remote[k]=v;remoteLoaded[k]=true;apply(remote)};",ctx);
 return ctx;
}
let ctx=withRender('');
assert.equal(Object.keys(ctx.expose().data.entries).length,0);
assert.equal(ctx.expose().real,false);
ctx.setLoaded('weights',{views:1,likes:1,shares:1});
assert.equal(ctx.expose().renderCount,0,'Do not render partial Firebase snapshot');
ctx.setLoaded('entries',{'real1':{name:'Real contestant',type:'Đội',views:123,likes:6,shares:2}});
assert.equal(ctx.expose().renderCount,1);
assert.equal(Object.keys(ctx.expose().data.entries).length,1);
assert.equal(ctx.expose().data.entries.real1.name,'Real contestant');
assert.equal(ctx.expose().real,true);
ctx=withRender('');
ctx.setLoaded('weights',null);ctx.setLoaded('entries',null);
assert.equal(ctx.expose().renderCount,1);
assert.equal(Object.keys(ctx.expose().data.entries).length,0,'Empty Firebase data must remain empty');
ctx=withRender('?share='+'a'.repeat(48));
ctx.setLoaded('weights',{views:1,likes:2,shares:3});
ctx.setLoaded('entries',{real1:{name:'Private contestant'}});
assert.equal(ctx.expose().renderCount,0,'Do not leak live ranking while private snapshot loads');
assert.equal(Object.keys(ctx.expose().data.entries).length,0);
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(match[1].trim())new vm.Script(match[1]);
console.log('PASS Vlog: no embedded demo records, no fallback on errors, waits both Firebase streams, empty state, private-link isolation, inline JS syntax');
