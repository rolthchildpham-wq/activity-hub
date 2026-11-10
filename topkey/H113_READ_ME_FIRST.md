# TOPKEY H113 – Báo cáo tài chính riêng, CSV/PDF và phụ lục chứng từ

Nền: H112 (kế thừa H111; giữ các phần sửa báo cáo H105–H107). Đây là bản **STAGING**, chưa kiểm thử đăng nhập/ghi Firebase hoặc EdgeOne production.

## Đối chiếu yêu cầu H105–H107

| Yêu cầu cũ | Tình trạng trong mã H113 | Giới hạn cần kiểm chứng |
|---|---|---|
| Cơ cấu giải thưởng trong báo cáo toàn giải (H105/H107) | Có trong luồng báo cáo HTML, PDF và đường lưu giải thưởng, có dữ liệu Test Lab theo H112 | Chưa xác nhận trên giải production thực tế |
| ADMIN sửa giải thưởng dù giải đã khóa luật (H105) | Bộ xử lý riêng trong `upgrade122-hotfix80.js` được giữ | Cần kiểm thử Firebase staging với 2 ADMIN đồng thời |
| Mẫu PPT riêng cho 7 môn, slide và ảnh tùy chỉnh (H105/H112) | Giữ `h112-ppt-template.js` và các `.pptx` theo môn | Cần xác nhận bản PPT sinh từ dữ liệu thật sau deploy |
| PDF cuối giải trắng (H106/H112) | Giữ bộ PDF nội bộ và nút in/lưu PDF của H112 | Cần kiểm thử EdgeOne/PWA thực tế |
| Báo cáo riêng tài chính (H113) | Bổ sung bảng chi tiết thu/chi, tổng bút toán và tổng đã thanh toán, CSV, PDF | Phân quyền chỉ mở khi tài khoản đã xác thực |
| Phụ lục chứng từ (H113) | Ảnh hiển thị trên trang riêng; chứng từ PDF có trang nhãn theo hạng mục và được nhúng nguyên gốc vào mục Attachments của PDF | Trình đọc PDF cần hỗ trợ mở danh sách tệp đính kèm. Không thể tự biến mọi trang PDF nguồn thành ảnh xem trực tiếp trong bản in HTML. |

## Xuất báo cáo tài chính

Mở **Tài chính** trong mỗi môn và chọn một trong ba nút mới:

- **Xuất CSV tài chính:** đầy đủ các giao dịch, trạng thái, số chứng từ, tên/link chứng từ và hàng tổng thu/chi/số dư; mã hóa UTF-8 BOM cho Excel.
- **Xuất PDF + chứng từ:** A4 ngang, các trang thống kê và giao dịch, cuối báo cáo là phụ lục. Ảnh chứng từ hiển thị trực tiếp; PDF chứng từ gốc nằm trong chính tệp PDF (Attachments/paperclip) và được liên kết bằng tiêu đề hạng mục/mã giao dịch.
- **In / Lưu PDF:** luồng in HTML giống Giải trình BXH; chỉ mở khi không có chứng từ dạng PDF nguồn, vì trình duyệt không bảo đảm đưa các trang PDF lồng vào bản in. Với chứng từ PDF, chọn nút Xuất PDF + chứng từ.

**Không được lược bỏ chứng từ không tải được:** nếu bản ghi có chứng từ nhưng Firebase Storage/CORS hay bộ nhớ IndexedDB không trả được tệp, hệ thống báo lỗi và dừng xuất PDF. Kiểm tra quyền và tệp trước khi xuất lại. Tệp lưu LOCAL_ONLY trên thiết bị khác sẽ không thể được xuất đủ cho đến khi upload lên Storage.

Tổng thu/chi kế toán là tổng các bút toán, khác tổng đã thanh toán. Chỉ xuất khi snapshot tài chính đã đầy đủ; bản H104 sẽ nạp đủ theo đợt khi cần.

## Đã kiểm thử cục bộ

- Chromium DOM: nút xuất tài chính, PDF ảnh + một hóa đơn PDF gốc, CSV, phân quyền VIEWER, trường hợp thiếu chứng từ.
- PDF: 5 trang đều có mực nội dung (PyMuPDF), tài liệu đính kèm đọc được (pypdf).
- Kiểm tra cú pháp, phiên bản, đường dẫn, test hồi quy cục bộ: chi tiết trong `H113_RELEASE_TEST_MATRIX.json`.
- Dữ liệu hóa đơn minh họa là **dữ liệu giả lập**. Tệp Test Lab người dùng gửi là JSON của kết quả kiểm tra 18/18, không chứa chứng từ thật; vì vậy không thể xác nhận chứng từ thật đã xuất được.

## An toàn và triển khai

Không đổi Firebase Rules, không ghi hoặc migrate dữ liệu, không thay đổi điểm số/lịch/giải thưởng. Deploy nguyên bộ lên staging; kiểm tra đăng nhập thật, quyền tài chính, chứng từ ảnh/PDF từ Storage và tải file bằng trình duyệt mobile/desktop trước production. Giữ bản H112 để rollback.
