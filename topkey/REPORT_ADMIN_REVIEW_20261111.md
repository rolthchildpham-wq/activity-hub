# Bản sửa để duyệt: PPT tự động / mẫu tải lên và quản trị tài khoản

Nguồn: https://github.com/rolthchildpham-wq/activity-hub

Commit gốc: `f544c0b327868d81c751eed9ca2c66042966b5c2`

Nhánh cục bộ: `fix/report-template-and-admin-review`

Phát hành H121 qua GitHub theo xác nhận của chủ dự án; trạng thái website được xác minh riêng. Không ghi Firebase thật.

## Luồng PPT và deployment nhẹ

Khi xuất báo cáo, người dùng chọn **Tự động** hoặc **Theo mẫu tải lên**. Chế độ tự động tạo PPT từ dữ liệu giải mà không cần file mẫu. Chế độ theo mẫu đọc thứ tự slide từ PPTX tải lên, hiển thị danh sách để chọn slide, nguồn dữ liệu và ô chữ cần điền. Có thể dùng mẫu bất kỳ, không còn bắt buộc cấu trúc 9 slide. Mẫu có các thẻ `{{results}}`, `{{finance}}` sẽ được gợi ý nguồn dữ liệu tương ứng; mẫu không có thẻ dùng lựa chọn ô chữ thủ công.

Mỗi mục có lựa chọn ảnh/tệp riêng, chỉ hiện nút chọn tệp khi được tích. Ảnh được chèn vào trang phụ lục của mục đó. Với mẫu tải lên, trang ảnh sao chép bố cục và dùng ô nội dung được chọn làm khung ảnh. Các tệp khác được đóng trong ZIP cùng PPT, chia thư mục theo mục. Bỏ tích mục hoặc đính kèm thì các tệp đó không được xuất.

Mẫu và tệp ở trong phiên trình duyệt, không ghi máy chủ. Đổi mẫu dựng lại danh sách slide và bỏ các tệp gán theo mẫu trước; đóng cửa sổ xuất xóa phiên chọn. Dữ liệu dài được chia trang, giữ theme/master/layout và tỷ lệ slide của mẫu.

Bộ đóng gói `tools/package_deployment.py` tạo thư mục/ZIP deployment, loại thư mục `report-templates`, PPT tham chiếu lớn, tài liệu và mã kiểm thử. Giữ thư viện PPT local và chỉ tải khi dùng chế độ tự động. Các file mẫu vẫn được giữ trong mã nguồn tham khảo, không xuất hiện trong gói deployment. Nếu deploy trực tiếp thư mục source `topkey` thì các tệp tham khảo vẫn còn; muốn gói nhẹ phải dùng thư mục output do bộ đóng gói tạo.

Các sửa lỗi trước vẫn được giữ: mô-đun H76 nhường nút xuất cho bộ mới, tải thư viện trước khi mở trình xuất, giải phóng trạng thái bận sau lỗi để có thể thử lại, và các luồng quản trị bên dưới.

## Quản trị hệ thống

Repository đã có trang đăng nhập `system-admin.html` tập trung tài khoản Firebase Auth, Backup/Restore, firewall/chống sao chép, vai trò và phân quyền chi tiết. Bản này giữ cấu trúc đó và sửa các luồng chỉnh sửa:

- Danh sách 7 môn có mặt trong form. Nạp tài khoản theo UID từ hồ sơ Firebase, không lấy tài khoản ADMIN đang đăng nhập để điền form.
- Nạp tên, email, vai trò, môn, trạng thái và quyền chi tiết. Hỗ trợ vai trò tùy chỉnh kế thừa BTC.
- Chặn phản hồi nạp tài khoản cũ ghi đè tài khoản mới khi đổi lựa chọn nhanh.
- Lưu bằng cập nhật các trường được chỉnh sửa, giữ các quyền khác chưa có trong giao diện; đóng form chỉ sau khi ghi thành công.
- Phân biệt rõ tài khoản và vai trò trong trình sửa quyền chung, tránh lưu nhầm quyền vai trò vào tài khoản trước đó.
- Tài khoản quản trị đã bị vô hiệu hóa không được mở trang quản lý.

## Báo cáo tự động

Giữ cơ chế tự tạo snapshot và hiện nút tải khi tất cả trận có trạng thái cuối. Bổ sung chữ ký thay đổi theo mã giải, thông tin đội và cấu hình để tránh dùng báo cáo của giải trước sau khi chuyển giải. Các lần lưu snapshot dùng mã giải của chính báo cáo.

## Kiểm tra

- 11 nhóm kiểm thử mới trong `tests/ppt-upload-wizard.cjs` về chế độ tự động, mẫu tùy ý, đổi mẫu, đủ dữ liệu/chia trang, giữ theme, cấu trúc relationships, loại slide không chọn, đính tệp và ảnh, và xóa phiên xuất.

- 16 nhóm kiểm thử DOM ngoại tuyến trong `tests/report-admin-review.cjs`: 7 template, đủ dữ liệu và thứ tự trang; ẩn mục; tranh chấp bộ xuất cũ/mới; xuất liên tiếp và thử lại; báo cáo sau trận cuối; đổi giải; tải thư viện một lần; chọn môn, nạp/lưu/đóng tài khoản; phân biệt tài khoản/vai trò; tài khoản bị vô hiệu hóa.
- 5 bộ hồi quy đăng nhập/cache/host hiện có đều đạt.
- Kiểm thử kết nối Auth/Test Lab H120 P2 đạt 5/5.
- Kiểm tra cú pháp JavaScript và `git diff --check`.
- Xuất PPT dữ liệu giả lập qua chính bộ xuất đã sửa, chuyển thành PDF bằng LibreOffice và xem các trang bìa, tổng quan, thành tích, BXH chi tiết, kết quả. Không kiểm tra bằng Microsoft PowerPoint.

Chạy kiểm thử mới từ gốc repository, với `jsdom` và `jszip` trong môi trường Node:

```sh
node topkey/tests/report-admin-review.cjs
```

Các bài đăng nhập hiện có chạy từ gốc repository:

```sh
node --test topkey/tests/badminton-auth-boot.test.cjs topkey/tests/badminton-auth-overlay.test.cjs topkey/tests/auth-profile-pending.test.cjs topkey/tests/auth-p5-cache.test.cjs topkey/tests/edgeone-host-redirect.test.cjs
```

## Giới hạn và bước nghiệm thu còn lại

Không đăng nhập hay ghi Firebase production. Kiểm thử DOM dùng Firebase giả lập; chưa thay cho kiểm thử trình duyệt với tài khoản và dữ liệu thật. Chromium cục bộ không khởi động được vì môi trường chặn socket. Chưa chạy Restore hoặc lưu firewall thật, chưa triển khai hay thay đổi Security Rules.

Sau khi bản sửa được duyệt và triển khai trên môi trường thử nghiệm, cần kiểm tra: đăng nhập, mở báo cáo giải lần 8, thử chế độ tự động và tải mẫu riêng, tích/bỏ mục và ảnh/tệp, xuất PPT hai lần liên tiếp, kiểm tra đủ các nội dung và kết quả; thử tài khoản BTC đúng/sai môn và lưu quyền trên tài khoản thử nghiệm.

Các file `template-fixture.pptx` và `template-fixture.pdf` trong gói duyệt dùng dữ liệu giả lập để xem mẫu, không phải báo cáo thật của giải TOPKEY lần 8.
