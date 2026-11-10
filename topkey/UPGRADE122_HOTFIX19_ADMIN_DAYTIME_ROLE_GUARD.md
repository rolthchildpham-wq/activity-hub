# Upgrade122 Hotfix19 — ADMIN Day-Time Role Guard

- `⏱ Sắp time` chỉ hiển thị và hoạt động cho role ADMIN.
- UMPIRE/VIEWER tự loại bỏ mọi nút sắp time nếu DOM được render lại.
- Readiness của UMPIRE không còn fail vì thiếu nút ADMIN-only.
- ADMIN Readiness vẫn kiểm tra đủ nút theo số header ngày.
- Không thay đổi thuật toán Hotfix15/13; chỉ sửa phân quyền/UI.
