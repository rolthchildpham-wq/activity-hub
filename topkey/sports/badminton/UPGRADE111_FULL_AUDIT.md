# Upgrade111 — Feature Code Splitting

## What is actually split
- Viewer remains a separate minimal route bundle.
- Admin core: `admin-core.c1ac5ff4541f.js` (1219446 bytes JS), `admin-core.c2532571daf9.css` (142052 bytes CSS).
- Replay/AI Live feature: `feature-replay.fe7f71fb1812.js` (55849 bytes JS), `feature-replay.066a639d1526.css` (10600 bytes CSS), loaded on first Live tab entry.
- Firebase Storage SDK is no longer loaded at admin boot; it loads on finance/settings/upload demand.
- QRCode library is no longer loaded at admin boot; it loads on Teams/registration demand.
- JSZip remains lazy for finance ZIP export.

## Deliberately not split yet
Finance and Scheduler business logic remain inside admin core because they are still intertwined with `app.js` and multiple historical upgrade wrappers. Forcing those out in U111 would create a high regression risk. They are reserved for the final consolidation/module-boundary work.

## Safety
- WebRTC Upgrade88 remains in core and uses replay compatibility proxies until the Replay feature chunk loads.
- Firebase Rules, TURN, scoring semantics and Viewer bundle are unchanged.

## QA result
- 49/49 regression + VM tests PASS.
- 200/200 JavaScript syntax checks PASS.
- 30/30 JSON/webmanifest parse checks PASS.
- 10/10 Service Worker precache assets exist.
- 17/17 sensitive files match Upgrade110 byte-for-byte; `firebase.js` is the intentional exception to make Storage lazy.
- Visual browser/device smoke test: NOT-RUN in container.
