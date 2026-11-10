# TOPKEY H119 - Unified Platform Auth & MultiSport Policy

## Mục tiêu bản phát hành

H119 khắc phục luồng đăng nhập Cầu lông tải chậm, đăng nhập xong quay lại màn hình đăng nhập và sự khác biệt cơ chế giữa Cầu lông với các môn VNext.

- Một bộ nạp Firebase dùng chung: Firebase App tải trước; Auth và Database tải song song khi cần.
- Một trình xử lý đăng nhập duy nhất, có khóa chống submit lặp.
- Không hiển thị lại màn hình đăng nhập khi Auth/profile chỉ mất kết nối tạm thời.
- Một policy role, sport scope và trạng thái tài khoản cho 7 môn.
- Route công khai chỉ tải Database; Auth chỉ tải khi route cần đăng nhập.
- Optional report/media vẫn nằm ngoài đường tải đăng nhập.
- Firebase rules canonical và bản mirror được kiểm tra parity khi build.

Release: `H119`

Cache tag: `u122h119-20261109`

## Triển khai production

1. Sao lưu toàn bộ bản production H118 đang chạy.
2. Upload toàn bộ nội dung ZIP H119 cùng một lần và giữ nguyên cấu trúc thư mục. Không trộn file H118/H119.
3. Xác nhận `release.json`, ba `build.json` và ba service worker đều mang tag `u122h119-20261109`.
4. Chỉ triển khai `firebase.database.rules.json` và `firebase.storage.rules` từ gói này sau khi đã đối chiếu project Firebase production. Rules không thay đổi schema dữ liệu.
5. Invalidate cache EdgeOne nếu nền tảng không tự nhận file mới. Service worker H119 sẽ loại cache shell cũ theo từng scope.

## Nghiệm thu bắt buộc sau deploy

1. Mở Hub bằng cửa sổ riêng tư, chọn Cầu lông và đăng nhập một lần.
2. Xác nhận app không quay lại màn hình đăng nhập và không phát sinh lần sign-in thứ hai.
3. Refresh trang Cầu lông: phiên Firebase được phục hồi, không yêu cầu nhập lại mật khẩu.
4. Chuyển lần lượt qua Bóng đá, Bóng chuyền, Chạy bộ, Đá cầu, Handmade và Nấu ăn; kiểm tra cùng tài khoản/role/sport scope cho kết quả thống nhất.
5. Kiểm tra tài khoản BTC đúng môn được vào, BTC sai môn bị từ chối, tài khoản disabled/suspended bị từ chối.
6. Kiểm tra `#spectator`, `#register`, `#judge` không tải Auth không cần thiết và vẫn xem/gửi dữ liệu đúng rules.
7. Trong DevTools Network, xác nhận không còn chuỗi timeout Firebase tuần tự khoảng 30 giây và không có hai request đăng nhập do submit trùng.

## Rollback

Khôi phục toàn bộ snapshot H118 cùng một lần. Không rollback riêng HTML, bundle hoặc service worker vì các file phải cùng cache tag.

## Giới hạn xác minh

Container đã chạy đầy đủ kiểm thử VM, rules, syntax, release integrity và nghiệp vụ chọn lọc. Endpoint EdgeOne và Firebase production không truy cập được từ môi trường kiểm thử; Playwright cũng không được cài. Vì vậy nghiệm thu browser/live ở trên vẫn là cổng bắt buộc sau deploy.

