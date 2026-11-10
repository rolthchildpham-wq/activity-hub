# Upgrade117 Production Hardening Report

Build: `upgrade117`  
Version: `2026.10.31-vnext-featureparity15-upgrade117-production-hardening`

## Runtime hardening added

- `src/core/production-hardening.js`
  - Single-flight `Data.init()`.
  - Single-flight `Auth.init()`.
  - Serialized/coalesced `Data.flushQueue()` so Firebase reconnect, browser online, user action, and resume recovery cannot drain the same IndexedDB queue concurrently.
  - Coalesced `pageshow` / `visibilitychange` / `online` recovery.
  - Recovery only runs when Firebase Data is ready, connected, and Auth has a current user.
  - Health metrics: init runs/avoided calls, flush requests/runs/coalesced, recovery count, queue high-water, listener budget self-check.

## Deterministic soak executed

1. Boot storm
   - 40 concurrent `Data.init()` requests.
   - Underlying Data init runs: exactly 1.
   - 30 concurrent `Auth.init()` requests.
   - Underlying Auth init runs: exactly 1.

2. Queue/reconnect storm
   - 100 concurrent `flushQueue()` requests.
   - Underlying drain maximum concurrency: exactly 1.
   - Requests coalesce to at most 2 underlying drain passes in the VM scenario.
   - 25 resume recovery requests coalesce to one recovery drain.

3. Long UI/Firebase session
   - 100 repeated `App.subscribe()` cycles.
   - 1,200 tab changes across Admin surfaces.
   - UI Boundary hook counts remain constant.
   - Core Firebase handler ownership remains one listener set.
   - Dynamic tab listener ownership stays within one active branch.

4. Atomic scoring soak
   - 500 `POINT_AWARDED` + commentary actions.
   - Exactly 500 underlying atomic writes.
   - Every write contains active match + event + commentary/latest.
   - Atomic pending map returns to 0.

5. Existing mandatory resilience coverage retained
   - WebRTC heartbeat/signaling retry regression and VM tests.
   - Viewer BLV lifecycle tests.
   - Scoring Fast Lane / offline fallback tests.
   - Viewer Firebase Window tests.
   - Admin login boot guard tests.

## Byte-preservation audit vs Upgrade116

Unchanged sensitive source/config: 18/18 PASS, including Firebase Rules, Storage Rules, `firebase.js`, `auth.js`, `scoring.js`, TURN config/function, WebRTC U88/U101, Data Runtime, Fast Lane U105, Atomic Score U113, UI boundary and Schedule/Umpire/Live feature runtimes.

Unchanged production assets: Viewer JS/CSS, Replay JS/CSS, Admin CSS.

## Browser visual smoke

`NOT-RUN`.

Chromium 144 is installed, but headless `--dump-dom` timed out in the container with DBus/zygote errors and produced no DOM. This is intentionally not reported as PASS.

## Rules / deployment

Upgrade117 does not change Firebase Rules. No Rules publish is required when upgrading from 112+ rules state.
