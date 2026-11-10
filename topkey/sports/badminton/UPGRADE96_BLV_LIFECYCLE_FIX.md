# Upgrade96 — Performance Safe + Viewer BLV Lifecycle Fix

Fixes a production runtime bug discovered after Upgrade95: enabling Viewer BLV could replay an existing `commentary/<court>/latest` row and could also set the legacy global `App.audioUnlocked`, allowing the older BTC Local BLV engine to become active on Viewer.

## Changes
- Viewer BLV no longer sets `App.audioUnlocked`.
- Initial/rebind Firebase `latest` snapshots are baseline-only and never spoken.
- Dedupe is tracked per court.
- Switching courts cannot replay old commentary.
- Only fresh commentary rows speak.
- Existing 700 ms score fallback remains.
- TURN, WebRTC, scoring and Firebase Rules are unchanged.
