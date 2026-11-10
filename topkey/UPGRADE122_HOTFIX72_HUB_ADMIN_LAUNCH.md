# Upgrade122 Hotfix72 — Hub Admin Launch

- Bỏ khối thông báo “BTC phụ trách cố định” khỏi Sports Hub.
- Luôn hiển thị thẻ **Cài đặt / Quản trị hệ thống · ADMIN** ở cuối Hub, không phụ thuộc phiên BTC/ADMIN đang được Firebase nhớ.
- Trang `system-admin.html` tiếp tục tự yêu cầu đăng nhập và tự kiểm tra quyền ADMIN / `systemAdmin:access`, nên hiển thị nút ở Hub không làm lộ quyền quản trị.
- Giữ nguyên luồng Hotfix71: Hub → chọn môn → đăng nhập → kiểm tra quyền → vào môn hoặc quay lại Hub.
- Bump cache/service worker lên `u122h72-20261107`.
