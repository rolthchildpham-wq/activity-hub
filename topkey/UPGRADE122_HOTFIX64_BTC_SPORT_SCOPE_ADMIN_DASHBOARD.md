# Upgrade122 Hotfix64 - BTC Sport Scope + Admin-only Dashboard Editing

## Mục tiêu
- Mỗi tài khoản `BTC` bắt buộc gán đúng **1 môn phụ trách cố định** (`sportScope`).
- BTC không thể vận hành/chỉnh sửa môn khác, kể cả đổi URL thủ công.
- Firebase Rules chặn mọi lệnh ghi của BTC sang root môn khác.
- Dashboard điều hành xã đoàn tại Hub: BTC/tài khoản lãnh đạo có thể **xem** nếu được cấp quyền; chỉ ADMIN được cập nhật snapshot/cấu hình CLB.

## Môn hỗ trợ
`badminton`, `football`, `volleyball`, `running`, `handmade`, `shuttle`, `cooking`.

## Quản lý tài khoản
ADMIN sẽ thấy trường **Môn BTC phụ trách (cố định)** khi role = BTC ở cả form tạo mới và cửa sổ chỉnh quyền.

BTC cũ chưa có `sportScope` bị fail-closed: không được vận hành cho tới khi ADMIN gán môn.

## Firebase Rules
Deploy file `firebase.database.rules.json` ở thư mục gốc sau khi deploy web để khóa quyền ghi cross-sport ở backend.
