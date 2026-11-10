# Upgrade94 applied to the user-supplied Upgrade93 baseline

Baseline: `Topkey_Sports_Hub_VNext_2026_Upgrade93_PublicViewer_Stability_FULLTEST-20261030T074056Z-1-001.zip`

Implemented requirements:
1. Public Viewer button shows `🔊 Bật tiếng + BLV`.
2. One click unmutes Live audio and enables Viewer TTS BLV.
3. One click speaks: `Âm thanh bình luận tỷ số đã bật.`
4. Viewer BLV follows the court actually being watched.
5. `commentary/<court>/latest` remains the primary commentary source.
6. `activeMatches` score changes provide a ~700 ms fallback narration if commentary is delayed/missing.
7. Viewer does not call `getUserMedia`; no Viewer camera/microphone is opened by Upgrade94.
8. TURN configuration and Firebase Rules are intentionally unchanged from the attached Upgrade93 baseline.
