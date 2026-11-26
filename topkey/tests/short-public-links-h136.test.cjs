const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('topkey/l/index.html','utf8');
const bundle=fs.readFileSync('topkey/sports/vnext/h97-vnext.bundle.js','utf8');
const entry=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
assert.ok(entry.includes('h97-vnext.bundle.js?v=h232-badminton-config-parity-20261126'),'VNext must load the synchronized H232 runtime bundle, not the obsolete H136 cache tag');
assert.ok(bundle.includes("const LINK_FORMAT_KEY='topkey_share_url_format_h136'"));
assert.ok(bundle.includes('tk14-link-format'));
const start=bundle.indexOf("const LINK_FORMAT_KEY='topkey_share_url_format_h136'");
const end=bundle.indexOf('function spectatorUrl()',start);
assert.ok(start>0&&end>start);
const script=bundle.slice(start,end);
const output=(mode,hash,tid,token,sport='volleyball')=>{
 const T={Data:{tid},SPORT:{key:sport}};
 const storage={getItem:()=>mode};
 const ctx={T,localStorage:storage,location:{href:'https://demo.edgeone.dev/sports/vnext/index.html?sport='+sport+'&v=u122h123&entry=hub'},URL,console};
 vm.runInNewContext(script+';globalThis.__getLink=withTournament;',ctx);
 return ctx.__getLink(hash,{reg:token});
};
const viewer=output('short','spectator','main_2026','');
assert.equal(viewer,'https://demo.edgeone.dev/l/?s=v&t=main_2026#v');
const register=output('short','register','main_2026','abcd_123');
assert.equal(register,'https://demo.edgeone.dev/l/?s=v&t=main_2026&k=abcd_123#r');
assert.ok(!viewer.includes('u122h123'));
assert.ok(!register.includes('entry=hub'));
assert.equal(output('short','register','main_2026','token.with.dot'), 'https://demo.edgeone.dev/sports/vnext/index.html?sport=volleyball&entry=hub&tid=main_2026&reg=token.with.dot#register');
assert.ok(output('full','spectator','main_2026','').includes('/sports/vnext/index.html?'));
assert.ok(!output('full','spectator','main_2026','').includes('&v='));
const pre=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(pre,'short redirect script missing');
function route(query,hash){
 let assigned='',loaded;
 const current=new URL('https://demo.edgeone.dev/l/'+query+hash);
 const nodes={message:{textContent:''},'open-target':{href:'',hidden:true}};
 const ctx={
   window:{},
   location:{search:current.search,hash:current.hash,href:current.href,replace:v=>{assigned=v}},
   document:{addEventListener:(name,fn)=>{if(name==='DOMContentLoaded')loaded=fn},getElementById:id=>nodes[id],visibilityState:'visible'},
   URL,URLSearchParams,setTimeout:()=>0,
 };
 vm.runInNewContext(pre[1],ctx);
 assert.equal(typeof loaded,'function','redirect must attach DOM-ready listener');
 loaded();
 return {assigned,valid:!!ctx.window.TopkeyShortRedirect,manual:nodes['open-target']};
}
const a=route('?s=v&t=main_2026','#v');
assert.equal(a.assigned,'https://demo.edgeone.dev/sports/vnext/index.html?sport=volleyball&tid=main_2026#spectator');
assert.equal(a.manual.href,a.assigned);
assert.equal(a.manual.hidden,false);
assert.equal(route('?s=v&t=main_2026&k=abcd_123','#r').assigned,'https://demo.edgeone.dev/sports/vnext/index.html?sport=volleyball&tid=main_2026&reg=abcd_123#register');
assert.ok(!route('?s=v&t=main_2026','#bad').valid);
assert.ok(!route('?s=bad&t=main_2026','#v').valid);
assert.ok(!route('?s=v&t=../../evil','#v').valid);
console.log('H136 short links: viewer, registration token, manual mobile fallback, invalid slug routing passed.');
