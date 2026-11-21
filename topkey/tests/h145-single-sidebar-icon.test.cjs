'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('topkey/collapsible-panels-h141.js','utf8');
const css=fs.readFileSync('topkey/collapsible-panels-h141.css','utf8');
const vnext=fs.readFileSync('topkey/sports/vnext/sport-identities-h132.css','utf8');
const badminton=fs.readFileSync('topkey/sports/badminton/sidebar-collapse-h130.js','utf8');

test('H141 no longer inserts a second sidebar icon',()=>{
 assert.doesNotMatch(js,/createElement\(['"]span['"]\)/);
 assert.doesNotMatch(js,/btn\.prepend\(mark\)/);
 assert.match(js,/querySelectorAll\(['"]\.tk141-nav-icon['"]\)/);
});
test('H132 VNext and H130 badminton each own their icon',()=>{
 assert.match(vnext,/\[data-tab\]:before/);
 assert.match(badminton,/tk-h130-icon/);
 assert.match(css,/\.tk141-nav-icon/);
 assert.match(css,/\.tk-h130-icon\)\:\:before/);
});
test('H141 collapse toggle and panels remain intact',()=>{
 assert.match(js,/tk141-nav-toggle/);
 assert.match(js,/tk141-panel-folded/);
 assert.match(js,/localStorage\.setItem/);
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
