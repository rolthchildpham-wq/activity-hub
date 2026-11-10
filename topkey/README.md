# H118 · UNIFIED AUTH / MULTISPORT RULES

Current release: **H118** / `u122h118-20261109`. All seven sports share one Firebase Auth/profile validation module, Hub entry guard, and canonical Firebase Rules deployment. Read `H118_READ_ME_FIRST.md` before deploying; no live production verification is claimed.

# H92 · CLUB PLAN + HUB REPORT

Current atomic release: `u122h92-20261107`. Club planning is now a shared Hub module: club calendar/plan is summarized on the Hub; BTC manages budget and task assignment in a sport-scoped workspace. Publish the bundled Firebase Database Rules together with the static deployment. Read `UPGRADE122_HOTFIX92_CLUB_PLAN_DASHBOARD.md` and `H92_ACCEPTANCE_REPORT.md` first.

## H91 · AUTH + I18N PARITY

Current atomic release: `u122h91-20261107`. Badminton and VNext now share the same protected-auth guard contract; dynamic Executive Dashboard UI participates in full-interface i18n. See `H91_ACCEPTANCE_REPORT.md`.

# H91 · AUTH + I18N PARITY

Current atomic release: **Upgrade122 Hotfix90** / `u122h91-20261107`. Badminton initializes Firebase DEFAULT before Auth; Football and Volleyball use sport-specific main referee consoles. Deploy the whole package atomically. Read `UPGRADE122_HOTFIX90_REFEREE_AUTH_STABILITY.md` and `H90_ACCEPTANCE_REPORT.md` first.

## H89 · FULL INTERFACE I18N

Current atomic release: `u122h89-20261107`. UI language switching is unified across Hub, Badminton, VNext, System Admin and Change Password. System UI copy must be single-language in Vietnamese / English / Simplified Chinese; user-entered data and technical identifiers remain unchanged. See `H89_ACCEPTANCE_REPORT.md`.

## Hotfix88 - Report + Judging + Public (2026-11-07)
- PDF export now prints the same A4-landscape HTML used by Preview; production fixture no longer produces the ugly fallback/blank final page.
- PowerPoint has a visible 9-section TKT structure form and inserts assigned images immediately after their section.
- Cooking + DIY/Handmade now support configurable weighted judging, public QR/device voting, judge-code QR, and ranked statistics.
- Public Viewer/Register/Judge routes bypass the visible login screen; VNext public routes skip Firebase Auth, while Badminton WebRTC loads anonymous Auth only when Live is requested.
- Atomic release: H88 / u122h89-20261107. Deploy Firebase Database Rules with the static package.


## Hotfix87 - Schedule Group Parity (2026-11-07)
- VNext Football/Volleyball schedule now preserves each match directly under its correct day header.
- Walkover/administrative loss stays bottom-of-day without detaching from the date.
- Stage/status/quick-result decorators resolve matches by ID/code, not DOM row index.
- Atomic release: H87 / u122h87-20261107. Auth session contract remains the stable H86/v86 contract.

> **Latest consolidated release:** Upgrade122 Hotfix90 - `u122h91-20261107`. Deploy the whole package atomically; read `UPGRADE122_HOTFIX86_REPORT_PARITY_REGRESSION.md` and `H86_ACCEPTANCE_REPORT.md` first.

# TOPKEY Sports Hub VNext 2026 — Upgrade118 Production Artifact Cleanup

Current consolidated deployment baseline: **Upgrade122 Hotfix90** / `2026.11.07-vnext-upgrade122-hotfix91-auth-i18n-parity`.

# TOPKEY Sports Hub VNext 2026 — Upgrade116

Current Badminton build: **Upgrade116 Consolidation Phase 3**. See `HOAN_THIEN_ROADMAP.md`, `sports/badminton/UPGRADE116_FULL_AUDIT.md`, and `sports/badminton/KET_QUA_KIEM_TRA.txt`.

# Current Badminton build: Upgrade115 — Consolidation Phase 2

- Admin no longer executes legacy Upgrade102/103 wrappers; one `src/core/data-runtime.js` owns authenticated listener/render/latency runtime.
- `TopkeyUpgrade102` / `TopkeyUpgrade103` compatibility exports remain for Fast Lane and health contracts.
- Firebase paths, Rules, scoring, TURN/WebRTC, Viewer and lazy feature chunks are unchanged.
- Full regression: 55/55 PASS.

# Current Badminton build: Upgrade103 — Render & Runtime Stability

## Upgrade101 — WebRTC Signaling Resilience
- Preserve waiting Viewer sessions across broadcaster reload/self-heal; heartbeat + auto-repair + one Viewer retry.


## Upgrade94 · Viewer BLV Audio Stability
- Public Viewer `Bật tiếng` now enables BLV TTS, not only WebRTC video audio.
- BLV follows the actual public Live court selected by the viewer.
- `commentary/<court>/latest` is primary; `activeMatches` score change supplies a short fallback if commentary is late/missing.
- Existing TURN/WebRTC, public Viewer bootstrap, anonymous signaling and Firebase rules are unchanged.
# TOPKEY Sports Hub VNext 2026 · Upgrade92 Stability / Public Viewer

Badminton build: `2026.10.30-vnext-featureparity15-upgrade93-public-viewer-bootstrap-stability`  
Cache tag: `u93-20261030`

## Upgrade92 · Stability baseline
- Public `#spectator` never renders the login form; Firebase Anonymous Auth is automatic and used only for scoped WebRTC signaling.
- F5 and automatic client repair preserve `#spectator`.
- Spectator listeners are idempotent to prevent duplicate Firebase subscriptions after Auth restore/render wrappers.
- Upgrade92 is the final runtime/version authority so legacy Upgrade87/88 timers cannot overwrite Health/runtime labels.
- `reset-u92.html` removes stale Badminton Service Workers and shell caches while preserving Piper/crowd runtime caches.
- Release uses numeric `upgrade93` / `u93-20261030` to stay compatible with the existing regression contracts.
- Full packaged regression: 17/17 PASS, JS syntax 0 failures, JSON parse 0 failures.

## Nâng cấp chính
- Giữ toàn bộ Upgrade63-77, gồm Start/Set/Open server, responsive/mobile score, Auto Voice, Mandarin/Pinyin, crowd applause và AI Shuttle Replay.
- Auto BLV mặc định bật theo Upgrade87; audio được prime/unlock từ cử chỉ hợp lệ, nhưng Upgrade78 Session Gate vẫn không cho câu cũ/sai trận phát tiếng.
- Chỉ bình luận khi browser tab đang foreground/focus, app đang ở `Trọng tài` hoặc `Live`, sân đang chọn có `activeMatch` đã Start, match còn tồn tại và `status=LIVE`, court cũng `LIVE` đúng `activeMatchId`.
- Với tài khoản UMPIRE/non-ADMIN ở tab Trọng tài, `court.umpireUid` phải đúng UID đang đăng nhập; Upgrade88 tự gán UID hiện tại khi sân chưa có trọng tài, nhưng không chiếm sân đã gán người khác.
- `commentary/latest` cũ được baseline khi gate mở và không bao giờ đọc lại trong tab mới.
- Rời tab / background / xóa-kết thúc trận / mất active match / mất phân công trọng tài sẽ dừng ngay mọi TTS/Piper/Mandarin/FX và xóa queue.
- ZIP tiếp tục tự mô tả bằng manifest/changelog/feature registry/regression contract/source SHA-256 index.

## AI Shuttle Replay
Camera/WebRTC rolling replay của Upgrade77 vẫn giữ nguyên. AI EdgeOne là tùy chọn; xem `EDGEONE_AI_SETUP.md`.


Upgrade79 fixes EdgeOne AI routing from the nested Badminton page: all AI health/analysis requests use origin-root `/api/ai-shuttle-analyze`.


## Upgrade81 · Continuous Replay ~10s
- Fix mobile replay stopping after the first short recorder segment.
- Target ~10 seconds of court context: ~6 s before + ~4 s after the event.
- Upgrade85 supersedes the old MediaSource stitching path: playback now uses one segment ObjectURL at a time to avoid Chromium hangs.
- Still uses one MediaRecorder encoder only.


## Upgrade82 · Replay Orientation Fit
- Replay mới lưu hướng điện thoại ngay lúc ghi từng segment.
- Quay ngang nhưng MediaRecorder trả video dọc sẽ tự xoay 90° và fit vào khung 16:9.
- Xoay điện thoại sau khi quay không làm replay đổi sai hướng.
- Có nút Xoay 90° cho clip cũ/sensor sai và Kín khung/Vừa khung + Toàn màn hình.

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
Fixes the lazy-Replay placement regression exposed by Upgrade85: on desktop the durable Live order is Viewer -> Source/Fallback -> AI Replay in the left workspace, with BLV on the right. A narrow direct-child Live-page guard repairs Replay if it is created after the layout pass; no whole-document observer is added.


## Upgrade87 · Audio / Reset UX
- Natural public-domain audience recording is preferred for set/match applause; tie applause defaults OFF and local OGG fallback is softened.
- BLV adds Auto/Nam/Nữ profiles; Nam prefers an actual vi-VN system male voice and discloses lower-pitch fallback when the device lacks one.
- Audio is auto-first: first eligible Umpire/Live gesture verifies/unlocks automatically; activation buttons are only actionable when the browser blocks playback.
- Referee Reset opens a two-scope chooser: current set or ADMIN whole-match reset to SCHEDULED/Chưa thi đấu.


## Upgrade88 · Viewer Live / UMPIRE Auto BLV
- Viewer/public spectator đưa Trận đang Live + player lên đầu. HLS/YouTube có thể xem công khai; Camera/WebRTC giữ signaling có xác thực.
- Camera cục bộ dùng đúng một stream đang quay và chia sẻ stream đó qua WebRTC cho tài khoản VIEWER/LIVE_ONLY; không mở camera/encoder thứ hai.
- VIEWER/LIVE_ONLY vào thẳng player Live và ẩn các control phát/Replay/BLV không dành cho người xem.
- UMPIRE bắt đầu/chấm sân chưa gán sẽ tự nhận `court.umpireUid` trước khi Upgrade78 mở BLV; sân đã gán người khác không bị tự chiếm.

- Firebase WebRTC signaling rules must be published once; see `UPGRADE88_FIREBASE_RULES.md`.

## Upgrade95 Performance Safe (2026-10-30)
- Bundle 68 CSS -> 1 hashed CSS, 90 app JS -> 1 hashed JS; giữ preboot riêng.
- CDN Firebase/QRCode chuyển khỏi HEAD để không chặn first paint.
- Badminton Service Worker precache còn 11 shell/audio assets; hashed bundle cache-first.
- Không đổi Firebase Rules, TURN, scoring, WebRTC protocol hoặc BLV Upgrade94.

### Upgrade97 Viewer Orientation Guard
Public Viewer uses CSS full-view instead of native fullscreen and releases stale orientation locks on spectator entry. This preserves Upgrade95 performance bundling and Upgrade96 BLV lifecycle fixes.

### Upgrade98
Public Viewer supports horizontal fullscreen Live with portrait-track correction. Referee fullscreen on short landscape phones uses larger score/name/action typography and 44px touch targets.

## Upgrade99 Viewer Freeze Fix (2026-10-30)
- Fix recursive MutationObserver loop introduced in Upgrade98 public Viewer landscape patch.
- Observer now disconnects before DOM mutation; button writes are idempotent.
- Keeps Upgrade98 landscape Live correction and referee readability.

## Upgrade117 — Production Hardening
Upgrade117 is the final planned HOÀN THIỆN hardening baseline. It adds single-flight boot guards, serialized/coalesced Firebase queue recovery and long-session soak contracts. No Firebase Rules change is required from Upgrade116/112 rules state.

## Upgrade121 (2026-10-31)
- Ghi nhớ ngôn ngữ Hub sau lần chọn đầu tiên; quay lại Hub không hỏi lại.
- Nền SVG cục bộ riêng cho 7 bộ môn, tối ưu tải nhanh/offline.
- Badminton: bảng Bình luận vui của trọng tài, chọn VĐV đang thi đấu và câu bình luận tích cực an toàn.
