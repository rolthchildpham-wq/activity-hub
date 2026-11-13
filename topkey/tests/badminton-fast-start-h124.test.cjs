const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('topkey/sports/badminton/index.html','utf8');
const source=fs.readFileSync('topkey/sports/badminton/fast-start-h124.js','utf8');
const events=[];
const scheduled=[];
let resolveSchema,resolveSeed;
const app={
 currentTab:'overview',
 renderOverview(){events.push('overview-render')},
 renderAll(){events.push('full-render')},
 renderTeams(){events.push('teams-render')},
 ensureSchema(){events.push('schema-start');return new Promise(r=>{resolveSchema=r})},
 seedIfEmpty(){events.push('seed-start');return new Promise(r=>{resolveSeed=r})}
};
const auth={
 user:{uid:'user-a'},_profileVerifiedUid:'user-a',
 logout(){events.push('logout');return Promise.resolve()}
};
const context={window:{Topkey:{App:app,Auth:auth,Data:{auth:{currentUser:{uid:'user-a'}}}}},requestIdleCallback:fn=>scheduled.push(fn),setTimeout:fn=>scheduled.push(fn),console};
vm.runInNewContext(source,context);
assert.ok(context.window.TopkeyBadmintonFastStart124.installed);
assert.ok(html.includes("await loadScript('./fast-start-h124.js?v=h126-startup-20261113',7000);await loadScript('./dashboard-smooth-h129.js?v=h129-20261113',7000);state.core=true"));
(async()=>{
 // Only the visible authorized tab is rendered on the first Firebase login.
 app.renderAll();
 assert.equal(scheduled.length,1,'first visible tab is scheduled for a single paint');
 scheduled.shift()();
 assert.deepEqual(events,['overview-render']);
 app.renderAll();
 assert.deepEqual(events,['overview-render','full-render']);
 events.length=0;
 // Housekeeping completes after login without waiting for slow RTDB responses.
 await Promise.all([app.ensureSchema(),app.seedIfEmpty()]);
 assert.equal(events.length,0,'Firebase housekeeping must not block app startup');
 assert.equal(scheduled.length,2);
 scheduled.shift()();scheduled.shift()();
 await new Promise(r=>setTimeout(r,0));
 assert.deepEqual(events,['schema-start','seed-start']);
 resolveSchema();resolveSeed();
 await new Promise(r=>setTimeout(r,0));

 // Unverified session must NOT skip server housekeeping or other permission gates.
 auth._profileVerifiedUid='';
 const p=app.ensureSchema();
 assert.equal(events.at(-1),'schema-start');
 resolveSchema();await p;

 // Sign-out invalidates deferred work; no stale data is written after logout.
 auth._profileVerifiedUid='user-a';
 await app.seedIfEmpty(); // already completed; no pending
 await auth.logout();
 assert.ok(events.includes('logout'));
 // Repeated Firebase events in one frame should not trigger full repeated DOM redraws.
 app.renderOverview();app.renderOverview();app.renderOverview();
 assert.equal(events.filter(x=>x==='overview-render').length,0);
 assert.equal(scheduled.length,1,'one redraw scheduled for three Firebase notifications');
 scheduled.shift()();
 assert.equal(events.filter(x=>x==='overview-render').length,1);
 assert.equal(context.window.TopkeyBadmintonFastStart124.overviewRequested,4);
 assert.equal(context.window.TopkeyBadmintonFastStart124.overviewFlushed,2);
 console.log('H124 fast-start: verified-only background housekeeping, no auth bypass, and logout cancellation passed.');
})().catch(err=>{console.error(err);process.exitCode=1});
const authSource=fs.readFileSync('topkey/topkey-shared-auth.js','utf8');
const entrySource=fs.readFileSync('topkey/sports/badminton/index.html','utf8');
const perfSource=fs.readFileSync('topkey/sports/badminton/perf-diagnostics-h125.js','utf8');
assert.ok(authSource.includes("document.getElementById('topkey-auth-boot-pending')?.remove()"),'verified auth must remove old Firebase overlay');
assert.ok(authSource.includes("document.documentElement?.classList?.add('tk-auth-verified')"));
assert.ok(authSource.includes("document.documentElement?.classList?.remove('tk-auth-verified')"));
assert.ok(!authSource.includes("setTimeout(()=>this.recoverProductionTournament().catch(e=>console.warn('Tournament recovery',e)),250)"),'do not synchronously churn tournament during first click');
assert.ok(perfSource.includes('navigationType:metrics.navType'),'diagnostic navigation type');
assert.ok(perfSource.includes('unexpectedBootOverlays'),'diagnostic overlay count');
assert.ok(entrySource.includes('topkey-shared-auth.js?v=h127-auth-visual-stability-20261113'));
assert.ok(entrySource.includes('html.tk-auth-verified #topkey-auth-boot-pending'));
