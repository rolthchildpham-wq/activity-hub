# TOPKEY Upgrade114 — Consolidation Phase 1

## What changed
Upgrade114 begins the long-term `core/ + features/` consolidation without changing scoring/Firebase/TURN/WebRTC behavior.

- Admin JS runtime sources: **95 → 87**.
- Admin JS bytes: **1,225,025 → 1,183,656**.
- Admin CSS sources: **68 → 67**.
- Admin CSS bytes: **141,848 → 140,120**.
- Removed from Admin execution: `upgrade92.js`, `upgrade93.js`, `upgrade94.js`, `upgrade95.js`, `upgrade96.js`, `upgrade97.js`, `upgrade98.js`, `upgrade99.js`, `upgrade100.js`.
- Legacy files remain packaged for audit/regression only.
- Added `src/core/runtime-authority.js` as the single final Upgrade114 build/version/server authority.

## Runtime noise removed
The nine removed Viewer-only wrappers contained approximately:
- 53 `setTimeout()` sites
- 29 `addEventListener()` sites
- 4 `MutationObserver` sites
- 43,690 bytes of JS source

Those wrappers no longer execute in Admin after Viewer Minimal Boot owns public Viewer behavior.

## Critical retained behavior
- `upgrade98.css` remains because it contains referee landscape readability rules.
- `upgrade101.js` remains for BTC WebRTC broadcaster/signaling resilience.
- U102/U103/U105/U106/U107/U111/U113 remain for Firebase latency, runtime stability, Scoring Fast Lane, schedule UX, feature lazy-loading and Atomic Score Pipeline.
- Viewer bundle is byte-identical to Upgrade113.
- Firebase Rules, scoring.js, TURN and WebRTC/BLV critical sources are unchanged.

## QA
- Regression + VM: **53/53 PASS**
- JavaScript syntax: **215/215 PASS**
- JSON/webmanifest: **30/30 PASS**
- Service Worker precache: **10/10 PASS**
- Sensitive byte-for-byte checks: **16/16 PASS**
- HTML active local asset references missing: **0**

## Next
Upgrade115 — Consolidation Phase 2: migrate data/runtime wrappers toward core modules while preserving paths and regression contracts.
