'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const hub=fs.readFileSync('topkey/index.html','utf8');
const sports=fs.readFileSync('topkey/sports/vnext/index.html','utf8');
const hubCss=fs.readFileSync('topkey/canva-ui-system.css','utf8');
const sportsCss=fs.readFileSync('topkey/sports/vnext/canva-sports-ui.css','utf8');
function styles(html){
 const tags=html.match(/<link\b[^>]*>/gi)||[];
 return tags.filter(tag=>/\brel=["']stylesheet["']/i.test(tag)).map(tag=>tag.match(/\bhref=["']([^"']+)["']/i)?.[1]).filter(Boolean);
}
assert.deepEqual(styles(hub),['./canva-ui-system.css?v=canva-ui-v1-20261127']);
assert.deepEqual(styles(sports),['./canva-sports-ui.css?v=canva-sports-v1-20261127']);
for(const [name,html] of [['Hub',hub],['Sports VNext',sports]]){
 const markup=html.replace(/<script\b[\s\S]*?<\/script>/gi,'');
 assert.ok(!/\sstyle\s*=/.test(markup),name+' must not retain inline style attributes');
 assert.ok(!/<style\b/i.test(markup),name+' must not retain embedded style blocks');
}
for(const legacy of ['styles.css','upgrade30.css','upgrade53.css','hub-redesign-h240.css','hub-canva-design-system-h251.css'])assert.ok(!hub.includes(legacy),'Legacy Hub CSS still linked: '+legacy);
for(const legacy of ['styles.css','upgrade9.css','upgrade11.css','upgrade122-hotfix61.css','workspace-redesign-h218.css','canva-sports-design-system-h251.css','contrast-global-h217.css'])assert.ok(!sports.includes(legacy),'Legacy Sports CSS still linked: '+legacy);
for(const token of ['--tk-navy:#0B1F33','--tk-slate:#173A55','--tk-teal:#0AA6A6','Inter,system-ui','@media(max-width:640px)','@media(max-width:370px)','position:fixed','safe-area-inset-bottom','prefers-reduced-motion:reduce'])assert.ok(hubCss.includes(token),'Hub design token/responsive rule missing: '+token);
for(const token of ['--tk-navy:#0B1F33','--tk-slate:#173A55','--tk-teal:#0AA6A6','@media(max-width:700px)','@media(max-width:380px)','prefers-reduced-motion:reduce','.official-score','.score-actions','.table-wrap','.modal-box','position:fixed','safe-area-inset-bottom'])assert.ok(sportsCss.includes(token),'Sports design token/component rule missing: '+token);
for(const [name,css] of [['Hub',hubCss],['Sports',sportsCss]]){
 assert.equal(css.split('{').length,css.split('}').length,name+' CSS braces must balance');
 assert.ok(!css.includes('@import'),'No external font import may delay first paint');
}
for(const token of ['firebase-app-compat.js','firebase-auth-compat.js','firebase-database-compat.js'])assert.ok(sports.includes(token),'Firebase runtime dependency must be preserved: '+token);
for(const sport of ['football','volleyball','running','handmade','shuttle','cooking','badminton'])assert.ok(sports.includes("'"+sport+"'")||sports.includes('"'+sport+'"'),'VNext sport missing: '+sport);
for(const tab of ['overview','control','teams','schedule','umpire','live','finance','announcements','audit','health','settings'])assert.ok(sports.includes('data-tab="'+tab+'"'),'VNext tab missing: '+tab);
console.log('Canva UI replacement contract passed.');
