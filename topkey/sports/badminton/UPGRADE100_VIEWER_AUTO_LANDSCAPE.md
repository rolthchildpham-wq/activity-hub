# Upgrade100 — Viewer Auto-Landscape + Fullscreen Cleanup

- WebRTC portrait-sized track is auto-rotated 90° inline when the physical scene is expected horizontal.
- Rotated video uses object-fit: cover inside the existing 16:9 Viewer player to remove large side black bars.
- No screen.orientation.lock().
- Fullscreen is native only; no fixed CSS fallback.
- Exiting fullscreen resets fullscreen classes/overflow but preserves inline auto-correction.
- Manual rotate button remains as a fallback for reversed sensor metadata.
- Referee readability CSS from Upgrade98 is retained.
