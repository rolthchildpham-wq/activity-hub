# TOPKEY Upgrade106 — Schedule Internal Scroll UX

## Why
Upgrade105 collapse/expand worked, but expanding the Admin/Public schedule still stretched the whole page. The operator still had to scroll a long page before reaching standings.

## Change
- Admin schedule table uses a bounded internal scroll region (`max-height: min(64vh, 680px)`).
- Public schedule cards use a bounded internal vertical scroll region.
- Desktop scrollbars are styled and visible on supported browsers.
- Admin column header remains sticky while scrolling.
- Public date header remains sticky while scrolling.
- Mobile max-height is reduced to 58vh.
- Upgrade105 collapse/expand and localStorage persistence remain unchanged.

## Safety
No changes to scoring semantics, Fast Lane, Firebase Rules, TURN, WebRTC, BLV, Upgrade102 Firebase Latency, or Upgrade103 Runtime Stability.

## Validation
- Regression/VM: 39/39 PASS
- JS syntax: 155/155 PASS
- JSON/webmanifest: 25/25 PASS
- SW precache assets: 11/11 PASS
- Sensitive source hashes unchanged vs Upgrade105: PASS
- Chromium visual smoke: NOT-RUN because headless Chromium timed out in this container.
