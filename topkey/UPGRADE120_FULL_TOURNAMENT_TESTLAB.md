# Upgrade120 — Full Tournament Test Lab

## Mục tiêu
Thêm một thẻ ADMIN tại Hub để chạy regression test bằng dữ liệu giả toàn giải cho tất cả môn mà không đụng dữ liệu production.

## Cách dùng
1. Đăng nhập tài khoản ADMIN Firebase.
2. Tại Hub mở thẻ **Full Tournament Test Lab**.
3. Chọn môn.
4. Bấm **TẠO KÊNH & TEST TOÀN GIẢI**.
5. App mở ở tab mới với `testlab=1` và Tournament ID dạng `__testlab_u120_20261031_<sport>_<runId>`.
6. Sau khi Auth được khôi phục, Test Lab tự nạp dữ liệu giả và hiện bảng Smoke Check.

## Cách ly dữ liệu
- Production mặc định: `.../tournaments/main_2026`
- Test Lab: `.../tournaments/__testlab_u120_20261031_<sport>_<runId>`
- Seeder từ chối chạy nếu `tid` không có prefix Test Lab hợp lệ.
- Nút Reset chỉ ghi lại đúng Tournament ID test hiện tại.

## Bộ dữ liệu giả
Bao gồm config, participants/teams, check-in, registrations, courts/lanes/judging areas, lịch nhiều giai đoạn, FINISHED, WALKOVER, LIVE, SCHEDULED, vòng trong/final, active match, finance, announcements, audit và scheduler constraints.

## Smoke Check tự động
Kiểm tra namespace, config, participants, matches/events, finished, live, registrations, finance, announcements và audit.
