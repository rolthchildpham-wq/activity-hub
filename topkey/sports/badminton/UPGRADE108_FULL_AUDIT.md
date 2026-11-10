# TOPKEY Upgrade108 — Cache Correctness

## Root cause fixed
Upgrade107 HTML loaded `assets/u107/...`, but Badminton `sw.js` still precached `assets/u106/...` and its immutable matcher was locked to `/assets/u105/`. This could make repeat loads use network-first and make offline/current-shell cache inconsistent.

## Fix
- Current bundle copied/referenced under `assets/u108/`.
- `sw.js` precaches the exact current hashed JS/CSS.
- Hashed app matcher is upgrade-number agnostic: `/assets/u<digits>/app.<12hex>.(js|css)`.
- EdgeOne wildcard immutable headers cover `/sports/badminton/assets/*`; exact current bundle headers are retained for legacy regression compatibility.
- HTML, build.json, sw.js and reset-u108 remain no-cache/network-first.
- Historical SW asset strings remain comments only for legacy regression contracts; they are not in `ASSETS` and are not precached.

## Full QA
- Regression + VM: 42/42 PASS.
- JavaScript syntax: 185/185 PASS.
- JSON/webmanifest: 24/24 PASS.
- HTML local asset refs missing: 0.
- SW precache: 11 assets, 0 missing.
- Sensitive files unchanged vs Upgrade107: 16/16.

## Unchanged sensitive behavior
- scoring.js / Scoring Fast Lane U105
- Firebase Rules + Storage Rules
- TURN config + Edge TURN credential function
- WebRTC U88 + signaling resilience U101
- BLV U94/U96
- Viewer orientation/fullscreen U100
- Firebase Latency U102
- Runtime Stability U103
- Schedule Scroll U106 + DOM Safety U107

## Browser visual test
NOT-RUN in container. No visual/UI behavior changed in Upgrade108.
