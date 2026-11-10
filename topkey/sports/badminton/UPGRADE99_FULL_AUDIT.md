# Upgrade99 — Viewer Freeze Fix — Full Audit

Baseline: Upgrade98 Referee Readable + Viewer Landscape Live.

## Production bug reproduced from Upgrade98
Upgrade98 attached a `MutationObserver` to `#public-spectator` with `childList:true, subtree:true` and called `patchViewer()` for every mutation. `patchViewer()` called `applyFullscreenState()`, which unconditionally rewrote fullscreen-button `textContent`. That write itself creates another child-list mutation, so the observer could re-enter continuously in the microtask queue. Result: the static public Viewer shell could paint, while Firebase callbacks / Live / Schedule rendering became starved and appeared frozen/blank.

## Upgrade99 fix
- Replaced the recursive observer with a one-shot observer.
- Observer waits only until `#tk88-public-full` exists.
- It disconnects **before** any DOM mutation/patching.
- Fullscreen and rotate button text/title writes are idempotent (`write only when changed`).
- Keeps Upgrade98 Viewer landscape behavior, portrait-track 90° correction, manual rotate button and referee readability CSS.
- Adds Upgrade99 final build authority only; it does not modify public data rendering, scoring, signaling or BLV.

## Sensitive components unchanged byte-for-byte from Upgrade98
- `src/scoring.js`
- `src/upgrade88.js` (WebRTC / public Live transport)
- `src/upgrade94.js` (Viewer BLV)
- `src/upgrade96.js` (BLV lifecycle)
- Badminton Firebase Rules
- Full Firebase Rules
- TURN config
- Edge TURN credential function

## Validation
- Regression tests: 27/27 PASS
- Upgrade99 VM lifecycle test: PASS (observer disconnected before fullscreen text mutation)
- JavaScript syntax: 154 files PASS
- JSON/webmanifest parse: 19 PASS
- HTML local asset refs: 0 missing
- Service Worker precache: 11/11 existing
- ZIP integrity: PASS

Chromium visual-headless is not counted as PASS because this container's Chromium/DBus environment can hang; the targeted VM lifecycle regression directly tests the production freeze mechanism instead.
