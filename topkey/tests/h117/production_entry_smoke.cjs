const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../..');
const TAG = 'u122h117p1-20261109';
const OPTIONAL = ['h106-', 'jszip', 'h112-', 'h113-', 'h116-'];
const BROWSER_CANDIDATES = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome'
].filter(Boolean);

const FIREBASE_MOCK = String.raw`(() => {
  const user = {uid:'admin', email:'admin@example.invalid', isAnonymous:false};
  const profile = {uid:'admin', role:'ADMIN', active:true, displayName:'Production Smoke'};
  const stats = window.__h117Smoke = {signOut:0, reads:[], watches:[]};
  const snapshot = value => ({
    val: () => value, exists: () => value !== null && value !== undefined, key:'',
    forEach: cb => { if (!value || typeof value !== 'object') return false; Object.entries(value).forEach(([key, child]) => cb({...snapshot(child), key})); return false; }
  });
  const valueFor = path => {
    if (/\/users\/admin$/.test(path)) return profile;
    if (/\/tournamentIndex\//.test(path)) return {};
    if (/\/currentTournamentId$/.test(path)) return '__testlab_h117_smoke';
    if (/\/config$/.test(path)) return {title:'H117 Smoke', sport:'badminton'};
    return null;
  };
  const ref = path => {
    const api = {
      key:String(path || '').split('/').pop(),
      once:async()=>{ stats.reads.push(String(path)); return snapshot(valueFor(String(path))); },
      on:(_event, cb)=>{ stats.watches.push(String(path)); queueMicrotask(()=>cb(snapshot(valueFor(String(path)))); return cb; },
      off:()=>{}, set:async()=>{}, update:async()=>{}, remove:async()=>{},
      push:()=>({key:'smoke-key', set:async()=>{}}),
      transaction:async fn=>({committed:true, snapshot:snapshot(fn(valueFor(String(path))))}),
      child:child=>ref(String(path).replace(/\/$/, '') + '/' + child),
      limitToFirst:()=>api, limitToLast:()=>api, orderByChild:()=>api,
      equalTo:()=>api, startAt:()=>api, endAt:()=>api
    };
    return api;
  };
  const auth = {
    currentUser:user,
    onAuthStateChanged(cb){ queueMicrotask(()=>cb(user)); return ()=>{}; },
    signOut:async()=>{ stats.signOut += 1; }, setPersistence:async()=>{},
    signInWithEmailAndPassword:async()=>({user}), signInAnonymously:async()=>({user:{uid:'anonymous',isAnonymous:true}})
  };
  const storage = {ref:()=>({put:async()=>({ref:{getDownloadURL:async()=>''}}), getDownloadURL:async()=>''})};
  const app = {auth:()=>auth, database:()=>({ref}), storage:()=>storage, delete:async()=>{}};
  function authFn(){ return auth; } authFn.Auth = {Persistence:{LOCAL:'LOCAL'}};
  window.firebase = {apps:[app], initializeApp:(_config,name)=>name?{...app}:app, app:()=>app, auth:authFn, database:()=>({ref}), storage:()=>storage};
  sessionStorage.setItem('topkey_hub_session_v2', JSON.stringify({
    sport:'badminton', nonce:'h117-smoke-ticket', createdAt:Date.now(), touchedAt:Date.now(),
    phase:'SELECTED', authUid:'', authenticatedAt:0, loginStartedAt:0, build:${JSON.stringify(TAG)}
  }));
})();`;

const mime = file => ({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)] || 'application/octet-stream');

function server() {
  return http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(ROOT, '.' + pathname);
    if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, {'Content-Type':mime(file), 'Cache-Control':'public, max-age=3600'});
    fs.createReadStream(file).pipe(res);
  });
}

async function runCase(page, base, route, viewport, phase) {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  const started = performance.now();
  await page.goto(`${base}/${route}?entry=hub&hubTicket=h117-smoke-ticket&sport=badminton&v=${TAG}&__topkey_build=${TAG}&tid=__testlab_h117_smoke`, {waitUntil:'domcontentloaded', timeout:20_000});
  await page.locator('#app-shell:not(.hidden)').waitFor({state:'visible', timeout:10_000});
  const interactiveMs = Math.round((performance.now() - started) * 10) / 10;
  const signOutCount = await page.evaluate(() => window.__h117Smoke?.signOut || 0);
  const loginHidden = await page.locator('#login-screen').evaluate(el => el.classList.contains('hidden'));
  const optional = requests.filter(url => OPTIONAL.some(marker => url.toLowerCase().includes(marker)));
  if (signOutCount !== 0) throw new Error(`${route} unexpectedly signed out the restored user`);
  if (!loginHidden) throw new Error(`${route} returned to the login screen`);
  if (optional.length) throw new Error(`${route} eagerly requested optional report modules: ${optional.join(', ')}`);
  return {route, viewport, phase, interactiveMs, requestCountToInteractive:requests.length, signOutCount, optionalRequestsToInteractive:optional.length};
}

(async () => {
  const executablePath = BROWSER_CANDIDATES.find(candidate => fs.existsSync(candidate));
  if (!executablePath) {
    const blocked = {
      release:'H117 Production Stability P1', cacheTag:TAG, pass:false, status:'BLOCKED',
      reason:'No Chromium executable is installed; network policy returned 403 when Playwright attempted to download it.'
    };
    fs.writeFileSync(path.join(__dirname, 'H117_PRODUCTION_ENTRY_SMOKE.json'), JSON.stringify(blocked, null, 2) + '\n');
    console.error(JSON.stringify(blocked));
    process.exitCode = 2;
    return;
  }
  const web = server();
  await new Promise(resolve => web.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${web.address().port}`;
  const results = [];
  let browser;
  try {
    browser = await chromium.launch({headless:true, executablePath, args:['--no-sandbox','--disable-dev-shm-usage','--disable-features=ServiceWorker']});
    for (const [viewportName, viewport] of [['desktop',{width:1440,height:920}],['mobile',{width:390,height:844}]]) {
      const context = await browser.newContext({viewport, serviceWorkers:'block'});
      await context.addInitScript({content:FIREBASE_MOCK});
      await context.route('https://**/*', route => route.fulfill({status:200, contentType:'application/javascript', body:'/* H117 smoke network stub */'}));
      for (const phase of ['cold','warm']) {
        for (const sportRoute of ['sports/badminton/index.html','sports/vnext/index.html']) {
          const page = await context.newPage();
          results.push(await runCase(page, base, sportRoute, viewportName, phase));
          await page.close();
        }
      }
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => web.close(resolve));
  }
  const report = {release:'H117 Production Stability P1', cacheTag:TAG, results, pass:true};
  fs.writeFileSync(path.join(__dirname, 'H117_PRODUCTION_ENTRY_SMOKE.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
})().catch(error => { console.error(error); process.exit(1); });
