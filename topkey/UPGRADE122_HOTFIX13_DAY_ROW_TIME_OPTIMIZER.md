# Upgrade122 Hotfix13 — Day-row Time Optimizer

- Đặt nút `⏱ Sắp time` ngay trên từng dòng ngày trong bảng lịch.
- Khắc phục Hotfix12 không tối ưu được khi lịch cũ có nhiều trận cùng sân cùng giờ.
- Tạo lại slot giờ hợp lệ trong ngày thay vì chỉ hoán đổi tập giờ cũ.
- Giữ nguyên ngày và sân; không thay đổi trận LIVE/đã có điểm/đã kết thúc.
- Ưu tiên tránh cùng VĐV đánh hai lượt liên tiếp; nếu bắt buộc, ưu tiên trận MEN ở lượt trước.
- Có preview trước khi ghi Firebase và audit khi áp dụng.
