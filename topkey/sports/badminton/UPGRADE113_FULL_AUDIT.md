# TOPKEY Upgrade113 — Atomic Score Pipeline

## Goal
Reduce score→Viewer→BLV race by merging the positive SCORE state, event log and commentary/latest into one Firebase multi-location update while preserving local optimistic UI and local BLV.

## Implementation
- Does not replace `App.score()` or legacy scoring wrappers.
- Intercepts the Data layer only.
- A positive `POINT_AWARDED` SCORE is held for the remainder of the same JavaScript turn.
- The existing Upgrade48 local BLV still composes/enqueues speech immediately.
- When `commentary/<court>/latest` is produced in that same turn, its update is merged into the pending SCORE payload.
- Upgrade105 Fast Lane then owns the single Firebase direct update / IndexedDB fallback.
- `POINT_CORRECTED` and score paths without commentary are not delayed.
- Commentary outside a pending score uses its existing path.

## Atomic write shape
```text
activeMatches/<court>
events/<court>/<eventId>
commentary/<court>/latest
```
These paths are sent by one underlying SCORE `queueMulti()` call when commentary is available.

## Safety
- Firebase Rules unchanged from Upgrade112.
- TURN/WebRTC unchanged.
- Scoring engine unchanged.
- Upgrade105 ordering/offline fallback remains authoritative.
- Viewer Firebase Window remains unchanged apart from build identity.

## QA
- Regression + VM: 51/51 PASS
- JavaScript syntax: 183/183 PASS
- JSON/webmanifest: 29/29 PASS
- HTML missing assets: 0
- SW precache: 10/10 present
- Sensitive unchanged vs U112: 15/15
- ZIP integrity: PASS

## Dynamic atomic checks
- POINT_AWARDED + commentary → one underlying write with activeMatches + event + commentary: PASS
- POINT_CORRECTED → no commentary wait: PASS
- Non-score commentary → legacy path preserved: PASS

Visual browser/device test: NOT-RUN in container.
