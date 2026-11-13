const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync('topkey/sports/badminton/tab-perf-h133.js','utf8');
const html=fs.readFileSync('topkey/sports/badminton/index.html','utf8');
const loader=fs.readFileSync('topkey/sports/badminton/production-loader.js','utf8');
assert.ok(html.includes("await loadScript('./tab-perf-h133.js?v=h133-20261113',7000)"));
assert.ok(html.includes('production-loader.js?v=h135-poll-free-reports-20261113'));
assert.ok(loader.includes('await yieldToBrowser(4000)'));
const frames=[],calls=[];
let tab='overview';
const app={get currentTab(){return tab},set currentTab(x){tab=x},
 showTab(name){tab=name;calls.push('nav:'+name)},
 renderMatches(){calls.push('matches')},renderStandings(){calls.push('standings')},
 renderSelectors(){calls.push('selectors')},renderSchedulerControls(){calls.push('controls')},
 renderUmpire(){calls.push('umpire')}
};
const Auth={_profileVerifiedUid:'user-1'};
const core={renderTabFromCache(name){calls.push('original:'+name)}};
const window={Topkey:{App:app,Auth,Data:{auth:{currentUser:{uid:'user-1'}}}},
 TopkeyCoreDataRuntime115:core,requestAnimationFrame:fn=>frames.push(fn),
 performance:{now:()=>0}};
vm.runInNewContext(code,{window,console,setTimeout:fn=>frames.push(fn),Date});
assert.ok(window.TopkeyTabPerf133.installed);
app.showTab('schedule');core.renderTabFromCache('schedule');
assert.deepEqual(calls,['nav:schedule']);
frames.shift()();
assert.ok(calls.includes('matches'));
app.showTab('umpire');core.renderTabFromCache('umpire');
frames.shift()(); // stale schedule standings must be cancelled
assert.ok(!calls.includes('standings'));
frames.shift()();frames.shift()(); // umpire and selector
assert.ok(calls.includes('umpire'));
assert.equal(calls.filter(x=>x==='selectors').length,1,'only active umpire selectors should be drawn');
assert.equal(window.TopkeyTabPerf133.snapshot.cancelled>=1,true);
core.renderTabFromCache('finance');
assert.ok(calls.includes('original:finance'),'unmodified other tabs still use core renderer');
Auth._profileVerifiedUid='different-user';
core.renderTabFromCache('schedule');
assert.ok(calls.includes('original:schedule'),'unverified state must not bypass original behavior');
console.log('H133: rapid schedule->umpire cancels obsolete BXH, paints active referee in phases, preserves security.');
