# UPGRADE122 HOTFIX83 - FULL WEB CONSOLIDATION

Ngày phát hành: 2026-11-07  
Build: `u122h83-20261107`  
Version: `2026.11.07-vnext-upgrade122-hotfix83-full-web-consolidation`

## Mục tiêu

Hotfix83 là bản hợp nhất toàn web, không phải một bản vá cục bộ tiếp tục chồng lên chuỗi Hotfix71-82. Mục tiêu của bản này là đưa Hub, Cầu lông và toàn bộ VNext về cùng một cơ chế đăng nhập/quyền, cùng version authority, cùng chính sách báo cáo và cùng bộ acceptance test trước khi deploy.

## Các lỗi gốc đã phát hiện và xử lý

1. **Bootstrap Cầu lông có lỗi cú pháp thật**: danh sách runtime trong `sports/badminton/index.html` bị thiếu dấu đóng sau Hotfix80. Giao diện login tĩnh vẫn có thể hiện, nhưng bootstrap/auth có thể không chạy đúng hoặc trình duyệt dùng cache cũ.
2. **Nhiều version authority xung đột**: manifest, bundle, Cầu lông, VNext và production đang báo các version khác nhau. H83 thêm release authority chạy cuối và chuẩn hóa toàn bộ về `u122h83-20261107`.
3. **Auth bị chia thành nhiều cơ chế**: fresh-login flag, hubTicket và Firebase session có thể đá nhau tạo vòng lặp `select-sport`. H83 dùng một state machine chung cho Cầu lông và VNext.
4. **Alias môn tiếng Việt lỗi với Đ/đ**: chuẩn hóa Unicode cũ không đổi `Đ` thành `D`, làm `Bóng đá`/`Đá cầu` có thể sai scope. H83 chuẩn hóa bổ sung `đ -> d`.
5. **VNext reload URL sạch**: session hợp lệ giờ có thể khôi phục môn đã chọn nếu query `sport=` bị mất sau reload/navigation nội bộ.
6. **System Admin đọc scope legacy**: các giá trị như `Cầu lông`, `🏸 Cầu lông`, `Bóng đá`... được canonicalize về sport key khi load tài khoản.
7. **Cơ chế Cầu lông chưa reapplied đầy đủ cho VNext**: H83 kiểm tra parity các hotfix dùng chung và chức năng quản lý sân/khu vực trên 6 môn VNext.
8. **Báo cáo đa ngôn ngữ có recursion bug**: dictionary `L()` từng tự gọi chính nó ở một số nhãn, có thể gây `Maximum call stack`. Đã thay bằng dictionary literal và kiểm thử fixture.
9. **Báo cáo đa ngôn ngữ chưa xuyên suốt**: các heading/table/finance/image labels hard-code được đưa vào cùng dictionary 3 chế độ `vi-en`, `vi-zh`, `en-vi-zh`.
10. **PDF trắng**: bỏ phụ thuộc vào luồng html2pdf/jsPDF CDN và DOM slice dễ render ngoài viewport. H83 raster từng trang báo cáo, kiểm tra trang trắng, rồi tự dựng PDF binary từ JPEG page objects; có fallback printable HTML khi raster thất bại.
11. **PPT phụ thuộc CDN**: PptxGenJS browser bundle được đóng gói local trong `vendor/pptxgen.bundle.js` và cache cùng release.
12. **Test Lab dùng namespace cũ**: giữ namespace `__testlab_u122_20261031_...` để tương thích Firebase Rules, nhưng route/runtime/build được ép về H83 để fixture chạy code mới.

## State machine đăng nhập H83

Session key chung: `topkey_hub_session_v83`.

- `SELECTED`: người dùng vừa chọn môn từ Hub, lần đầu bắt buộc login.
- `LOGIN_SUBMITTED`: form login đã submit cho đúng môn.
- `AUTHENTICATED`: Firebase xác thực thành công và role/sportScope hợp lệ.

Quy tắc:

- ADMIN được vào mọi môn sau khi xác thực.
- BTC chỉ được vào sportScope đã gán.
- BTC sai môn: sign-out + báo không có quyền + quay Hub.
- Tài khoản DISABLED: từ chối.
- Reload/F5 sau khi `AUTHENTICATED`: không sign-out, không yêu cầu lại hubTicket trên URL.
- Chọn môn mới từ Hub: tạo session môn mới và yêu cầu fresh login cho môn đó.
- Direct access chưa có session Hub hợp lệ: quay Hub.

## Reapply/parity toàn môn

H83 kiểm tra Cầu lông và 6 môn VNext: Bóng chuyền, Bóng đá, Chạy bộ, Đá cầu, Nấu ăn, DIY/Handmade.

- Auth/role/sportScope: cùng cơ chế session state machine.
- Central system admin: cùng policy.
- Executive dashboard/BTC scope: cùng policy.
- Final report images: cùng module.
- Report languages: cùng module.
- Venue delete/rename: VNext có cơ chế an toàn tương đương; không xóa khi LIVE hoặc có lịch sử đã thi đấu.
- Nấu ăn/DIY: nhãn venue là **Khu vực (Sảnh)**.

## Báo cáo

- 3 chế độ ngôn ngữ: Việt-Anh, Việt-Trung, Anh-Việt-Trung.
- Cơ cấu giải thưởng tùy chỉnh.
- Ảnh chỉ giữ trong phiên tạo báo cáo; không lưu Firebase/localStorage/sessionStorage.
- Ảnh được chunk vào các block báo cáo để tránh một trang quá tải.
- PDF: internal image-PDF builder + blank-page detection.
- PPTX: TKT-style report + local PptxGenJS bundle.

## Version/cache/deploy

- Release badge phải hiển thị: **H83 · FULL CONSOLIDATED**.
- Hub, Badminton, VNext và Service Worker dùng `u122h83-20261107`.
- `TOPKEY_PACKAGE_MANIFEST.json` là nguồn version release chính.
- EdgeOne no-cache áp dụng cho Hub/auth/sport guards/system-admin/change-password để tránh kéo lại auth cũ.

## Lưu ý kiểm thử production

Tại thời điểm audit ngày 2026-11-07, public production vẫn đang phục vụ H82 ở đường Cầu lông. H83 phải được deploy trước khi đánh giá lại hành vi production.

Không có mật khẩu thật dạng rõ trong gói/test, vì vậy H83 không đăng nhập bằng thông tin tài khoản production của người dùng. Thay vào đó, auth source thật được chạy qua Firebase mock/integration test với ADMIN, BTC Cầu lông, BTC Bóng chuyền, sai môn và DISABLED để kiểm tra toàn bộ transition/sign-out/redirect.

Chromium headless trong môi trường kiểm thử container không hoạt động ổn định do D-Bus/runtime, nên không tuyên bố click-export PDF end-to-end trong browser automation. Tuy nhiên binary PDF builder đã được smoke-test, tạo PDF 2 trang, render lại bằng PDF renderer và xác nhận nội dung không trắng.

## Quy tắc cho các bản sau

Không gửi bản vá cục bộ chỉ sửa một môn hoặc một role. Mọi thay đổi phải chạy lại full acceptance gồm Hub, ADMIN, ít nhất 2 BTC khác môn, reload, đổi môn, quyền, báo cáo, System Admin, Test Lab và parity Cầu lông/VNext trước khi đóng gói.
