# Upgrade115 — Consolidation Phase 2 Full Audit

Build: `upgrade115`  
Version: `2026.10.31-vnext-featureparity15-upgrade115-consolidation-phase2`  
Cache tag: `u115-20261031`

## Goal
Consolidate the authenticated Firebase listener/render runtime introduced by Upgrade102 and Upgrade103 into one core module without changing Firebase paths, scoring semantics, Rules, Viewer, TURN/WebRTC, BLV, or feature lazy loading.

## Runtime change
Admin bundle no longer executes:
- `src/upgrade102.js`
- `src/upgrade103.js`

They remain packaged for historical audit and their standalone regression tests still run.

Replacement:
- `src/core/data-runtime.js`

Compatibility exports retained:
- `window.TopkeyUpgrade102`
- `window.TopkeyUpgrade103`

This lets Upgrade105 Fast Lane and historical health/latency contracts continue to read the same state/metrics surface without re-executing the two legacy wrappers.

## Consolidated ownership
`core/data-runtime.js` now owns, in one place:
- authenticated core Firebase listeners;
- tab-scoped Finance / Audit / Registration / Commentary / Users listeners;
- child listener map updates;
- render coalescing;
- hidden/background render defer;
- active-tab relevance filtering;
- cached tab rendering after tab changes / visibility restore;
- passive score UI/Firebase latency metrics;
- legacy BLV poller retirement;
- one `App.showTab` data/runtime wrapper;
- one visibility lifecycle path.

Final build/version authority remains separate in:
- `src/core/runtime-authority.js`

## Measured consolidation
| Metric | Upgrade114 | Upgrade115 |
|---|---:|---:|
| Admin runtime JS sources | 87 | 86 |
| Admin JS bytes | 1,183,656 | 1,175,959 |
| Legacy U102+U103 source bytes | 18,532 | — |
| Consolidated data-runtime bytes | — | 10,938 |
| data/runtime `App.showTab` wrappers | 2 | 1 |
| data/runtime `setTimeout` occurrences | 13 | 4 |
| data/runtime lifecycle `addEventListener` occurrences | 3 | 2 |

The primary benefit is lifecycle simplification and fewer wrapper/race surfaces, not raw byte savings.

## Explicitly unchanged
Byte-for-byte / contract-preserved checks cover:
- `src/firebase.js`
- `src/scoring.js`
- Upgrade88 WebRTC
- Upgrade101 signaling resilience
- Upgrade105 Scoring Fast Lane
- Upgrade106 schedule scroll
- Upgrade107 DOM safety
- Upgrade111 feature lazy loading
- Upgrade113 Atomic Score Pipeline
- Viewer standalone JS/CSS lineage
- Replay/AI feature chunk lineage
- Realtime Database Rules
- Storage Rules
- TURN config

No Firebase Rules publication is required for Upgrade115.

## Regression coverage
All existing historical regression/VM tests continue to run. New Upgrade115 tests verify:
1. U102/U103 are absent from current Admin runtime sources.
2. `core/data-runtime.js` is present and owns the consolidated contract.
3. Viewer-only U92-U100 removals from Upgrade114 remain removed.
4. U101 broadcaster remains present.
5. One consolidated `showTab` wrapper owns data/runtime tab activation + cached rendering.
6. Hidden Firebase changes defer DOM work.
7. Inactive branches update state without rendering irrelevant tabs.
8. Finance attaches only when the Finance tab becomes active.
9. Local scoring render and Firebase SCORE latency metrics still work.
10. U102/U103 compatibility exports remain available.

## QA result
- Regression + VM: **55/55 PASS**
- JavaScript syntax: **195/195 PASS**
- JSON / webmanifest parse: **35/35 PASS**
- Current HTML local asset missing: **0**
- Service Worker precache: **10/10 present**
- Bundle content hash: **PASS**
- Bundle source order: **PASS**
- Rules/TURN unchanged vs Upgrade114: **PASS**
- Sensitive unchanged comparison: **20 files PASS**
- Browser visual smoke: **NOT-RUN** in this container; not reported as PASS.

## Next phase
Upgrade116 — Consolidation Phase 3: establish safer Schedule / Umpire / Live feature boundaries and reduce cross-feature wrappers while preserving score and broadcast contracts.
