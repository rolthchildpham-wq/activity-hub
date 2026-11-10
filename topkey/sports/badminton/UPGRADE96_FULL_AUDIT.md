# Upgrade96 Full Audit — Performance Safe + Viewer BLV Lifecycle

## Production bug reproduced
Upgrade95 could speak the current historical `commentary/<court>/latest` row immediately after Viewer audio enable. It also set `App.audioUnlocked=true`, which belongs to the legacy BTC Local BLV engine and could activate a second TTS path on Viewer.

Reproduction result:
- U95: test phrase + stale historical phrase; `App.audioUnlocked=true`.
- U96: test phrase only; stale historical phrase = 0; `App.audioUnlocked=false`.

## Fix
- Viewer BLV is isolated from legacy BTC audio state.
- Initial Firebase value callback after bind/rebind is treated only as baseline.
- `lastSeenByCourt` and `lastSpokenByCourt` prevent cross-court/rebind replay.
- Only a fresh row after baseline may speak.
- 700 ms score fallback remains unchanged.

## Performance Safe preserved
- 1 CSS bundle + 1 application JS bundle + preboot helper.
- Service Worker precache remains 11 assets.
- Content-hashed immutable bundles.
- Firebase Rules, TURN credential endpoint/config, scoring and shared-camera WebRTC unchanged.

## Final verification
- Regression: 23/23 PASS.
- JavaScript syntax: 145/145 PASS.
- JSON parse: 13/13 PASS.
- Bundle source/hash/order: PASS (91 JS sources, 68 CSS sources).
- SW assets: 11/11 exist.
- HTML local refs: PASS.
- ZIP integrity: verified after packaging.
