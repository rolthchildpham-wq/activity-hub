# Upgrade103 — Render & Runtime Stability FULL AUDIT

Baseline: **Upgrade102 — Firebase Latency**.

## Mục tiêu
Giảm DOM work và polling nền sau khi Upgrade102 đã giảm Firebase listener/branch latency, nhưng không thay đổi scoring, Rules, TURN, WebRTC protocol hay BLV semantics.

## Thay đổi
- U102 vẫn cập nhật state Firebase cho core branches, nhưng DOM render chỉ chạy cho branch liên quan tab authenticated đang mở.
- Khi `document.hidden`, admin DOM render được defer; khi quay lại visible, dirty state được flush một lần.
- `renderOverview()` không còn ghi DOM KPI khi Overview đang ẩn.
- Upgrade94 bỏ polling Viewer BLV 700 ms; court/commentary binding dùng các event đã có: activeMatches/courts, court click, hashchange, focus.
- Upgrade90 legacy BLV poller tự retire ngay khi Upgrade94 canonical engine đã có, tránh duplicate commentary listener/polling.
- Thêm passive runtime metrics trong Health: tap điểm → UI trọng tài, Firebase SCORE write, Viewer Firebase receive, listener/render counters.
- Performance Safe bundling tiếp tục giữ preboot + 1 app JS bundle + 1 CSS bundle, SW precache 11 assets.

## Kiểm tra động
- Document hidden + Firebase `matches` change: state cập nhật, DOM render = 0 cho đến khi visible.
- Finance tab + `matches` change: state cập nhật, hidden/inactive branch DOM render = 0.
- Score wrapper vẫn gọi renderUmpire; latency metric đo được mà không thay score semantics.
- SCORE queueMulti wrapper giữ nguyên write và chỉ đo thời gian.

## Sensitive files so với Upgrade102
- `src/scoring.js`: UNCHANGED
- `firebase.database.rules.json`: UNCHANGED
- `turn-config.json`: UNCHANGED
- `src/upgrade88.js`: UNCHANGED
- `src/upgrade96.js`: UNCHANGED
- `src/upgrade100.js`: UNCHANGED
- `src/upgrade101.js`: UNCHANGED
- root `firebase.database.rules.json`: UNCHANGED
- root `edge-functions/api/turn-credentials.js`: UNCHANGED

## Kết quả
- Regression/VM: **36/36 PASS**
- JavaScript syntax: **172/172 PASS**
- JSON/webmanifest: **23/23 PASS**
- HTML local refs missing: **0**
- Service Worker assets: **11/11 present**
- Bundle integrity: **98 JS sources / 70 CSS sources PASS**
- Visual browser/device test: **NOT-RUN in container**; production device remains final smoke test.
