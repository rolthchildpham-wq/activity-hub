# H92 Acceptance Report

Release: `u122h92-20261107`
Version: `2026.11.07-vnext-upgrade122-hotfix92-club-plan-dashboard`

## Kết quả
`FULL_WEB_ACCEPTANCE_OK 497`

## Phạm vi regression
- ADMIN + BTC Cầu lông + BTC Bóng chuyền + reload/session/sport-scope.
- Atomic Hub / Badminton / VNext release authority.
- Badminton/VNext auth parity và Firebase bootstrap.
- Lịch/BXH/withdrawal/ranking hiện hành.
- Báo cáo PDF/PPT, 3 ngôn ngữ, hình ảnh, tài chính.
- QR/public judging Nấu ăn/DIY.
- Trọng tài Bóng đá/Bóng chuyền.
- Full-interface i18n.
- H92 Club Plan browser test: Excel seed, ngân sách, phân công, save ADMIN/BTC, leadership read-only.
- Firebase clubPlan Rules cho 7 môn.
- Hub Service Worker + EdgeOne no-cache cho module mới.
- Executive Dashboard `readRaw()` được phục hồi để không kẹt ở `Đang tải dashboard...`.

## Dữ liệu kiểm thử H92 từ workbook
- 20/10/2026 - 20/11/2026.
- Hạn đăng ký 17/10/2026.
- Thu dự kiến 15.000.000 VND.
- Chi dự kiến 14.315.000 VND.
- Cân đối 685.000 VND.
- 5 công việc mẫu từ sheet phân công.

## Release gate
Deploy toàn bộ package H92 và publish Firebase Database Rules cùng release. Không deploy riêng Hub hoặc riêng sport branch.
