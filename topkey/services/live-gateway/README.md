# H154 – TOPKEY WebRTC + neural BLV

**Status:** Source integration only. No VPS, DNS, credentials, paid plan, EdgeOne preview or production deployment has been provisioned by this PR. The public file `sports/vnext/live-services-h154.json` is deliberately disabled.

## Architecture

- Existing TOPKEY on EdgeOne hosts football/volleyball Admin/Viewer pages and RTDB live scores.
- On a dedicated Linux VM (public UDP 8000; HTTPS 80/443), Docker Compose runs:
  - **SRS v8** private HTTP API for WHIP publish / WHEP Viewer sessions.
  - **KokoroTTS v1.0** private neural TTS API (language-model pack for vi/en/zh).
  - **TOPKEY Node gateway** verifies Firebase ID token and existing central TOPKEY user permissions before publish or neural TTS requests, and permits public playback only while the court has a live WebRTC stream.
  - **Caddy** issues HTTPS certificate and proxies the gateway.
- Browser never receives the Firebase Admin service account, SRS API token or Kokoro API key.
- Existing Firebase score updates and security rules are unchanged.
- Neural TTS returns WAV and, when a WebRTC publish session is active, is mixed into its outgoing audio via Web Audio alongside the microphone; ordinary browser speechSynthesis is NOT mixed into the stream.

## Before infrastructure rollout (one-time)

1. Create a dedicated public Linux server with Docker Compose, stable IPv4, TCP 80/443 and **UDP 8000**. Deploying static files only to EdgeOne cannot run SRS or Kokoro. Budget for continuous compute, CPU/RAM (and optionally GPU) and outbound media traffic.
2. Point an HTTPS DNS hostname to the VM; write the hostname into `LIVE_DOMAIN` in `.env`. Use the actual public IPv4 address for `SERVER_PUBLIC_IP` (SRS ICE candidate).
3. Copy `.env.example` to `.env`; put long independent random values in `SRS_API_TOKEN` and `KOKOROTTS_API_KEY`. Set `ALLOWED_ORIGINS` to the precise EdgeOne production origin and separate preview hostname when testing.
4. Using a **server-side** Google Firebase Admin service account with minimum Database read authorization, provide `secrets/firebase-service-account.json` on the VM (not in Git, EdgeOne public files or chat).
5. Start the private stack from this directory: `docker compose up -d --build`.
6. Verify `https://YOUR-LIVE-DOMAIN/health` and HTTPS certificate. Check SRS internal API and Kokoro `/health/ready` health via Docker network, not a public forwarded port.
7. Query **the locally running Kokoro model** `/tts/voices`, select Vietnamese, English and Mandarin voice identifiers, configure `NEURAL_VOICE_VI`, `NEURAL_VOICE_EN`, `NEURAL_VOICE_ZH` in the VM `.env`, restart the API. Do not assume a selected Vietnamese voice identifier without checking the installed catalog.

## Safe staging workflow

1. Deploy this branch to an **isolated EdgeOne Preview**, with a preview-only fork of `sports/vnext/live-services-h154.json` configured to `{"enabled":true,"apiBase":"https://YOUR-LIVE-DOMAIN"}`. Never commit secrets to this JSON.
2. Use a **test tournament** such as `tid=__testlab_h154_20261121` with assigned court and test match. Authorize one Admin, one assigned umpire, one Viewer, one anonymous Viewer. Compare deployed and repo Firebase rules **without modifying them**.
3. Test Android Chrome / iOS Safari camera and microphone permissions; press **Áp dụng / Mở nguồn** with source **WEBRTC**. Wait for ICE `connected`, then verify court stream status LIVE in RTDB.
4. From another phone on a separate 4G/5G network, open public Viewer `#spectator`; require visible moving video, heard microphone, correct score order and 30-minute runtime without leaks. Test pause/stop, reconnect, screen orientation, camera switching, reload and public player autoplay restrictions.
5. Select **Neural · Kokoro** in Live & BLV, test Vietnamese voice and check that viewers **hear** the speech (no echo and no clipping) in the WebRTC mix. Independently test English and Mandarin voices via the gateway and installed models.
6. Run `node --test topkey/tests/h154-webrtc-client.test.cjs` from the repository root. In `topkey/services/live-gateway`, run `npm ci` only after creating a lock file, otherwise `npm install` then `npm test`. Run `python scripts/static_gate.py topkey`, plus Firebase emulator security tests and all TOPKEY regressions.
7. Confirm preview served SHA, JS/CSS requests, JS errors, security roles and 3 cold + 3 warm performance runs. Only after all gates PASS and the release is approved: merge, enable the production API base, deploy, then verify the production SHA and end-to-end public Viewer.

## Known limits / safety

- No external media server exists merely because this repository has Docker Compose files.
- WebRTC ICE may fail without UDP 8000, correct public ICE candidate, a TURN relay on restricted networks or HTTPS/microphone permission.
- Neural inference may be slow on CPU. Do not advertise negligible delay or precision without device/model tests.
- The gateway's rate limit is per process/IP and is not a substitute for a production load balancer, metrics, streaming quotas, session control or long-running monitoring.
- Browser neural audio is currently mixed **only while a WebRTC session is active**; it is not published over HLS, YouTube or local CAMERA mode.
- The production source remains untouched unless someone merges/release-approves the PR. For rollback, disable `enabled` in the public config, revert the H154 feature commit and stop the VM stack only after the event concludes.
- Code paths are intentionally fail-closed: without an active and healthy HTTPS gateway, new WebRTC/Neural controls cannot silently report a working public stream.
