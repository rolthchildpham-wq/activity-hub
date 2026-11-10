# Upgrade122 Hotfix29 — Commentary Coalesce / Manual-only Score Voice

- Score taps (+1/-1) never enqueue or speak SCORE/BIG_LEAD/STREAK/LEAD_CHANGE/DEUCE/GAME_POINT/MATCH_POINT/COMEBACK commentary for ADMIN/UMPIRE.
- Any stale score commentary queued or currently playing is cancelled when a new point is entered.
- The `🎙 Tỷ số` button is re-bound to one clean handler and speaks only the latest score after a short 550 ms quiet window.
- Repeated presses with the same score within 1.8 seconds are ignored.
- Fun commentary and applause remain manual and independent.
