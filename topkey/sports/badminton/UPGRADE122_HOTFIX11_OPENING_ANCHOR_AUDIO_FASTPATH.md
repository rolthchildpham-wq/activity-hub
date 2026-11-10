# Upgrade122 Hotfix11 — Opening Anchor Persistence + Audio Fast Path

- Mirror immutable Set-1 opening-server ledger to both `activeMatches/<court>` and `matches/<matchId>`.
- Restore opening-server ledger from the durable match mirror when a LIVE umpire session is rebuilt/reloaded.
- Remove blocking audio activation from the +1 scoring critical path.
- Warm local/Piper voice after login/start and prime media from real user gestures.
- Add 260 ms local score-commentary fallback if the legacy BLV queue did not start speaking.
- Fun commentary uses a direct local audio path and reports success only when playback actually starts.
- Suppress repeated per-point audio-activation dependency/toast path.
