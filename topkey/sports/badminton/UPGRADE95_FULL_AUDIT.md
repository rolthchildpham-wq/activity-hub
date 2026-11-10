# Upgrade95 — Performance Safe FULL AUDIT

## Baseline
User-selected Upgrade94 A: `Topkey_Sports_Hub_VNext_2026_Upgrade94_Viewer_BLV_Audio_FROM_ATTACHED_U93_FULLTEST.zip`.

## What changed
- 68 local CSS files are concatenated in original order into `assets/u95/app.db873769a563.css`.
- 89 prior application JS sources + `src/upgrade95.js` are concatenated in exact original order into `assets/u95/app.ea8bc3b0934e.js`.
- `src/upgrade73-preboot.js` stays separate so its existing SW registration coalescer runs before the app bundle.
- Firebase App/Auth/Database/Storage and QRCode CDN scripts were moved from `<head>` to the end of `<body>` before application execution. This allows the HTML body to parse/paint without waiting for CDN JavaScript.
- Preconnect hints were added for gstatic and cdnjs.
- Badminton Service Worker precache was reduced from 196 entries to 11 essential shell/audio assets.
- Content-hashed JS/CSS use cache-first, while navigation/index/build/sw remain network-first/no-store.
- EdgeOne headers mark the two U95 hash bundles as `public, max-age=31536000, immutable`.

## Measured static request structure
| Metric | Upgrade94 A | Upgrade95 | Change |
|---|---:|---:|---:|
| Local CSS tags | 68 | 1 | -67 |
| Local JS tags | 90 | 2 | -88 |
| CDN JS in HEAD | 5 | 0 | -5 blocking scripts |
| SW precache entries | 196 | 11 | -185 |

The local CSS+JS tag count therefore falls from 158 to 3. This does **not** mean JavaScript compute work is 98% lower; U95 intentionally preserves the same behavior code. It primarily removes request waterfalls, stylesheet/script startup overhead and oversized precache installation work.

## Intentionally unchanged
- Firebase Database Rules
- Cloudflare TURN config and Edge credential endpoint
- Scoring logic and IndexedDB queue
- WebRTC signaling/protocol and shared-camera source
- Upgrade94 Viewer BLV/TTS logic
- Umpire permission/self-claim behavior
- Replay/AI behavior

## Validation
- 22/22 regressions PASS.
- 143/143 JavaScript syntax checks PASS.
- 16/16 JSON/webmanifest parse checks PASS.
- All HTML local refs exist.
- 11/11 SW precache assets exist.
- U95 bundle manifest verifies every original source SHA256 and execution order.

## Scope decision
Admin-only tree-shaking was deliberately deferred because Upgrade95 is the safe consolidation release. Removing legacy modules from Viewer execution should be a separate release with browser-level route tests, not mixed with this cache/request migration.
