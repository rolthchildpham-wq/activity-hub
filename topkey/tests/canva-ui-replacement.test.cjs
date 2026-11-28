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
assert.deepEqual(styles(hub).map(x=>x.split('?')[0]),['./canva-ui-system.css']);
assert.deepEqual(styles(sports).map(x=>x.split('?')[0]),['./canva-sports-ui.css']);
assert.match(hub,/canva-ui-system\.css\?v=canva-ui-v\d+-202611\d+/);
assert.ok(hubCss.includes('grid-template-columns:264px minmax(0,1fr)'),'Hub must use the Canva desktop sidebar layout');
assert.ok(hubCss.includes('body.tk-bi-hub .tk210-nav{display:flex;flex-direction:column'),'Hub desktop navigation must be vertical');
assert.ok(hubCss.includes('body.tk-bi-hub .tk210-nav{position:fixed;left:0;right:0;bottom:0'),'Hub mobile navigation must dock to the bottom');
assert.ok(sportsCss.includes('#app-shell:not(.hidden){display:grid;grid-template-columns:252px minmax(0,1fr)'),'Sports VNext must use the Canva desktop sidebar layout');
assert.ok(sportsCss.includes('#app-shell>.topbar .nav{display:flex;flex-direction:column'),'Sports desktop navigation must be vertical');
assert.ok(sportsCss.includes('.topbar>.nav{position:fixed;left:0;right:0;bottom:0'),'Sports mobile navigation must dock to the bottom');
assert.ok(hubCss.includes('.exec-insights{'),'Executive sport insights styles must be consolidated into Hub Canva CSS');
for(const token of ['#tk144-live-studio .tk144-workspace','#tk144-live-studio .tk144-video-pane','#tk144-live-studio .tk144-official-pane','#tk144-live-studio:fullscreen .tk144-official-pane','.tk156-referee-shortcuts','#tk157-youtube-panel','#tk160-audio-panel','#tk161-panel','[data-tk141-foldable="1"].tk141-panel-folded','grid-template-columns:0 minmax(0,1fr)!important'])assert.ok(sportsCss.includes(token),'Consolidated sports feature styles missing: '+token);
assert.ok(sports.includes('src/roster-csv-recovery.js?v=20261117-roster-import-r1'),'VNext roster recovery module must remain active');
assert.match(sports,/canva-sports-ui\.css\?v=canva-sports-v\d+-202611\d+/);
for(const [name,html] of [['Hub',hub],['Sports VNext',sports]]){
 const markup=html.replace(/<script\b[\s\S]*?<\/script>/gi,'');
 assert.ok(!/\sstyle\s*=/.test(markup),name+' must not retain inline style attributes');
 assert.ok(!/<style\b/i.test(markup),name+' must not retain embedded style blocks');
}
for(const legacy of ['styles.css','upgrade30.css','upgrade53.css','hub-redesign-h240.css','hub-canva-design-system-h251.css'])assert.ok(!hub.includes(legacy),'Legacy Hub CSS still linked: '+legacy);
for(const legacy of ['styles.css','upgrade9.css','upgrade11.css','upgrade122-hotfix61.css','workspace-redesign-h218.css','canva-sports-design-system-h251.css','contrast-global-h217.css'])assert.ok(!sports.includes(legacy),'Legacy Sports CSS still linked: '+legacy);
for(const token of ['--tk-navy:#0B1F33','--tk-slate:#173A55','--tk-teal:#0AA6A6','Inter,system-ui','@media(max-width:640px)','@media(max-width:370px)','position:fixed','safe-area-inset-bottom','prefers-reduced-motion:reduce'])assert.ok(hubCss.includes(token),'Hub design token/responsive rule missing: '+token);
for(const token of ['--tk-navy:#0B1F33','--tk-slate:#173A55','--tk-teal:#0AA6A6','@media(max-width:700px)','@media(max-width:380px)','prefers-reduced-motion:reduce','.official-score','.score-actions','.table-wrap','.modal-box','position:fixed','safe-area-inset-bottom','--sport-emoji','--sport-strap','topbar>.nav:before','[data-tab="overview"]::before','#tk-h132-hero','#page-overview.hidden{display:none!important}','#page-overview>.grid.g4{grid-template-columns:repeat(2,minmax(0,1fr))!important}','tk227-badge.live'])assert.ok(sportsCss.includes(token),'Sports design token/component rule missing: '+token);
for(const [name,css] of [['Hub',hubCss],['Sports',sportsCss]]){
 assert.equal(css.split('{').length,css.split('}').length,name+' CSS braces must balance');
 assert.ok(!css.includes('@import'),'No external font import may delay first paint');
}
for(const token of ['../../topkey-platform-core.js','../../topkey-shared-auth.js','../../h108-auth-guard.js'])assert.ok(sports.includes(token),'Shared Firebase/auth runtime dependency must be preserved: '+token);
for(const sport of ['football','volleyball','running','handmade','shuttle','cooking','badminton'])assert.ok(sports.includes("'"+sport+"'")||sports.includes('"'+sport+'"'),'VNext sport missing: '+sport);
for(const tab of ['overview','control','teams','schedule','umpire','live','finance','announcements','audit','health','settings'])assert.ok(sports.includes('data-tab="'+tab+'"'),'VNext tab missing: '+tab);
console.log('Canva UI replacement contract passed.');
