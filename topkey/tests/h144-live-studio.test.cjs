'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const js=fs.readFileSync('topkey/sports/vnext/src/live-studio-h144.js','utf8');
const css=fs.readFileSync('topkey/sports/vnext/canva-sports-ui.css','utf8');
const html=fs.readFileSync('topkey/sports/vnext/index.html','utf8');

function harness({sport='volleyball',umpire=true}={}){
 const els=new Map();
 class Element {
  constructor(tag='div',id=''){
   this.tagName=tag.toUpperCase();this.id=id;this.children=[];this.parentNode=null;
   this.dataset={};this.hidden=false;this.listeners={};this.value='auto';this.textContent='';
   this.classList={values:new Set(),add:x=>this.classList.values.add(x),
     remove:x=>this.classList.values.delete(x),
     contains:x=>this.classList.values.has(x),
     toggle:x=>{if(this.classList.values.has(x)){this.classList.values.delete(x);return false}
       this.classList.values.add(x);return true;}};
  }
  appendChild(child){
   if(child.parentNode)child.parentNode.removeChild(child);
   this.children.push(child);child.parentNode=this;return child;
  }
  append(...children){children.forEach(x=>this.appendChild(x))}
  prepend(child){if(child.parentNode)child.parentNode.removeChild(child);
    this.children.unshift(child);child.parentNode=this;}
  insertBefore(child,ref){
   if(child.parentNode)child.parentNode.removeChild(child);
   const idx=this.children.indexOf(ref);
   this.children.splice(idx<0?this.children.length:idx,0,child);child.parentNode=this;
  }
  removeChild(child){const idx=this.children.indexOf(child);if(idx>=0)this.children.splice(idx,1);child.parentNode=null}
  querySelector(selector){
   if(selector===':scope > .grid')return this.children.find(x=>x.className==='grid');
   if(selector===':scope > .card')return this.children.find(x=>x.className==='card');
   if(selector==='.card')return this.children.find(x=>x.className==='card');
   return null;
  }
  setAttribute(key,val){this[key]=val}
  addEventListener(key,cb){this.listeners[key]=cb}
  closest(selector){return selector==='.card'?this.parentNode:null}
  requestFullscreen=async()=>{document.fullscreenElement=this};
 }
 const get=id=>{if(!els.has(id))els.set(id,new Element('div',id));return els.get(id)};
 const live=get('page-live'),grid=new Element();grid.className='grid';live.appendChild(grid);
 const videoCard=new Element();videoCard.className='card';grid.appendChild(videoCard);
 videoCard.appendChild(get('video-box'));
 const umpireCard=new Element();umpireCard.className='card';get('page-umpire').appendChild(umpireCard);
 const video=get('stream-court'),umpireCourt=get('umpire-court');
 const auth={can:tab=>tab==='live'||(tab==='umpire'&&umpire)};
 let renderCount=0;
 const app={currentTab:'live',currentCourt:'',
  showTab(tab){this.currentTab=tab;return tab},
  renderOfficial(){renderCount++},
  renderLiveScore(){renderCount++}};
 const document={readyState:'complete',fullscreenElement:null,
  getElementById:get,
  createElement:tag=>new Element(tag),
  createComment:()=>new Element('comment'),
  addEventListener(){},
  exitFullscreen:async()=>{document.fullscreenElement=null}};
 const T={SPORT:{key:sport},Auth:auth,App:app};
 const sandbox={window:{Topkey:T,matchMedia:()=>({matches:false}),addEventListener(){}},
  document,screen:{orientation:{lock:async()=>{},unlock(){}}}};
 vm.runInNewContext(js,sandbox,{timeout:1000});
 return {app,get,videoCard,umpireCard,live,grid,document,renderCount:()=>renderCount};
}
test('applies only to football and volleyball',()=>{
 assert.match(js,/new Set\(\['football', 'volleyball'\]\)/);
 assert.ok(harness({sport:'football'}).get('tk144-live-studio'));
 const other=harness({sport:'running'});
 assert.equal(other.live.children.length,1);
});
test('moves original referee card, preserving event handlers and state',()=>{
 const h=harness();
 assert.ok(h.umpireCard.parentNode.id==='tk144-official-pane');
 assert.ok(h.videoCard.parentNode.className==='tk144-video-pane');
 h.app.showTab('umpire');
 assert.equal(h.umpireCard.parentNode.id,'page-umpire');
 h.app.showTab('live');
 assert.equal(h.umpireCard.parentNode.id,'tk144-official-pane');
});
test('viewer/Live-only roles never receive moved scoring controls',()=>{
 const h=harness({umpire:false});
 assert.equal(h.umpireCard.parentNode.id,'page-umpire');
 assert.equal(h.get('tk144-official-pane').hidden,true);
 assert.equal(h.get('tk144-toggle-umpire').hidden,true);
});
test('studio supports portrait, landscape, native fullscreen and exit',async()=>{
 const h=harness();
 const entry=h.get('tk144-enter-fullscreen');
 await entry.listeners.click();
 assert.equal(h.document.fullscreenElement.id,'tk144-live-studio');
 const exit=h.get('tk144-exit-fullscreen');
 await exit.listeners.click();
 assert.equal(h.document.fullscreenElement,null);
 assert.match(css,/data-orientation="portrait"/);
 assert.match(css,/data-orientation="landscape"/);
 assert.match(css,/@media\(orientation:landscape\)/);
});
test('VNext loads H144 and keeps source scoreboard and video IDs unique',()=>{
 assert.match(html,/live-studio-h144\.js\?v=h144-20261121/);
 assert.ok(/canva-sports-ui\.css\?v=canva-sports-v\d+-202611\d+/.test(html));
 for(const id of ['umpire-board','live-video','stream-court','umpire-plus-a','umpire-plus-b'])
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 assert.doesNotMatch(js,/queue(Set|Multi)|firebase\.database|\.ref\(/);
});
