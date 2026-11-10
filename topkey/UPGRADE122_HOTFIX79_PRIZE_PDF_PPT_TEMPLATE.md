# UPGRADE122 HOTFIX79 - Prize structure + nonblank PDF + TKT PPT template

## 1. Cơ cấu giải thưởng
- Thêm editor `Cơ cấu giải thưởng` trong Cấu hình giải.
- Mỗi hạng mục có: tên giải, số lượng, giải thưởng/phần quà, ghi chú.
- Có thể thêm/xóa không giới hạn theo nhu cầu.
- Khi ADMIN tạo giải mới, wizard tạo giải hiển thị sẵn các dòng: Giải Nhất, Nhì, Ba, Khuyến khích, Quà toàn giải; có thể sửa/xóa/thêm trước khi tạo.
- Dữ liệu lưu tại `config/prizeStructure` và được snapshot vào báo cáo cuối giải.

## 2. PDF
- Giữ layout báo cáo PDF hiện tại.
- Thêm mục `Cơ cấu giải thưởng` và hỗ trợ ảnh ở vị trí sau mục này.
- Sửa lỗi preview có nội dung nhưng file PDF tải xuống trắng: không còn render một canvas siêu dài/offscreen.
- Render theo từng lát A4 an toàn rồi ghép bằng jsPDF; kiểm tra kích thước file trước khi tải.
- Nếu thư viện tự động lỗi, mở bản in đầy đủ để người dùng Save as PDF.

## 3. PowerPoint
- Xuất PPTX 16:9 theo ngôn ngữ thiết kế của mẫu TKT do người dùng cung cấp:
  - nền nâu đậm,
  - tiêu đề trắng,
  - điểm nhấn vàng,
  - logo TOPKEY góc trái,
  - bố cục ảnh/collage,
  - slide Cơ cấu giải thưởng,
  - slide kết `THANKS FOR WATCHING / CẢM ƠN / 謝謝观看`.
- Ảnh người dùng chọn vẫn chỉ tồn tại trong phiên xuất, không ghi vào Firebase/Database.

## 4. Test
- JavaScript syntax check: PASS cho Badminton và VNext.
- PptxGenJS smoke deck: PASS, không overflow; đã render kiểm tra montage.
- PDF renderer đã đổi sang cơ chế chia trang để tránh giới hạn canvas chiều cao trong trình duyệt.
