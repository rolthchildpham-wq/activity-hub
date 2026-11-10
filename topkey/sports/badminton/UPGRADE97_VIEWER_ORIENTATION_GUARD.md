# Upgrade97 — Public Viewer Orientation Guard

Baseline: Upgrade96 Performance Safe + BLV Lifecycle.

Fixes only Public Viewer orientation/full-view behavior:
- entering `#spectator` releases any stale `screen.orientation` lock from previous Replay/fullscreen flows;
- the Public Viewer `⛶` button no longer calls native `requestFullscreen()`;
- it uses a fixed CSS full-view mode so Android/PWA does not get pushed into landscape by native fullscreen;
- Viewer does not call `screen.orientation.lock('landscape')`;
- Umpire Match Focus and Replay orientation behavior are unchanged;
- TURN, Firebase Rules, WebRTC, scoring and BLV lifecycle are unchanged.
