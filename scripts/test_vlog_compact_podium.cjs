'use strict';
/* TOPKEY Vlog compact medals regression: static + card rendering, no Firebase writes. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const h=fs.readFileSync(path.join(__dirname,'..','topkey','sports','diy-vlog','index.html'),'utf8');
for(const name of ['first','second','third'])assert(h.includes('.pod.'+name+'{grid-column:auto'),name+' order CSS');
assert(h.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
assert(h.includes('.podium{grid-template-columns:1fr;gap:8px}'));
assert(h.includes('.section.podium-section{margin-top:20px}'));
assert(h.includes('.pod{padding:10px 12px;min-height:100px'));
assert(!h.includes('min-height:212px'));
assert(!h.includes('min-height:87px'));
assert(!h.includes('<div class="pedestal">'));
assert(h.includes('#d9c07e')&&h.includes('#bdc9d8')&&h.includes('#c89e80'),'subtle gold/silver/bronze accents');
const start=h.indexOf('function topCard(x,rank){'),end=h.indexOf('function render(){',start);
assert(start>=0&&end>start,'card source');
const ctx={testMode:false,real:true,esc:s=>String(s),nf:n=>Number(n).toLocaleString('en-US'),
safeLink:s=>/^https:\/\/www\.tiktok\.com/.test(String(s))?s:''};
vm.createContext(ctx);
vm.runInContext(h.slice(start,end),ctx);
for(const [i,cl,label] of [[1,'first','Vàng'],[2,'second','Bạc'],[3,'third','Đồng']]){
 const t=ctx.topCard({name:'Thí sinh',type:'Đội',views:100,likes:20,shares:3,score:175,url:'https://www.tiktok.com/@a/video/7500000000000000000'},i);
 assert(t.includes('class="pod '+cl+'"'),cl);
 assert(t.includes(label),label);
 assert(t.includes('175'),t);
 assert(t.includes('100 xem · 20 thích · 3 chia sẻ'));
 assert(t.includes('Xem video'));
 assert(!t.includes('pedestal'));
}
const missing=ctx.topCard(null,2);
assert(missing.includes('Chưa có thí sinh'));
const scripts=[...h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(x=>x.trim());
for(const source of scripts)new vm.Script(source);
console.log('PASS compact podium: three subtle medals, equal-height 3 columns, mobile compact rows, unchanged score and links, all inline JS valid');
