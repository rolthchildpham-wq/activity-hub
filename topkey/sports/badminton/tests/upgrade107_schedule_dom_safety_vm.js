const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'src','upgrade16.js'),'utf8');
const App={state:{matches:{},teams:{}},renderMatches(){},renderSpectator(){}};
const window={Topkey:{App}};
const ctx={window,document:{getElementById(){return null}},setTimeout(){return 0},clearTimeout(){},console,Object,String,Array,Set,Map,RegExp};
vm.runInNewContext(src,ctx);
const safe=window.TopkeyUpgrade16.safeInsertBefore;assert.strictEqual(typeof safe,'function');
class Parent{constructor(name){this.name=name;this.children=[]}appendChild(n){if(n.parentElement){const i=n.parentElement.children.indexOf(n);if(i>=0)n.parentElement.children.splice(i,1)}n.parentElement=this;this.children.push(n);return n}insertBefore(n,ref){if(ref.parentElement!==this)throw new Error('NotFoundError');if(n.parentElement){const i=n.parentElement.children.indexOf(n);if(i>=0)n.parentElement.children.splice(i,1)}const idx=this.children.indexOf(ref);n.parentElement=this;this.children.splice(idx,0,n);return n}}
const card=new Parent('card'),body=new Parent('collapse-body'),wrap={name:'table-wrap',parentElement:null},bar={name:'search-bar',parentElement:null};
card.appendChild(body);body.appendChild(wrap);
assert.doesNotThrow(()=>safe(card,bar,wrap));
assert.strictEqual(bar.parentElement,body,'search bar must follow reference actual parent');
assert.deepStrictEqual(body.children.map(x=>x.name),['search-bar','table-wrap']);
console.log('PASS upgrade107 DOM parent VM');
