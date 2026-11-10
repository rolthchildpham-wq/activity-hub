# H107 - Cơ cấu giải thưởng trong Báo cáo cuối giải

Nền: H106. Không thay đổi dữ liệu Firebase, kết quả trận, phân quyền, xếp hạng.

- Bổ sung bảng tên giải, số lượng, giải thưởng và ghi chú trong bản HTML báo cáo truyền thống (H65).
- Đồng nhất bảng giải thưởng trong bản xem trước/in/PDF mới (H80), bao gồm Cầu lông và sáu môn VNext.
- Bảo toàn cơ cấu từ snapshot của giải đã lưu; tránh danh sách trống của archive xóa danh sách giải thưởng hợp lệ.
- Luôn thể hiện mục giải thưởng; nếu chưa thiết lập sẽ hiện thông báo thay vì biến mất.
- Kiểm tra báo cáo có nhãn TOPKEY REPORT H107 hoặc meta topkey-report-build=H107 để nhận biết cache cũ.
- Đồng bộ release H107, cache-buster và Service Worker; triển khai toàn bộ ZIP, không copy rời.

Lưu ý: H107 đã qua kiểm thử cục bộ về render HTML và xuất PDF bằng dữ liệu mẫu. Chưa thử nghiệm Firebase production thật; không coi staging là production PASS.
