# UPGRADE122 HOTFIX74 · PASSWORD CHANGE

- Thêm trang `change-password.html` cho tất cả tài khoản đã được cấp.
- Người dùng nhập email, mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới.
- Hệ thống xác thực Firebase Email/Password trước khi gọi `updatePassword`.
- Không lưu mật khẩu vào Realtime Database/localStorage.
- Thêm lối tắt `Đổi mật khẩu` ở Sports Hub và khu Quản trị hệ thống.
- ADMIN có nút `Gửi reset mật khẩu` cho từng tài khoản, dùng Firebase Password Reset Email.
- Tăng build/cache lên `u122h74-20261107`.
