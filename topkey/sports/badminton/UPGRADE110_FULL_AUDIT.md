# Upgrade110 — Admin Login Boot Guard

Root cause: Upgrade109 dynamically loaded the Admin bundle after Firebase/CDN dependencies. `app.js` registered only a `DOMContentLoaded` listener. If the event had already fired, `App.init()` never executed, so login form lacked `preventDefault()` and native GET submission placed credentials in the query string and reloaded repeatedly.

Fixes:
- readyState-safe idempotent `bootTopkeyAdmin()`
- early capture-phase login submit guard
- automatic removal of `email` and `password` query parameters via `history.replaceState`
- pending submit is replayed only after `topkey:admin-ready`
- Viewer Minimal Boot remains unchanged

Build: upgrade110

## QA
- 45/45 regression + VM PASS
- 192/192 JS syntax PASS
- 26/26 JSON/webmanifest PASS
- 0 HTML local asset missing
- 10/10 SW precache assets present
- Viewer bundle byte-for-byte unchanged from Upgrade109
- Scoring/Rules/TURN/WebRTC/BLV/Fast Lane sensitive files unchanged
