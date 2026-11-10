# Upgrade101 Full Audit — WebRTC Signaling Resilience

## Hien tuong production
Viewer hien `Dang ket noi camera WebRTC...` roi bao `Chua nhan duoc WebRTC offer tu may BTC`.

## Nguyen nhan tim duoc
1. `court.stream.status=LIVE` la trang thai Firebase lau dai, nhung local MediaStream/broadcaster chi ton tai trong tab BTC. BTC reload/deploy/close tab co the lam stream chet trong khi Firebase van con LIVE.
2. `publishSharedCamera()` cu goi `sessionsRef.remove()` truoc khi attach `child_added`. Neu Viewer da gui request trong luc BTC khoi dong lai/self-heal, request co the bi xoa va Viewer cho offer vo han.
3. Viewer cu chi timeout sau 6 giay va khong phan biet broadcaster stale voi signaling cham.

## Fix Upgrade101
- Khong xoa sessions root. Chi prune session that su cu (>120s).
- Broadcaster ghi heartbeat moi 4s khi video track con `readyState=live`.
- Self-heal moi 5s / online / focus / visibility restore: neu local camera con song nhung listener signaling mat, tu `publishSharedCamera()` lai.
- Existing Viewer session duoc Firebase `child_added` phat lai khi broadcaster attach, nen offer duoc tao cho request dang cho.
- Viewer preflight broadcast heartbeat: stale/offline thi dung ngay va bao ro BTC da reload/ngat.
- Neu heartbeat fresh nhung offer cham, Viewer auto retry dung 1 lan. Khong loop.
- Bam `Xem LIVE` thu cong moi reset retry counter.

## Khong thay doi
Scoring, BLV, orientation/video transform, Firebase Rules, TURN config/function, Replay/AI.

## Test
- 26/26 regression PASS.
- 3/3 dynamic VM PASS.
- 164 JS syntax PASS.
- 21 JSON/webmanifest parse PASS.
- SW 11/11 assets PASS.
- Bundle source hash/order PASS.
