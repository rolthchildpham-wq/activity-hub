# TOPKEY Sports Hub VNext 2026 – H105 (STAGING)

**Nền kế thừa:** H104-R1 (không quay về H96). Giữ lại toàn bộ cấu trúc Firebase V2, tối ưu H103, sửa bố cục lịch H104-R1, quyền đăng nhập, fullscreen và hệ thống 7 môn.

## Tính năng mới

### A. Cơ cấu giải thưởng trong báo cáo cuối giải

- Trường `config/prizeStructure` hiện là nguồn cơ cấu giải chính thức. Mục **Cơ cấu giải thưởng** luôn có trong màn hình xuất PDF/PPT; nếu chưa cấu hình thì hiển thị rõ chưa có dữ liệu.
- Trong `Cấu hình giải & Rule Engine`, tài khoản `ADMIN` có nút **Lưu giải thưởng (ADMIN)** riêng. Nút này hoạt động ngay cả khi `rulesLocked=true` hoặc giải đã bắt đầu. Không mở khóa các luật tính điểm, không thay đổi trận, tỷ số, bảng xếp hạng hoặc tài chính.
- Ghi bằng `transaction` trên đúng nhánh `config/prizeStructure`, so sánh dữ liệu đã đọc để tránh ghi đè khi người khác sửa đồng thời. Sau ghi đọc lại kiểm chứng, ghi metadata và audit best-effort. Nếu có snapshot báo cáo cuối giải tương ứng, chỉ cập nhật phần `prizeStructure` của snapshot trong trường hợp được cấp phép.
- Quyền đọc/ghi vẫn do Firebase Security Rules hiện hành quyết định. Nếu Rules thực tế cấm thay đổi khi giải đã khóa, giao diện sẽ báo lỗi. Chưa kiểm thử với rules/đăng nhập Firebase staging thật.

### B. Báo cáo PPT tùy chỉnh của 7 môn

- Mở **Xuất Báo cáo toàn giải → Tạo PowerPoint**. Có 9 mục: Bìa, Tổng quan, Thành tích, Cơ cấu giải thưởng, BXH, Kết quả, Tài chính, Khoảnh khắc, Kết thúc.
- Với từng mục: tích chọn xuất hoặc bỏ, chỉnh tiêu đề, tích **Nội dung tùy chỉnh** để sửa nội dung, tải ảnh riêng cho mục. Ảnh JPG/PNG/WebP, tối đa **30 ảnh**, được xử lý trong trình duyệt, không gửi ảnh lên Firebase.
- PowerPoint được xuất dưới dạng `.pptx` với văn bản và các đối tượng có thể chỉnh trong PowerPoint. Màu và phong cách riêng cho Badminton, Football, Volleyball, Running, Handmade, Shuttle, Cooking; bộ font tương thích và UTF-8.
- Có nút **Tải mẫu PowerPoint chuẩn** theo môn; các mẫu nằm trong `/report-templates/`. Mỗi mẫu 9 slide 16:9, có ô thay ảnh và nội dung mẫu. Nấu ăn lấy cảm hứng ảnh hoạt động màu ấm, Chạy bộ thể thao nền xanh đậm điểm vàng từ 2 tài liệu bạn cung cấp; không sao chép toàn bộ ảnh cá nhân từ PPT gốc sang bản web.
- Thay đổi tiếng Việt trong điều khiển xuất, tránh tình trạng lẫn label tiếng Anh.

## Phạm vi giữ nguyên

- H104 Firebase v2: chỉ mục, phân trang đội/trận/tài chính, giới hạn render, guard tránh tính kết quả từ trang dữ liệu thiếu.
- Quy tắc thi đấu và xử thua, kết quả lịch sử, BXH, phân quyền, đồng bộ Hub – Badminton – VNext, fullscreen, bố cục mobile và highlight đội thắng của H104-R1.
- Không có script tự ý migration hoặc ghi dữ liệu production. Không thay Firebase Rules hiện tại.

## Triển khai và kiểm thử

1. Sao lưu Firebase trước thử nghiệm. Dùng **môi trường staging riêng** và triển khai **toàn bộ ZIP** (không chép lẻ tệp). Đảm bảo Hub, Badminton và VNext hiện `releaseId=H105`, `cacheTag=u122h105-20261108`; không thay đổi phân quyền gốc.
2. Chạy login ADMIN và viewer/BTC, mở 7 môn, kiểm tra gián đoạn/kết nối lại, thử sửa cơ cấu giải trong giải đã khóa và đổi từ thiết bị thứ hai. Đối chiếu dữ liệu bằng sao lưu.
3. Xuất PDF + PPT cho giải chưa và đã kết thúc, sử dụng ảnh và nội dung tùy chỉnh. Xác nhận kết quả, BXH, số dư và giải thưởng không bị thay đổi ngoài trường dự kiến.
4. Kiểm tra tự động có thể chạy trong thư mục mã nguồn: `python h105-tests/acceptance.py`, `python h105-tools/test_report_ui.py`, `node h104-tests/v2-engine.test.js`, `node tests/ppt_export_h88.js`.
5. Nếu phát hiện lỗi, rollback deploy về gói H104-R1 đã lưu; không rollback dữ liệu bằng cách ghi đè toàn bộ database đang chạy.

## Trạng thái nghiệm thu

**PASS kiểm thử cục bộ/mô phỏng, CHƯA PASS triển khai production.** Đã kiểm tra cú pháp JS, JSON, manifest/cache, quyền ADMIN/VIE​WER và xung đột sửa giải thưởng trong mock Firebase, PDF/PPT của 7 môn trong Chromium mô phỏng, toàn vẹn 7 mẫu PPTX, kiểm thử data V2 12.000 bản ghi/nhóm và không tràn layout PowerPoint. **Chưa có kết nối thực sự với Firebase staging và EdgeOne để xác nhận giao dịch xuyên thiết bị hoặc toàn hệ thống production.**

Xem `H105_STATIC_TEST_REPORT.json`, `H105_UI_AND_PPT_RUNTIME_TEST.json`, `H105_RELEASE_TEST_MATRIX.json`.
