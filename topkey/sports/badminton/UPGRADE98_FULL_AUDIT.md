# Upgrade98 Full Audit

## Scope
Upgrade98 is based on Upgrade97 and changes only:
1. Public Viewer horizontal Live behavior.
2. Referee fullscreen readability/touch size on short landscape phones.

Scoring, Firebase Rules, TURN configuration/function, Upgrade88 WebRTC protocol, Upgrade94/96 Viewer BLV lifecycle, Replay and Umpire authorization are intentionally unchanged.

## Viewer Live fix
The supplied screenshot showed a horizontal physical camera scene arriving in a portrait-sized WebRTC video frame, so ordinary fullscreen produced a narrow portrait column with sideways content.

Upgrade98 changes the Public Viewer full button to **Xem ngang**. On explicit user gesture it:
- requests native fullscreen (with a no-options fallback),
- attempts `screen.orientation.lock('landscape')`,
- detects portrait-sized WebRTC tracks (`videoHeight > videoWidth * 1.08`),
- swaps rendered box geometry and rotates the video 90 degrees,
- provides a **Xoay hình** control to reverse direction or return straight if device metadata differs,
- unlocks orientation on exit.

Auto-rotation is active only during horizontal Viewer mode. Inline Viewer is not transformed.

## Referee readability
On landscape phone viewports <=1200px wide and <=650px high:
- score: 44–64px,
- score labels: 11–14px,
- match name: 13–18px,
- team: 13–18px,
- player: 14–19px,
- player notes: 11–13px,
- primary service/swap targets: >=44px,
- score action targets: >=48px,
- fullscreen exit: 44x44px.

At <=430px landscape height only secondary side notes/history detail are reduced; score and action controls remain prioritized.

## Regression result
- 25/25 test files PASS
- JS syntax PASS
- JSON/webmanifest parse PASS
- Bundle hash/order PASS
- SW 11/11 app-shell assets PASS
- Upgrade98 dynamic Viewer fullscreen/orientation/portrait-track test PASS

## Historical contract
Upgrade97's final rule (Viewer must never use native fullscreen/landscape) is marked superseded by Upgrade98 because the user explicitly requested horizontal Viewer playback for horizontal camera Live. Upgrade97 remains tested in isolation for historical compatibility.

## Visual harness limitation
A Chromium headless CSS harness was attempted, but Chromium in this container could not complete because the local runtime lacks its DBus socket. This is not reported as a visual PASS. CSS sizes are instead protected by the regression contract and the final cascade values in Upgrade98 CSS.
