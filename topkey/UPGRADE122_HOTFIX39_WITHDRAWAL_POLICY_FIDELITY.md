# Upgrade122 Hotfix39 — Withdrawal Policy Fidelity

## Mục tiêu
Sửa BXH để phản ánh đúng 3 chính sách bỏ cuộc mà ADMIN chọn, không tự động cắt điểm chỉ vì `team.withdrawn=true`.

## 3 policy
1. `CANCEL_ALL`: hủy toàn bộ kết quả liên quan đội — các trận thành `CANCELLED`, không tính BXH.
2. `KEEP_PLAYED_WO`: giữ trận đã đấu; trận chưa đấu xử WO 0-2, mặc định 0-11 / 0-11 cho đội bỏ cuộc.
3. `KEEP_PLAYED_CANCEL`: giữ trận đã đấu; trận chưa đấu `CANCELLED`, không ai nhận điểm.

## Tách standings và eligibility
- `App.ranking()` hiển thị đầy đủ số liệu theo kết quả sau policy, kể cả đội đã bỏ cuộc.
- `App.rankingEligible()` chỉ dùng cho Top 3 / Knockout / chốt giải và loại đội đã bỏ cuộc khỏi quyền đi tiếp.
- Đội bỏ cuộc được gắn nhãn `BỎ CUỘC` trong BXH nhưng không bị cắt điểm ngoài policy.

## Các invariant giữ lại từ H38
- Chỉ trận vòng bảng (GROUP) tính BXH.
- MEN/WOMEN/MIX tách độc lập.
- `CANCELLED` không tính.
- `WALKOVER`, `RETIRED`, `DISQUALIFIED`, `FINISHED` chỉ tính khi có winner hợp lệ.
- Không tự gán đội B thắng nếu thiếu winner.
