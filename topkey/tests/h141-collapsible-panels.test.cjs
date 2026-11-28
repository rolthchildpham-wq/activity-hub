'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const root='topkey/';
const js=fs.readFileSync(root+'collapsible-panels-h141.js','utf8');
const hub=fs.readFileSync(root+'index.html','utf8');
const vnext=fs.readFileSync(root+'sports/vnext/index.html','utf8');
const css=fs.readFileSync(root+'sports/vnext/canva-sports-ui.css','utf8');
test('H240 owns Hub navigation; H141 collapsible behavior remains once in VNext',()=>{
 assert.ok(hub.includes('hub-workspace-h240.js?v=h240-single-workspace-20261127'));
 assert.ok(!hub.includes('collapsible-panels-h141.js'));
 assert.equal((vnext.match(/collapsible-panels-h141\.js\?v=h142-collapsible-groups-20261125/g)||[]).length,1);
 assert.ok(vnext.includes('canva-sports-ui.css'));
 assert.ok(fs.readFileSync(root+'sports/badminton/index.html','utf8').includes('../vnext/index.html'));
});
test('VNext sidebar toggle supports desktop/mobile and persists accessible state',()=>{
 for(const token of ['tk141-nav-collapsed','aria-expanded','aria-controls','localStorage.setItem'])assert.ok(js.includes(token),token);
 assert.ok(css.includes('grid-template-columns:0 minmax(0,1fr)!important'));
 assert.ok(css.includes('@media(max-width:700px)'));
 assert.ok(css.includes('visibility:hidden!important'));
});
test('cards fold without destructive navigation or DOM replacement',()=>{
 assert.ok(js.includes('tk141-panel-folded'));
 assert.doesNotMatch(js,/(?:location\.reload|location\.replace|\.innerHTML\s*=|\.remove\(\)|\.replaceChildren\(\))/);
 assert.ok(css.includes('[data-tk141-foldable="1"].tk141-panel-folded>:not(.tk141-panel-toggle)'));
});
test('styles are balanced and accessible controls have focus styling',()=>{
 assert.equal(css.split('{').length,css.split('}').length);
 assert.ok(css.includes(':focus-visible'));assert.ok(css.includes('min-height:40px'));assert.match(js,/aria-label/);
});
console.log('H141 VNext collapsible behavior and H240 Hub navigation contracts passed.');
