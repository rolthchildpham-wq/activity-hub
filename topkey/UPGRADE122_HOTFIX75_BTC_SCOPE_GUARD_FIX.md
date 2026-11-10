# UPGRADE122 HOTFIX75 - BTC SPORT SCOPE GUARD FIX

- Sửa vòng lặp đăng nhập/chặn sai đối với tài khoản BTC đã được gán đúng môn.
- `Hotfix64` trước đây chỉ đọc `T.SPORT.key`; riêng Badminton có thời điểm biến này rỗng nên bị hiểu nhầm là đang mở môn khác.
- Xác định môn hiện tại theo thứ tự: `T.SPORT.key` -> query `sport` -> pathname `/badminton/`.
- Chuẩn hóa `sportScope/assignedSport` để tương thích dữ liệu cũ như `Cầu lông`, `🏸 Cầu lông`, `badminton`.
- Khi Firebase đã đăng nhập và tài khoản BTC đúng môn, giữ nguyên phiên và vào app; không bắt đăng nhập lại.
- Chỉ từ chối khi tài khoản disabled, BTC chưa gán môn, hoặc môn được gán thực sự khác môn đang mở.
