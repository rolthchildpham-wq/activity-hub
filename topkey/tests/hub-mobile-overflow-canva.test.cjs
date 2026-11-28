'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const hub=fs.readFileSync('topkey/index.html','utf8');
const css=fs.readFileSync('topkey/canva-ui-system.css','utf8');
const dashboard=fs.readFileSync('topkey/executive-dashboard.js','utf8');
const insights=fs.readFileSync('topkey/executive-sport-insights.js','utf8');
assert.match(hub,/canva-ui-system\.css\?v=canva-ui-v\d+-202611\d+/);
assert.ok(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))!important'),'mobile sport catalog must fit four columns without horizontal scrolling');
assert.ok(css.includes('overflow:visible!important'),'mobile table wrappers must not force sideways scroll');
assert.ok(css.includes('.exec-table tbody tr'),'executive club and finance tables must become responsive cards');
assert.ok(css.includes('.exec-insights-table tbody tr'),'executive insights table must become responsive cards');
for(const label of ['CLB','Ra đời','Trưởng BTC','Số giải','VĐV','Gần nhất','Thu','Chi','Số dư','Giải','Năm','Chờ']){
 assert.ok(dashboard.includes('data-label="'+label+'"'),'Executive dashboard missing mobile table label '+label);
}
assert.ok(insights.includes("cell.setAttribute('data-label',label)"),'Executive insights must label each cell for mobile cards');
assert.ok(css.includes('white-space:normal;overflow-wrap:anywhere'),'mobile Hub title must wrap without clipping');
console.log('PASS: Canva Hub mobile catalog, dashboard tables and insights render without horizontal overflow');
