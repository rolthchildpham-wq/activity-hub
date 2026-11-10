const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

class ClassList{
 constructor(){this.values=new Set()}
 add(...names){names.forEach(name=>this.values.add(name))}
 remove(...names){names.forEach(name=>this.values.delete(name))}
 toggle(name,force){const next=force===undefined?!this.values.has(name):!!force;next?this.values.add(name):this.values.delete(name);return next}
 contains(name){return this.values.has(name)}
}
class Store{
 constructor(seed={}){this.map=new Map(Object.entries(seed))}
 getItem(key){return this.map.has(key)?this.map.get(key):null}
 setItem(key,value){this.map.set(key,String(value))}
}
function runtime({mobile,stored}={}){
 const header={classList:new ClassList(),append(node){this.child=node}};
 const cards={classList:new ClassList(),nextElementSibling:null,querySelector(){return null},prepend(){}};
 const exec={parentNode:{insertBefore(){}}};
 const media={matches:!!mobile,addEventListener(){}};
 const storage=new Store(stored===undefined?{}:{topkey_hub_header_collapsed_v120:stored});
 const document={
  readyState:'complete',body:{classList:new ClassList(),style:{setProperty(){}}},
  querySelector(selector){if(selector==='.top')return header;if(selector==='.cards')return cards;if(selector==='#executive-dashboard')return exec;return null},
  querySelectorAll(){return []},getElementById(){return null},addEventListener(){},
  createElement(){return {className:'',type:'',title:'',textContent:'',attributes:{},setAttribute(k,v){this.attributes[k]=String(v)},addEventListener(type,fn){this['on'+type]=fn}}}
 };
 const ctx={console,window:null,document,localStorage:storage,location:{search:''},URLSearchParams,matchMedia(){return media},firebase:null};
 ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(fs.readFileSync('hub-layout94.js','utf8'),ctx,{filename:'hub-layout94.js'});
 return {ctx,header,storage,button:header.child};
}

{
 const {header,button,storage}=runtime({mobile:true});
 assert(header.classList.contains('hub-header-collapsed'),'mobile header must start collapsed');
 assert(button,'mobile header toggle must be inserted');
 assert.equal(button.attributes['aria-expanded'],'false');
 button.onclick();
 assert(!header.classList.contains('hub-header-collapsed'),'click must expand the mobile header');
 assert.equal(button.attributes['aria-expanded'],'true');
 assert.equal(storage.getItem('topkey_hub_header_collapsed_v120'),'0','expanded preference must persist');
}
{
 const {header,button}=runtime({mobile:false,stored:'1'});
 assert(!header.classList.contains('hub-header-collapsed'),'desktop must remain expanded');
 assert.equal(button.attributes['aria-expanded'],'true');
}
console.log('H120_MOBILE_HEADER_TOGGLE_OK');
