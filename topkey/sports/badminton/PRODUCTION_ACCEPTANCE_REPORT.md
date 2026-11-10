# TOPKEY Badminton VNext 2026 — Production Acceptance Report

Release under test: **Upgrade118 — Production Artifact Cleanup / Dependency Hygiene**  
Build: `upgrade118`  
Version: `2026.10.31-vnext-featureparity15-upgrade118-production-artifact-cleanup`

## Release decision

**GO — production baseline accepted.**

Upgrade118 is the recommended deploy artifact after the performance/stability roadmap 108→117. It adds no tournament feature or permission change; it removes the final runtime dependency on an older versioned Replay/AI asset directory and removes stale historical versioned bundles from the deploy artifact.

## What was actually tested

### 1. Clean release-artifact regression

All tests were executed from a clean extraction of the final release tree, not from an incremental working directory.

- Regression + deterministic VM tests: **62/62 PASS**
- JavaScript syntax (`node --check`): **180/180 PASS**
- JSON / webmanifest parse: **17/17 PASS**
- Service Worker precache: **10/10 assets present**
- Current hashed asset filename/content verification: **PASS**
- Admin bundle recreation from manifest source order: **PASS**
- Admin CSS bundle recreation from manifest source order: **PASS**
- EdgeOne current shell/cache policy check: **PASS**
- Historical versioned asset directories in production package: **0** (`u118` is the only versioned asset directory)

### 2. Chromium browser acceptance — deterministic Firebase

Chromium executed the real DOM, current CSS, current Admin/Viewer bundles, feature chunks, and application logic. Firebase was replaced with a deterministic in-browser mock so the acceptance run is reproducible and does not depend on Internet access.

**Admin acceptance**

- Admin boot: PASS
- Login screen before authentication: PASS
- Firebase login: PASS
- Credentials do not appear in query string: PASS
- Logout → login again: PASS; two authentication calls total, no reload loop
- All Admin tabs open: Overview, Control, Teams, Schedule, Umpire, Live, Finance, Announcements, Audit, Health, Settings: PASS
- Feature lazy-load: Teams→QRCode, Live→Replay JS/CSS, Finance/Settings→Firebase Storage: PASS
- Schedule collapse/expand after DOM wrappers: PASS
- One referee +1 action changes score 5→6: PASS
- Same score action produces one atomic payload containing `activeMatches + event + commentary/latest`: PASS
- 200 rapid tab changes after normal use: 0 new console/page errors
- Console/page errors: **0**

**Viewer acceptance**

- Public Viewer boots without Admin shell: PASS
- Anonymous auth called once: PASS
- Schedule renders: PASS
- Standings renders: PASS
- Live card renders: PASS
- Search/filter: PASS
- Schedule collapse/expand: PASS
- Latest announcement chip: PASS
- BLV audio enable control: PASS
- Viewer data references use individual team IDs and `commentary/<court>/latest`; no full `/teams` listener: PASS
- Console/page errors: **0**

### 3. Long-session / recovery soak inherited and re-run through regression

The mandatory Upgrade117 hardening contracts remain in the 62-test release suite:

- 40 concurrent `Data.init()` requests → one underlying init
- 30 concurrent `Auth.init()` requests → one underlying init
- 100 concurrent `flushQueue()` requests → max underlying queue-drain concurrency = 1
- repeated resume/online recovery → coalesced recovery
- 100 subscription cycles + 1,200 tab changes → no multiplication of owned listeners/hooks
- 500 awarded points with commentary → exactly 500 underlying atomic writes, pending map returns to zero
- WebRTC heartbeat/signaling self-heal, Viewer BLV lifecycle and Fast Lane offline recovery remain mandatory regressions

### 4. Local HTTP artifact check

The final directory was served by a local HTTP server and all current shell/assets were fetched by URL. All returned HTTP 200 and correct MIME types:

- `/sports/badminton/`
- `index.html`
- `build.json`
- `sw.js`
- `manifest.webmanifest`
- current Admin JS/CSS
- current Viewer JS/CSS
- current Replay JS/CSS

The execution environment blocks Playwright `page.goto(http://127.0.0.1/...)` with `ERR_BLOCKED_BY_ADMINISTRATOR`, so full browser navigation over localhost could not be used. Browser application acceptance was therefore performed with the same final DOM/bundles in Chromium via `set_content`, while HTTP path/MIME correctness was verified separately with actual HTTP requests. This limitation is recorded rather than reported as a pass.

## Performance / package observations

- Upgrade117 release artifact: ~33.6 MB
- Upgrade118 release tree: ~5.7 MB
- Badminton subtree: ~4.5 MB
- Current versioned assets (`assets/u118`): ~1.5 MB
- Shared audio: ~104 KB

Current payload sizes before CDN compression:

- Admin JS: 1,183,848 B; gzip ~320.5 KB; Brotli ~226.9 KB
- Admin CSS: 140,120 B; gzip ~28.1 KB; Brotli ~23.5 KB
- Viewer JS: 32,198 B; gzip ~11.2 KB; Brotli ~10.1 KB
- Viewer CSS: 6,108 B; gzip ~2.0 KB; Brotli ~1.7 KB
- Replay JS (lazy): 55,849 B; gzip ~16.1 KB; Brotli ~14.2 KB
- Replay CSS (lazy): 10,600 B; gzip ~2.8 KB; Brotli ~2.4 KB

The package cleanup primarily improves deploy/upload hygiene and eliminates stale asset dependencies. It does not materially change Viewer runtime behavior or scoring behavior.

## Original optimization plan — final status

1. Viewer does not load Admin system: **DONE**
2. CSS bundled by route/feature: **DONE**
3. JS code splitting/lazy loading: **DONE for the production-critical boundaries** (Viewer, Replay, Storage, QR, JSZip); deep Finance/Scheduler extraction is intentionally deferred
4. Minimal Service Worker precache: **DONE**
5. Hashed assets Cache First / shell Network First: **DONE**
6. Content-hashed immutable assets: **DONE**
7. Reduced Viewer Firebase window: **DONE**
8. Incremental Viewer/render lifecycle: **DONE**
9. Scoring Fast Lane: **DONE**
10. Atomic score/event/commentary: **DONE**
11. Eliminate legacy upgrade wrapper chain: **PARTIALLY CONSOLIDATED**; major runtime boundaries are consolidated, but a complete rewrite is intentionally not required for this production baseline
12. Firebase compat→modular SDK: **NOT MIGRATED**; Storage is lazy and Viewer boot is minimal, so this remains optional technical debt rather than a production blocker
13. EdgeOne cache rules for shell/assets: **DONE in source config**; live HTTP/3/Brotli/CDN behavior requires verification from the deployed domain/network

## Remaining limitations that cannot be proven in this container

The environment cannot resolve/access the live EdgeOne production site or external Internet reliably. Therefore the following are not claimed as verified here:

- real Firebase RTT/region latency on the deployed site
- real EdgeOne response headers, Brotli/HTTP/3 behavior and edge-hit ratio
- a true two-device WebRTC/TURN call over the public Internet
- actual phone/browser memory behavior over many hours

These are deployment/environment checks, not known code failures.

## Final recommendation

Deploy Upgrade118 and treat it as the **production baseline**. Do not continue creating upgrade patches merely to finish the remaining architectural ideals. Full Firebase modular migration or a complete rewrite of legacy upgrade modules should only be undertaken as a separately planned major refactor when measurements show a real benefit or when new development makes it necessary.
