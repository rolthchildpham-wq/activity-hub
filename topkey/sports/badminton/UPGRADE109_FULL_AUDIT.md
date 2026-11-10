# TOPKEY Upgrade109 — Viewer Minimal Boot

## Route split
Public `#spectator` loads:
- Firebase App/Auth/Database compat
- `viewer.6dbec66a2de5.css`
- `viewer.f2f8c43ed628.js`

It does NOT load Firebase Storage, QRCode, Upgrade73 Admin preboot, or `admin.60e6fa2dbc89.js`.

Protected/Admin route loads the full existing application and Storage/QR as before.

## Size
- Viewer JS: 28536 bytes
- Viewer CSS: 6108 bytes
- Admin JS: 1268822 bytes
- Admin CSS: 152252 bytes

## Preserved Viewer contracts
- no-login public first paint
- anonymous auth for WebRTC signaling
- TURN credentials endpoint + fallback config
- HLS/YouTube/WebRTC
- BLV commentary/latest + 700 ms score fallback
- announcement chip/modal
- 16:9 player, portrait-track auto correction, native fullscreen cleanup
- schedule/BXH/search/collapse/internal scroll

No Firebase Rules, TURN function, scoring or Admin business logic changed.

## Final QA
- Regression + VM: 44/44 PASS
- JS syntax: 189/189 PASS
- JSON/webmanifest: 28/28 PASS
- SW assets: 10/10 present
- Viewer JS reduction vs protected Admin JS: 97.7%
- Viewer CSS reduction vs protected Admin CSS: 96.0%
- Viewer bundle is loaded before Firebase CDN, so first paint is not blocked by Auth/Database SDK download.
- Admin bundle is not in Viewer-first SW precache.
