/* Simulated authorization parity: Vlog UI and EdgeOne must not grant write UI beyond RTDB Rules. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'topkey/sports/diy-vlog/index.html'),'utf8');
const edge=fs.readFileSync(path.join(root,'topkey/edge-functions/api/tiktok-stats.js'),'utf8');
const rules=JSON.parse(fs.readFileSync(path.join(root,'topkey/firebase.database.rules.json'),'utf8')).rules.topkey_vlog2026['.write'];
const start=html.indexOf("const role=String(p.role||'');"),end=html.indexOf("$('admin-toggle').hidden=!isAdmin;",start);
assert(start>0&&end>start,'Vlog profile authorization block');
const evaluate=vm.runInNewContext('(p)=>{let isRootAdmin=false,isAdmin=false;'+html.slice(start,end)+';return {isAdmin,isRootAdmin}}');
const edgeStart=edge.indexOf('function permitted(profile){'),edgeEnd=edge.indexOf('async function getJson(',edgeStart);
assert(edgeStart>0&&edgeEnd>edgeStart);
const permitted=vm.runInNewContext(edge.slice(edgeStart,edgeEnd)+'\npermitted');
const cases=[
 ['ADMIN',{role:'ADMIN'},true,true],
 ['BTC vlog',{role:'BTC',sportAccess:{vlog:true}},true,false],
 ['BTC DIY scope',{role:'BTC',sportScope:'diy'},true,false],
 ['BTC handmade assigned',{role:'BTC',assignedSport:'DIY / Handmade'},true,false],
 ['BTC handmade flag',{role:'BTC',sportAccess:{handmade:true}},true,false],
 ['BTC explicit module',{role:'BTC',permissions:{modules:{vlog:'edit'}}},true,false],
 ['viewer',{role:'VIEWER'},false,false],
 ['unscoped BTC',{role:'BTC'},false,false],
 ['group-only BTC',{role:'BTC',sportScopes:['vlog']},false,false],
 ['vlog text only BTC',{role:'BTC',sportScope:'vlog'},false,false],
 ['uppercase module value',{role:'BTC',permissions:{modules:{vlog:'EDIT'}}},false,false],
 ['lowercase role',{role:'btc',sportScope:'diy'},false,false],
 ['disabled BTC',{role:'BTC',sportAccess:{vlog:true},disabled:true},false,false],
 ['inactive ADMIN',{role:'ADMIN',status:'disabled'},false,false]
];
for(const [label,profile,expected,rootAdmin] of cases){
 const actual=evaluate(profile);
 assert.equal(actual.isAdmin,expected,'UI: '+label);
 assert.equal(actual.isRootAdmin,rootAdmin,'TEST LAB: '+label);
 assert.equal(permitted(profile),expected,'EdgeOne: '+label);
}
assert.match(rules,/sportAccess\/vlog/);
assert.doesNotMatch(rules,/sportScopes/);
console.log('PASS Vlog UI/EdgeOne simulated authorization parity: '+cases.length+' cases; RTDB rule structure checked (not emulator)');
