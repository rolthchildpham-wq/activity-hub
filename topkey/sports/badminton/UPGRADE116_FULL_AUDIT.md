# Upgrade116 — Consolidation Phase 3 Full Audit

## Scope
Upgrade116 consolidates Admin UI lifecycle hooks into explicit core/feature boundaries. It does **not** change Firebase data paths, Realtime Database Rules, Storage Rules, scoring semantics, TURN, WebRTC signaling, Viewer Firebase Window, or Atomic Score Pipeline.

## New runtime boundaries
- `src/core/ui-boundary.js` — registry for migrated tab/render hooks.
- `src/core/ui-boundary-install.js` — installs the final dispatcher after legacy modules register.
- `src/features/schedule/runtime.js` — Upgrade106 internal-scroll + Upgrade107 DOM-parent safety runtime owner.
- `src/features/umpire/runtime.js` — Umpire top-reset/scroll lifecycle owner.
- `src/features/live/runtime.js` — rear/front camera selector and camera-status runtime owner, compatible with Upgrade80 contract.

## Legacy runtime removed from Admin
The following source files remain packaged for audit/regression but are not in the Upgrade116 Admin bundle:
- `src/upgrade80.js`
- `src/upgrade106.js`
- `src/upgrade107.js`

Compatibility exports are preserved by feature runtimes:
- `window.TopkeyUpgrade80`
- `window.TopkeyUpgrade106`
- `window.TopkeyUpgrade107`

## Hook migration
`src/upgrade24.js`, `src/upgrade87.js`, and `src/upgrade111.js` now register migrated hooks with `TopkeyUIBoundary` when present and retain a legacy fallback for isolated audit/testing.

Runtime effect for the migrated group:
- `showTab`: U24 + U80 + U87 + U111 (4 independent wrappers) → one UI-boundary dispatcher for those hooks.
- Schedule `renderMatches`: U24 + U106 + U107 (3 independent wrappers) → one UI-boundary dispatcher for those hooks.
- U105 schedule-collapse/Fast Lane remains untouched and separate by design.

## Bundle measurements
- Upgrade115 Admin JS: 1,175,959 bytes.
- Upgrade116 Admin JS: 1,175,698 bytes.
- Upgrade115 active JS source entries: 86.
- Upgrade116 active JS source entries: 88 (explicit core/feature modules replace three monolithic legacy runtimes; source-entry count is not the optimization target).
- Admin CSS unchanged: 140,120 bytes.
- Viewer JS/CSS unchanged byte-for-byte.
- Replay/AI JS/CSS unchanged byte-for-byte.

## Sensitive invariants preserved byte-for-byte vs Upgrade115
17/17 checked:
1. root `firebase.database.rules.json`
2. root `firebase.storage.rules`
3. Badminton `firebase.database.rules.json`
4. Badminton `firebase.storage.rules`
5. `turn-config.json`
6. `edge-functions/api/turn-credentials.js`
7. `src/scoring.js`
8. `src/firebase.js`
9. `src/auth.js`
10. `src/app.js`
11. `src/upgrade88.js`
12. `src/upgrade101.js`
13. `src/core/data-runtime.js`
14. `src/upgrade105.js`
15. legacy `src/upgrade106.js`
16. legacy `src/upgrade107.js`
17. `src/upgrade113.js`

Viewer and Replay hashed assets were additionally compared byte-for-byte and are unchanged.

## QA
- Regression + VM: **57/57 PASS**.
- JavaScript syntax: **205/205 PASS**.
- JSON/webmanifest parse: **36/36 PASS**.
- Active HTML local assets missing: **0**.
- Service Worker precache: **10/10 PASS**.
- Bundle SHA/content-hash: **PASS**.
- Bundle source hashes: **PASS**.
- Bundle source order: **PASS**.
- Sensitive comparison: **17/17 PASS**.
- Chromium visual/browser smoke: **NOT-RUN** — headless Chromium timed out in this container with DBus/zygote environment errors and produced no DOM; not reported as PASS.

## Deployment
No Firebase Rules change is required for Upgrade116. Deploy the full site package, then open `reset-u116.html` once to clear old shell caches.

## Next roadmap step
Upgrade117 — Final production hardening / long-session soak: listener/timer leak audit, reconnect/offline recovery, repeated tab cycling, score/BLV/WebRTC soak, and deploy verification.
