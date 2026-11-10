# Upgrade122 Hotfix89 - Full Interface i18n

Release: `H89 · FULL INTERFACE I18N`
Build: `u122h89-20261107`
Date: 2026-11-07

## Mục tiêu

Đồng bộ ngôn ngữ toàn bộ giao diện TOPKEY Sports Hub. Khi người dùng chọn Tiếng Việt, English hoặc 中文, toàn bộ chữ giao diện hệ thống phải chuyển theo cùng ngôn ngữ, không giữ sót nhãn của ngôn ngữ trước.

Ngoại lệ cố ý không dịch: tên riêng/tên đội/VĐV/nội dung do người dùng nhập, thương hiệu và mã kỹ thuật như TOPKEY, Firebase, EdgeOne, VNext, QR, JSON, ID, WebRTC, HLS, PWA và các permission key nội bộ.

## Thay đổi chính

- Một engine i18n trung tâm cho Hub, System Admin và Change Password.
- VNext dùng cùng dictionary/behavior; Badminton admin bundle đồng bộ cùng engine, Badminton public route cũng nạp engine trung tâm.
- Dịch text node, placeholder, title, aria-label, alt và input button value.
- `MutationObserver` tự dịch nội dung giao diện được tạo sau khi trang đã tải.
- Chuyển ngôn ngữ trực tiếp không cần reload: `vi -> zh -> en -> vi -> zh` đã regression.
- Language picker tự hiển thị tên các ngôn ngữ theo ngôn ngữ đang chọn.
- Bổ sung dictionary cho các chuỗi trước đây còn trộn ngôn ngữ: Security, Smart Scheduler, Check-in, Live, Finance, Audit, Backup/Restore, Firewall, Production Fixture, Test Lab, Export CSV, Audit Log, Security Rules, Live Viewer, System Health và các mô tả Hub/Admin.
- Vietnamese mode cũng loại bỏ các nhãn tiếng Anh giao diện thông thường; English/Chinese mode không còn chuỗi tiếng Việt hệ thống.
- `TopkeyI18n.auditResidual()` quét chuỗi còn sót để hỗ trợ regression.

## Phạm vi kiểm thử i18n

1. Sports Hub
2. VNext (Football, Volleyball, Running, Handmade, Shuttle, Cooking)
3. Badminton
4. System Administration
5. Change Password
6. Dynamic DOM after language switch
7. Language picker labels

## Regression bảo toàn từ H88

- ADMIN + BTC Badminton + BTC Volleyball auth/reload/session.
- Atomic release guard.
- Public routes no-login.
- Cooking/DIY QR judging.
- PDF/PPT report export, prize, images, 3 report language modes.
- VNext schedule day grouping H87.
- Finance, venue, standings and withdrawal regressions.

