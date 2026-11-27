'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const root='topkey/';
const js=fs.readFileSync(root+'collapsible-panels-h141.js','utf8');
const css=fs.readFileSync(root+'sports/vnext/canva-sports-ui.css','utf8');
test('Hub and VNext load the collapsible behavior once; legacy badminton hands off',()=>{
 for(const path of ['index.html','sports/vnext/index.html']){
  const html=fs.readFileSync(root+path,'utf8');
  assert.equal((html.match(/collapsible-panels-h141\\.js\\?v=h142-collapsible-groups-20261125/g)||[]).length,1,path+' JS');
  assert.ok(html.includes(path==='index.html'?'canva-ui-system.css':'canva-sports-ui.css'));
 }
 const legacy=fs.readFileSync(root+'sports/badminton/index.html','utf8');
 assert.ok(legacy.includes("../vnext/index.html"));
});
test('sidebar toggle supports desktop/mobile and saves local state',()=>{
 assert.match(js,/tk141-nav-collapsed/);assert.match(js,/matchMedia/);assert.match(js,/aria-expanded/);assert.match(js,/aria-controls/);assert.match(js,/localStorage\\.setItem/);
 assert.ok(css.includes('grid-template-columns:0 minmax(0,1fr)!important'));
 assert.ok(css.includes('@media(max-width:700px)'));
 assert.ok(css.includes('visibility:hidden!important'));
});
test('cards fold without removing form fields or destroying event handlers',()=>{
 assert.match(js,/tk141-panel-folded/);assert.match(js,/panel\\.prepend\\(button\\)/);
 assert.doesNotMatch(js,/(?:location\\.reload|location\\.replace|\\.innerHTML\\s*=|\\.remove\\(\\)|\\.replaceChildren\\()/);
 assert.ok(css.includes('[data-tk141-foldable="1"].tk141-panel-folded>:not(.tk141-panel-toggle)'));
});
test('styles are balanced and accessible controls have focus styling',()=>{
 assert.equal(css.split('{').length,css.split('}').length);assert.ok(css.includes(':focus-visible'));assert.ok(css.includes('min-height:40px'));assert.match(js,/aria-label/);
});
