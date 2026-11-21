# H157 — Official YouTube Live for TOPKEY Viewer

This integration uses public YouTube watch links plus the official embedded player. **No user password, RTMP stream key, or OAuth refresh token goes into TOPKEY Firebase.**

## Account activation — YouTube owner action
1. Sign in at https://studio.youtube.com/ using the channel-owning Google account.
2. Verify the channel and review eligibility: no live-streaming restrictions in the preceding 90 days. YouTube may need 24 hours to enable Live initially.
3. If streaming from the YouTube mobile app, check eligibility (at least 50 subscribers); alternatively use webcam or a supported encoder.
4. In YouTube Studio, choose Create -> Go Live. Start a public or unlisted broadcast and ensure embedding is allowed.
5. Copy only the public **watch** URL (`youtube.com/watch?v=...`, `youtube.com/live/...` or `youtu.be/...`). Do not copy the stream key or RTMP ingest URL.

## TOPKEY workflow
1. Log in as authorized TOPKEY Live operator, select **Trực tiếp & BLV** in football/volleyball.
2. In the YouTube Live panel choose the court, paste the public watch link, verify ID and click **Gắn Live vào sân đang chọn**.
3. Source changes to `EMBED`, reusing existing `app.applyStream()` and Firebase rules. Public Viewer displays the YouTube-nocookie embed while Firebase updates score separately.
4. Open the public Viewer on a second phone as a logged-out user and verify moving video, audible audio and correct match score. Embedded autoplay with sound is restricted by many mobile browsers; tap Play and unmute.

## Optional official channel connection via OAuth (read-only)
To connect and view the YouTube channel name from TOPKEY:
1. In **Google Cloud Console** create or select a project owned by your organization; enable **YouTube Data API v3**.
2. Configure the Google OAuth consent screen for permitted users and create an OAuth 2.0 **Web application** client ID.
3. Add the actual TOPKEY site domain (for example `https://topkey-activity-management.edgeone.dev`) to **Authorized JavaScript origins**. Add Preview domains individually when needed.
4. Set only the public `clientId` in `topkey/sports/vnext/youtube-oauth-h157.json`. Never commit a client secret or OAuth access/refresh token.
5. On the Live screen click **Kết nối Google (chỉ quyền đọc)** and grant the `youtube.readonly` permission in Google's official popup. The client reads `channels.list(mine=true)` and shows the channel title. Tokens stay in memory only.
6. This read-only authorization does **not** automatically go Live, record, update videos or validate the full channel eligibility. The owner must inspect the Live Control Room.

## Limitations
- YouTube Live is a third-party streaming service and commonly adds latency; the Firebase scoreboard may display changes ahead of the video. Do not claim real-time synchronization.
- YouTube Live **does not automatically stream camera/video inside TOPKEY**. Use YouTube app, webcam, OBS or supported encoder to send camera/mic to YouTube. Stream keys remain inside YouTube/encoder settings, not TOPKEY.
- On-device speechSynthesis BLV from TOPKEY is not automatically part of a separate YouTube camera stream. To broadcast commentary and overlay live score on YouTube, use an encoder that captures/composites those sources.
- No Google account is connected until the user uses the official Google consent dialog; no OAuth client exists in this PR. Public link embedding works without OAuth credentials.
- Do not merge or deploy production until regression tests, EdgeOne preview SHA, anonymous Viewer on desktop/mobile, role validation, Firebase gate and performance checks PASS.

## H159 — Direct camera to YouTube, without third-party streaming apps

1. In TOPKEY Live & BLV choose **Kiểm tra camera** to test the local phone/computer camera (no network upload). Stop preview to release the camera.
2. Choose **Phát camera bằng YouTube Studio**. On desktop Chrome/Edge open **Create → Go Live → Webcam**, grant YouTube Studio camera and microphone access, select the camera, then go Live. Only the YouTube browser tab streams camera to YouTube. TOPKEY does **not** capture and forward video via RTMP.
3. On mobile, use YouTube's official app to go live from the device camera, subject to YouTube's current mobile live eligibility. Desktop webcam mode and mobile app mode are separate official paths.
4. After starting, copy the YouTube watch URL (not the ingest URL or stream key), paste into TOPKEY and click **Gắn Live vào sân đang chọn**. Public TOPKEY Viewer will embed the YouTube player for the selected court, separate from Firebase scoreboard.
5. Switching Google accounts uses the official OAuth chooser only if a read-only OAuth Client ID is configured; switching the broadcast account in YouTube Studio/YouTube app is separate. Update the TOPKEY Viewer link explicitly after changing channels.

## Important technical limit
YouTube's official supported ingest methods include RTMP(S), HLS and DASH, not browser WebRTC/WHIP. Thus TOPKEY cannot send an already-captured browser MediaStream straight to YouTube with a simple JavaScript call, even if Google OAuth is connected. YouTube Studio Webcam avoids a VPS/encoder but originates the live stream **inside YouTube's own browser tab**. On-screen TOPKEY score overlays and synthesized BLV are **not** included in this YouTube Webcam stream unless an external compositor/encoder is used. No stream key is requested or stored in TOPKEY.
