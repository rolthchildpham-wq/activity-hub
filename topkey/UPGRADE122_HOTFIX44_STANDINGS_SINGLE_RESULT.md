# Upgrade122 Hotfix44 - Standings Single Result

Version: 2026.11.04-vnext-upgrade122-hotfix44-standings-single-result

## Rule BXH authoritative
- Mỗi cặp đội vòng bảng chỉ đóng góp đúng 1 kết quả vào BXH.
- Ưu tiên kết quả thật đã hoàn tất; virtual WO chỉ dùng khi không có kết quả hợp lệ.
- Điểm BXH TOPKEY: 1 điểm cho mỗi trận thắng, kể cả WO; thua 0 điểm.
- Cột Điểm luôn bằng số trận thắng (W).
- Kết quả duplicate/stale WO không được cộng chồng với kết quả thật.
- `auditStandingTeam(teamId, category)` trả chi tiết từng cặp đóng góp vào BXH.
