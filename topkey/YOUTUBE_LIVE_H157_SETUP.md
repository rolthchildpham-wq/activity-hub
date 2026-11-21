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

## H158 — Live Now mobile production and switching YouTube accounts

- Live Now is a third-party **mobile app**, not an embeddable web SDK. Use https://livenow.one/ to install it, select a supported YouTube destination, start the eligible YouTube Live, then copy its public watch link into TOPKEY. TOPKEY Viewer plays YouTube (not the Live Now UI).
- Live Now officially supports a **URL Overlay** inside its video production: https://livenow.one/docs/how-to/live-sports/add-a-url-overlay-to-a-live-stream/. You can configure a public TOPKEY URL there as an overlay, but displaying the full Viewer screen may be too busy; a dedicated scoreboard-only URL requires separate design/test and is not claimed implemented by H158.
- The H158 TOPKEY button **Đổi tài khoản YouTube** opens the Google identity account chooser through `youtube.readonly`, revoking the previous in-memory access token when present. It clears the draft link, **not** the already published court stream; updating the public Viewer source requires pasting and saving the new channel's actual video URL.
- Switching Google accounts inside TOPKEY is separate from switching the YouTube destination inside Live Now. To change the broadcasting account in Live Now, use its supported YouTube account logout/reconnect workflow. Google credentials are never exchanged between Live Now and TOPKEY.
- OAuth connection in TOPKEY requires an organization-owned Google Cloud OAuth Web Client ID in `youtube-oauth-h157.json`. If the ID is blank, public YouTube links still work without account authorization, but the TOPKEY account switch option cannot execute.
- Free and paid features differ in Live Now. Multistream and advanced sports overlays may require a paid tier; verify on the user's app before promising those features.
