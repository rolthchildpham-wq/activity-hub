# Current Badminton build: Upgrade115 — Consolidation Phase 2

- Admin no longer executes legacy Upgrade102/103 wrappers; one `src/core/data-runtime.js` owns authenticated listener/render/latency runtime.
- `TopkeyUpgrade102` / `TopkeyUpgrade103` compatibility exports remain for Fast Lane and health contracts.
- Firebase paths, Rules, scoring, TURN/WebRTC, Viewer and lazy feature chunks are unchanged.
- Full regression: 55/55 PASS.

## Upgrade102 — Firebase Latency
- Incremental child listeners for teams/matches/courts/activeMatches.
- Finance/Audit/Registrations/Commentary/Users listeners are tab-scoped and cleaned up on tab changes.
- Public Viewer removes duplicate full-tree listeners; commentary stays per selected court.
- Firebase callback bursts are coalesced before UI rendering.
- Rules/TURN/WebRTC/scoring/BLV/orientation are unchanged.

## Upgrade101 — WebRTC Signaling Resilience
- WebRTC broadcaster heartbeat/self-heal; do not delete waiting Viewer sessions; Viewer retry/fast stale diagnosis.


## Upgrade94 · Viewer BLV Audio Stability
- Public Viewer `Bật tiếng` now enables BLV TTS, not only WebRTC video audio.
- BLV follows the actual public Live court selected by the viewer.
- `commentary/<court>/latest` is primary; `activeMatches` score change supplies a short fallback if commentary is late/missing.
- Existing TURN/WebRTC, public Viewer bootstrap, anonymous signaling and Firebase rules are unchanged.
# TOPKEY Badminton VNext 2026 · Upgrade88 Viewer Live / UMPIRE Auto BLV

Build: `2026.10.30-vnext-featureparity15-upgrade93-public-viewer-bootstrap-stability`  
Cache: `u88-20261030`

## BLV fail-closed
1. Mỗi lần mở website/browser tab mới: BLV output OFF; không đọc lại câu Firebase cũ.
2. Chỉ phát khi đúng tab `umpire`/`live` + browser foreground/focus + đúng sân + active match đã Start + match `LIVE` + court `LIVE` đúng activeMatchId.
3. UMPIRE/non-ADMIN ở tab Trọng tài phải còn đúng `court.umpireUid`.
4. `commentary/latest` đang tồn tại lúc gate mở là baseline stale, không được phát.
5. Rời tab, background, xóa/kết thúc trận, xóa active match hoặc mất assignment => clear queue + stop system TTS + Piper Việt + Mandarin + crowd FX.
6. Upgrade49/50/72 chỉ chuẩn bị giọng; Upgrade78 Live Session Gate vẫn là authority cuối cùng cho quyền phát.

Toàn bộ contract Upgrade63-77 tiếp tục phải PASS.


Upgrade79 fixes EdgeOne AI routing from the nested Badminton page: all AI health/analysis requests use origin-root `/api/ai-shuttle-analyze`.


## Upgrade81 · Continuous Replay ~10s
AI Shuttle Replay targets ~10 seconds (6 s pre / 4 s post). Upgrade85 supersedes the earlier MediaSource sequence path with safe one-segment-ObjectURL-at-a-time playback to avoid Chromium hangs. One MediaRecorder encoder is preserved for mobile performance.


## Upgrade82 · Replay Orientation Fit
Replay lưu orientation tại thời điểm ghi. Clip quay ngang được phát ngang 16:9 kể cả khi điện thoại đang cầm dọc lúc xem; nếu MediaRecorder trả kích thước portrait, player tự xoay 90°. Có Xoay 90° và Kín khung/Vừa khung + Toàn màn hình làm fallback.

## Upgrade83 · Replay Performance Guard
- Giữ 1 MediaRecorder; DB tối đa 24 replay nhưng chỉ materialize 8 replay mới nhất trong danh sách RAM/UI.
- Prune IndexedDB bằng key cursor thay vì getAll toàn bộ Blob.
- Giảm DOM/GC churn của detector; dừng replay encoder + detector khi rời Live hoặc browser chạy nền.

## Upgrade84 · Live-first Workspace / Auto Focus
- Laptop: Live Viewer, Nguồn Live/Fallback và AI Replay nằm cùng cột trái; BLV ở cột phải.
- Điện thoại/tablet: một cột, danh sách replay cuộn riêng để giảm chiều dài trang.
- Bấm Áp dụng/Mở nguồn Live tự vào Live Focus toàn viewport và thử fullscreen thật; có nút Thu nhỏ để quay lại bảng điều khiển.
- Không thay đổi camera, replay ~10 giây, AI EdgeOne/DeepSeek, BLV gate, điểm số hoặc Firebase match state.


## Upgrade85 performance architecture
Replay video is disk-first in IndexedDB: the UI keeps metadata only, loads one selected replay on demand, and releases it on close. MediaSource stitching of independent recorder files was removed after a confirmed Chromium hang. JSZip/HLS are lazy-loaded and default Vietnamese avoids the whole-body translation observer.

## Upgrade86 · Live layout race guard
Upgrade85 keeps replay lazy/disk-first. Upgrade86 makes Upgrade84 Live-first placement durable even when the Replay card is created later: Viewer -> Source/Fallback -> AI Replay stays in the left desktop column; BLV stays right. The guard observes only direct Live-page children and does not alter score/Firebase/AI/replay storage.


## Upgrade87 · Natural Crowd / Voice / Auto Audio / Reset
- Vỗ tay set/trận ưu tiên field recording khán giả thật public-domain; vỗ tay hòa điểm mặc định OFF. FX local vẫn còn để chạy offline nhưng đã làm mềm/hạ âm lượng.
- BLV có profile Tự động / Nam / Nữ. Nam ưu tiên voice vi-VN Nam thật của hệ điều hành; nếu máy không có sẽ báo rõ fallback hạ tông.
- Auto Audio mặc định bật. Nút kích hoạt chỉ sáng khi browser chặn; trạng thái đã bật/chờ LIVE sẽ mờ và disabled. Upgrade78 Session Gate vẫn chặn mọi câu cũ/sai trận.
- Reset trọng tài có 2 lựa chọn: Reset hiệp hiện tại hoặc ADMIN Reset cả trận về SCHEDULED/Chưa thi đấu.


## Upgrade88 · Viewer Live / UMPIRE Auto BLV
- Viewer/public spectator đưa Trận đang Live + player lên đầu. HLS/YouTube có thể xem công khai; Camera/WebRTC giữ signaling có xác thực.
- Camera cục bộ dùng đúng một stream đang quay và chia sẻ stream đó qua WebRTC cho tài khoản VIEWER/LIVE_ONLY; không mở camera/encoder thứ hai.
- VIEWER/LIVE_ONLY vào thẳng player Live và ẩn các control phát/Replay/BLV không dành cho người xem.
- UMPIRE bắt đầu/chấm sân chưa gán sẽ tự nhận `court.umpireUid` trước khi Upgrade78 mở BLV; sân đã gán người khác không bị tự chiếm.

- Firebase WebRTC signaling rules must be published once; see `UPGRADE88_FIREBASE_RULES.md`.
