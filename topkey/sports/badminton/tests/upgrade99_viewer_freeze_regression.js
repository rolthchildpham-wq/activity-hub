const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const u98=read('src/upgrade98.js'),u99=read('src/upgrade99.js'),html=read('index.html'),sw=read('sw.js'),build=JSON.parse(read('build.json'));
const n=Number((String(build.build).match(/upgrade(\d+)/)||[])[1]||0);assert(n>=99,'build must preserve U99 or later freeze fix');
assert(!u98.includes("new MutationObserver(()=>patchViewer())"),'recursive U98 observer pattern must stay removed');
assert(u98.includes('function armViewerPatch()'),'one-shot patch arming required');
assert(/const mo=state\.viewerObserver;state\.viewerObserver=null;try\{mo\?\.disconnect/.test(u98),'observer must disconnect before patchViewer mutation');
assert(u99.includes('VIEWER_FREEZE_MUTATION_LOOP_FIX_001'),'U99 final freeze contract source must remain');
if(n>=100){assert(html.includes(`window.__TOPKEY_BOOT_BUILD='${build.build}'`));assert(n>=109?new RegExp(`assets/u${n}/(?:admin|viewer)\\.[a-f0-9]{12}\\.js`).test(html):new RegExp(`assets/u${n}/app\\.[a-f0-9]{12}\\.js`).test(html));assert(sw.includes(`topkey-vnext-2026-${build.build}`)||/topkey-vnext-2026-upgrade\d+/.test(sw))}else{assert.strictEqual(build.build,'upgrade99');assert.strictEqual(build.cacheTag,'u99-20261030')}
console.log('upgrade99 viewer freeze regression: PASS');
