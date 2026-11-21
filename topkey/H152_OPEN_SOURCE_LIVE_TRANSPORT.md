# H152 — Sports Hub Live transport & multilingual commentary

## Findings (2026-11-21)
- The VNext `CAMERA` source opens a local `MediaStream`. Firebase RTDB stores match/stream metadata; **it does not transmit camera pixels or microphone audio**. A Viewer can see a LIVE badge while having no video. Repeated Firebase updates, reloading the Viewer or changing Pinyin/TTS code cannot fix this missing media path.
- The BLV speech engine uses browser `speechSynthesis`, with device-specific voices. This is not guaranteed to synthesize Mandarin tones or English IPA accurately; audio spoken on the Admin device is not automatically mixed into the remote video stream.
- H152 adds a **manual** pronunciation panel and language routing. Existing automatic Vietnamese score commentary is unchanged.

## Open-source streaming options
1. [OvenMediaEngine](https://github.com/OvenMediaLabs/OvenMediaEngine) + [OvenLiveKit-Web](https://github.com/OvenMediaLabs/OvenLiveKit-Web): WHIP/WebRTC browser publisher and WebRTC/LL-HLS playback; built-in WebRTC server and scalable origin/edge. OvenMediaEngine is AGPL-3.0, so evaluate obligations before integration.
2. [SRS](https://github.com/ossrs/srs): MIT-licensed RTMP, WebRTC, WHIP/WHEP, and HLS server. Good alternative when self-hosting with custom signaling, firewall and TLS.
3. [OvenPlayer](https://github.com/AirenSoft/OvenPlayer): browser playback client for LL-HLS and WebRTC.

## Recommended architecture
- Phone referee/operator: `getUserMedia` video + audio -> WHIP HTTPS endpoint, server performs fan-out / transcoding.
- Viewer: WHEP WebRTC or HLS playback URL provided as scoped public metadata, **never** an operator publish token.
- Score: existing Firebase `activeMatches` listener remains separate and can render on top of the player.
- BLV: TTS preview is local; for remote audience the commentary needs to be mixed into the outgoing `MediaStream` (Web Audio -> `MediaStreamAudioDestinationNode`) **before** publishing via WHIP. Browsers do not reliably expose `speechSynthesis` output as a media track; use a permitted TTS PCM/WAV engine when mixing is required.
- Use TURN/TLS and a public HTTPS endpoint (not EdgeOne static Pages alone); grant publish credentials from a server-side token endpoint after Admin/umpire authorization; publish credentials must not appear in source or Firebase public paths.
- Test mobile 4G switching, microphone permissions, orientation changes, Android/iOS browser policy, spectator without authentication, and reconnection after WebRTC ICE failure. Record cold/warm media times and error codes.

## TTS repositories
- [k2-fsa/sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) and its Kokoro Chinese/English ONNX models: appropriate for a server, APK or local GPU-capable inference.
- [uzen-zone/kokoro-js](https://github.com/uzen-zone/kokoro-js) supports browser Mandarin + English segments with caveats around Chinese segmentation and tone sandhi.
- This PR does **not** download a multi-hundred-megabyte neural model into the Sports Hub, does not invent a media server, does not translate Vietnamese commentary into English/Chinese and does not modify production Firebase rules.

## Acceptance criteria for a later transport feature
- WHIP publish `CONNECTED` confirmed by ICE, WHEP viewer receives A/V and survives 4G change or provides a clear retry UI.
- Public scoreboard keeps updating when media reconnects.
- Server auth rejects spectators publishing and prevents leaked credentials.
- Preview SHA, mobile/desktop browser QA, audio mixing, role matrix, and performance gate PASS before production release.
