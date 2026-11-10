# Upgrade122 Hotfix14 — ADMIN Force Date Override

- Trong popup Xử lý các trận CHƯA XẾP, ngày do ADMIN chọn trở thành lựa chọn FORCE OVERRIDE.
- Khi bấm Lưu & ÉP lịch, bỏ qua các rule nghiệp vụ: quota/ngày, ngày bận, giới hạn VĐV/đội, nghỉ giữa trận, time window và required rules.
- Hệ thống vẫn cố tránh hai trận đè cùng một sân/cùng thời gian; nếu cần sẽ tạo slot kế tiếp trong ngày.
- Ghi audit `SMART_SCHEDULE_FORCE_OVERRIDE` với danh sách trận/date/time/court.
- Các ngày từng bị disabled bởi hard rule được mở cho ADMIN chọn trong modal này.
