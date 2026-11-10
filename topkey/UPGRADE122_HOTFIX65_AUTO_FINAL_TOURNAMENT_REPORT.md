# Upgrade122 Hotfix65 - Auto Final Tournament Report

- Khi toàn bộ trận/lượt của giải đã ở trạng thái kết thúc/hủy, hệ thống tự tạo snapshot `Báo cáo toàn giải`.
- Báo cáo gồm: thông tin giải, đội/VĐV, toàn bộ lịch-kết quả, BXH theo nội dung, Top 4/nhà vô địch, xử thua/WO và tài chính thu-chi-số dư.
- Nút `⬇ Tải Báo cáo toàn giải` tự xuất hiện trong `Kết thúc giải & Tạo giải mới`.
- Báo cáo được lưu theo Tournament ID trong `tournamentIndex/<sport>/<tid>/finalReport` (ADMIN-only) và được giữ lại sau khi tạo giải mới.
- Trong `Kho giải đã kết thúc`, từng giải có nút tải lại báo cáo đã chốt.
- Nếu tài chính thay đổi sau khi lịch đã hoàn tất nhưng trước khi đóng giải, snapshot tự cập nhật; khi đóng giải báo cáo được chốt lại lần cuối.
