# TOPKEY Volleyball — Kiểm tra trạng thái lưu đơn đăng ký và đội hình (17/11/2026)

## Bằng chứng trước khi sửa
- Người dùng báo nhập đội và thành viên từ biểu mẫu đăng ký nhưng mở đội chỉ có 0 cầu thủ.
- Trang quản trị đang mở (Browser read-only) hiển thị **0 chờ duyệt, 4 đã duyệt, 4 đã ghép đội**.
- T001 MÀI NHÁM, T002 VĂN PHÒNG, T003 TRANG TRÍ, T004 PHÔI THÔ đều hiển thị **0 cầu thủ**.
- Luồng nguồn VNext: người dùng gửi `App.publicRegister` ghi `registrations/<registrationId>/roster`; khi duyệt, `App.approveRegistration` tạo `teams/<teamId>/roster` từ dữ liệu đơn.
- Dữ liệu đội còn tồn tại, lịch không bị mất theo ảnh. **Chưa có quyền kiểm tra trực tiếp nội dung đăng ký gốc qua Firebase authenticated SDK** trong phiên kiểm toán; không khẳng định dữ liệu roster đã bị xóa.

## Cơ chế kiểm tra mới trong Admin Bóng chuyền
- `src/volleyball-roster-registration-audit.js` chèn mục **Kiểm tra dữ liệu đăng ký & đội hình** cạnh danh sách đăng ký chờ duyệt.
- Chỉ ADMIN hoặc người có `permissions.modules.teams=edit` sử dụng. Bấm nút **Kiểm tra dữ liệu đã lưu trên Firebase** mới đọc từng bản ghi `registrations/<id>` và `teams/<id>` liên quan. Không tải toàn bộ cây và không ghi trong lúc kiểm tra.
- Thông báo rõ trạng thái từng đội:
  1. `SAVED`: đội đã có danh sách cầu thủ;
  2. `RESTORABLE`: đơn gốc còn mảng `roster`, đội trống và liên kết `registrationId` khớp;
  3. `MISSING_IN_REGISTRATION`: cả đơn gốc lẫn đội không có `roster`;
  4. `UNVERIFIED_LINK/LINK_MISMATCH`: không an toàn để tự khôi phục;
  5. `NO_APPROVED_LINK/TEAM_MISSING`: thiếu liên kết hoặc thiếu đội.
- Nếu đơn gốc có trường `members` hoặc `players` nhưng không có `roster`, báo để đối chiếu thủ công; không tự đoán cách chuyển dữ liệu.
- Chỉ `RESTORABLE` mới có nút **Khôi phục từ đơn gốc**. Nút yêu cầu xác nhận, đọc lại Firebase 2 lần để hạn chế ghi nhầm, ghi duy nhất `teams/<teamId>/roster` và `updatedAt`. Không thay mã đội, kết quả, lịch, tài chính hoặc quyền.
- Khi Firebase offline, bị từ chối, hoặc chưa có quyền đọc, báo **KHÔNG XÁC MINH ĐƯỢC**; không kết luận dữ liệu đã mất. Tài khoản Viewer không nhìn thấy công cụ này.

## Kiểm thử mã nguồn
- Snapshot GitHub branch `fix/volleyball-registration-save-audit-20261117` commit `708554ca4cb03330726fb134a3eddf4ee42a3d5d`.
- `node topkey/sports/vnext/tests/volleyball-roster-registration-audit.test.cjs`: PASS (dữ liệu duyệt, đội trống, thiếu roster, liên kết sai, chưa được duyệt, không tự ghi).
- `node topkey/sports/vnext/tests/volleyball-roster-csv-recovery.test.cjs`: PASS.
- Ba bài H95 VM: thoát mã 0, in dòng PASS; riêng `h95_large_data_render_vm.js` vẫn ghi stderr cảnh báo `TOPKEY VNext boot TypeError` trong giả lập, cần kiểm tra riêng; không xem là browser E2E.
- Static gate: **515 JS + 52 inline HTML + 62 JSON, 0 lỗi cú pháp**.
- Firebase auth/Emulator quyền, dữ liệu thật T001–T004, EdgeOne preview SHA, browser Android/Desktop, performance: NOT TESTED.

## Triển khai
- PR #65 trước đó đã merge vào `main` tại SHA `8fa8e49c6b280f3808da94d32f94c479342cc206` (bản import CSV).
- Công cụ đối chiếu lưu Firebase và nút khôi phục mới đang ở **nhánh riêng**, chưa triển khai production.
- Không dùng GitHub Actions. Không sửa Firebase Rules. Không thao tác vào dữ liệu thi đấu thật trước khi xác minh quyền và kiểm thử preview.
- Trạng thái phát hành: **BLOCKED — NOT VERIFIED**.
