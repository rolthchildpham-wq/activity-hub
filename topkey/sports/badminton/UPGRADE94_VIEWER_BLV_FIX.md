# Upgrade94 · Viewer BLV audio stability

Root cause fixed:
1. Public Viewer visible button `#tk88-public-unmute` only unmuted WebRTC video. Upgrade90 BLV engine listened to hidden `#tk89-viewer-audio`, so `S.enabled` stayed false.
2. Upgrade90 selected `App.currentCourt` / court_1 instead of the public Live court chosen by Upgrade88.
3. Viewer BLV depended on `commentary/<court>/latest`; Upgrade94 adds a score-change fallback from `activeMatches` after 700 ms when commentary is late/missing.

Upgrade94 behavior:
- Visible Public Viewer button now enables both Live audio and BLV TTS.
- One immediate spoken confirmation verifies the user gesture and device TTS path.
- Commentary listener rebinds to the actual Public Viewer court.
- `commentary/latest` remains primary; score fallback only speaks when no recent commentary has spoken.
- Existing WebRTC/TURN, anonymous signaling, UMPIRE scoring and Firebase rules are unchanged.
