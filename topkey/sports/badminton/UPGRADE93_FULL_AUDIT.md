# Upgrade93 Full Audit

## Root causes fixed
1. Public `#spectator` was hidden while `App.init()` awaited Firebase Auth. If Auth restore/anonymous stalled, both Login and Viewer were hidden -> blank screen.
2. Upgrade92 `MutationObserver` watched `data-topkey-build` while `enforceVersion()` rewrote that same attribute, allowing a self-triggering mutation loop.
3. `reset-u92.html` only unregistered the Badminton-scoped Service Worker; Sports Hub also owns a root-scoped `/` Service Worker.
4. Legacy reset had no visible manual fallback link.

## Upgrade93 changes
- First-paint CSS forces `#public-spectator` visible whenever URL is `#spectator`.
- Public App init renders before Auth and does not await Auth; Anonymous Auth runs in background for WebRTC signaling only.
- Upgrade92 final authority is disabled automatically when boot build > 92.
- Upgrade93 final authority avoids attribute self-observation.
- `reset-u93.html` unregisters all same-origin Service Workers and deletes TOPKEY shell caches while preserving Piper/crowd runtime caches.
- `reset-u92.html` is a compatibility alias to the Upgrade93 reset behavior.
- Root Sports Hub SW/cache tag is bumped to Upgrade93 so a root-scoped legacy worker cannot remain stale after a clean deployment.
- Existing Cloudflare TURN, Viewer local BLV, shared-camera WebRTC, UMPIRE rules and previous features are preserved.
