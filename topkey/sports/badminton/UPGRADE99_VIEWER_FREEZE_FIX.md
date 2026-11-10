# Upgrade99 Viewer Freeze Fix

Root cause confirmed in Upgrade98: a MutationObserver watched `#public-spectator` childList and called `patchViewer()`. `patchViewer()` always changed fullscreen button `textContent`, creating another childList mutation. This could create an infinite microtask loop and starve Firebase/render callbacks, leaving the Viewer shell visible but Live/Schedule blank.

Fix:
- observer is one-shot and disconnects BEFORE patching;
- button text/title/aria writes are idempotent;
- U98 landscape + rotated portrait-track correction remains;
- U98 referee readability CSS remains;
- scoring, TURN, Rules, WebRTC and BLV lifecycle are unchanged.
