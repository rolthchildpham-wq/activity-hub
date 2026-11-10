# Intentional Remaining Architecture Debt — after Upgrade118

This file records what is intentionally **not** being changed in the production baseline.

## 1. Firebase Compat SDK remains

The application still uses Firebase 9.23 compat for App/Auth/Database. Firebase Storage is lazy-loaded and is not part of Viewer startup.

Why not migrate now: a modular migration touches authentication, Realtime Database references/queries/listeners and many legacy modules. It has a high regression surface and no measured production blocker after Viewer Minimal Boot and Storage lazy-loading.

Decision: **defer**. Treat as a future major-version refactor, not another patch release.

## 2. Admin core still contains legacy upgrade source modules

Consolidation phases 114–116 removed Viewer-only execution and consolidated Data/Runtime/Schedule/Umpire/Live boundaries, but the Admin core still includes many historical `upgradeXX` modules.

Why not rewrite now: the current bundle passes all mandatory regressions and browser acceptance. A complete rewrite would exchange proven behavior for a large new regression surface.

Decision: **defer** until a feature area needs substantial redevelopment or profiling shows a measurable bottleneck.

## 3. Finance and Scheduler are not fully separate chunks

Replay/AI, Storage, QR and JSZip are lazy; Viewer is a separate minimal bundle. Finance/Scheduler logic remains substantially inside Admin core.

Decision: **defer**. Admin JS is ~320 KB gzip / ~227 KB Brotli in the release artifact, while Viewer remains ~11 KB gzip. Further splitting is optional and should be driven by real Admin startup measurements.

## 4. Live infrastructure must still be measured in production

TURN/WebRTC and EdgeOne network behavior depends on external routing, device/browser and region. Code-level regression coverage exists, but container testing cannot replace a real two-device public-network check.

Decision: keep the current signaling/TURN contracts; use production Health/log evidence before changing protocol code.
