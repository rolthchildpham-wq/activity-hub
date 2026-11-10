# H117 Production Stability P1

## Kết luận

Gói H117 đã được sửa và đóng dấu thành ứng viên production `2026.11.09-vnext-upgrade122-hotfix117-production-stability-p1`, cache tag `u122h117p1-20261109`.

Hai nguyên nhân chính đã được xử lý:

1. Luồng vào môn thể thao không còn ép đăng xuất Firebase khi người dùng đã có phiên hợp lệ. Hồ sơ quyền trong Realtime Database vẫn phải được xác minh trước khi mở giao diện quản trị.
2. Runtime tương thích và các module xuất báo cáo được tách khỏi đường tải đăng nhập. Báo cáo/PPT/ZIP chỉ tải khi có thao tác gọi tương ứng; các runtime còn lại chạy theo lô sau sự kiện `topkey:admin-ready`.

## Thay đổi chính

- Giữ UID Firebase hiện tại khi Hub tạo ticket mới; loại bỏ vòng `signOut` gây đăng nhập lần hai.
- Vẫn từ chối tài khoản ẩn danh, hồ sơ không tồn tại, hồ sơ bị khóa hoặc sai phạm vi môn.
- Dùng một production loader dùng chung, có promise idempotent để tránh tải trùng khi bấm nhanh nhiều lần.
- Badminton và VNext không còn nạp sớm QRCode, HLS, JSZip, H106, H112, H113 và H116 trên đường đăng nhập.
- Runtime tương thích được chia lô, giữ thứ tự thực thi và nhường main thread giữa các lô.
- Service Worker không pre-cache các module báo cáo tùy chọn.
- Toàn bộ Hub, Badminton, VNext, manifest, build metadata và Service Worker dùng cùng cache tag mới.

## Bằng chứng kiểm thử

| Nhóm | Kết quả |
|---|---:|
| Release integrity | 38/38 PASS |
| Club CRUD production isolation | 14/14 PASS |
| Club plan concurrency/conflict | 14/14 PASS |
| Dynamic i18n | 6/6 PASS |
| Translate proxy security | 6/6 PASS |
| Auth profile/security regression | PASS cho Badminton và VNext |
| Session restore không sign-out | PASS |
| Production loader idempotent/lazy | PASS |
| Runtime lifecycle | PASS |
| H104 data engine, 12.000 records | ALL PASS |
| JavaScript syntax | 420/420 PASS |
| JSON/manifest parse | 54/54 PASS |
| Inline scripts | 14/14 PASS |

Đường tải tĩnh ban đầu còn 8 script cho Badminton và 12 script cho VNext; không có script báo cáo tùy chọn nào trong hai danh sách này. Các con số này là kiểm tra đồ thị request tĩnh, không phải số đo mạng production.

## Cổng kiểm thử production còn mở

Không tuyên bố production live đã đạt tốc độ mục tiêu trong môi trường này:

- `https://topkey-activity-management.edgeone.dev/` bị proxy thực thi trả `403 CONNECT tunnel failed`.
- Runtime không có Chromium; Playwright cũng bị chặn 403 khi tải browser. Vì vậy phép đo cold/warm desktop/mobile được giữ ở trạng thái `BLOCKED`, không được ghi thành PASS.
- Chưa có quyền triển khai EdgeOne hoặc thông tin đăng nhập Firebase production, nên chưa thực hiện deploy hay kiểm thử ghi dữ liệu thật.

Sau khi triển khai, bắt buộc chạy `tests/h117/production_entry_smoke.cjs` trên máy có Chromium và kiểm tra thủ công bằng tài khoản production hợp lệ:

1. Mở Hub, chọn từng môn với phiên Firebase đã tồn tại; giao diện phải mở một lần, `signOutCount = 0`.
2. Chạy cold/warm trên desktop và mobile; ghi `interactiveMs` và request count cho cả Badminton/VNext.
3. Xác nhận không có request H106/JSZip/H112/H113/H116 trước thao tác xuất báo cáo.
4. Bấm từng chức năng báo cáo hai lần nhanh; mỗi dependency chỉ được tải một lần.
5. Kiểm tra tài khoản sai môn/bị khóa/ẩn danh vẫn bị từ chối.

## Triển khai và hoàn tác

Triển khai toàn bộ nội dung gói theo một lần atomic, không chép lẻ file. Sau deploy, purge cache EdgeOne cho HTML, `release-runtime.js`, manifest/build JSON và Service Worker; sau đó xác nhận cache tag `u122h117p1-20261109` ở Hub, Badminton và VNext.

Nếu cổng smoke production không đạt, hoàn tác toàn bộ về artifact production liền trước và purge lại cùng nhóm cache. Không hoàn tác riêng HTML hoặc Service Worker vì sẽ tạo trạng thái release trộn.

## Nguồn đối chiếu

- `H117_READ_ME_FIRST.md`, phần Production Stability P1.
- `release.json`, `build.json`, các manifest và Service Worker đã đóng dấu.
- `tests/h117/release_integrity.cjs`, `auth_session_restore.cjs`, `production_loader.cjs`, `inline_syntax.cjs`.
- `TOPKEY_H117_Pro_Audit_Fix_Tracking(2).xlsx`, danh mục kiểm tra/audit do người dùng cung cấp.
