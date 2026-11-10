# Upgrade92 Full Audit

Baseline: Upgrade91B package.

## Conflicts found
1. `upgrade91b` / `u91b-*` broke 5 existing numeric cache/build regression contracts.
2. Upgrade87 `renderHealth()` and delayed stamps could overwrite visible version after Upgrade88, producing mixed Health/runtime/server versions.
3. Upgrade55 and the bootstrap auto-updater rebuilt `./` without copying `location.hash`, so a spectator auto-repair could lose `#spectator` and land on Login.
4. Public Viewer auth was asynchronous but `Auth.init()` returned before the first auth decision; Login could render during restore.
5. `startSpectator()` could be invoked from multiple paths and installed duplicate Firebase listeners.
6. Root package metadata still declared Upgrade88 after later Viewer/TURN changes.

## Fixes
- Numeric Upgrade92 build/cache identity throughout package.
- First-paint spectator login suppression + awaited anonymous auth fast path.
- Hash-preserving auto update/F5 repair.
- Idempotent spectator subscriptions.
- Final runtime/version authority loaded last.
- `reset-u92.html` stale Service Worker/cache rescue path.
- Root manifests/registry/contract/source index updated to Upgrade92.

## Automated verification
- Existing Badminton regression scripts: 17 PASS / 0 FAIL.
- JS syntax: all `src/*.js` and `tests/*.js` pass `node --check`.
- JSON: root/package and Badminton JSON files parse.
- Upgrade92 test validates local HTML/SW asset existence and duplicate-free SW asset list.
- Rules test validates anonymous WebRTC read, own-UID request/answer ownership, and absence of broad WebRTC root write.
- WebRTC static contract confirms Upgrade88 reuses the existing MediaStream and contains no `getUserMedia()` path.
- Viewer BLV static contract confirms Firebase commentary listener + Viewer-local SpeechSynthesis path remain present.

## Browser limitation
Automated container tests cannot exercise real Chrome media playback, Firebase network, EdgeOne deployment, or TURN ICE. Those remain deployment smoke tests, but package/runtime conflicts above are covered before release.

Headless Chromium smoke was attempted locally but could not complete because this container Chromium hangs while resolving external Firebase/CDN dependencies. Per the regression contract this is marked NOT-RUN, not PASS.
