const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const hub=fs.readFileSync('topkey/index.html','utf8');
const badminton=fs.readFileSync('topkey/sports/badminton/index.html','utf8');
const hubCss=fs.readFileSync('topkey/hub-compact-h130.css','utf8');
const hubJs=fs.readFileSync('topkey/hub-compact-h130.js','utf8');
const barCss=fs.readFileSync('topkey/sports/badminton/sidebar-collapse-h130.css','utf8');
const barJs=fs.readFileSync('topkey/sports/badminton/sidebar-collapse-h130.js','utf8');
assert.ok(hub.includes('./hub-compact-h130.css?v=h130-20261113'));
assert.ok(hub.includes('./hub-compact-h130.js?v=h130-20261113'));
assert.ok(badminton.includes('./sidebar-collapse-h130.css?v=h130-20261113'));
assert.ok(badminton.includes("await loadScript('./sidebar-collapse-h130.js?v=h130-20261113',7000)"));
assert.match(hubCss,/tk-bi-hero\{display:none!important\}/);
assert.match(hubCss,/top \.status\{[^}]+flex-direction:row!important/);
assert.match(hubCss,/exec-table td/);
assert.match(barCss,/tk-h130-collapsed #app-shell\{grid-template-columns:68px minmax\(0,1fr\)!important/);
assert.match(barCss,/page:not\(#page-overview\) \.card/);
assert.ok(!barJs.includes('location.reload')&&!barJs.includes('location.replace'));
assert.ok(!hubJs.includes('firebase.')&&!hubJs.includes('location.reload'));
const makeClasses=()=>{
 const values=new Set();return {contains:k=>values.has(k),add:k=>values.add(k),remove:k=>values.delete(k),toggle:(k,v)=>{if(v===undefined)v=!values.has(k);v?values.add(k):values.delete(k);return v}};
};
const el=tag=>({tag,id:'',className:'',classList:makeClasses(),children:[],dataset:{},textContent:'',attrs:{},
 append(...nodes){this.children.push(...nodes)},appendChild(node){this.children.push(node)},prepend(...nodes){this.children.unshift(...nodes)},
 replaceChildren(...nodes){this.children=[...nodes];this.textContent=''},querySelector:()=>null,
 setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]}});
const body=el('body'),nav=el('nav'),app=el('main');
const buttons=[el('button'),el('button')];
buttons[0].dataset.tab='overview';buttons[0].textContent='Tổng quan';
buttons[1].dataset.tab='teams';buttons[1].textContent='Đội & Điểm danh';
const existing=el('button');existing.textContent='↑ Thu gọn';
nav.querySelectorAll=selector=>selector.startsWith('[data-tab]')?buttons:[existing];
const ids={ 'app-shell':app };
const document={readyState:'complete',body,getElementById:id=>ids[id]||null,
 createElement:tag=>{const node=el(tag);return node}};
app.querySelector=selector=>selector==='.topbar>.nav'?nav:null;
let store={};const window={
 matchMedia:()=>({matches:false,addEventListener:()=>{}}),
 addEventListener:()=>{},
 localStorage:null
};
const ctx={document,window,localStorage:{getItem:k=>store[k],setItem:(k,v)=>store[k]=v},console,
 setTimeout:()=>0,MutationObserver:class{observe(){}disconnect(){}}};
vm.runInNewContext(barJs,ctx);
assert.equal(window.TopkeySidebarH130.installed,true);
const toggle=nav.children.find(n=>n.id==='tk-h130-sidebar-toggle');
assert.ok(toggle,'sidebar toggle inserted at the bottom');
assert.equal(buttons[0].attrs['aria-label'],'Tổng quan');
assert.equal(buttons[1].children.length,2,'button text split into readable icon/label');
toggle.onclick();
assert.ok(body.classList.contains('tk-h130-collapsed'),'sidebar must collapse into left edge');
assert.equal(toggle.attrs['aria-expanded'],'false');
assert.equal(store.topkey_badminton_sidebar_collapsed_h130,'1');
toggle.onclick();
assert.ok(!body.classList.contains('tk-h130-collapsed'),'sidebar expands without reloading the page');
assert.equal(toggle.attrs['aria-expanded'],'true');
assert.ok(existing.classList.contains('tk-h130-legacy-toggle'),'hide old conflicting toggle');
console.log('H130: hub compact, contrast, BacPham credit and left sidebar collapse tested.');
