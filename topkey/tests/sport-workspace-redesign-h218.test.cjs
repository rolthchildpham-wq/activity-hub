const fs=require('node:fs');
const assert=require('node:assert/strict');
const root='topkey/sports';
const vhtml=fs.readFileSync(root+'/vnext/index.html','utf8');
const bhtml=fs.readFileSync(root+'/badminton/index.html','utf8');
const vcss=fs.readFileSync(root+'/vnext/workspace-redesign-h218.css','utf8');
const bcss=fs.readFileSync(root+'/badminton/workspace-redesign-h218.css','utf8');
const hub=fs.readFileSync('topkey/index.html','utf8');
const runtime=fs.readFileSync('topkey/release-runtime.js','utf8');
const collapsible=fs.readFileSync('topkey/collapsible-panels-h141.js','utf8');
const rootBuild=JSON.parse(fs.readFileSync('topkey/build.json','utf8'));
const release=JSON.parse(fs.readFileSync('topkey/release.json','utf8'));
const vb=JSON.parse(fs.readFileSync(root+'/vnext/build.json','utf8'));
const bb=JSON.parse(fs.readFileSync(root+'/badminton/build.json','utf8'));
assert.ok(hub.includes('release-runtime.js?v=h218-sports-redesign-20261124'),'Hub must load H218 runtime cache key');
assert.ok(hub.includes('sports/vnext/index.html?sport=football&amp;v=h218-sports-redesign-20261124'),'Hub sport launch tickets must match H218 runtime');
assert.ok(hub.includes('sports/badminton/index.html?v=h218-sports-redesign-20261124'),'Badminton launch ticket must match H218 runtime');
assert.ok(runtime.includes('h218-sports-redesign-20261124'),'release runtime must publish H218 cache tag');
assert.equal(rootBuild.cacheTag,release.cacheTag);
assert.ok(vhtml.includes('release-runtime.js?v=h218-sports-redesign-20261124'),'VNext must load H218 runtime cache key');
assert.ok(bhtml.includes('release-runtime.js?v=h218-sports-redesign-20261124'),'Badminton must load H218 runtime cache key');
assert.ok(vhtml.includes('workspace-redesign-h218.css?v=h218-sports-redesign-20261124'),'VNext H218 stylesheet must load last');
assert.ok(vhtml.includes('collapsible-panels-h141.js?v=h142-collapsible-groups-20261125'),'VNext must load nested collapsible function groups');
assert.ok(bhtml.includes('collapsible-panels-h141.js?v=h142-collapsible-groups-20261125'),'Badminton must load nested collapsible function groups');
assert.ok(collapsible.includes("panel.classList.contains('subcard')"),'Nested function-group cards must be collapsed by default');
assert.ok(collapsible.includes("button.setAttribute('aria-controls',id)"),'Collapsible cards must expose accessible controls');
assert.ok(bhtml.includes('workspace-redesign-h218.css?v=h218-sports-redesign-20261124'),'Badminton H218 stylesheet must load last');
assert.equal(release.releaseId,'H218');
assert.equal(release.hub,'h218-sports-workspace-redesign');
assert.equal(vb.cacheTag,release.cacheTag);
assert.equal(bb.cacheTag,release.cacheTag);
for(const [name,css] of [['VNext six-sport engine',vcss],['Badminton',bcss]]){
 for(const token of ['.page:not(#page-never) .card','table th','table td','input','textarea','.modal-box','@media(max-width:690px)','prefers-reduced-motion:reduce']){
  assert.ok(css.includes(token),name+' missing workspace redesign contract '+token);
 }
 assert.ok(css.includes('!important'),name+' must override legacy stylesheet cascade');
}
for(const sport of ['football','volleyball','running','handmade','shuttle','cooking']){
 assert.ok(vhtml.includes("'"+sport+"'"),'missing VNext sport '+sport);
}
for(const tab of ['overview','control','teams','schedule','umpire','live','finance','announcements','audit','health','settings']){
 assert.ok(vhtml.includes('data-tab="'+tab+'"'),'VNext missing tab '+tab);
 assert.ok(bhtml.includes('data-tab="'+tab+'"'),'Badminton missing tab '+tab);
}
assert.ok(vcss.includes('#app-shell:not(.hidden) .page:not(#page-never) .card'),'VNext H218 card selector must outrank legacy H217 cascade');
assert.ok(vcss.includes('html[data-tk-sport] body #app-shell:not(.hidden) .page:not(#page-never) .card'),'VNext H218.1 final cascade guard must override H217 dark card surfaces');
assert.ok(vcss.includes('background-color:#fff!important;color:#172b3d!important'),'VNext H218.1 must enforce readable light cards and dark text');
assert.ok(bcss.includes('#app-shell:not(.hidden) .page:not(#page-never) .card'),'Badminton H218 card selector must outrank legacy H217 cascade');
assert.ok(vcss.includes('var(--sport-strong)'),'VNext must preserve distinct per-sport identity accents');
assert.ok(bcss.includes('#075c75'),'Badminton must have its own teal identity');
console.log('H218 workspace redesign contracts passed: 6 VNext sports + Badminton, 11 tabs, card/form/table/modal/mobile styling and synchronized release manifests.');
