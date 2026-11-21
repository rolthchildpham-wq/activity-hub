# H161 — Free mobile-only live streaming to TOPKEY Viewer using Twitch

## Why this path
The official Twitch mobile app can broadcast directly from a phone with no YouTube 50-subscriber threshold, no OBS computer and no TOPKEY media VPS. Twitch distributes video/audio; TOPKEY embeds the official Twitch player and continues displaying its own Firebase scores.

Official references:
- Twitch mobile broadcasting: https://help.twitch.tv/s/article/how-do-i-stream-faq
- Twitch video embedding: https://dev.twitch.tv/docs/embed/video-and-clips
- Embedding requirements and parent host: https://dev.twitch.tv/docs/embed

## One-phone operator procedure
1. Create or sign in to a Twitch account using the Twitch app on Android/iOS.
2. In authorized TOPKEY Live & BLV, select the appropriate football/volleyball court, enter the public Twitch channel name or channel URL, click **Gắn Twitch Live vào sân**. You can do this **before** going Live. Only a channel URL is saved to Firebase, never a Twitch stream key/password.
3. Switch to the Twitch app on the *same phone*, open the camera/IRL broadcasting feature, grant camera + microphone permissions, then Go Live.
4. From **another viewer device**, open the public TOPKEY Viewer. Tap Play/unmute on the embedded Twitch player. The game score continues via Firebase independently.
5. When the stream ends, use the normal TOPKEY operator controls to stop the stream source and prevent a stale LIVE badge.

IMPORTANT: Twitch requires the iframe `parent` hostname to match the embedding site. H161 reconstructs this from the current Viewer hostname, not a stale stored production/preview hostname. Twitch's documented minimum player size is 400×300 px; mobile layouts narrower than 400 px may fail Twitch policy or playback; test actual phones and consider a user-visible link-out for narrow screens.

## Limits
- Free Twitch distribution is a hosted third-party service and can add latency. Score and video are not synchronized at frame level.
- One phone broadcasting in the Twitch app generally cannot foreground TOPKEY to act as match referee without interrupting the camera live. For ongoing scoring, a second operator/device is recommended.
- The Twitch app broadcasts its own camera and microphone, *not* TOPKEY's browser camera; TOPKEY's device speech synthesis / neural BLV is NOT automatically transmitted to Twitch viewers.
- Twitch's service terms, account state and moderation/ads are independent of TOPKEY. Twitch embed requires HTTPS and a correct `parent` parameter.
- The built-in sports H154 WebRTC mode remains opt-in and disabled because the external SRS API is not configured; H161 uses existing EMBED and public Viewer paths.
- Do not mix new Twitch signaling with Firebase P2P: existing football/volleyball WebRTC RTDB rules currently require authenticated reader and writers; opening anonymous signaling would require a separate security-reviewed rules change.

## Test/release gates
- Source tests: `node --test topkey/tests/h161-twitch-mobile-live.test.cjs`.
- Re-run `python scripts/static_gate.py topkey` and existing sport/auth/QR regressions; test any relevant Firebase emulator permissions.
- Preview deploy a test branch to a real EdgeOne URL, check served commit SHA, loading of CSS/JS and no console failures.
- Verify anonymous Viewer on desktop and mobile with a real test Twitch channel, video+sound, page reload, switching court, offline state, no duplicate iframe, and role enforcement. Verify Twitch player dimensions at a minimum of 400×300 where embedded.
- Run TOPKEY full browser, role matrix and performance gates before asking production approval.
- Production is NOT live from this PR. Do not merge until release verification and approval.

## Rollback
Revert H161 changes to `topkey/sports/vnext/index.html`, `src/twitch-mobile-live-h161.js`, `twitch-mobile-live-h161.css`, `src/live-state-h143.js`, `src/public-viewer-h137.js` if required. Keep Firebase metadata, channel links, referee controls and account credentials untouched unless specifically approved for cleanup.
