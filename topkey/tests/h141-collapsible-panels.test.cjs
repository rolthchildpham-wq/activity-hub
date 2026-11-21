'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const root='topkey/';
const js=fs.readFileSync(root+'collapsible-panels-h141.js','utf8');
const css=fs.readFileSync(root+'collapsible-panels-h141.css','utf8');
test('all TOPKEY root apps load collapse assets once',()=>{
 for(const path of ['index.html','sports/vnext/index.html','sports/badminton/index.html']){
  const html=fs.readFileSync(root+path,'utf8');
  assert.equal((html.match(/collapsible-panels-h141\.js\?v=h141-20261121/g)||[]).length,1,path+' JS');
  assert.equal((html.match(/collapsible-panels-h141\.css\?v=h141-20261121/g)||[]).length,1,path+' CSS');
 }
});
test('sidebar toggle supports desktop/mobile and saves local state',()=>{
 assert.match(js,/tk141-nav-collapsed/);
 assert.match(js,/matchMedia/);
 assert.match(js,/aria-expanded/);
 assert.match(js,/aria-controls/);
 assert.match(js,/setCollapsed\(mobile\(\)\?true/);
 assert.match(js,/localStorage\.setItem/);
 assert.match(css,/grid-template-columns:0 minmax\(0,1fr\)!important/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/display:none!important/);
});
test('cards fold without removing form fields or destroying event handlers',()=>{
 assert.match(js,/tk141-panel-folded/);
 assert.match(js,/panel\.prepend\(button\)/);
 assert.doesNotMatch(js,/(?:location\.reload|location\.replace|\.innerHTML\s*=|\.remove\(\)|\.replaceChildren\()/);
 assert.match(css,/>:not\(\.tk141-panel-toggle\)/);
 assert.match(js,/\.card:not\(\.kpi\)/);
 assert.match(js,/\.closest\('\.modal/);
});
test('styles are balanced and accessible controls have focus styling',()=>{
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
 assert.match(css,/:focus-visible/);
 assert.match(css,/min-height:42px/);
 assert.match(js,/aria-label/);
});
