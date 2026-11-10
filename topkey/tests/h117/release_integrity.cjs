'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');
const txt=f=>fs.readFileSync(path.join(root,f),'utf8');
const json=f=>JSON.parse(txt(f));
const r=json('release.json');const tag=r.cacheTag;
let checks=0;function ok(value,message){assert(value,message);checks++;console.log('PASS',message)}
ok(/^H(117|118|119|120)\b/.test(r.release),'manifest identifies a consolidated release');
for(const f of ['build.json','sports/badminton/build.json','sports/vnext/build.json']){
 const b=json(f);ok(b.cacheTag===tag&&b.version===r.version&&b.build===r.build,`${f} matches manifest`);
}
for(const f of ['index.html','sports/badminton/index.html','sports/vnext/index.html']){
 const s=txt(f);ok(s.includes('release-runtime.js?v='+tag),`${f} shared runtime loaded`);
 ok(s.includes(tag),`${f} cache buster matches`);
}
for(const [f,area] of [['sw.js','hub'],['sports/badminton/sw.js','badminton'],['sports/vnext/sw.js','vnext']]){
 const s=txt(f);ok(s.includes(`topkey-${r.releaseId.toLowerCase()}-${area}-shell`),`${f} current SW cache`);
 ok(s.includes('caches.delete'),`${f} old shell cache cleanup`);
}
ok(txt('release-runtime.js').includes(tag),'release-runtime.js authoritative version');
const html=txt('sports/badminton/index.html');
const src=(html.match(/adminJs:'\.\/assets\/u122\/([^']+)'/)||[])[1];
ok(src&&fs.existsSync(path.join(root,'sports/badminton/assets/u122',src.split('?')[0])),'active Badminton admin-core resolved without query');
const core=txt('sports/badminton/assets/u122/'+src.split('?')[0]);
ok(!/db\.ref\(`\$\{T\.ROOT\}\/tournaments`\)\.once\('value'\)/.test(core),'active tournament recovery has no full parent scan');
ok(txt('topkey-shared-auth.js').includes('rows.slice(0,10)')&&txt('topkey-shared-auth.js').includes('Promise.all(rows.slice(0,10).map'),'recovery bounded to 10 concurrent metadata reads');
ok(txt('topkey-platform-core.js').includes("url.hash='';history.replaceState"),'shared login removes stale public-route hash');
ok(html.includes('./production-loader.js?v='+tag),'Badminton installs staged production loader');
ok(!/<script[^>]+(?:h106-final-report-pdf|jszip\.min|h112-ppt-template|h113-finance-report)/.test(html),'Badminton report dependencies are not eager');
ok(!core.includes("needsFreshLogin?.(initialUser.uid)){try{await T.Data.auth.signOut()"),'Badminton restored Firebase user is not force-signed-out');
const vnextHtml=txt('sports/vnext/index.html'),vnextCore=txt('sports/vnext/h97-vnext.bundle.js');
ok(vnextHtml.includes('../badminton/production-loader.js?v='+tag),'VNext installs shared staged production loader');
ok(!/<script[^>]+src=["'][^"']*(?:qrcode\.min|jszip\.min|hls\.js@1|h106-final-report-pdf|h112-ppt-template|h113-finance-report)/.test(vnextHtml),'VNext optional dependencies are not eager');
ok(!vnextCore.includes("needsFreshLogin?.(user.uid)){try{await T.Data.auth.signOut()"),'VNext restored Firebase user is not force-signed-out');
ok(txt('sports/badminton/sw.js').includes('production-loader.js')&&!txt('sports/badminton/sw.js').includes("'../../h113-finance-report.js?v="),'Badminton SW avoids optional report prefetch');
ok(txt('sports/vnext/sw.js').includes('production-loader.js')&&!txt('sports/vnext/sw.js').includes("'../../h113-finance-report.js?v="),'VNext SW avoids optional report prefetch');
const plan=txt('club-planning.js');
ok(plan.includes('writePlan(db,sport,plan,uid,basePlan)')&&plan.includes('watchPlans(state)'),'form and Dashboard share a transactional plan data layer');
ok(plan.includes("if(q.get('testlab')==='1')")&&plan.includes('/clubPlan'), 'Test Lab and production use same schema and isolated paths');
for(const [key,rootSport] of [['badminton','topkey_badminton_vnext_2026'],['football','topkey_football_vnext_2026'],['volleyball','topkey_volleyball_vnext_2026'],['running','topkey_running_vnext_2026'],['handmade','topkey_handmade_vnext_2026'],['shuttle','topkey_shuttle_vnext_2026'],['cooking','topkey_cooking_vnext_2026']]){
 const rule=json('firebase.database.rules.json').rules[rootSport].clubPlan;
 ok(!!rule&&rule['.write'].includes('auth != null')&&rule['.write'].includes("role').val() === 'ADMIN'"),`clubPlan ${key} write remains authenticated`);
}
console.log('H117 RELEASE INTEGRITY',checks+'/'+checks,'PASS');
