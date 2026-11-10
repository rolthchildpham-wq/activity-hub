# TOPKEY Upgrade97 — Viewer Orientation Guard Full Audit

## Why Upgrade96 regressed
The Upgrade95/96 performance bundle faithfully preserved the selected production baseline. That baseline still contained the old Upgrade88 Public Viewer fullscreen handler using `stage.requestFullscreen()`. The orientation fix was therefore not represented as a final protected contract in that baseline, so Android/PWA could rotate the Viewer again when native fullscreen was entered.

## Upgrade97 fix
- Public Viewer `#spectator` releases a stale `screen.orientation` lock when entering/resuming Viewer.
- The Public Viewer `#tk88-public-full` click is captured before Upgrade88's old target handler.
- Viewer large mode uses a fixed CSS viewport (`tk97-public-viewer-focus`) instead of native fullscreen.
- Upgrade97 never calls `screen.orientation.lock('landscape')`.
- Leaving Viewer removes the CSS large-view state.

## Explicitly unchanged
- Scoring source and Firebase write flow.
- Full and Badminton Firebase Rules.
- Cloudflare TURN config and Edge Function.
- Upgrade88 WebRTC/shared-camera source.
- Upgrade94 Viewer BLV source.
- Upgrade96 BLV stale-snapshot/lifecycle source.
- Upgrade82 Replay orientation/fullscreen behavior.
- Umpire Match Focus/fullscreen behavior.

## Validation
- 24/24 regression tests pass.
- 122 JavaScript files pass syntax validation.
- 10 JSON/webmanifest files parse.
- Service Worker has 11 valid precache assets.
- U97 hashed JS/CSS bundles are active and configured immutable in EdgeOne.
- Dynamic Viewer test proves the large-view click results in zero native `requestFullscreen()` calls.

## Release contract
`PUBLIC_VIEWER_ORIENTATION_GUARD_U97`: Public Viewer must never force landscape or invoke native fullscreen from its large-view button. Replay and Umpire retain their independent orientation/fullscreen controllers.
