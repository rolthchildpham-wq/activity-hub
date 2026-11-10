# TOPKEY crowd-applause FX provenance

Upgrade87 changes the default crowd sound to a **natural field recording** when the device is online and the recording can be loaded:

- Preferred runtime source: Wikimedia Commons `Applause ii.ogg`
- Direct media URL used by the app: `https://upload.wikimedia.org/wikipedia/commons/0/09/Applause_ii.ogg`
- Recording: applause in a medium-size auditorium (about 500 people), author `thore`, originally from PDSounds.
- License: **Public Domain**. Commons file page: `https://commons.wikimedia.org/wiki/File:Applause_ii.ogg`
- Upgrade87 uses short windows from that recording for set/match reactions. Tie applause is OFF by default to avoid repetitive/annoying FX.
- The Badminton service worker runtime-caches the remote recording after it is requested when the browser permits an opaque media response to be cached.

The three local OGG files remain as the offline fallback required by `REAL_APPLAUSE_001`. They originated as TOPKEY-generated multi-layer crowd FX in Upgrade76 and contain no third-party audio. Upgrade87 softens the fallback with a 120 Hz high-pass, 4.2 kHz low-pass, gentle compression and lower level so it is less clicky/harsh on phone speakers.

- `applause-tie.ogg` — 0.95 s
- `applause-set.ogg` — 1.75 s
- `applause-match.ogg` — 3.10 s

Automated tests certify routing, asset integrity and fallback availability. Perceived sound quality still requires listening on the real tournament phone/laptop speakers.
