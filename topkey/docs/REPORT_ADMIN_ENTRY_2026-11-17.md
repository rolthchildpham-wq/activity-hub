# TOPKEY — Truy cập và quản trị từng môn (17/11/2026)

## Quy trình được áp dụng

1. Mở Hub TOPKEY → thẻ **Trung tâm quản trị môn**.
2. Chọn một trong 7 môn: bóng đá, cầu lông, bóng chuyền, chạy bộ, nấu ăn, DIY/Handmade hoặc đá cầu.
3. **Xem môn/giải** và **Vào quản trị môn** đều mở trang quản lý môn hiện hữu, sử dụng `a.sport` để đi qua `hub-auth-flow.js` và release health gate. Không tạo module đăng nhập hoặc Firebase Auth mới.
4. Nếu chưa đăng nhập, trang môn xử lý đăng nhập bằng Firebase Email/Password. Nếu đã có phiên, dùng xác thực chung và kiểm tra hồ sơ quyền server-side. Không suy ra quyền Admin/BTC từ URL, query, Hub ticket, sessionStorage hoặc thẻ UI.
5. Nếu quyền được xác minh: ADMIN có quyền tương ứng, BTC chỉ thao tác trong môn được cấp; Viewer xem theo quy tắc hiện hành. Nếu thiếu quyền, hệ thống từ chối truy cập chức năng hạn chế tại trang môn và Firebase Rules.
6. Vlog TikTok mở đúng `./sports/diy-vlog/index.html` với giao diện đăng nhập riêng trên Firebase TOPKEY. Quản trị hệ thống mở `./system-admin.html`, vẫn chỉ theo quyền Admin đã được kiểm tra.

## Phạm vi mã

- `topkey/index.html`: gắn thẻ quản trị bên dưới Dashboard và trước danh sách môn.
- `topkey/sport-management-launch.js`: 7 nút chọn môn, 2 nút điều hướng và trạng thái phiên Firebase chỉ để hướng dẫn; không đọc/chỉnh sửa role.
- `topkey/sport-management-launch.css`: giao diện TOPKEY navy / cyan, bố cục desktop/mobile.
- `topkey/tests/sport-management-entry.test.cjs`: kiểm tra 7 đường dẫn, callback trạng thái đăng nhập, định tuyến `a.sport`, Vlog, System Admin, CSS responsive.

## Ranh giới bảo mật

Nút **Vào quản trị môn** không cấp quyền và không bỏ qua màn đăng nhập. Trang môn và Rules tiếp tục quyết định. Khi Firebase chưa sẵn sàng, chỉ hiện dòng hướng dẫn; không phát sinh thao tác tài khoản từ Hub. Không sửa cơ sở dữ liệu hay Rules.

## Bằng chứng kiểm thử snapshot GitHub

- Archive nguồn commit `54f824b32fbc9245663a02fc483497c34a884c0f`, lấy qua GitHub connector, chạy Node.js + Python trong sandbox độc lập.
- `node topkey/tests/sport-management-entry.test.cjs`: PASS.
- `node topkey/tests/executive-sport-insights.test.cjs`: PASS.
- `node topkey/tests/hub-bi-visual-regression.test.cjs`: PASS.
- `node topkey/tests/auth-p5-cache.test.cjs`: PASS.
- `node topkey/tests/h137_public_viewer.test.cjs`: PASS.
- `python scripts/static_gate.py topkey`: **510 JS + 52 inline scripts + 62 JSON, 0 parse/syntax errors**.
- Screenshot DEMO desktop/mobile từ mẫu HTML độc lập trong Chromium; 7 tab chọn môn, modal mô phỏng đăng nhập, mobile width 390 không cuộn ngang body. Đây **không phải ảnh browser của EdgeOne Preview hoặc production**.

## Trạng thái triển khai

- Thay đổi đang ở nhánh `feature/report-admin-entry-20261117`, dựa trên nhánh thiết kế báo cáo PR #61 chưa merge.
- Firebase Emulator role matrix: NOT TESTED.
- Trình duyệt thực tế EdgeOne Desktop/Mobile: NOT TESTED.
- EdgeOne Preview SHA: NOT TESTED.
- Hiệu năng cold/warm: NOT TESTED.
- Không dùng GitHub Actions, không thay Firebase Rules, không triển khai production.
- **RELEASE BLOCKED** đến khi Production Gate đầy đủ được xác minh.
