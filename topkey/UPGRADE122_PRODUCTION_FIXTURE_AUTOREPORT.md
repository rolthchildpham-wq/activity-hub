# Upgrade122 — Production Fixture Test Lab + Auto Regression Report

- Một nút từ Hub tự tạo tournament test namespace riêng `__testlab_u122_20261031_<sport>_<runId>`.
- Seeder reset toàn bộ đúng tournament test rồi dựng lại dữ liệu production-like: registration, roster/check-in, schedule, group/knockout/final, live, standings, finance, announcement, audit, scheduler constraints.
- Không ghi vào `main_2026` và hard guard chỉ cho phép namespace Test Lab.
- Sau seed tự chạy regression checks trên Firebase state + runtime/UI cơ bản.
- Báo cáo lưu tại `testReports/latest` và lịch sử tại `testRuns/<reportId>` trong chính tournament test.
- VNext hỗ trợ tải report JSON ngay từ UI Test Lab.
