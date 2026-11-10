# UPGRADE122 HOTFIX76 - FINAL REPORT IMAGE INSERT

- Nút Xuất Báo cáo toàn giải mở hộp cấu hình chèn ảnh.
- Có thể thêm nhiều ảnh JPG/PNG/WebP.
- Mỗi ảnh chọn vị trí: sau Tổng quan, Thành tích chung cuộc, BXH, Lịch & Kết quả, Tài chính hoặc Mục hình ảnh cuối báo cáo.
- Mỗi ảnh có checkbox Có tiêu đề ảnh; chỉ khi tick mới cần nhập tiêu đề/chú thích.
- Mục hình ảnh cuối có tiêu đề tùy nhập.
- Xuất PDF trực tiếp (html2pdf; fallback trình in/Save as PDF) và PowerPoint .pptx (PptxGenJS).
- Ảnh chỉ nằm trong RAM của trình duyệt trong phiên xuất, không ghi Firebase/Database/IndexedDB/localStorage/sessionStorage. Sau khi xuất hoặc đóng hộp, ảnh tạm được giải phóng.
- Áp dụng cho Badminton và VNext multisport, gồm cả báo cáo giải hiện tại và báo cáo trong lịch sử.
