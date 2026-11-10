# Upgrade101 — WebRTC Signaling Resilience

- Không xóa session Viewer đang chờ khi broadcaster reload/self-heal.
- Broadcaster ghi heartbeat mỗi 4 giây khi local camera track còn live.
- Broadcaster tự gắn lại listener nếu camera local còn sống nhưng state signaling bị mất.
- Viewer timeout 3.5 giây, kiểm tra heartbeat; nếu broadcaster còn fresh thì retry signaling một lần.
- Nếu heartbeat stale/offline, Viewer báo rõ cần mở lại Camera/Live trên máy BTC thay vì chờ vô hạn.
- Không thay Firebase Rules, TURN, scoring, BLV, orientation/video transform.
