# Upgrade122 Hotfix25 · Fullscreen Applause Offline

- Hide the legacy Crowd FX settings/testing card.
- Add one `👏` manual applause button to referee fullscreen for ADMIN and UMPIRE.
- Use packaged `assets/audio/applause-match.ogg` first; no network is required for playback.
- Keep all three applause OGG files in Service Worker precache and explicitly warm them on first online visit.
- Keep applause playback independent from BLV/Piper queue.
