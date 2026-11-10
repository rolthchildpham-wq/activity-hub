# Upgrade122 Hotfix49 — Viewer Ranking Parity + Login Stability

Ngày: 2026-11-05

## 1. BXH Viewer = Admin
Viewer dùng cùng chính sách xếp hạng canonical với Admin:
- Chỉ tính GROUP / ROUND_ROBIN.
- Một kết quả có thẩm quyền cho mỗi cặp đấu.
- Hỗ trợ withdrawal archive / snapshot / virtual WO.
- Thứ tự: Điểm → H2H (2 đội) / mini-league (3+ đội) → HS set → HS điểm → set thắng → điểm ghi được.
- Viewer subscribe collection teams canonical để tránh lệch danh sách đội do window lịch.

## 2. Login không còn vòng reload
- Preboot không tự location.replace khi màn đăng nhập protected đang hiển thị.
- Auto Update Upgrade55 hoãn repair/reload khi chưa đăng nhập.
- Self-heal ngoài login giới hạn 1 lần / 60 giây / server build.
- Version/cacheTag: u122h49-20261105.
