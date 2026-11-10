'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(text('release.json'));
assert(/^H[0-9]+$/.test(manifest.releaseId),'current release must be stamped');
for(const p of ['build.json','sports/badminton/build.json','sports/vnext/build.json']){
 const b=JSON.parse(text(p));
 assert.equal(b.build,manifest.build,p);
 assert.equal(b.cacheTag,manifest.cacheTag,p);
}
for(const p of ['sports/badminton/upgrade122-hotfix65.js','sports/vnext/src/upgrade122-hotfix65.js']){
 const src=text(p);
 assert(src.includes('function h107AwardSection('),p);
 assert(src.includes('${h107AwardSection(r)}'),p);
 assert(src.includes('data-section="prizes"'),p);
}
for(const p of ['sports/badminton/upgrade122-hotfix80.js','sports/vnext/src/upgrade122-hotfix80.js']){
 const src=text(p);
 assert(src.includes('id="tk107-awards"'),p);
 assert(src.includes('function reportHtml(r,source=images){r=reportWithPrizes(r);'),p);
 assert(src.includes("const ps=[r?.prizeStructure,x?.prizeStructure,x?.config?.prizeStructure].find"),p);
}
const bundle=text('sports/vnext/h97-vnext.bundle.js');
assert(bundle.includes('id="tk107-awards"'));
assert(bundle.includes('function h107AwardSection('));
console.log('H107 award contracts PASS: all 7 sports, legacy/new report, archive snapshot, bundled VNext, 4 manifests');
