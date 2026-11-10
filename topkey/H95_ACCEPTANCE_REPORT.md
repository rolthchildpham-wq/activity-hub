# H95 Acceptance Report

Release: `H95 - PERFORMANCE HARDENING`  
Build: `u122h95-20261108`  
Version: `2026.11.08-vnext-upgrade122-hotfix95-performance-hardening`

## Ket qua
- Kiem thu H95 cho single-flight queue, listener theo tab, gom render, 10.000 ban ghi va lifecycle timer: **PASS**.
- Kiem tra cu phap JavaScript: **387 tep, 0 loi**.
- Kiem tra JSON/webmanifest: **21 tep, 0 loi**.
- Kiem tra release nguyen tu, auth/update authority, header, public routes, judging, club plan va Hub admin: **PASS**.
- Kiem tra soak listener, data runtime va 500 thao tac ghi diem cua Badminton: **PASS**.

## Cac tinh huong H95 da xac nhan
- Nhieu lenh flush dong thoi khong tao ghi Firebase song song.
- Burst callback chi lap lich mot frame va khong render nhanh cua tab dang an.
- Listener nang duoc thao khi doi tab; listener loi va tai chinh khong bi nhan doi.
- `pagehide` giai phong listener; `pageshow` khoi phuc dung mot ban.
- State giu du 10.000 ban ghi trong khi moi lan chi tao toi da 300 dong danh sach.
- Cac module runtime dang hoat dong khong con `setInterval` vo han.

## Gioi han moi truong kiem thu
Phan Playwright trinh duyet khong chay duoc trong container vi khong co browser binary/Python Playwright va mang cai dat bi chan. Toan bo kiem thu Node, kiem tra tinh, JSON va cac bai soak khong can browser da chay thanh cong.
