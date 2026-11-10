# H108 — Auth & Runtime Stability · Nền H107

**Trạng thái: STAGING / đã qua kiểm thử cục bộ được liệt kê; CHƯA xác nhận Firebase thực tế hay EdgeOne production.**

## Nguyên nhân đã xác nhận trong mã H107

- `hub-auth-flow.js` cấp vé truy cập `u122h105-20261108` dù `hub-entry-guard.js` của cả hai ứng dụng và `release-coordinator.js` kiểm tra `u122h107-20261108`. Vé bị từ chối ngay từ bước vào môn và chuyển về Hub trước khi xử lý đăng nhập.
- Cả Cầu lông và VNext đã có `submit` handler. Do đó lỗi **không phải** do thiếu hẳn `addEventListener('submit',...)` như giả thuyết ban đầu. Không thể `import { handleLogin } from './auth.js'` vì các tệp Auth hiện dùng IIFE/compat script, không export module ESM.
- Bản H107 còn tự phục hồi quyền từ JSON `localStorage` nếu không đọc được hồ sơ Firebase. Điều này có thể gây sai phân quyền khi ngoại tuyến và đã được sửa theo hướng **fail closed**.
- Quá trình mở giải sau đăng nhập có những nhánh `once('value')` tải toàn giải để dò giải hiện hành, gây chậm khi dữ liệu lớn. H108 chỉ kiểm tra cấu hình giải dựa trên chỉ mục; không tải toàn bộ trận/đội để suy đoán giải.

## Sửa đổi H108

1. Đồng bộ Hub, Badminton, VNext, release-coordinator, upgrade85 và manifest về **u122h108-20261109**. Thay tên cache Service Worker để không dùng lại ứng dụng cũ.
2. Bổ sung `h108-auth-guard.js` có một handler `submit` dùng chung theo capture phase, chống gửi lặp; đọc form qua `elements.namedItem`, hiển thị trạng thái xác thực rõ ràng; thử tải Firebase SDK từ hai CDN khi chưa sẵn sàng. Không tạo tài khoản/tokens/ADMIN phía trình duyệt.
3. Quyền được công nhận **chỉ sau khi đọc thành công hồ sơ người dùng từ Firebase Realtime Database**; không sử dụng `localStorage` làm nguồn quyết định quyền. SDK được nhớ trong RAM, không lưu mật khẩu.
4. Gắn một Auth observer mỗi ứng dụng; có thể thử đọc lại hồ sơ quyền sau lỗi mạng mà không đăng ký thêm listener.
5. Bỏ việc tải toàn bộ tournament trong bước dò giải khi đăng nhập, tránh nghẽn mạng; nếu thiếu tournamentIndex thì giữ giải đã chọn thay vì tải tất cả giải.
6. Các bảng đội/trận/nhật ký (và tài chính của Cầu lông) gom DOM node bằng `DocumentFragment` trước khi chèn vào bảng; giữ nguyên xử lý điểm và kết quả.
7. Giữ nguyên H107: PDF báo cáo cuối, giải thưởng, PPT 7 môn, Firebase V2, phân quyền và fullscreen.

## Kết quả kiểm thử cục bộ

- 404 tệp JS + 15 đoạn script trong HTML: **419/419 cú pháp hợp lệ**.
- Auth integration H83: **8/8 PASS**.
- Auth permissions H83: **26/26 PASS**.
- H108 Auth security: 4 trường hợp **PASS** (đọc role từ server / chống cache giả / một observer).
- Chromium DOM mock: 3 trường hợp **PASS** (mật khẩu sai, submit trùng, đúng credentials + profile hợp lệ, trường hợp không tải được profile).
- Firebase V2 pagination/aggregation: 12.000 đội + 12.000 trận + 12.000 giao dịch **PASS trên dữ liệu giả lập**.
- H108 version parity: PASS; 107 đường dẫn tài nguyên tĩnh: PASS.
- ZIP: sẽ kiểm tra CRC và số file sau khi đóng gói.

**Bài H95 performance acceptance cũ còn FAIL** ở `h95_subscription_render_vm.js` vì mock thiếu API `readPage` của H97; cùng lỗi này xảy ra trên H107 gốc. Đây là kiểm thử kế thừa chưa tương thích, **không** được tính PASS, cũng không phải bằng chứng về tốc độ runtime H108.

## Kiểm tra bắt buộc trước khi production

Cần dùng một Firebase staging thật cùng quy tắc bảo mật và dữ liệu sao chép đã ẩn danh. Kiểm tra đăng nhập đúng/sai, tài khoản bị vô hiệu, ADMIN/BTC/UMPIRE, mở 7 môn, F12 Network/Auth, số listener khi đổi tab, phân trang V2, tài chính, bảng xếp hạng, chấm điểm đồng thời, PDF/PPT và cập nhật Service Worker. Đo LCP, thời gian interactive, tổng tải Firebase và RAM sau 30 phút. **Chưa có kết quả cho các kiểm thử này** vì môi trường Chromium thử nghiệm chặn điều hướng URL thật (`ERR_BLOCKED_BY_ADMINISTRATOR`) và không có phiên đăng nhập Firebase staging.

## Triển khai an toàn

1. Giữ bản H107 ZIP và backup Firebase để rollback. H108 không thay đổi dữ liệu hay Firebase Rules.
2. Deploy **toàn bộ ZIP** lên staging, không chép một vài file. Đảm bảo Hub/Badminton/VNext cùng bản H108.
3. Kiểm tra `release.json`, `build.json`, `sports/badminton/build.json`, `sports/vnext/build.json` trả cùng `cacheTag` và `version`.
4. Thử đăng nhập trên cửa sổ ẩn danh; nếu vẫn lỗi, mở DevTools Console/Network và gửi lỗi Firebase cụ thể (không gửi mật khẩu/token).
5. Chỉ triển khai chính thức khi kiểm thử staging thật đạt; rollback toàn bộ nếu thất bại.
