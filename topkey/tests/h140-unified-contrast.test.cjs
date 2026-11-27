'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base='topkey/';
const css=fs.readFileSync(base+'contrast-unified-h140.css','utf8');
function luminance(hex){const values=hex.replace('#','').match(/.{2}/g).map(s=>parseInt(s,16)/255);const linear=values.map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722}
function ratio(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
test('WCAG AAA normal-text palette has at least 7:1 contrast',()=>{for(const [fg,bg] of [['#f4faff','#102a43'],['#c8dcec','#0b2036'],['#142e3d','#ffffff'],['#e0e9f3','#30475c']])assert.ok(ratio(fg,bg)>=7,fg+' / '+bg)});
test('native dropdowns, disabled states and keyboard focus are styled',()=>{for(const token of ['#tk139-format','select option',':disabled',':focus-visible','color-scheme:dark','color-scheme:light'])assert.ok(css.includes(token));assert.equal(css.split('{').length,css.split('}').length)});
test('Hub and all seven sports use the consolidated Canva stylesheets',()=>{
 const hub=fs.readFileSync(base+'index.html','utf8'),sports=fs.readFileSync(base+'sports/vnext/index.html','utf8'),legacy=fs.readFileSync(base+'sports/badminton/index.html','utf8');
 assert.ok(hub.includes('canva-ui-system.css?v=canva-ui-v1-20261127'));
 assert.ok(sports.includes('canva-sports-ui.css?v=canva-sports-v1-20261127'));
 assert.ok(!hub.includes('hub-redesign-h240.css')&&!hub.includes('hub-canva-design-system-h251.css'));
 assert.ok(!sports.includes('upgrade9.css')&&!sports.includes('contrast-global-h217.css')&&!sports.includes('workspace-redesign-h218.css'));
 assert.ok(legacy.includes("query.set('sport', 'badminton')"));
 assert.ok(legacy.includes("../vnext/index.html"));
});
test('light overview is not treated as dark admin controls',()=>{for(const token of ['#page-overview','var(--tk140-paper-ink)','html[data-tk-sport]','body.tk-bi-hub'])assert.ok(css.includes(token))});
