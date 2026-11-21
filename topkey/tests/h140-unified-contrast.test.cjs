'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base='topkey/';
const css=fs.readFileSync(base+'contrast-unified-h140.css','utf8');

function luminance(hex){
 const values=hex.replace('#','').match(/.{2}/g).map(s=>parseInt(s,16)/255);
 const linear=values.map(n=>n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4);
 return linear[0]*0.2126+linear[1]*0.7152+linear[2]*0.0722;
}
function ratio(a,b){
 const x=luminance(a),y=luminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
test('WCAG AAA normal-text palette has at least 7:1 contrast',()=>{
 for(const [foreground,background] of [
  ['#f4faff','#102a43'],
  ['#c8dcec','#0b2036'],
  ['#142e3d','#ffffff'],
  ['#e0e9f3','#30475c']
 ])assert.ok(ratio(foreground,background)>=7,foreground+' / '+background);
});
test('native dropdowns, disabled states and keyboard focus are styled',()=>{
 assert.match(css,/#tk139-format/);
 assert.match(css,/select option/);
 assert.match(css,/:disabled/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/color-scheme:dark/);
 assert.match(css,/color-scheme:light/);
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
test('all three app entrypoints load H140 stylesheet in head',()=>{
 for(const path of ['index.html','sports/vnext/index.html','sports/badminton/index.html']){
  const html=fs.readFileSync(base+path,'utf8');
  const head=html.slice(0,html.indexOf('</head>'));
  assert.match(head,/contrast-unified-h140\.css\?v=h140-contrast-20261121/);
  assert.equal(head.match(/contrast-unified-h140\.css/g)?.length,1);
 }
});
test('light overview is not treated as dark admin controls',()=>{
 assert.match(css,/#page-overview/);
 assert.match(css,/var\(--tk140-paper-ink\)/);
 assert.match(css,/html\[data-tk-sport\]/);
 assert.match(css,/body\.tk-bi-hub/);
});
