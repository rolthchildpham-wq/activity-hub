# UPGRADE122 HOTFIX71 — HUB AUTH FLOW

Luồng bảo vệ mới:

1. Mở domain gốc luôn ở Sports Hub.
2. Người dùng chọn môn tại Hub; Hub tạo ticket phiên cho đúng môn.
3. Trang môn chỉ chấp nhận entry có ticket Hub (trừ spectator/register/testlab).
4. Phiên Firebase cũ không được tự dùng để vào môn; lần vào mới từ Hub luôn hiện đăng nhập.
5. Sau đăng nhập, ADMIN được vào mọi môn; BTC bắt buộc sportScope/assignedSport trùng môn; role khác nếu có scope thì cũng phải trùng.
6. Sai quyền: đăng xuất, báo không có quyền và quay về Hub.
7. Hub không còn ẩn các thẻ môn chỉ vì trình duyệt đang nhớ một tài khoản BTC cũ.

Build: `u122h71-20261107`.
