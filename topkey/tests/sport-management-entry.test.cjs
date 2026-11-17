'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const hub=fs.readFileSync(path.join(root,'index.html'),'utf8');
const flow=fs.readFileSync(path.join(root,'hub-auth-flow.js'),'utf8');
const code=fs.readFileSync(path.join(root,'sport-management-launch.js'),'utf8');
const css=fs.readFileSync(path.join(root,'sport-management-launch.css'),'utf8');
assert.match(hub,/id="sport-management"/);
assert.match(hub,/sport-management-launch\.css\?v=20261117-admin-r1/);
assert.match(hub,/sport-management-launch\.js\?v=20261117-admin-r1/);
assert(hub.indexOf('hub-auth-flow.js')<hub.indexOf('sport-management-launch.js'),'Hub session handler must load first');
assert.match(flow,/closest\?\.\('a\.sport'\)/);
assert.match(flow,/makeSession\(sport\)/);
assert.match(css,/@media\(max-width:680px\)/);
assert.doesNotMatch(code,/signInWithEmailAndPassword|signOut\(|localStorage|sessionStorage|\.set\(|\.update\(|innerHTML/,'Navigation must not create an independent login, grant permissions, or write data');
class Element{
 constructor(tag='section'){this.tag=tag;this.children=[];this.dataset={};this.events={};this.attrs={};this.classList={add(){}};this.textContent='';}
 append(...nodes){this.children.push(...nodes)}
 appendChild(node){this.children.push(node);return node}
 replaceChildren(...nodes){this.children=[...nodes]}
 setAttribute(k,v){this.attrs[k]=v}
 addEventListener(k,fn){this.events[k]=fn}
 querySelectorAll(selector){const out=[];const search=n=>{for(const x of n.children){if(selector==='button'&&x.tag==='button')out.push(x);search(x)}};search(this);return out}
}
const host=new Element(),doc={readyState:'complete',getElementById:id=>id==='sport-management'?host:null,createElement:tag=>new Element(tag)};
let authListener;
const window={firebase:{auth:()=>({onAuthStateChanged:fn=>{authListener=fn;fn(null)}})}};
const ctx={document:doc,window,console};
vm.createContext(ctx);new vm.Script(code,{filename:'sport-management-launch.js'}).runInContext(ctx);
const api=window.TopkeySportManagement;
assert.equal(api.sports.length,7);
const tabs=host.querySelectorAll('button');
assert.equal(tabs.length,7);
let links=[];
function collect(node){if(node.tag==='a')links.push(node);for(const c of node.children)collect(c)}
collect(host);
let view=links.find(x=>x.className.includes('tk-mgmt-view')),manage=links.find(x=>x.className.includes('tk-mgmt-manage'));
assert(view&&manage);
assert.equal(manage.href,'./sports/vnext/index.html?sport=football');
assert(manage.className.includes('sport'),'Management link must use Hub auth ticket handling');
tabs.find(x=>x.dataset.sport==='badminton').events.click();
assert.equal(manage.href,'./sports/badminton/index.html');
tabs.find(x=>x.dataset.sport==='running').events.click();
assert.equal(manage.href,'./sports/vnext/index.html?sport=running');
assert.equal(view.href,manage.href);
assert.equal(tabs.find(x=>x.dataset.sport==='running').attrs['aria-pressed'],'true');
const state=(()=>{const find=n=>n.id==='sport-management-session'?n:n.children.map(find).find(Boolean);return find(host)})();
assert.match(state.textContent,/Chưa đăng nhập/);
authListener({uid:'u1',isAnonymous:false});
assert.match(state.textContent,/Đã đăng nhập TOPKEY/);
assert(links.some(x=>x.href==='./system-admin.html'),'System administration route must be preserved');
assert(links.some(x=>x.href==='./sports/diy-vlog/index.html'),'Vlog login route must be preserved');
console.log('PASS: seven management sports, shared hub auth links, login states, responsive CSS and preserved system/Vlog routes');
