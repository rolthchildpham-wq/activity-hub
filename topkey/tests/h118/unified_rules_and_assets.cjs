'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');
const file=p=>fs.readFileSync(path.join(root,p),'utf8');
const release=JSON.parse(file('release.json')),build=JSON.parse(file('build.json'));
let checks=0;
function check(condition,message){assert(condition,message);checks++;console.log('PASS',message)}
const sports=['badminton','football','volleyball','running','handmade','shuttle','cooking'];
const db=JSON.parse(file('firebase.database.rules.json'));
const config=JSON.parse(file('firebase.json'));
check(config.database.rules==='firebase.database.rules.json'&&config.storage.rules==='firebase.storage.rules','Firebase CLI deploys canonical shared rules');
check(file('firebase.database.rules.json')===file('sports/badminton/firebase.database.rules.json'),'Legacy badminton database rules mirror canonical multi-sport ACLs exactly');
check(file('firebase.storage.rules')===file('sports/badminton/firebase.storage.rules'),'Legacy badminton Storage rules mirror canonical multi-sport ACLs exactly');
for(const sport of sports){
 const sub=db.rules['topkey_'+sport+'_vnext_2026'];
 check(!!sub&&typeof sub==='object',sport+' retained under one database security ruleset');
 const html=sport==='badminton'?'sports/badminton/index.html':'sports/vnext/index.html';
 const source=file(html);
 check(source.includes('topkey-hub-guard-core.js?v='+release.cacheTag)&&source.includes('topkey-shared-auth.js?v='+release.cacheTag),'Shared auth and Hub guard load on '+sport);
}
for(const sport of ['badminton','vnext']){
 const buildLocal=JSON.parse(file(`sports/${sport}/build.json`));
 check(JSON.stringify(buildLocal)===JSON.stringify(build),'Atomic Hub/build manifest matches '+sport);
 const sw=file(`sports/${sport}/sw.js`);
 check(sw.includes(`topkey-h${release.releaseId.slice(1)}-${sport}-shell`)&&sw.includes('../../topkey-shared-auth.js?v='+release.cacheTag),'Versioned SW caches common auth on '+sport);
 check(sw.includes('topkey-shared-auth')&&sw.includes('networkFirst(req)'),'SW prefers a fresh common auth module on '+sport);
}
for(const sport of ['badminton','vnext']){
 const p=sport==='badminton'?'sports/badminton/assets/u122/admin-core.h85full.js':'sports/vnext/h97-vnext.bundle.js';
 check(file(p).includes('TopkeySharedAuth.create(T)'),'Production bundle for '+sport+' delegates auth to central module');
}
const guard=file('h108-auth-guard.js');
check(!guard.includes('for(let i=0;i<32')&&guard.includes('platform.bindLogin({ensureCore})'),'Login guard delegates to one platform controller without the old 8 second poll');
check(!guard.includes('sleep(3500)')&&!guard.includes("addEventListener('submit'"),'Login adapter neither blocks on observer initialization nor binds a competing submit handler');
check(['H118','H119','H120'].includes(release.releaseId)&&build.cacheTag===release.cacheTag,'Unified release ID/cacheTag are atomic');
const report={pass:true,checks,release:release.releaseId,scope:'Local static/rules parity; deployed Firebase ACLs not read'};
fs.writeFileSync(path.join(__dirname,'UNIFIED_RULES_RESULTS.json'),JSON.stringify(report,null,2)+'\n');
console.log('H118_UNIFIED_RULES',checks+'/'+checks,'PASS');
