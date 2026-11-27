'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const js=fs.readFileSync('topkey/collapsible-panels-h141.js','utf8');
const css=fs.readFileSync('topkey/sports/vnext/canva-sports-ui.css','utf8');
const vnext=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
const legacy=fs.readFileSync('topkey/sports/badminton/index.html','utf8');
test('H141 does not insert a duplicate sidebar icon',()=>{
 assert.doesNotMatch(js,/createElement\(['"]span['"]\)/);assert.doesNotMatch(js,/btn\.prepend\(mark\)/);assert.match(js,/querySelectorAll\(['"]\.tk141-nav-icon['"]\)/);
});
test('Canva shell owns a single sport/navigation icon layer',()=>{
 assert.ok(vnext.includes('canva-sports-ui.css?v=canva-sports-v1-20261127'));
 assert.ok(vnext.includes('sport-identities-h132.js?v=h132-20261113'));
 assert.ok(css.includes('.tk141-nav-icon'));
 assert.ok(css.includes('.tk-h130-icon'));
 assert.ok(css.includes('content:none!important'));
 assert.ok(css.includes('.nav [data-tab]'));
 assert.ok(legacy.includes("../vnext/index.html"));
});
test('H141 collapse toggle and panels remain intact',()=>{
 assert.match(js,/tk141-nav-toggle/);assert.match(js,/tk141-panel-folded/);assert.match(js,/localStorage\.setItem/);
 assert.ok(css.includes('tk141-panel-folded'));assert.equal(css.split('{').length,css.split('}').length);
});
