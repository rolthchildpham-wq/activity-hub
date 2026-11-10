# Upgrade91 — Public Viewer no-login + F5 persistence

- `#spectator` never shows the login screen.
- Firebase Anonymous Auth is used silently only to obtain a per-device UID for WebRTC signaling.
- Refresh/F5 stays on the Viewer surface.
- Anonymous Viewer may read WebRTC signaling and write only its own request/candidates/answer; it cannot broadcast.

## REQUIRED ONCE
Firebase Console → Authentication → Sign-in method → Anonymous → Enable.

## RULES
Publish the root `firebase.database.rules.json` from this package.
