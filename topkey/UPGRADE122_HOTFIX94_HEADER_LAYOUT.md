# Upgrade122 Hotfix94 — Header Layout

## Mục tiêu
Tinh chỉnh duy nhất phần đầu Hub theo phản hồi giao diện, giữ nguyên toàn bộ chức năng H93.

## Thay đổi
- Tiêu đề chính Hub hiển thị ngang một dòng trên desktop: `HỆ THỐNG QUẢN LÝ THỂ THAO & HOẠT ĐỘNG XÃ ĐOÀN`.
- Dòng chú thích `TRUNG TÂM THỂ THAO TOPKEY · VNEXT 2026` chuyển xuống ngay dưới tiêu đề chính.
- Logo giữ bên trái; nhóm trạng thái/release giữ thành cụm độc lập bên phải.
- Tablet/mobile cho phép tiêu đề xuống dòng tự nhiên để không tràn màn hình.
- Giữ nguyên cấu hình tiêu đề và ảnh nền từ Quản trị hệ thống; nếu ADMIN đổi tiêu đề/chú thích, bố cục H94 vẫn áp dụng.
- Nâng build/cache đồng bộ Hub + Cầu lông + VNext lên `u122h94-20261108` để tránh cache H93.

## Không thay đổi
- Auth/role/session.
- Dashboard và selector môn compact.
- Kế hoạch CLB, ngân sách, phân công.
- Báo cáo PDF/PPT, QR/public, trọng tài và i18n.
