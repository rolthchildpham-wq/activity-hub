# UPGRADE122 HOTFIX68 - CENTRAL SYSTEM ADMIN

- Chuyển Tài khoản Firebase Auth, Backup/Restore, Database Firewall & chống sao chép, Vai trò tùy chỉnh và Phân quyền chi tiết ra khỏi Cài đặt từng môn.
- Thêm trang `/system-admin.html` ở cuối Sports Hub.
- Bắt buộc Firebase Authentication; chỉ ADMIN hoặc tài khoản có `systemAdmin:view/edit` được vào.
- `systemAdmin:view`: chỉ xem/export. `systemAdmin:edit`: tạo/sửa tài khoản, restore, sửa firewall, role, permissions.
- Các trang môn giữ các node cũ nhưng hard-hide để không phá runtime legacy.
- Firebase Rules thêm quyền systemAdmin trên các root môn cho backup/quản trị tập trung.

Build: `2026.11.06-vnext-upgrade122-hotfix68-central-system-admin` / `u122h68-20261106`
