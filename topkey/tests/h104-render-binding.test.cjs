const fs=require('node:fs');
const assert=require('node:assert/strict');
const source=fs.readFileSync('topkey/h104-indexed-runtime.js','utf8');
for(const method of ['renderTeams','renderCheckin','renderSelectors','renderMatches','renderLiveScore','renderFinance']){
  assert.ok(source.includes(`safeRun(App.${method}?.bind(App))`), `H104 must preserve App context for ${method}`);
  assert.ok(!source.includes(`safeRun(App.${method});`), `H104 must not invoke ${method} unbound`);
}
console.log('H104 indexed render callbacks preserve App context.');
