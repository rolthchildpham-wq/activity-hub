# Upgrade122 Hotfix 1 — Test Lab / Production isolation

- Không lưu `__testlab_*` vào khóa tournament production trong localStorage.
- Tự dọn các test TID cũ từng bị lưu nhầm trong khóa production.
- Thêm preboot phục hồi Test Lab query khi Android/PWA mở bằng `start_url` và làm mất `tid`.
- Hub lưu pending Test Lab launch tối đa 3 phút để PWA khôi phục đúng kênh.
- Áp dụng cho Badminton và VNext multisport.
- Test namespace vẫn dùng hard guard `__testlab_u122_20261031_<sport>_...`.
