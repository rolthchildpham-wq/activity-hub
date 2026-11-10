# Upgrade102 — Firebase Latency FULL AUDIT

Baseline: Upgrade101 WebRTC Signaling Resilience.

## Changes
- Core operational state `config/teams/matches/courts/activeMatches/announcements` remains live.
- `teams/matches/courts/activeMatches` now use child-level incremental Firebase events instead of full-branch `value` snapshots on every change.
- `finance`, `audit`, `registrations`, `commentary`, and ADMIN `users` are tab-scoped and detached when leaving the tab.
- Firebase callback bursts are coalesced to one UI render frame.
- Public Viewer no longer subscribes to the whole `commentary` tree. BLV continues on `commentary/<selectedCourt>/latest`.
- Duplicate Upgrade94 global Viewer listeners are suppressed; its per-court commentary listener and 700 ms score fallback remain active.
- Public schedule rendering and Live rendering are separated so score updates do not rebuild the whole schedule.

## Performance-safe packaging
- Browser local CSS: 1 bundle: `./assets/u102/app.f3c0a961bca6.css`
- Browser local JS: preboot + 1 app bundle: `./assets/u102/app.51ef9682619f.js`
- Service Worker precache remains 11 assets.

## Preserved byte-for-byte from Upgrade101
- `firebase.database.rules.json`
- root FULL Firebase Rules
- `turn-config.json`
- Edge TURN function
- `src/scoring.js`
- `src/upgrade88.js` (WebRTC signaling)
- `src/upgrade94.js` / `src/upgrade96.js` (Viewer BLV)
- `src/upgrade100.js` (Viewer auto-landscape/fullscreen cleanup)
- `src/upgrade101.js` (WebRTC heartbeat/self-heal)

## Tests
- Regression + VM: 34/34 PASS
- JavaScript syntax: 168/168 PASS
- JSON/webmanifest parse: 22/22 PASS
- HTML local assets missing: 0
- Service Worker assets: 11/11 present
- ZIP integrity: verified before release

## U102 dynamic test
A burst of 25 `matches` child updates is coalesced instead of producing one full render per callback. Public Viewer starts without a whole-tree commentary listener, and Finance/Audit listeners are absent until their tabs are activated.
