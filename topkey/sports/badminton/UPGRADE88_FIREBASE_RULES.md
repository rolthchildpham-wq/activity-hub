# Upgrade88 · Firebase Realtime Database Rules for secure Viewer WebRTC

Upgrade88 adds a real viewer path for Local Camera/WebRTC. WebRTC signaling needs the Viewer to write its own `request`, `viewerCandidates` and `answer`; Upgrade87 rules allowed Viewer reads but not those writes.

## Required one-time deploy
1. Open Firebase Console for project `topkey-badminton`.
2. Realtime Database -> Rules.
3. Replace/publish the rules from this package: `sports/badminton/firebase.database.rules.json`.
4. Keep Email/Password authentication enabled. VIEWER/LIVE_ONLY accounts remain authenticated accounts; Upgrade88 does **not** make WebRTC signaling public/anonymous.

## Security scope
- `webrtc/$courtId/broadcast`: write only ADMIN / live-edit / legacy UMPIRE broadcaster.
- `webrtc/$courtId/sessions`: broadcaster may clear/manage sessions.
- Viewer session `request`: authenticated live-view user may write only when `request.uid === auth.uid`.
- `viewerCandidates` and `answer`: authenticated live-view user may write only when the stored session `request.uid === auth.uid`.
- `offer` and `broadcasterCandidates`: broadcaster/edit only.
- Unauthenticated public `#spectator` can still watch HLS/YouTube when those public URLs are configured, but Camera/WebRTC intentionally asks for a VIEWER login instead of opening Firebase signaling writes to the internet.
