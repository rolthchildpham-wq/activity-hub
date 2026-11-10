# Upgrade122 Hotfix18 — Offline UMPIRE Readiness + Day Time Button Repair

## Offline UMPIRE
- Health có thẻ **Offline UMPIRE Readiness**.
- Kiểm tra: Service Worker controller, Admin JS/CSS cache, Firebase SDK cache, Auth session, tournament state, TOPKEY Offline Voice/Piper, audio unlock, và nút Sắp time theo ngày.
- **Chuẩn bị Offline** chủ động cache Admin bundle + Firebase Compat SDK 9.23.0 và kiểm tra/cài TOPKEY Offline Voice khi còn online.
- Service Worker precache Admin bundle và giữ Firebase SDK trong cache riêng `topkey-firebase-sdk-9.23.0`.
- Piper runtime cache mở rộng cho vits-web, mintplex piper, Realtimex piper, piper-wasm và ONNX Runtime.

## Sắp time theo ngày
- Sửa lỗi Hotfix17: nút không còn nằm trong wrapper `<span>` bị admin renderer ghi `textContent` và xóa mất.
- Nút `⏱ Sắp time` là child độc lập của `.tk12-day-head` và tự mount lại sau render/sync/filter.
- Health hiển thị `X/Y header ngày có nút` để phát hiện ngay regression.

## Regression
- Upgrade78 BLV gate: PASS
- Upgrade87 audio/reset: PASS
- Upgrade88 UMPIRE audio ownership: PASS
- Upgrade96 BLV lifecycle: PASS
- JS syntax Hotfix16/17/18 + SW: PASS
- Local references: 0 missing
- Service Worker precache assets: 0 missing

Version: `2026.11.02-vnext-upgrade122-hotfix18-offline-umpire-readiness`
Cache: `u122h18-20261102`
