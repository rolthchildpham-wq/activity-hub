# Upgrade122 Hotfix51 — Ranking Explain Report

Build: `2026.11.05-vnext-upgrade122-hotfix51-ranking-explain-report`  
Cache tag: `u122h51-20261105`

## Mục tiêu
- Thêm nút **🧾 Giải trình BXH** chỉ cho tài khoản `ADMIN` tại thẻ **BXH nhanh**.
- Cho phép chọn nội dung thi đấu (Đôi Nam / Đôi Nữ / Đôi Nam Nữ hoặc category đang có trong dữ liệu).
- Sinh báo cáo BXH dựa trên chính `App.ranking({category})` đang chạy, không tạo một bảng điểm độc lập.
- Giải thích riêng thứ hạng 1–2–3 theo rule hiện tại:
  `Điểm → H2H (2 đội) / Mini-league (3+ đội) → HS set → HS điểm → Set thắng → Điểm ghi được`.
- Hiển thị nhóm đồng điểm, mini-league và các trận trong nhóm dùng để kiểm tra lại.
- Xuất **HTML**, **CSV**, hoặc **In / Save PDF** từ trình duyệt.

## An toàn
- Không thay đổi dữ liệu Firebase.
- Không thay đổi kết quả trận hoặc logic xếp hạng.
- Giữ nguyên Hotfix50: không auto-reload trong phiên đăng nhập.
- Viewer công khai không có nút này.
