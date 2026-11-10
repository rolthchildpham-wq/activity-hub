# Upgrade122 Hotfix4 — Auto Update Self-Heal

- So sánh build bằng `cacheTag + version`, không chỉ số `upgrade122`.
- Nếu runtime khác server: tự unregister Service Worker Badminton cũ, xóa cache app cũ (giữ cache Piper/crowd audio), đăng ký SW mới và reload một lần.
- Giữ nguyên query hiện tại (`tid`, Test Lab, v.v.) và hash khi reload.
- Health hiển thị effective build Hotfix4 thay vì hằng số Upgrade118 trong bundle nền.
- Nút `Kiểm tra bản mới` dùng cùng self-heal và có thể retry thủ công.
