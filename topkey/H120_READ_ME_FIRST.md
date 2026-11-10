# TOPKEY H120 - Auth Shell nhẹ và Header Mobile

## Mục tiêu bản phát hành

H120 xử lý hai lỗi production được ghi nhận trên điện thoại và luồng đăng nhập Cầu lông:

- Cầu lông và các môn VNext dùng chung `TopkeyPlatform.startSport()`; không còn nhánh đăng nhập riêng trong adapter.
- Form đăng nhập chỉ tải Firebase App/Auth/Database và Auth service dùng chung. Bundle nghiệp vụ Cầu lông 1,25 MB chỉ tải sau khi hồ sơ quyền trên Firebase đã được xác minh.
- Đối tượng Auth/Firebase được giữ nguyên khi core hydrate, tránh observer thứ hai và tránh yêu cầu đăng nhập lần hai.
- Đăng nhập thủ công chỉ báo thành công sau khi core đã hydrate và `App.afterLogin()` đã gắn vào phiên xác thực.
- Header Hub trên màn hình nhỏ mặc định thu gọn, có nút mở/thu với `aria-expanded` và nhớ lựa chọn; desktop luôn mở đầy đủ.
- Route công khai `#spectator`, `#register`, `#judge` giữ cơ chế lazy hiện tại.

Release: `H120`

Cache tag: `u122h120-20261110`

## Triển khai production

1. Sao lưu toàn bộ bản production đang chạy.
2. Upload toàn bộ nội dung ZIP H120 cùng một lần, giữ nguyên cấu trúc thư mục. Không trộn file H119/H120.
3. Xác nhận `release.json`, ba `build.json` và ba service worker đều mang tag `u122h120-20261110`.
4. Invalidate cache EdgeOne sau upload. Service worker H120 sẽ xóa cache shell cũ trong từng scope.
5. Không cần migration dữ liệu và không đổi Firebase rules/schema trong H120.

## Nghiệm thu bắt buộc sau deploy

1. Trên điện thoại hoặc DevTools mobile, Hub phải mở với header thu gọn; nút `+` mở đầy đủ và nút `-` thu lại. Reload phải giữ lựa chọn.
2. Mở Cầu lông từ Hub bằng cửa sổ riêng tư. Trước khi đăng nhập, Network không được tải `admin-core.h85full.js`.
3. Đăng nhập Cầu lông đúng một lần. Sau khi profile hợp lệ, core tải một lần và app mở; không quay lại form đăng nhập.
4. Refresh Cầu lông: Firebase phục hồi phiên và app mở lại, không yêu cầu nhập mật khẩu lần hai.
5. Lặp lại với một môn VNext, xác nhận cùng cơ chế `__TOPKEY_SPORT_BOOT`/`__TOPKEY_ENSURE_CORE`.
6. Kiểm tra BTC đúng môn, BTC sai môn, tài khoản disabled/suspended và các route công khai.
7. Ghi lại thời gian từ click Đăng nhập đến khi app sẵn sàng và log Network/Console nếu vượt 10 giây.

## Rollback

Khôi phục toàn bộ snapshot H119 cùng một lần. Không rollback riêng HTML, bundle hoặc service worker vì các file phải cùng cache tag.

## Giới hạn xác minh

Container đã chạy test VM, Auth/policy/rules, route công khai, syntax và release integrity. Browser smoke tự động bị chặn vì môi trường không có Chromium; endpoint EdgeOne/Firebase production không được sửa hoặc đăng nhập từ container. Nghiệm thu browser/live ở trên vẫn là cổng bắt buộc sau deploy.
