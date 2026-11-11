TOPKEY — BẢN DUYỆT PPT TẢI MẪU / DEPLOYMENT NHẸ — 11/11/2026

Phát hành H121 qua GitHub theo xác nhận của chủ dự án; không tự ghi Firebase production.

CÁCH DÙNG
1. Mở Xuất Báo cáo toàn giải.
2. Chọn Tạo tự động từ dữ liệu giải hoặc Theo mẫu tải lên.
3. Tự động: tích các mục muốn xuất; không cần có mẫu trên máy chủ.
4. Theo mẫu: tải file .pptx (tối đa 30 MB). App đọc slide thành danh sách,
   không bắt buộc mẫu 9 slide. Chọn mục cần xuất, nguồn dữ liệu và ô chữ
   nhận dữ liệu/tiêu đề cho từng slide. Có thể đổi mẫu bất cứ lúc nào.
5. Mục cần hình ảnh/tệp: tích Mục này cần ảnh / tệp đính kèm, rồi chọn tệp.
   Không tích thì app không đính các tệp đã chọn trước đó.
6. Ảnh JPG/PNG/WebP tạo trang ảnh sau mục tương ứng. Với mẫu tải lên,
   trang ảnh dùng lại bố cục và đặt ảnh vào khung nội dung đã chọn.
7. PDF, Word, Excel, CSV, TXT hoặc PPTX đi kèm báo cáo trong gói ZIP.
   Đây là tệp đi kèm, không tự chuyển tài liệu thành ảnh trong slide.

LƯU Ý VỀ MẪU
- Giữ nguyên theme, master, layout và kích thước slide.
- Các thẻ {{title}}, {{date}}, {{location}}, {{sport}} được điền tự động.
- Có thể dùng {{summary}}, {{champions}}, {{prizes}}, {{rankings}},
  {{results}}, {{finance}}, {{thanks}} trong ô nội dung để app gợi ý nguồn dữ liệu.
- Mẫu bất kỳ không có thẻ vẫn dùng được bằng cách chọn ô chữ và nguồn dữ liệu.
- Nội dung dài được chia trang bằng cách sao chép bố cục của slide đó.
- Mẫu và ảnh/tệp chỉ ở trong bộ nhớ phiên xuất trên trình duyệt. Đóng cửa sổ
  xuất sẽ xóa lựa chọn; lần sau có thể tải lại mẫu mới. Không đưa lên Firebase.
- Tối đa 150 slide mẫu, 60 tệp, tổng tệp đính kèm tối đa 80 MB.

GÓI DEPLOYMENT
- ZIP này có index.html ngay ở gốc, không có thư mục bọc topkey/.
- Đã loại template PPT có sẵn, file PPT tham chiếu lớn, tài liệu và mã kiểm thử.
- Code tạo PPT chỉ tải thư viện khi dùng. Không cần deploy lại để đổi mẫu.
- Nếu build từ repository, chạy:
    python3 topkey/tools/package_deployment.py --output dist --zip topkey-deploy.zip
  Sau khi được duyệt, dùng dist làm thư mục output hoặc upload ZIP deployment.
  Upload toàn bộ gói cùng lúc; chưa có thay đổi hosting hoặc Firebase nào được
  thực hiện tự động bởi bản sửa này.

KIỂM TRA
- 11 nhóm kiểm thử mới về chọn chế độ, tải/đổi mẫu, chia trang, giữ theme,
  bỏ slide không chọn, đính tệp thật, tích/bỏ ảnh/tệp và xóa phiên xuất.
- 16 nhóm kiểm thử báo cáo/quản trị trước đó và 5 bộ hồi quy đăng nhập/cache.
- PPT dữ liệu giả lập đã được xuất PDF bằng LibreOffice để kiểm tra bố cục.
- Chưa thử đăng nhập/ghi dữ liệu thật trên production; cần nghiệm thu trình
  duyệt trên môi trường thử nghiệm trước khi triển khai chính thức.
