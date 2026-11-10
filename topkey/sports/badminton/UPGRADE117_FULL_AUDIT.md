# TOPKEY Badminton Upgrade117 — Full Audit

## Purpose
Final planned **HOÀN THIỆN** production hardening release. No feature expansion. The release hardens boot/reconnect/queue lifecycles and locks long-session soak invariants after the 108–116 performance/consolidation roadmap.

## Production changes
- Added `src/core/production-hardening.js` (7.8 KB source).
- Data/Auth initialization is single-flight.
- Firebase/IndexedDB queue drain is serialized and concurrent flush triggers are coalesced.
- Resume/online recovery is coalesced and gated on ready + connected + authenticated state.
- Added listener-budget/self-check metrics in Health.
- Final runtime authority moved to Upgrade117 while retaining `CONSOLIDATED_RUNTIME_AUTHORITY_003` compatibility marker for previous contracts.

## Bundle impact
- Upgrade116 Admin JS: 1,175,698 bytes.
- Upgrade117 Admin JS: 1,183,746 bytes.
- Increase: 8,048 bytes for production hardening.
- Viewer JS remains 32,198 bytes byte-for-byte.
- Viewer CSS, Replay JS/CSS and Admin CSS remain byte-for-byte unchanged.
- Service Worker remains Viewer-first with 10 precached assets and does not precache Admin core.

## Regression / soak
- 61/61 regression + VM tests PASS.
- 100 resubscribe cycles + 1,200 tab changes: no owned-listener/hook growth.
- 500 atomic score/commentary actions: 500 underlying writes, pending map returns to zero.
- 100 concurrent queue flush requests: underlying drain max concurrency = 1.
- 40 Data init + 30 Auth init concurrent requests: one underlying init each.

## Sensitive preservation
18/18 sensitive source/config files are byte-for-byte identical to Upgrade116. Firebase Rules, TURN, scoring, WebRTC protocol, Viewer behavior and Replay assets were not modified.

## QA caveat
Chromium visual smoke: NOT-RUN because container Chromium timed out with DBus/zygote errors and emitted no DOM. All executable static/VM/regression/package checks passed.

## Deployment
Deploy the ZIP to EdgeOne Production and open `reset-u117.html` once. Firebase Rules do not need to be republished.
