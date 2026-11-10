# H96 Acceptance Report

Release: `H96 - HEADER REFERENCE`  
Build: `u122h96-20261108`  
Version: `2026.11.08-vnext-upgrade122-hotfix96-header-reference-layout`

## Pham vi
- Header Hub theo anh tham chieu.
- Metadata va cache phat hanh nguyen tu.
- Bao toan hardening H95.

## Hop dong giao dien
- Tieu de mac dinh co hai dong ngu nghia, ngat sau dau `&`.
- Subtitle nam duoi tieu de.
- Logo o ben trai va badge o ben phai tren desktop.
- Man hinh hep xep header theo cot va cho phep tieu de dai tu xuong dong.
- Tieu de tuy chinh chi duoc gan dang van ban, khong dien giai HTML.

## Ket qua
- Header H96 va cache namespace H96: PASS.
- H95 performance acceptance: PASS.
- Atomic release, update authority, auth/i18n, public routes, judging, club plan va Hub admin: PASS.
- Badminton listener soak, data runtime, 500-action score soak va main-thread regression: PASS.
- Cu phap JavaScript: 388 tep, 0 loi.
- JSON/webmanifest: 21 tep, 0 loi.

## Gioi han moi truong
Playwright trinh duyet khong co san trong container. Kiem tra H96 su dung hop dong DOM/CSS, cung cac bo hoi quy Node, cu phap va cau hinh cua goi.
