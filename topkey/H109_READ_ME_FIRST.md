# TOPKEY H109 - Unified Release Authority, Guard/Auth Sequencing and Lightweight Runtime

**Foundation:** H108 (which inherits H107 reports, H106 PDF, H105 awards/PPT, H104 Firebase V2, H103 release fixes). This is a **STAGING release, not a certified production release**. No Firebase data or Security Rules were changed.

## Verified problem in H108

The Hub Auth Flow and both entry guards used the H108 tag, but `club-planning.js` and `executive-dashboard.js` continued to expose H105. The test-lab preboot code also created links using H105. Release/version literals were scattered across multiple active files. A module mismatch could reject an entry ticket and return to Hub.

`club-planning.js` registered `topkey:languagechange` inside every Firebase Auth state callback without disposing its previous handler; the seven club plans were queried one after another. Some version checks fetched three manifests sequentially.

## Changes

1. `release.json` is the release authority. `tools/build_release.py` derives `release-runtime.js`, the three build manifests, entrypoint cache busters and the three Service Worker cache names. The H110 simulation proves a future release can be stamped consistently.
2. `hub-auth-flow.js`, `release-coordinator.js`, both `hub-entry-guard.js` files, Club Planning, the executive dashboard and active update controllers now use `window.TopkeyRelease` instead of separately maintained H105/H108 version literals.
3. The Hub only creates a sport session after its release coordinator finishes verifying Hub, Badminton and VNext. The per-sport entry guard returns a readiness decision; the login handler waits for the decision and never grants ADMIN based on cached client data.
4. Each Service Worker uses a unique H109 cache, removes older caches in *its own scope*, loads release manifests/auth/guard scripts network-first, and no longer forces `skipWaiting()` during installation. User-triggered update can still send `SKIP_WAITING`.
5. Release checks are de-duplicated if triggered concurrently. Manifest verification before applying an update runs in parallel rather than serially.
6. Club Planning uses `Promise.all` to query seven plans concurrently. It removes the previous language-event listener when Auth changes and discards stale async results. Existing delegated/assigned button handlers and existing Firebase authorization are preserved.
7. Reduced the repeated global version-patcher scans at startup from a 24-cycle interval to four scheduled retries. Testlab navigation now uses the active release tag.

## Local verification (not production certification)

- 407 / 407 JavaScript files passed `node --check`.
- 16 / 16 tested inline HTML scripts parsed; 78 / 78 local HTML resources exist.
- 60 architecture / routing assertions pass; seven sport entry routes exercised in Node VM.
- 3 Service Worker scope/cache tests pass; old caches from another scope remain untouched.
- Auth integration: 8 / 8 pass. Role/session guard matrix: 26 / 26 pass.
- Four Auth profile verification mock cases pass (cached ADMIN does not confer a role).
- Ten Chromium DOM tests pass: release parity, de-duplication, mismatch blocking, recheck, club-planning listener lifetime and parallel Firebase reads.
- Firebase V2 simulation: 12,000 teams + 12,000 matches + 12,000 finance rows passed pagination/reference and aggregate checks.
- H107 award report contract, H88 HTML report, PPT export and security contract, and H95 finite lifecycle test passed.
- H95 legacy performance acceptance **FAIL**: its pre-H97 mock is incompatible with the paginated data API. This also failed on H107/H108 and does **not** demonstrate a performance improvement or regression by itself.
- A direct Chromium navigation test was attempted but blocked by `ERR_BLOCKED_BY_ADMINISTRATOR`; isolated Chromium DOM tests ran instead.
- Firebase Auth against a real staging Database and EdgeOne production load times **NOT TESTED**. No claim of end-to-end production PASS.

## Deploy / rollback gate

1. Back up Firebase and keep the working prior ZIP. Deploy **all files** in this ZIP to a separate staging site. Never copy only one folder or disable the version guard.
2. Verify `release.json`, `build.json`, `sports/badminton/build.json`, `sports/vnext/build.json` all contain `cacheTag: u122h109-20261109` and the same version string.
3. Use an incognito browser to test Firebase login (ADMIN/BTC/UMPIRE/VIEWER), sign-out, Hub-to-sport navigation and reload. Do not share passwords/tokens.
4. Verify all seven sports, matches/BXH/winner, finance aggregate, PDF/PPT, and check `/diagnostics/release-and-speed-check.html`.
5. In DevTools, check Console exceptions, Network duplicate requests, Performance LCP/INP, JS heap, Firebase listener count and app-update flow. Repeat on desktop and mobile, including 30-minute use.
6. Roll back the full site if the real staging tests fail. No Firebase migration is performed by H109.

## Future release steps

Change *only* `release.json` to the next release ID/build/cacheTag/version/release. Then run `python tools/build_release.py` to stamp all dependent assets. Run `node tests/h109_release_architecture.js` (the H109-specific assertion may need its expected release ID generalized for subsequent versions), Auth and SW tests, check all JS and HTML before ZIP packaging. Keep scripts, manifests and Service Worker in one atomic release artifact.
