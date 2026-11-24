const fs=require('node:fs');
const assert=require('node:assert/strict');
const root='topkey/sports';
const vhtml=fs.readFileSync(root+'/vnext/index.html','utf8');
const bhtml=fs.readFileSync(root+'/badminton/index.html','utf8');
const vcss=fs.readFileSync(root+'/vnext/workspace-redesign-h218.css','utf8');
const bcss=fs.readFileSync(root+'/badminton/workspace-redesign-h218.css','utf8');
const release=JSON.parse(fs.readFileSync('topkey/release.json','utf8'));
const vb=JSON.parse(fs.readFileSync(root+'/vnext/build.json','utf8'));
const bb=JSON.parse(fs.readFileSync(root+'/badminton/build.json','utf8'));
assert.ok(vhtml.includes('workspace-redesign-h218.css?v=h218-sports-redesign-20261124'),'VNext H218 stylesheet must load last');
assert.ok(bhtml.includes('workspace-redesign-h218.css?v=h218-sports-redesign-20261124'),'Badminton H218 stylesheet must load last');
assert.equal(release.releaseId,'H218');
assert.equal(vb.cacheTag,release.cacheTag);
assert.equal(bb.cacheTag,release.cacheTag);
for(const [name,css] of [['VNext six-sport engine',vcss],['Badminton',bcss]]){
 for(const token of ['.page .card','table th','table td','input','textarea','.modal-box','@media(max-width:690px)','prefers-reduced-motion:reduce']){
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
assert.ok(vcss.includes('var(--sport-strong)'),'VNext must preserve distinct per-sport identity accents');
assert.ok(bcss.includes('#075c75'),'Badminton must have its own teal identity');
console.log('H218 workspace redesign contracts passed: 6 VNext sports + Badminton, 11 tabs, card/form/table/modal/mobile styling and synchronized release manifests.');
