# TOPKEY Upgrade77 · EdgeOne AI Shuttle Replay setup

Upgrade77 works in two layers:

1. **Local replay (no AI key required)**
   - Camera/WebRTC MediaStream only.
   - One MediaRecorder creates short independent segments.
   - Browser keeps a short rolling memory buffer and stores selected replays in IndexedDB.
   - Manual tags: Smash / Drop / Near line / Save replay ~10 seconds.
   - Lightweight local motion detector can flag fast shuttle candidates.

2. **Optional EdgeOne Makers vision assist**
   - Endpoint: `/api/ai-shuttle-analyze` from `edge-functions/api/ai-shuttle-analyze.js`.
   - The browser sends only 2–4 downscaled JPEG frames, never the whole livestream.
   - Firebase ID token is checked server-side; only ADMIN / UMPIRE / LIVE_ONLY are accepted.
   - API/model key stays in EdgeOne environment variables, never in frontend HTML.

## EdgeOne Makers configuration

In the EdgeOne Makers project settings, configure one of:

- `MAKERS_MODELS_KEY` = your Makers Models API key (recommended for this package), or
- `AI_GATEWAY_API_KEY` = compatible gateway key.

Optional:

- `AI_GATEWAY_BASE_URL` = `https://ai-gateway.edgeone.link/v1`
- `TOPKEY_VISION_MODEL` = `@makers/deepseek-v4.1-flash`

If the built-in Makers model in your account does not accept image content, bind a vision-capable provider/model in Makers Models and set `TOPKEY_VISION_MODEL` to that model ID. DeepSeek native API currently documents image input on `deepseek-flash`.

## Important limitation

TOPKEY AI Shuttle Replay is an **advisory replay/highlight tool**. It is not BWF Instant Review System / Hawk-Eye and must not automatically change the score or overrule the umpire. A single phone camera can miss the shuttle because of blur, occlusion, rolling shutter, low light or insufficient frame rate.

## Performance policy

- No full video is uploaded for AI analysis.
- Detector canvas is approximately 160 px wide at ~8 FPS.
- Vision snapshots are approximately 480 px wide JPEGs.
- AI calls are throttled; local replay keeps working when AI is offline.
- HLS/YouTube/iframe sources are not auto-recorded by Upgrade77 because browser CORS/media restrictions can prevent safe capture. Use Camera/WebRTC for replay capture.

## Upgrade79 route requirement
The Badminton UI is nested under `/sports/badminton/`, but the Edge Function is origin-root. Frontend health and analysis calls MUST use `/api/ai-shuttle-analyze` (leading slash), never `./api/ai-shuttle-analyze`. This keeps the same route on both stable project domains and deployment-specific domains.

## Upgrade80 camera default
Mobile Local Camera now requests the rear/environment camera by default. Live source controls expose Camera sau / Camera trước; this media-device preference does not change EdgeOne AI credentials or endpoint configuration.


## Upgrade81 replay playback
Replay target is approximately 10 seconds (~6 s before + ~4 s after the event). Upgrade85 superseded the earlier MediaSource/SourceBuffer stitching path with safe one-segment-ObjectURL-at-a-time playback after a confirmed Chromium hang. This does not change Makers Models environment variables, AI endpoint configuration, or the rule that only 2-4 still frames are sent for AI analysis.


## Upgrade82 replay orientation
Orientation correction is local playback only. It does not change Makers Models variables or upload extra video. New clips store capture orientation metadata; landscape court clips are corrected to a 16:9 replay stage when MediaRecorder exposes portrait intrinsic dimensions.


## Upgrade84 Live-first layout
Upgrade84 only rearranges the Live workspace and adds automatic Live Focus after Apply/Open Live. It does not change `MAKERS_MODELS_KEY`, `TOPKEY_VISION_MODEL`, the `/api/ai-shuttle-analyze` endpoint, frame upload limits, or Firebase role checks.

## Upgrade85 replay/storage note
Upgrade85 keeps saved replay video in local IndexedDB and keeps only replay metadata in the live JavaScript list. Opening the normal website outside Live does not load replay video. Pressing **Xem** loads only the selected replay; closing it releases the ObjectURL/full record. This is independent of `MAKERS_MODELS_KEY` and does not change the EdgeOne AI endpoint/model configuration.

## Upgrade86 layout note
Upgrade86 does not change the EdgeOne AI endpoint, model, Firebase authorization or replay storage. It only makes the Upgrade84 Live-first placement durable when Upgrade77 creates the Replay UI lazily after Upgrade85 startup guards. Desktop order remains Live Viewer -> Source/Fallback -> AI Replay on the left, BLV on the right.


## Upgrade87 audio note
Upgrade87 does not change Makers Models keys, the `/api/ai-shuttle-analyze` route, model selection, Firebase AI authorization, or replay frame limits. The new natural applause source is a separate public-domain media request to Wikimedia Commons and is runtime-cached when possible; BLV male/female selection uses system/Piper audio locally and does not send commentary text to EdgeOne AI.


## Upgrade88 · Viewer transport / UMPIRE audio
- No EdgeOne AI environment variable changes.
- Local Camera now reuses the same MediaStream for authenticated Firebase-signaled WebRTC viewers; it does not upload the livestream to EdgeOne/DeepSeek.
- Public `#spectator` can play HLS/YouTube directly. Camera/WebRTC signaling remains authenticated by existing Firebase rules; use a VIEWER/LIVE_ONLY account for secure camera viewing.
- UMPIRE audio fix is local/Firebase court ownership only and does not change AI authorization.
