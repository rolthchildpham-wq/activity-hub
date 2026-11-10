const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {chromium} = require('playwright');

const root = path.resolve(__dirname, '..');
(async () => {
  const executablePath = chromium.executablePath().replace('chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell', 'chromium-1234/chrome-linux64/chrome');
  if (!fs.existsSync(executablePath)) {
    console.log('SKIP H95 browser smoke: Chromium executable is not installed');
    return;
  }
  const browser = await chromium.launch({headless: true, executablePath});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.setContent('<table><tbody id="teams-list"></tbody></table><table><tbody id="matches-list"></tbody></table><span id="team-count"></span>');
  await page.addScriptTag({content: `window.Topkey={U:{setText:(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v},money:String,dateTime:String},SPORT:{key:'football',title:'Football',rules:{},mode:'score'},DEFAULT_RULES:{},MATCH_STATUSES:['SCHEDULED','FINISHED'],Data:{ready:true,listen(){return()=>{}},listenAuthUsers(){return()=>{}}},Auth:{role:()=> 'ADMIN'}};`});
  await page.addScriptTag({content: fs.readFileSync(path.join(root, 'sports/vnext/src/app.js'), 'utf8')});
  await page.addScriptTag({content: fs.readFileSync(path.join(root, 'sports/vnext/src/core/performance-runtime.js'), 'utf8')});
  const result = await page.evaluate(() => {
    const App = Topkey.App;
    App.state.teams = Object.fromEntries(Array.from({length: 10000}, (_, i) => [`t${i}`, {id:`t${i}`,code:`T${i}`,name:`Team ${i}`,p1:'A',p2:'B',category:'OPEN'}]));
    App.state.matches = Object.fromEntries(Array.from({length: 10000}, (_, i) => [`m${i}`, {id:`m${i}`,code:`M${i}`,teamAId:`t${i}`,teamBId:`t${(i+1)%10000}`,status:'SCHEDULED',date:'2026-11-08',time:'08:00'}]));
    App.matchLabel = m => `${m.teamAId}-${m.teamBId}`;
    App.resultLabel = () => '—';
    App.renderTeams();
    App.renderMatches();
    return {teams: document.querySelectorAll('#teams-list > tr').length, matches: document.querySelectorAll('#matches-list > tr').length, stateTeams: Object.keys(App.state.teams).length, stateMatches: Object.keys(App.state.matches).length};
  });
  await browser.close();
  assert.deepStrictEqual(errors, [], `browser page errors: ${errors.join('; ')}`);
  assert.deepStrictEqual(result, {teams: 300, matches: 300, stateTeams: 10000, stateMatches: 10000});
  console.log('H95_BROWSER_10K_SMOKE_OK', result);
})().catch(error => { console.error(error); process.exit(1); });
