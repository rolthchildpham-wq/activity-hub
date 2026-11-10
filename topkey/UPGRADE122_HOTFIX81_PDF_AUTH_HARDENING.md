# Upgrade122 Hotfix81 - PDF + Auth hardening

- PDF: bỏ cơ chế cắt DOM bằng translateY; dựng từng trang độc lập, kiểm tra pixel có nội dung trước khi ghép PDF.
- Auth: preview EdgeOne dừng tải trang ngay và chuyển sang domain chính trước khi Firebase SDK chạy.
- Nếu Google Cloud API key chưa whitelist domain chính thì cần bổ sung HTTP referrer bên Google Cloud/Firebase; lỗi này không thể bypass an toàn bằng client JS.
- Cache/build: u122h81-20261107.
