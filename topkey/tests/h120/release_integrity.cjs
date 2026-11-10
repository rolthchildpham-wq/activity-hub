'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');
const text=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(text(file));
const release=json('release.json'),tag=release.cacheTag;
let checks=0;
function ok(value,message){assert(value,message);checks++}

ok(release.releaseId==='H120','manifest identifies H120');
ok(tag==='u122h120-20261110','H120 uses a fresh cache tag');
for(const file of ['build.json','sports/badminton/build.json','sports/vnext/build.json']){
 const build=json(file);ok(build.cacheTag===tag&&build.version===release.version&&build.build===release.build,file+' matches release authority');
}
for(const file of ['index.html','sports/badminton/index.html','sports/vnext/index.html']){
 const source=text(file);ok(source.includes('release-runtime.js?v='+tag),file+' loads the current runtime');ok(source.includes(tag),file+' uses the current cache buster');
}
for(const [file,scope] of [['sw.js','hub'],['sports/badminton/sw.js','badminton'],['sports/vnext/sw.js','vnext']]){
 const source=text(file);ok(source.includes(`topkey-h120-${scope}-shell`),file+' uses the H120 shell cache');ok(source.includes('caches.delete'),file+' removes old shell caches');
}
const platform=text('topkey-platform-core.js'),guard=text('h108-auth-guard.js'),auth=text('topkey-shared-auth.js');
ok(platform.includes('function startSport(options={})'),'shared platform exports the lazy sport controller');
ok(platform.includes('__platformShell:true'),'shared platform creates a lightweight Firebase shell');
ok(platform.includes('options.ensureCore?.afterAuthenticated'),'manual login waits for post-auth hydration');
ok(!guard.includes('isBadminton'),'login guard has no Badminton-only branch');
ok(guard.includes('__TOPKEY_SPORT_BOOT')&&guard.includes('__TOPKEY_ENSURE_CORE'),'login guard uses one sport contract');
ok(auth.includes('attachApp(){return this._startAppIfReady()}'),'verified Auth can attach a deferred app');
for(const [html,bundle] of [['sports/badminton/index.html','sports/badminton/assets/u122/admin-core.h85full.js'],['sports/vnext/index.html','sports/vnext/h97-vnext.bundle.js']]){
 const entry=text(html),core=text(bundle);
 ok(entry.includes('TopkeyPlatform.startSport'),'protected '+html+' uses the shared Auth shell');
 ok(entry.includes('__TOPKEY_ENSURE_CORE'),'protected '+html+' exposes deferred hydration');
 ok(core.includes('shell?.__platformShell'),'bundle '+bundle+' preserves shell Firebase handles');
 ok(core.includes('T.Auth=T.Auth||window.TopkeySharedAuth.create(T)'),'bundle '+bundle+' preserves the Auth observer');
}
const badminton=text('sports/badminton/index.html');
ok(!badminton.includes('else ensureAdmin();'),'Badminton core is not eagerly loaded before Auth');
ok(badminton.includes('ensureViewer();else if(reg)ensureRegister()'),'Badminton public routes remain specialized and lazy');
const hub=text('hub-layout94.js'),css=text('hub-layout94.css');
ok(hub.includes('topkey_hub_header_collapsed_v120'),'mobile header preference is versioned');
ok(hub.includes("setAttribute('aria-expanded'"),'mobile header exposes expanded state');
ok(css.includes('.top.hub-header-collapsed'),'mobile collapsed layout is present');
console.log(`H120_RELEASE_INTEGRITY ${checks}/${checks} PASS`);
