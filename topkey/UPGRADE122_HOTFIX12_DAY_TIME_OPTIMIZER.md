# Upgrade122 Hotfix12 — Day Time Optimizer

- Thêm nút **⏱ Sắp time trong ngày** tại Lịch & BXH.
- Chỉ hoán đổi giờ của các trận chưa bắt đầu trong cùng ngày; giữ nguyên ngày và sân.
- Không chạm LIVE, trận đã có điểm, đã kết thúc hoặc trạng thái bảo vệ.
- Ưu tiên tránh cùng VĐV thi đấu ở hai lượt thời gian liên tiếp.
- Nếu xung đột liên tiếp không thể tránh hoàn toàn, ưu tiên trận **MEN (đôi Nam-Nam)** ở lượt sớm hơn.
- Có preview trước/sau và chỉ ghi Firebase khi ADMIN xác nhận.
- Audit action: `DAY_TIME_OPTIMIZE`.
