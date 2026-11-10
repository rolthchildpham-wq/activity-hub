# TOPKEY H120 — bản rà soát để duyệt (không triển khai)

## Repository tham khảo
- https://github.com/ggtyl/tournado — giấy phép MIT (React/NestJS/PostgreSQL).
- Chỉ tham khảo kiến trúc quản lý giải, không sao chép, không thay thế Firebase hiện có.
- Không có ghi/chỉnh sửa nào lên repository của tác giả.

## Thay đổi đã thực hiện trên bản sao H120
- `system-admin.js`: mở phân quyền một tài khoản sẽ đọc trực tiếp hồ sơ Firebase RTDB mới nhất từ `users/{uid}`, sau đó nạp thông tin và editor đầy đủ.
- Tránh hiển thị sai tài khoản khi người dùng bấm chuyển nhanh giữa các tài khoản.
- Hai nút lưu quyền/tài khoản đều đóng editor sau khi lưu thành công. Lỗi đọc/ghi hiển thị thông báo thay vì tạo lỗi promise chưa xử lý.

## Phạm vi chưa sửa/được kiểm chứng
- Các form chọn môn hiện đã có danh sách tĩnh 7 môn và tính năng lưu trên H120; cần xác thực bằng tài khoản Firebase thực tế để kết luận lỗi đã hết.
- Các mục Firebase Auth, backup, tường lửa, role, quyền chi tiết đã có trang `system-admin.html` trong H120; chưa chỉnh các security rules của Firebase.
- Luồng tự tổng hợp báo cáo giải cần kiểm tra với dữ liệu hoàn thành thực tế; chưa thay đổi thuật toán, tránh làm sai BXH.
- Chưa kiểm thử trình duyệt kết nối Firebase hoặc triển khai.

## Kiểm tra
- `node --check system-admin.js`: PASS.
- Không merge, deploy hay sửa hệ thống bên ngoài.
