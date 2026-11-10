# Upgrade100 Full Audit — Viewer Auto-Landscape + Fullscreen Cleanup

Baseline: Upgrade99.

## User-visible fix
- Public Viewer WebRTC track with portrait geometry (e.g. 720x1280) is auto-corrected inline to horizontal display when the physical live scene was shot landscape.
- Correction applies before fullscreen; fullscreen is not required to obtain the correct orientation.
- Corrected track uses `object-fit: cover` in the existing 16:9 Viewer player, removing the large left/right black bars caused by the sideways portrait-sized track.
- Manual `↻ Xoay hình` remains as fallback for reversed sensor metadata.
- Viewer no longer calls `screen.orientation.lock()`.
- Fullscreen is native-only. The old CSS fixed-position fullscreen fallback is removed.
- Exiting fullscreen removes fullscreen/body classes, overflow state and unlocks orientation defensively; the inline video correction remains active.
- Upgrade97 focus/visibility cleanup now yields to the newer Viewer fullscreen controller instead of unexpectedly exiting fullscreen.

## Preserved behavior
- Referee landscape readability/touch-size improvements from Upgrade98 remain.
- Upgrade99 MutationObserver freeze fix remains.
- Scoring, Upgrade88 WebRTC signaling, Upgrade94/96 BLV, Firebase Rules and TURN files are unchanged byte-for-byte.

## Verification
- Regression scripts: 25 PASS / 0 FAIL.
- Upgrade100 VM: PASS (720x1280 WebRTC auto-rotates inline; native fullscreen enters/exits; orientation lock calls = 0; inline rotation remains after exit).
- JavaScript syntax: PASS.
- JSON/webmanifest parse: PASS.
- Service Worker app-shell asset existence: PASS.
- Runtime bundle contains U100 contract and updated U97/U98 source: PASS.
- ZIP integrity: verified after packaging.
