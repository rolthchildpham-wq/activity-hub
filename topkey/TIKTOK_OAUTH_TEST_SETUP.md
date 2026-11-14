# TOPKEY Vlog TikTok 2026 — Test consent & sync (staging only)

## What is implemented
- ADMIN/BTC scoped to DIY can save a TikTok URL and open the "Kết nối chủ video" flow.
- The creator logs in to TikTok, consents to `video.list`, and the callback verifies that the video actually belongs to their account.
- Approved `/v2/video/query/` returns `view_count`, `like_count`, `share_count`. Firestore is **not** used; RTDB writes updated numbers under `topkey_handmade_vnext_2026/vlog2026/entries`. The existing weighted scoreboard updates through Firebase listeners.
- A callable "Đồng bộ" and a scheduler every six hours refresh only videos with valid stored consent.
- TikTok access/refresh tokens are kept under a private RTDB root `_topkey_private/tiktok2026`. Versioned client RTDB rules deny access to this root. No secrets in EdgeOne HTML.

## External prerequisites — not yet deployed or verified
1. Register a TikTok Developer application (https://developers.tiktok.com/). Add **Login Kit** and **Display API**, request `video.list` scope, and configure the HTTPS redirect URI. The app may need review/approval. Videos used in the pilot must belong to the consenting TikTok account.
2. Enable Firebase Functions (2nd gen), Cloud Scheduler and appropriate billing on project `topkey-badminton`. Billing might be required; do **not** enable or upgrade paid services without owner approval.
3. Choose the exact callback URL **only after** deploying `tiktokCreatorCallback` in region `asia-southeast1`. Register that URL in TikTok Login Kit. Do not use a temporary EdgeOne deployment domain as OAuth callback.
4. Store `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` and `TIKTOK_REDIRECT_URI` using Firebase Functions secrets (not GitHub commits, chat or HTML). The redirect must exactly match TikTok registration.
5. Use `topkey/firebase.tiktok.functions.json` as **isolated** CLI config to deploy only this codebase. Example (operator review required):
   `cd topkey && firebase deploy --project topkey-badminton --config firebase.tiktok.functions.json --only functions:vlog-tiktok`
   **Do not** deploy production database rules from this branch without passing emulator role matrix.
6. Make sure `topkey_handmade_vnext_2026/vlog2026` has the versioned read/write rules for PUBLIC viewer, ADMIN and BTC with `sportScope=handmade`. These rules are in the candidate branch, not confirmed deployed.
7. Allow the preview EdgeOne hostname in Google Cloud API key Website restrictions and in Firebase Authentication Authorized domains for Firebase login; the TikTok callback itself has a separate fixed HTTPS URL.

## Safe smoke test (staging dataset)
1. As an authorized TOPKEY ADMIN, open the Vlog preview. Avoid real participant data for tests.
2. Save a trial entry with a full public link in form `https://www.tiktok.com/@handle/video/1234567890123456789`.
3. Choose "Kết nối chủ video"; a TikTok authorization URL is copied. Give that link to the **owner of that TikTok video**; they authorize scope `video.list`.
4. On callback success, refresh the Vlog board; verify `source=tiktok_api`, `lastSyncedAt` and counts match TikTok (numbers may lag and may differ by display rounding).
5. From ADMIN choose "Đồng bộ"; check RTDB values and weighted scoreboard, and confirm BTC for a different sport is denied.
6. Revoke TikTok consent and verify expired tokens fail safely. No fake/scraped numbers should be written.

## Known limitations
- Merely pasting a TikTok URL does **not** grant API access for that video. The creator must authorize and video.list must be available to the app.
- No direct API permission exists to query arbitrary creator videos through the standard Display API.
- TikTok Developer permissions, Firebase Functions deployment and live OAuth have not been validated.
- This branch must not be merged to `main` or deployed to TOPKEY production without the release gate.
