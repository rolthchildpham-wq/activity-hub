# Upgrade122 Hotfix31 — Stability Consolidation

## Mục tiêu
- Khắc phục login bị treo do boot phụ thuộc IndexedDB/Firebase/full App init.
- Giảm chồng chéo version/runtime giữa Upgrade118 core và Hotfix16–30.
- Gia cố cùng pattern boot cho `sports/vnext` (Football/Volleyball/Running/DIY/Đá cầu/Cooking).

## Sửa lõi Badminton
- `bindStatic()` chạy trước Data/Auth init và có idempotent guard.
- IndexedDB open có timeout 3.5s + `onblocked`; lỗi IDB không chặn login.
- Data init không block bởi queue stats/initial flush.
- Auth restore timeout 6s; profile read timeout 4.5s + cached profile fallback.
- `afterLogin`/schema/seed chạy có timeout và không giữ admin boot vô hạn.
- Preboot login authority có thể xác thực ngay cả trước `topkey:admin-ready`; không còn guard giữ nút ở “Đang tải hệ thống…” vô hạn.
- Rebuild admin-core mới: `admin-core.44f04243159c.js`.

## Chống xung đột
- Runtime authority lõi dùng Hotfix31/Upgrade122, không ép ngược về Upgrade118.
- Hotfix16–30 thống nhất cùng version/cacheTag.
- Hotfix17 cũ (day-button persistence) được supersede bởi Hotfix21 để tránh observer/mount trùng.
- Giảm tần suất các vòng maintenance của Hotfix21/27/28/29/30 và bỏ version stamping lặp trong timer.

## VNext multisport
- IndexedDB timeout/fail-safe.
- Bind login trước Data init.
- Queue flush không chặn boot.
- Profile/recovery/afterLogin có timeout/background handling.
- Service Worker cache bump để nhận source mới.

## Acceptance
- 243 JS files: syntax PASS.
- JSON/webmanifest: PASS.
- Local HTML refs + Badminton/VNext Service Worker assets: 0 missing.
- Regression PASS: BLV gate, audio reset, UMPIRE ownership, BLV lifecycle, Firebase latency, render stability, scoring fast-lane, schedule DOM safety, production hardening VM.
- Hotfix31 stability regression: PASS.
- Một số regression lịch sử U92–U118 vẫn FAIL vì hard-code build/asset cũ; không dùng làm acceptance của Hotfix31.
