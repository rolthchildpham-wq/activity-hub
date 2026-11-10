# Upgrade118 Full Audit — Production Artifact Cleanup / Dependency Hygiene

## Root cause found during final production acceptance

Upgrade117 was functionally stable, but its lazy Replay/AI loader still referenced `assets/u116/...` while the current release was u117. The package therefore retained historical versioned asset directories. Those files were not part of normal Viewer boot, but they made the release artifact much larger and kept a hidden runtime dependency on an older release.

## Upgrade118 changes

- `src/upgrade111.js` now resolves Replay JS/CSS through `window.__TOPKEY_ASSETS`; it no longer hardcodes an older `uNNN` directory.
- `index.html` publishes the current hashed Admin/Viewer/Replay asset manifest used by route boot and feature lazy-load.
- Current versioned assets are rebuilt/copied to `assets/u118`.
- Historical versioned asset directories u96→u117 are removed from the deploy artifact. Shared `assets/audio` remains.
- Redundant exact old asset header rules are removed from `edgeone.json`; wildcard immutable asset caching remains.
- Service Worker cache/build/current Viewer asset references are moved to Upgrade118.
- Runtime authority/build metadata are moved to Upgrade118.
- No permission, Rules, scoring, TURN, WebRTC, BLV, Viewer data-path or tournament workflow change.

## Sensitive-file comparison against Upgrade117

**22/22 byte-identical** for the checked sensitive baseline, including:

- scoring.js
- firebase.js / auth.js / app.js
- FULL and Badminton Realtime Database Rules
- FULL and Badminton Storage Rules
- TURN config and Edge Function
- WebRTC Upgrade88 / signaling Upgrade101
- Fast Lane Upgrade105
- Atomic Score Upgrade113
- consolidated Data Runtime
- Schedule / Umpire / Live feature runtimes
- Viewer JS/CSS
- Replay JS/CSS

Only the feature loader/current build authority/deploy metadata and current Admin bundle containing those changed sources differ as intended.

## Acceptance status

See `PRODUCTION_ACCEPTANCE_REPORT.md` for the complete production-like browser and artifact test matrix.

Release decision: **GO**.
