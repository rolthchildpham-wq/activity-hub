const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const build=JSON.parse(fs.readFileSync(path.join(root,'build.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/u122/bundle-manifest.json'),'utf8'));
assert.equal(build.build,'upgrade122');
assert.equal(build.cacheTag,'u122h33-20261103');
assert(/hotfix33-stable-runtime/.test(build.version));
assert(!/assets\/u118/.test(html),'production HTML leaked u118 asset');
assert(!/TOPKEY U100 SOURCE ORDER MANIFEST/.test(html),'legacy source-order audit block leaked into production HTML');
const core=manifest.adminCore?.js || manifest.admin?.js?.file || manifest.js?.file;
assert(core && fs.existsSync(path.join(root,'assets/u122',core)), 'manifest core missing');
const coreBytes=fs.readFileSync(path.join(root,'assets/u122',core));
const coreHash=crypto.createHash('sha256').update(coreBytes).digest('hex');
assert(core.includes(coreHash.slice(0,12)), 'core filename hash mismatch');
for(const [name,entry] of Object.entries(manifest.sources||{})){
  const file=entry.file||name;
  const p=path.join(root,file);
  if(!fs.existsSync(p)) continue;
  const sha=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  if(entry.sha256) assert.equal(entry.sha256,sha,`source hash mismatch ${file}`);
}
const refs=[];
for(const m of html.matchAll(/(?:src|href)=["']([^"'#?]+)(?:\?[^"']*)?["']/g)){
  const r=m[1]; if(r.startsWith('./')) refs.push(r.slice(2));
}
for(const m of html.matchAll(/["'](\.\/[^"'?]+)(?:\?[^"']*)?["']/g)) refs.push(m[1].slice(2));
const missing=[...new Set(refs)].filter(r=>!fs.existsSync(path.join(root,r)));
assert.deepEqual(missing,[],`missing HTML refs: ${missing.join(', ')}`);
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const swRefs=[...sw.matchAll(/["']\.\/([^"']+)["']/g)].map(m=>m[1]).filter(x=>!x.startsWith('http'));
const swMissing=[...new Set(swRefs)].filter(r=>r && !fs.existsSync(path.join(root,r)));
assert.deepEqual(swMissing,[],`missing SW refs: ${swMissing.join(', ')}`);
console.log('PASS Hotfix33 integrity · production HTML slim · manifest hashes · local refs');
