# Upgrade94 Full Audit — applied to attached Upgrade93 baseline

## Baseline

User-supplied ZIP: Upgrade93 PublicViewer Stability FULLTEST, attached on 2026-10-30.

Upgrade94 was applied on top of that extracted baseline. It does not replace the project with a different tree.

## Requested Viewer BLV behavior

1. Visible Public Viewer button is `🔊 Bật tiếng + BLV`.
2. A single user click unmutes Live audio and enables Viewer-local Vietnamese TTS BLV.
3. The same click speaks the test sentence `Âm thanh bình luận tỷ số đã bật.`.
4. Commentary follows the court actually selected/watched by the public Viewer.
5. Primary path is `commentary/<court>/latest`.
6. `activeMatches` score changes schedule a fallback narration after approximately 700 ms when commentary is late/missing.
7. Upgrade94 does not call `getUserMedia`; it does not open Viewer camera/microphone.
8. TURN and Firebase Rules remain unchanged from the attached Upgrade93 baseline.

## Implementation

- Added `src/upgrade94.js` as the final Viewer BLV stability layer.
- Added `tests/upgrade94_viewer_blv_regression.js`.
- Added Upgrade94 metadata/registry entries and cache-busting build tag `u94-20261030`.
- Badminton service-worker cache is new: `topkey-vnext-2026-upgrade94-viewer-blv-audio-stability`.
- Existing Upgrade88 WebRTC/TURN receive path is not modified.
- Existing Firebase database/storage rules are not modified.

## Test results

- JavaScript syntax: **140 PASS / 0 FAIL**
- JSON/webmanifest parse: **15 PASS / 0 FAIL**
- Regression files: **21 PASS / 0 FAIL**
- Badminton service-worker local assets: **196/196 exist**
- Root service-worker local assets: **12/12 exist**
- HTML local asset references: **174/174 exist**
- ZIP integrity: verified after packaging

### Upgrade94 Viewer BLV regression specifically proves

- public visible audio button enables BLV;
- enable gesture speaks the test sentence;
- selected public court is used (`court_2` mock, not default `court_1`);
- listener binds to `commentary/court_2/latest`;
- new Firebase commentary is spoken;
- an `activeMatches` score change schedules and actually speaks the ~700 ms fallback;
- `src/upgrade94.js` contains no `getUserMedia` call;
- Badminton SW uses a fresh Upgrade94 cache.

## Security/config immutability

SHA-256 after patch (identical to attached Upgrade93 baseline for these files):

- root Firebase DB Rules: `58f54620044cfae953b716adc3bb7b68c01b1e0a2b9c57c481862de4f370dd33`
- Badminton Firebase DB Rules: `4b17a74cd65929fa5c3b2e22420b3d9e3c2b2f099d81823fd056470794665615`
- Badminton TURN config: `226f7243b32c39660dbdc6d871fd7eb14b74d75f89867967f656631bf68ab12b`
- Edge TURN credential function: `0a99d75e5c83a30fa036783b69796efdc6db02a4f28b7988cc6f04544e5e0e10`

No TURN credentials or Firebase permission model were changed by Upgrade94.
