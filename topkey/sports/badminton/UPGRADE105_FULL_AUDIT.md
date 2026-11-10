# TOPKEY Upgrade105 — Scoring Fast Lane + Schedule Collapse

## Scoring Fast Lane
- Keeps Upgrade48 optimistic/local-first scoring UI.
- Online authenticated SCORE writes call Firebase root `update()` directly, bypassing unrelated IndexedDB backlog.
- Direct SCORE update is still atomic across `activeMatches/<court>` and `events/<court>/<eventId>`.
- On failure/offline/auth-not-ready/ordered fallback, SCORE is persisted to IndexedDB.
- Permission denied is persisted as BLOCKED and surfaced.
- A fallback rewrites the queued active-match snapshot to the newest local version when safe, preventing an older failed write from regressing a later local score.

## Schedule Collapse
- Public `Lịch thi đấu & Kết quả`: manual collapse/expand.
- Admin `Lịch thi đấu`: manual collapse/expand.
- State persists in localStorage.

## Performance/package
- Browser still loads one application JS bundle + preboot and one CSS bundle.
- U105 bundle JS: `app.10fcb2b4e906.js`
- U105 bundle CSS: `app.9aae57d1f395.css`

## Unchanged
- Scoring rules and set rotation semantics
- Firebase Rules
- Cloudflare TURN
- WebRTC Upgrade88/101
- Viewer BLV lifecycle Upgrade96
- Viewer orientation/fullscreen Upgrade100

## QA
- Regression + VM: 38/38 PASS
- JavaScript syntax: 176/176 PASS
- JSON/webmanifest: 24/24 PASS
- HTML local refs missing: 0
- SW precache assets: 11/11 present
- Bundle source/hash/order: PASS (99 JS / 71 CSS)
- Visual browser/device: NOT-RUN in container
