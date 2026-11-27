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
test('Hub and all seven sports use the consolidated Canva stylesheets',()=>{
 const hub=fs.readFileSync(base+'index.html','utf8');
 const sports=fs.readFileSync(base+'sports/vnext/index.html','utf8');
 const legacyBadminton=fs.readFileSync(base+'sports/badminton/index.html','utf8');
 assert.match(hub,/canva-ui-system\\.css\\?v=canva-ui-v1-20261127/);
 assert.match(sports,/canva-sports-ui\\.css\\?v=canva-sports-v1-20261127/);
 assert.doesNotMatch(hub,/hub-(?:redesign|canva-design-system)|contrast-unified-h140\\.css/);
 assert.doesNotMatch(sports,/(?:upgrade\\d+|contrast-global-h217|workspace-redesign-h218|contrast-unified-h140)\\.css/);
 assert.match(legacyBadminton,/query\\.set\\('sport', 'badminton'\\)/);
 assert.match(legacyBadminton,/vnext\\/index\\.html/);
});
test('light overview is not treated as dark admin controls',()=>{
 assert.match(css,/#page-overview/);
 assert.match(css,/var\(--tk140-paper-ink\)/);
 assert.match(css,/html\[data-tk-sport\]/);
 assert.match(css,/body\.tk-bi-hub/);
});
