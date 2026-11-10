# Upgrade95 Performance Safe — Full Audit

Baseline: user-selected Upgrade94 A.

## Changes
- Preserved all Upgrade94 source files and source order.
- Combined 68 local CSS files into one content-hashed CSS bundle.
- Combined 90 application JS files into one content-hashed JS bundle; upgrade73-preboot stays separate.
- Moved Firebase/QRCode CDN scripts from HEAD to end of BODY before app bundle, allowing HTML/body first paint without blocking on CDN JS.
- Added preconnect for gstatic/cdnjs.
- Service Worker precache reduced from 196 assets to 11 shell/audio assets.
- Content-hashed JS/CSS use cache-first; HTML/build/sw stay network-first/no-store.
- Firebase Rules, TURN config, TURN Edge Function, scoring, WebRTC protocol and Upgrade94 BLV logic are intentionally unchanged.

## Bundle files
- JS: ./assets/u95/app.ea8bc3b0934e.js
- CSS: ./assets/u95/app.db873769a563.css

## Safety principle
Upgrade95 is request/cache consolidation, not behavior refactoring. Original sources remain in package for regression/audit.
