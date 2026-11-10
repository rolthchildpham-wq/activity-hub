# H94 · HEADER LAYOUT

- Header Hub: tiêu đề chính một hàng trên desktop.
- Chú thích TOPKEY/VNext chuyển xuống dưới tiêu đề.
- Giữ cụm trạng thái riêng bên phải.
- Đồng bộ build/cache `u122h94-20261108` cho Hub, Cầu lông và VNext.

# H92 - Club Plan + Hub Report (2026-11-07)

- Import/mapping cấu trúc workbook kế hoạch CLB vào Hub theo mô hình dùng chung.
- Sheet 01 -> Lịch & kế hoạch CLB trên Hub; Sheet 02/03 -> workspace BTC Ngân sách + Phân công.
- KPI Hub: thu/chi/cân đối dự kiến, công việc hoàn tất/quá hạn.
- ADMIN quản lý tất cả CLB; BTC chỉ đúng sportScope; leadership Executive Dashboard xem read-only.
- Firebase Rules + sport backup V2 bao gồm clubPlan.
- Phục hồi Executive Dashboard readRaw() từ tournamentIndex/finalReport.
- Full regression: 497/497 PASS.

# H91 - Auth + i18n Parity (2026-11-07)

- Badminton protected authentication now uses the same central auth-root / sport-scope / Hub-session contract as VNext.
- Badminton and VNext Hub entry guards are byte-identical.
- Badminton optional runtime modules retry in the background and cannot present a runtime timeout as a protected-login failure.
- Hotfix57 public-link module is removed from the login-critical path.
- Executive Dashboard dynamic content is fully translated in Vietnamese, English and Simplified Chinese, including dynamic warnings/default club labels.
- Full regression: 471/471 PASS.

# H89 - Full Interface i18n (2026-11-07)

- Full UI localization for Vietnamese / English / Simplified Chinese across Hub, Badminton, VNext, System Admin and Change Password.
- Added residual-language audit and dynamic MutationObserver translation coverage.
- Removed mixed UI terms (Security, Scheduler, Check-in, Live, Finance, Audit, Backup/Restore, Firewall, Test Lab, Export CSV, etc.) from non-matching language modes.
- Preserved user-entered content, proper names, brands and technical identifiers.
- Full regression: 453/453 PASS before packaging.

## 2026-11-07 - Upgrade122 Hotfix88 Report + Judging + Public
- Reworked PDF export to use the exact Preview HTML + A4 landscape browser print; removed tainted-canvas export dependency.
- Added TKT PowerPoint structure card with per-section enable/title and image insertion.
- Added Cooking/DIY weighted judging configuration, QR/link publishing, public-device voting, judge-code voting and ranked statistics.
- Added Firebase create-only vote rules and hashed judge-code rules for Cooking/Handmade.
- Public VNext Viewer/Register/Judge routes bypass Firebase Auth and the login screen; Badminton public routes use lazy anonymous Auth only for WebRTC Live.
- Full source acceptance: 444/444 PASS.

# 2026-11-07 - Upgrade122 Hotfix86 Report + Cross-Sport Parity Regression

- Fix PowerPoint `BROWN is not defined` and restore missing `getLogoData()` helper.
- Test Lab now injects fixture finance into App state before final-report generation.
- System-owned report labels/codes translated across VI-EN, VI-ZH and EN-VI-ZH.
- Reapply common Badminton interaction parity to VNext: edit modal, confirmations, finance KPI/status UI, safe quick result.
- Fix H86 Hub session-key mismatch caught during cross-hotfix regression.
- Real PptxGenJS export (including embedded image) and full H86 acceptance are release gates.

# Upgrade122 Hotfix85 - Production Atomic Release

- Atomic release coordinator verifies Hub, Badminton, and VNext build metadata before sport launch.
- New H85 Hub session contract with H84/H83 migration and H85-specific safe-update handoff.
- Mixed-deploy routes are blocked with `reason=deploy-mismatch` instead of entering an auth loop.
- VNext login now has the same duplicate-submit guard as Badminton.
- Uploaded login/optimization patches reviewed: insecure local/mock auth fallbacks rejected; safe performance concepts retained.
- Full H85 automated acceptance and production public audit documented.

## 2026-11-07 — Upgrade122 Hotfix84 Session-Safe Update Authority
- Fix Health/runtime version conflict and manual update logout.
- Preserve authenticated Hub session across controlled build update.
- Reapply final authority to Badminton + VNext.

# 2026-11-07 - Upgrade122 Hotfix83 Full Web Consolidation

- Hợp nhất Hub, Cầu lông và toàn bộ VNext về một auth/session state machine; bỏ xung đột hubTicket/fresh-login gây vòng lặp `select-sport`.
- Sửa lỗi cú pháp bootstrap Cầu lông và chuẩn hóa version authority/cache/manifest về `u122h84-20261107`.
- Reapply parity auth/admin/report/venue giữa Cầu lông và 6 môn VNext; sửa alias tiếng Việt `Đ/đ`.
- Sửa recursion dictionary báo cáo đa ngôn ngữ; hoàn thiện 3 chế độ Việt-Anh, Việt-Trung, Anh-Việt-Trung.
- PDF dùng internal raster-to-image PDF builder có blank-page detection; PPT dùng local PptxGenJS bundle.
- Full web acceptance: 363 PASS; auth matrix 26 PASS; auth integration 8 PASS; report fixture 6 PASS; PDF binary/render smoke PASS.
- Xem `UPGRADE122_HOTFIX83_FULL_WEB_CONSOLIDATION.md` và `H83_ACCEPTANCE_REPORT.md`.

# Upgrade122 Hotfix81 - PDF blank + Auth redirect hardening (2026-11-07)

- PDF: bỏ cắt DOM bằng translateY; dựng từng trang A4 độc lập rồi chụp từng trang, kiểm tra pixel để chặn PDF trắng.
- Auth: trên EdgeOne preview, dừng tải trang trước khi Firebase SDK/API khởi tạo và chuyển sang domain chính.
- Nếu Firebase báo `auth/requests-from-referer-...-are-blocked` ngay trên domain chính, cần whitelist domain trong Google Cloud API key restrictions.
- Cache/build: u122h81-20261107.


## Upgrade122 Hotfix77 - Final Report Image State Fix (2026-11-07)
- Fix: ảnh đã chọn trong hộp Xuất Báo cáo toàn giải bị mất state trước khi pipeline PDF/PPTX chạy, đặc biệt trong Production Fixture/Test giả định.
- Ảnh được snapshot ngay tại thời điểm bấm Xuất và snapshot riêng được dùng xuyên suốt quá trình tạo PDF/PPTX.
- PDF chờ toàn bộ ảnh base64 decode xong trước khi html2canvas/html2pdf render.
- Mở lại cùng báo cáo không xóa ảnh tạm đang chọn; chỉ đổi sang báo cáo/giải khác mới reset ảnh.
- Sau khi file xuất thành công mới giải phóng ảnh tạm; không lưu Firebase/Database/localStorage.
# HOTFIX72 · HUB ADMIN CARD
- Bỏ banner BTC phụ trách cố định khỏi Hub.
- Luôn hiển thị Cài đặt / Quản trị hệ thống ở cuối Hub; quyền vẫn được kiểm tra bên trong system-admin.html.
- Giữ nguyên Hub Auth Flow Hotfix71.

## Hotfix68 - Central System Admin
- Tách quản trị hệ thống ra khỏi từng môn, thêm cổng auth/permission riêng.

## 2026-11-06 - Upgrade122 Hotfix66

- Fix dropdown Môn BTC phụ trách không có danh sách.
- Self-heal option sau mỗi lần UI/permission editor render lại.
- Giữ nguyên Hotfix65 Báo cáo toàn giải.

## 2026-11-06 - Upgrade122 Hotfix65

- Tự tạo Báo cáo toàn giải khi toàn bộ lịch đã kết thúc.
- Hiện nút tải báo cáo trong khối Kết thúc giải & Tạo giải mới.
- Giữ snapshot báo cáo theo Tournament ID và cho tải lại từ Kho giải đã kết thúc.
- Báo cáo gồm BXH/Top 4, lịch-kết quả, VĐV/đội, WO và tài chính.


## 2026-11-06 - Upgrade122 Hotfix64
- Thêm `sportScope` bắt buộc cho role BTC: mỗi BTC phụ trách đúng 1 môn cố định.
- Chặn UI khi BTC mở nhầm môn và Hub chỉ hiển thị môn được giao.
- Firebase Rules khóa toàn bộ write cross-sport của BTC.
- Dashboard lãnh đạo: BTC tối đa chỉ xem; cập nhật snapshot/cấu hình CLB chỉ ADMIN.
- BTC legacy chưa có scope bị fail-closed cho tới khi ADMIN gán môn.
# Hotfix63 - Executive Association Dashboard

- Replaced Hub technical intro blocks with an executive leadership dashboard.
- Aggregates all sports/clubs: tournament count, participant reach, champions, finance, yearly trends and leadership alerts.
- ADMIN can configure club name, founded year and head organizer.
- Added independent `Dashboard lãnh đạo` permission card.
- Leadership/BTC users read the centrally saved aggregate snapshot without direct access to raw finance/player modules.
- Added Firebase rules for `topkey_badminton_vnext_2026/associationDashboard`.

## Hotfix62 - Test Lab Recovery (2026-11-06)
- Fixed multi-sport Test Lab permission_denied and added local fallback/report recovery.
- Added ADMIN-only test namespace grants for football, volleyball, running, handmade, shuttle and cooking.

# Hotfix58 - MultiSport Parity (2026-11-06)

- Updated shared `/sports/vnext/` for Football, Volleyball, Running, Handmade, Shuttlecock and Cooking.
- Added granular/custom roles, public Viewer standings parity, sport-specific canonical ranking, Top-4 multilingual report with logo/signature, ADMIN+BTC public links, administrative-forfeit bottom-of-day ordering and persistent login.
- Badminton Hotfix57 remains unchanged.

## Hotfix50 — Auth session / no automatic reload (2026-11-05)
- Chặn mọi auto-reload sau login; chỉ manual update mới reload.
- Firebase Auth ép LOCAL persistence trước sign-in.
- Preboot detect-only và asset hash mới.


## Upgrade122 Hotfix49 — Viewer Ranking Parity + Login Reload Stability (2026-11-05)
- Viewer BXH now uses the same canonical pool policy as Admin: group/round-robin only, one authoritative result per pair, withdrawal/archive/snapshot handling, virtual WO recovery, then Point → H2H/mini-league → set diff → point diff → sets won → points scored.
- Viewer subscribes the canonical teams collection instead of only teams inferred from a windowed match list.
- Auto-update no longer calls `location.replace()` while the protected login screen is idle; pending build changes are deferred.
- Preboot self-heal is limited to one automatic reload per server build within 60 seconds.
## 2026-11-04 — Upgrade122 Hotfix47 Withdrawal Legacy Recovery
- Standings: preserve withdrawn teams at bottom when results still count; hide CANCEL_ALL teams.
- Legacy blank history under KEEP_PLAYED_WO now yields administrative WO instead of losing the win.
- Core-only standings ownership retained.

## 2026-11-03 — Upgrade122 Hotfix41 Auto Update Authority
- Fixed H39/H40/H41 being treated as equal because all share `upgrade122`.
- Exact version/cacheTag update detection and bounded cache-busting reload.
- Fixed runtime-authority overriding the repair button with a check-only handler.
- Unified loaded runtime version authority to H41.

## 2026-11-03 — Upgrade122 Hotfix39 Withdrawal Policy Fidelity
- Fixed H38 regression that removed all withdrawn teams from standings regardless of selected withdrawal policy.
- Standings now preserve statistics exactly from the transformed match states produced by CANCEL_ALL / KEEP_PLAYED_WO / KEEP_PLAYED_CANCEL.
- Qualification is separated from standings: withdrawn teams keep their ranking stats but are excluded from Top 3, knockout generation and final qualification.
- Added BỎ CUỘC label in standings.

# 2026-11-03 — Upgrade122 Hotfix33 Stable Runtime

- Replaced stacked production boot with one stable bootstrap.
- Firebase CDN failover and deterministic Auth/Data initialization.
- Moved production admin artifacts to assets/u122 with content-hashed core.
- Pruned superseded runtime hotfixes and removed legacy production audit HTML.
- Defined single ownership for schedule optimizer/day buttons/order buttons.
- Removed steady self-heal timers from H26/H28/H29/H30 and schedule remount conflicts.
- Added H33 integrity, bootstrap, auth, early-submit and runtime-ownership acceptance tests.

## Upgrade122 Hotfix26 - Commentary Single Fire
- Loai bo double-handler o nut binh luan vui; mot lan bam chi phat mot lan.
- Them guard 900 ms cho cung mot cau de chan double-tap.

## Upgrade122 Hotfix21 — ADMIN Day Time Mount
- Fix per-day time optimizer button mount after ADMIN auth/render races.
- Hook afterLogin/applyRole/renderMatches/renderAll/showTab and observe matches table.
- Preserve ADMIN-only role guard and Health compatibility count.

## Upgrade122 Hotfix20 - Audio Single-Arm
Fix lap toast kich hoat am thanh va race pause Piper; them audible watchdog cho +1.

## Upgrade122 Hotfix19 — ADMIN Day-Time Role Guard (2026-11-02)
- Nút `⏱ Sắp time` chỉ dành cho ADMIN.
- UMPIRE/VIEWER không thấy hoặc gọi được optimizer qua UI.
- Offline UMPIRE Readiness bỏ mục nút time khỏi điều kiện bắt buộc cho non-ADMIN.

## Upgrade122 Hotfix16 — Version Authority / Auto-Update Recovery
- Fixed runtime/server version authority and stale Upgrade118 Health labels.
- Auto-update retry can recover from a failed previous attempt.


## Upgrade122 Hotfix15 — Global Unique Time + Save Verify (2026-11-02)
- Day optimizer now enforces globally unique match times within a day, regardless of court.
- Save flow shows progress, verifies Firebase after write, and reports remaining duplicates instead of silently closing.
- Per-day optimizer button remains on each date row.
## Upgrade122 Hotfix14 — ADMIN Force Date Override (2026-11-02)
- ADMIN chọn ngày cho trận CHƯA XẾP và bấm Lưu sẽ bỏ qua toàn bộ business scheduling rules.
- Audit FORCE OVERRIDE và tránh physical same-court overlap khi có thể.

## Upgrade122 Hotfix13 — Day-row Time Optimizer
- Nút sắp time nằm ngay từng ngày; sửa duplicate-time deadlock của Hotfix12.

## Upgrade122 Hotfix12 — Day Time Optimizer
- Thêm tối ưu giờ trong ngày theo VĐV và ưu tiên MEN khi buộc liên tiếp.

## Upgrade122 Hotfix8 — 2026-10-31
- Fun Commentary: đọc xưng hô + tên VĐV trước câu vui (Anh/Chị/Bạn theo dữ liệu/category).
- Không suy đoán giới tính từ tên.
- Giữ selection đúng A1/A2/B1/B2 và fullscreen Hotfix7.

## Upgrade122 Hotfix4 — Auto Update Self-Heal (2026-10-31)
- Fix runtime/server mismatch: compare cacheTag/version and auto purge SW/cache + reload.
- Health now reports effective hotfix build.

## Upgrade122 Hotfix 1 — Test Lab isolation
- Fix PWA/query TID fallback khiến Test Lab có thể mở nhầm tournament production.
- Tách tuyệt đối localStorage preference production khỏi `__testlab_*`.

# Upgrade121 — Language Memory, Sport Backgrounds, Badminton Fun Commentary

- Hub language picker appears only on the first visit when no `topkey_ui_language_v1` choice exists; returning from a sport does not prompt again. The 🌐 launcher remains available.
- Added lightweight local SVG backgrounds for Badminton, Football, Volleyball, Running, DIY/Handmade, Shuttlecock and Cooking. No remote image dependency.
- Badminton Live & BLV now includes a manual positive/fun commentary selector: current active player + curated safe phrase list + random phrase button.
- Upgraded Hub/VNext/Badminton service-worker cache identifiers to Upgrade121.

# Upgrade119 — 2026-10-31

- Fixed Hub routing so each VNext card opens the correct sport via `?sport=`.
- Added sport-specific registration/format/rules metadata for Football, Volleyball, Running, Handmade, Shuttlecock and Cooking.
- Added judged rubrics for Handmade and Cooking.
- Preserved Badminton Upgrade118 as an independent application.
- Bumped Hub/VNext service-worker caches to Upgrade119.

# Upgrade118 — Production Artifact Cleanup / Dependency Hygiene

- Removed stale runtime dependency on `assets/u116` Replay/AI chunk.
- Added runtime asset manifest `window.__TOPKEY_ASSETS`.
- Production package keeps only current `assets/u118` plus shared audio; source/tests/history docs remain.
- No Firebase Rules, scoring, TURN, WebRTC, BLV, Viewer data-path or permission changes.

## Upgrade117 — Production Hardening / Long-session Soak · 2026-10-31
- Add `src/core/production-hardening.js`: single-flight Data/Auth init, serialized/coalesced queue flush, coalesced resume recovery and Health self-check.
- Add long-session VM soak: 100 subscriptions, 1,200 tab changes, reconnect/flush storms and 500 atomic scoring actions.
- Preserve Viewer/Replay/CSS/Rules/TURN/WebRTC/scoring sources except final runtime authority metadata; no Firebase Rules publish required.
- Marks the planned HOÀN THIỆN optimization/consolidation roadmap complete; future work should be evidence-driven.

# Upgrade116 — Consolidation Phase 3

- Added shared `core/ui-boundary.js` for migrated Admin tab/render hooks.
- Added explicit Schedule/Umpire/Live runtime boundaries.
- Removed Upgrade80/106/107 from Admin execution while preserving legacy source for audit.
- Migrated Upgrade24/87/111 hooks to boundary registration with legacy fallback.
- No Firebase Rules, scoring paths, TURN or WebRTC signaling changes.

## Upgrade115 — Consolidation Phase 2
- Replace executed Upgrade102 + Upgrade103 Admin wrappers with one `src/core/data-runtime.js`.
- Preserve U102/U103 source files for audit/regression and export compatibility objects for later modules.
- Reduce data/runtime `showTab` wrappers 2→1, `setTimeout` calls 13→4 and lifecycle listeners 3→2.
- Keep Firebase paths, Rules, scoring, TURN/WebRTC, Viewer and feature lazy-load behavior unchanged.

## Upgrade114 — Consolidation Phase 1
- Admin core stops executing nine public-Viewer legacy wrappers (Upgrade92–100 Viewer-only JS set) now superseded by standalone Viewer boot.
- Remove obsolete Upgrade97 public-viewer focus CSS from Admin; retain Upgrade98 CSS because it also contains referee landscape readability rules.
- Add `src/core/runtime-authority.js` as a single final build/version/server authority.
- Preserve legacy sources in the ZIP for audit/regression while reducing executed Admin runtime layers.

## Upgrade113 — Atomic Score Pipeline
- Merge positive SCORE activeMatches + event + commentary/latest into one Firebase update without replacing App.score wrappers.
- Local optimistic score render and local BLV remain immediate; Firebase write is coalesced in the same JavaScript turn.
- Score corrections/no-commentary paths bypass the join and preserve Upgrade105 Fast Lane/offline fallback.
- No Rules/TURN/WebRTC change.

## Upgrade112 — Viewer Firebase Window
- Viewer schedule uses bounded date queries (20 recent + 60 upcoming) instead of subscribing the full matches tree.
- Standings keep correctness through separate terminal-status queries.
- Team records are subscribed only when referenced by visible/live/standings matches; announcement subscription is latest-only.
- Add Firebase `.indexOn` for matches date/status and announcements createdAt (index-only Rules change; permissions unchanged).

## Upgrade111 — Feature Code Splitting
- Admin boot no longer loads Firebase Storage, QRCode, JSZip or Replay/AI code.
- Replay/AI becomes a lazy Live-tab chunk; Storage/QRCode become on-demand external SDKs.
- Viewer Minimal Boot from U109/U110 remains unchanged.
- Finance/Scheduler core logic is intentionally not force-split yet because historical wrappers still cross module boundaries.

## Upgrade110 — Admin Login Boot Guard
- Fix Admin login reload loop introduced by Viewer Minimal Boot dynamic loading.
- Admin boot is readyState-safe even when bundle loads after DOMContentLoaded.
- Early capture guard prevents native GET form submission before Firebase handlers are ready.
- Scrubs accidental email/password query parameters from browser URL/history immediately.

## Upgrade109 — Viewer Minimal Boot
- `#spectator` now route-gates to a standalone Viewer bundle instead of loading the full Admin application.
- Viewer loads only Firebase App/Auth/Database; Firebase Storage and QRCode stay on the protected Admin path.
- Viewer retains public schedule/BXH, announcement, WebRTC/TURN, BLV, fullscreen and auto-rotation.
- Admin path retains the existing Upgrade108 application bundle unchanged except final build stamp.

## Upgrade108 — Cache Correctness
- Fix Service Worker precache to use the exact current hashed bundle rather than stale Upgrade106 assets.
- Make hashed app asset detection upgrade-number agnostic.
- Replace per-version EdgeOne immutable headers with wildcard `/sports/badminton/assets/*` and keep HTML/build/SW no-cache.
- No scoring, Firebase Rules, TURN, WebRTC, BLV, Viewer orientation or schedule behavior changed.

## Upgrade107 — Schedule DOM Safety Fix
- Fix `insertBefore` NotFoundError when changing match status after Upgrade105/106 moved schedule content into collapse/scroll wrappers.
- Admin/public schedule search bars now insert relative to the reference node's actual parent.
- Keep Scoring Fast Lane, internal schedule scrollbar, Viewer/BLV/WebRTC/TURN behavior unchanged.

## Upgrade106 — Schedule Internal Scroll UX
- Expanded schedule no longer stretches the whole page; Admin and Public schedules get bounded internal vertical scrolling.
- Admin table header stays sticky; public date headers stay sticky while scrolling.
- Upgrade105 collapse state and Scoring Fast Lane remain unchanged.

## Upgrade105 — Scoring Fast Lane + Schedule Collapse
- SCORE writes now use a direct-first atomic Firebase update when online/authenticated, bypassing unrelated IndexedDB backlog.
- On network failure/offline, SCORE falls back to ordered IndexedDB persistence; permission-denied writes become BLOCKED.
- Existing Upgrade48 local-first score UI remains unchanged.
- Add persistent `Thu gọn / Mở rộng` controls for public and admin schedule sections to reach BXH faster.
- Rules, TURN, WebRTC signaling, scoring rules and BLV lifecycle are unchanged.

## Upgrade102 — Firebase Latency
- Incremental child listeners for teams/matches/courts/activeMatches.
- Finance/Audit/Registrations/Commentary/Users listeners are tab-scoped and cleaned up on tab changes.
- Public Viewer removes duplicate full-tree listeners; commentary stays per selected court.
- Firebase callback bursts are coalesced before UI rendering.
- Rules/TURN/WebRTC/scoring/BLV/orientation are unchanged.

## Upgrade101 — WebRTC Signaling Resilience
- Preserve waiting Viewer sessions across broadcaster reload/self-heal; heartbeat + auto-repair + one Viewer retry.


## Upgrade94 · Viewer BLV Audio Stability
- Public Viewer `Bật tiếng` now enables BLV TTS, not only WebRTC video audio.
- BLV follows the actual public Live court selected by the viewer.
- `commentary/<court>/latest` is primary; `activeMatches` score change supplies a short fallback if commentary is late/missing.
- Existing TURN/WebRTC, public Viewer bootstrap, anonymous signaling and Firebase rules are unchanged.
# TOPKEY Sports Hub VNext 2026 · Upgrade History

## Upgrade92 · Stability / Public Viewer No-Login / Client Shell Repair · 2026-10-30
- Audit Upgrade91B as a full package instead of a single patch. Existing suite exposed 5 packaging regressions because alphanumeric `u91b`/`upgrade91b` violated numeric release-cache contracts. Upgrade92 restores numeric release semantics.
- Public `#spectator` is hidden from login on first paint, awaits its first Firebase auth decision, and creates Anonymous Auth automatically without reading a user profile.
- F5/self-update preserves the spectator hash. Spectator Firebase subscriptions are idempotent to avoid duplicate listeners from Auth + public render wrappers.
- Add final Upgrade92 runtime authority so delayed Upgrade87/88 version stamps cannot make Health show mixed 87/88/92 states.
- Add `reset-u92.html` to unregister stale Badminton Service Workers and remove old TOPKEY shell caches before reopening public Viewer.
- Keep WebRTC shared-camera/TURN, scoped anonymous signaling rules and Upgrade90 Viewer-local BLV unchanged.
- Full packaged regression: 17/17 PASS; all JS syntax and package JSON parse checks PASS.

## Upgrade88 · Viewer Live Player · Shared Camera WebRTC · UMPIRE Auto BLV · 2026-10-30
- Move public `Trận đang Live` to the top and add a 16:9 viewer stage. HLS/YouTube can play directly when configured; Camera/WebRTC honestly requires an authenticated Viewer because Firebase signaling remains protected.
- Fix the missing remote-camera path: `Camera cục bộ` now reuses the exact capture MediaStream for WebRTC viewers. No second `getUserMedia`, camera or encoder is opened.
- VIEWER/LIVE_ONLY accounts land on the Live player first; broadcaster/source/replay/BLV controls are hidden in viewer mode, and CAMERA is received through WebRTC rather than opening the viewer device camera.
- Fix UMPIRE score audio ownership mismatch: if an UMPIRE starts/scores an unassigned court, the court self-assigns to that UID via Firebase + Audit before Upgrade78 evaluates the BLV gate. Courts assigned to another UID are not bypassed.
- Preserve Upgrade78 stale-event/session gate and Upgrade87 auto-audio behavior; Upgrade88 introduces no direct score/match write path.
- Add `VIEWER_LIVE_PLAYER_001` and `UMPIRE_AUDIO_OWNERSHIP_001`.
- WebRTC Viewer requires the scoped Upgrade88 Realtime Database rules in `sports/badminton/firebase.database.rules.json`; deployment steps are in `sports/badminton/UPGRADE88_FIREBASE_RULES.md`.

## Upgrade87 · Natural Crowd · Male Voice Profile · Auto Audio · Reset Scope UX · 2026-10-30
- Replace the default synthetic crowd path for set/match reactions with the public-domain natural field recording `Applause ii.ogg` (Wikimedia Commons / PDSounds, author thore). The recording is loaded only from Umpire/Live interaction and runtime-cached when the browser permits, so ordinary startup is not slowed by the remote audio.
- Tie applause is OFF by default to avoid repetitive/annoying noise. Existing local tie/set/match OGG files remain offline fallback and are softened with high/low-pass EQ, gentle compression and lower level.
- Add BLV voice profile `Tự động / Nam / Nữ`. Nam prefers an identifiable vi-VN system male voice; if the device has no male-labeled vi-VN voice, TOPKEY uses the nearest allowed Vietnamese system voice with a lower pitch and states that fallback in the UI. The existing vais1000 Piper voice remains offline fallback.
- Do not ship/select Piper `25hours_single` as a male production model because its source/model licensing is not established by this package.
- Auto BLV audio is enabled by default. The first eligible gesture in Umpire/Live automatically runs the existing verified audio-unlock path. Activation controls are now stateful: ON/ARMED are dimmed+disabled; only a real browser-blocked state is bright/actionable. Upgrade78 Live Session Gate remains final authority, so no stale commentary can speak.
- Referee `Reset set` becomes `Reset…` with two radio/tick choices: reset current set using the existing `App.resetSet` flow, or ADMIN-only reset whole match using Upgrade68 verified `resetMatchResult(..., status=SCHEDULED)`. Whole-match reset clears score/result/active scoring and returns the court AVAILABLE while preserving teams/players/schedule record.
- Add `NATURAL_APPLAUSE_002`, `MALE_VOICE_PROFILE_001`, `AUTO_AUDIO_STATE_001`, and `RESET_SCOPE_MENU_001`.

## Upgrade86 · Live Layout Race Guard · Durable Live-first Workspace · 2026-10-29
- Fix the Upgrade85 regression where AI Shuttle Replay could appear as a full-width block below the Live/BLV grid instead of under Live Source in the desktop left workspace.
- Root cause: Upgrade84 arranged the Live-first grid before the lazy Upgrade77 Replay UI existed; Upgrade85 startup optimization delayed Replay creation, then Upgrade77 appended the card directly to `#page-live` about 80 ms later.
- Upgrade77 now immediately re-runs the registered Live-first layout after lazily creating the Replay card.
- Add a narrow Upgrade86 race guard that observes only direct children of `#page-live`; a late `#tk77-replay-card` is RAF-coalesced back into `#tk84-live-left`. No whole-document/subtree observer is introduced.
- Re-check the layout when entering Live and after Camera/WebRTC asynchronous startup. Desktop order is locked to `Live Viewer -> Live Source/Fallback -> AI Shuttle Replay`, with BLV on the right; mobile remains one column.
- Add a dynamic regression reproducing the exact failure state: layout exists first, Replay is appended later as a direct page child, then must be repaired into the left column.
- Align the older `CONTINUOUS_REPLAY_001` registry text with Upgrade85 safe one-ObjectURL-at-a-time playback, which superseded the old MediaSource stitching path.
- Add `LIVE_LAYOUT_RACE_GUARD_001`.

## Upgrade85 · Disk-first Replay · Safe Lazy Playback · Startup Guard · 2026-10-29
- Fix the confirmed Chromium hang when opening a 4-5 segment replay: remove the MediaSource/SourceBuffer path that appended independently recorded MediaRecorder containers. Replay now plays one local segment ObjectURL at a time and releases each URL before loading the next; if autoplay continuation is blocked, an explicit Continue button appears instead of blocking the page.
- Saved replay video Blobs remain in IndexedDB local storage. The in-memory replay list contains metadata only; pressing Xem/ZIP loads only the selected replay and closing the player releases the full record/ObjectURL.
- Upgrade replay DB schema to v2 with a separate `clip_meta` store. Legacy clips are not materialized on startup; the operator can migrate their metadata on demand.
- Do not open/read replay DB, build replay UI or call AI health during ordinary non-Live startup. Replay storage is touched only when Live is opened.
- Replay MediaRecorder now records the camera video track only, retaining the single-encoder design while avoiding unnecessary court-audio encoding/storage.
- Request persistent browser storage when supported and show local storage usage/persistence state in Replay status.
- Startup guard: Vietnamese default no longer keeps the whole-body translation observer active; Upgrade82 removes its whole-document modal observer; Upgrade35 overlay scans are RAF-coalesced.
- JSZip and HLS.js are lazy-loaded only when ZIP export or HLS playback is requested instead of blocking initial page load.
- Add `REPLAY_DISK_LAZY_001` and `STARTUP_PERFORMANCE_001`.


## Upgrade84 · Live-first Workspace · Auto Live Focus · 2026-10-29
- Re-layout Live & BLV so the desktop left column is `Live Viewer -> Live Source/Fallback -> AI Shuttle Replay`, using the large empty area under the video instead of forcing operators to scroll far down and back up. BLV remains in the right column.
- Mobile/tablet falls back to one column; replay history is height-bounded with its own scroll area to prevent long pages after many clips.
- `Áp dụng / Mở nguồn Live` automatically enters Live Focus: the Live Viewer fills the visual viewport and immediately attempts native fullscreen from the same user gesture when supported.
- Add explicit `↓ Thu nhỏ` and `↗ Mở màn Live` controls. Existing `Toàn màn hình` enters the same focus path; `Vừa màn hình`, leaving Live, stopping Live, Escape/back fullscreen safely exits focus.
- Layout/focus only: no scoring/Firebase match mutation and no change to Upgrade83 replay performance, Upgrade82 orientation, Upgrade80 rear camera, Upgrade79 AI endpoint or Upgrade78 BLV gate.
- Add `LIVE_FIRST_WORKSPACE_001` regression contract.


## Upgrade83 · Replay Performance Guard · Long Session Stability · 2026-10-29
- Performance audit of Upgrade82 confirmed one MediaRecorder path, bounded 26-second rolling buffer and proper ObjectURL cleanup, but found two long-session risks: detector status DOM was repainted at ~8 FPS and replay DB maintenance materialized all stored Blob records with getAll().
- Keep DB retention at 24 clips but materialize only the newest 8 replay records/blobs in the live JavaScript list/UI; a newly saved replay is inserted into that RAM list directly without rereading DB blobs, and play/download uses direct primary-key lookup when needed.
- Prune old replay records through the createdAt key cursor instead of loading every video Blob just to find old IDs.
- Reuse detector gray/mask/seen typed arrays between frames and throttle/change-detect status DOM painting, reducing mobile garbage-collection and layout churn.
- Leaving Live or backgrounding the browser stops the replay MediaRecorder plus detector/frame loops; returning to foreground Live restarts them without touching the camera source, score, Firebase match state, BLV gate or AI advisory semantics.
- Add `REPLAY_PERFORMANCE_001` regression contract.

## Upgrade82 · Replay Orientation Fit · Landscape Court Playback · 2026-10-29
- Fix phone replay recorded while the handset is landscape but played back as a narrow/rotated portrait frame with large black side bars.
- Persist capture orientation at MediaRecorder segment time: portrait/landscape, screen angle, viewport size, track dimensions and video dimensions when available.
- Replay uses the orientation from capture time even if the operator rotates the phone before opening the replay.
- When intrinsic recorded dimensions conflict with captured orientation, automatically quarter-turn the video and fit it into the correct 16:9 landscape or 9:16 portrait stage.
- Add `Xoay 90°` fallback for legacy clips/device sensor quirks and `Kín khung / Vừa khung` + `Toàn màn hình` display control.
- Refit on window/orientation/visualViewport changes. No new encoder; Upgrade81 ~10s continuous replay, Upgrade80 rear camera, Upgrade79 AI endpoint and Upgrade78 BLV gate remain unchanged.
- Add `REPLAY_ORIENTATION_001` regression contract.

## Upgrade81 · Continuous Replay ~10s · Mobile Playback Fix · 2026-10-29
- Fix the real replay symptom where a saved multi-segment clip could show ~6-8 seconds in metadata but mobile playback stopped after the first ~2-second recorder segment.
- Root cause: Upgrade77 changed the same `<video>` `src` after each independent segment and called `play()` again; mobile autoplay/media state can block or break the transition after segment 1.
- New replay target is approximately 10 seconds: ~6 seconds before the marked/candidate event + ~4 seconds after it. Rolling retention increases while keeping exactly one MediaRecorder encoder.
- Multi-segment playback now prefers MediaSource + SourceBuffer `sequence` mode so one user Play action can consume a continuous timeline instead of repeatedly restarting the media element.
- Keep a compatibility playlist fallback for browsers/MIME types that cannot use MediaSource; the UI reports when the browser requires a manual resume.
- Add `CONTINUOUS_REPLAY_001` regression contract. No change to scoring, Firebase match state, AI endpoint/key/model, BLV Live Session Gate, rear-camera default, Mandarin/Pinyin or applause.


## Upgrade80 · Rear Camera Default · Court Capture · 2026-10-29
- Fix mobile `Camera cục bộ` opening the selfie/front camera because legacy `getUserMedia({video:true})` left device choice to the browser.
- Default every new page session to `facingMode: environment` (rear camera) and expose an explicit `Camera sau / Camera trước` selector in Live source controls.
- Local Camera and WebRTC broadcaster now share the selected camera-facing constraint. Changing the selector while Local Camera is active restarts only that local stream.
- Add `REAR_CAMERA_DEFAULT_001` regression contract. No change to AI endpoint/key/model, replay timing, scoring, BLV gate, Mandarin/Pinyin or applause.

This file is the durable release memory carried inside every ZIP. Future upgrades must append here and update `sports/badminton/FEATURE_REGISTRY.json` + `REGRESSION_CONTRACT.json`.

## Upgrade79 · AI Endpoint Root Fix · Stable Project Domain · 2026-10-29
- Fix AI Shuttle Replay health/analysis routing from nested `/sports/badminton/`: `./api/ai-shuttle-analyze` incorrectly resolved to `/sports/badminton/api/ai-shuttle-analyze`.
- Both health GET and vision POST now use the origin-root endpoint `/api/ai-shuttle-analyze`, so the stable project domain and deployment-specific domains use the same Edge Function route.
- Add `AI_ENDPOINT_ROOT_001` regression contract to prevent this relative-path bug from returning.
- No change to `MAKERS_MODELS_KEY`, Firebase authorization, replay buffer, scoring, BLV gate, Mandarin/Pinyin or applause behavior.

## Upgrade78 · BLV Live Session Gate · No Stale Commentary · 2026-10-29
- New website/browser tabs start fail-closed: commentary output is muted even though voice models may prepare/warm silently.
- Automatic BLV is allowed only in the foreground/focused browser page, on the Umpire or Live app tab, for the selected court with an active started match whose match status is LIVE and whose court status/activeMatchId agree.
- Non-ADMIN Umpire audio additionally requires `court.umpireUid` to match the current authenticated user.
- Firebase `commentary/<court>/latest` present when a gate arms is treated as a stale baseline and is never replayed in a newly opened tab. Only fresh events created after the current gate armed may speak.
- Leaving Umpire/Live, changing browser tab/window focus, deleting/finishing the match, removing activeMatches, releasing the court or losing umpire assignment immediately clears the queue and hard-stops SpeechSynthesis, Vietnamese Piper, Mandarin audio and crowd FX.
- Legacy voice layers Upgrade49/50/72 may still download/warm voices, but they now consult Upgrade78 before authorizing playback.
- Add cross-tab audio ownership and a visible `BLV SESSION GATE` status row.

## Upgrade77 · AI Shuttle Replay · Edge Assist · 2026-10-29
- Add lightweight rolling replay for Camera/WebRTC MediaStream: one MediaRecorder, short independent segments, approximately 5.2 s pre-roll + 2.8 s post-roll.
- Store replay groups locally in IndexedDB and provide sequential replay + ZIP export; no Firebase video upload is required.
- Add low-resolution (~160 px, ~8 FPS) local motion/shuttle-candidate detector and manual tags for smash / drop / near-line / save last ~8 seconds.
- Add optional EdgeOne Makers Edge Function `/api/ai-shuttle-analyze`; it accepts only 2-4 downscaled JPEG frames and classifies SMASH / DROP / LINE_NEAR / OTHER.
- Keep AI credentials server-side in EdgeOne environment variables; validate Firebase ID token and allow ADMIN / UMPIRE / LIVE_ONLY.
- AI analysis is advisory/highlight metadata only. It never changes score or claims to be an official BWF Instant Review System.
- Replay local mode remains fully usable when AI is not configured, offline or unavailable.

## Upgrade76 · Natural Crowd Applause FX
- Replace Upgrade67 synthetic 45 ms noise-burst claps with three embedded stereo multi-layer crowd-applause FX samples for tie / set finish / match finish.
- Keep applause on a dedicated WebAudio path so it cannot steal Piper/TTS audio.
- Add FX enable, volume control and three manual test buttons in BLV settings.
- Prime the FX AudioContext from a referee gesture and keep all samples available offline through the Service Worker.

## Upgrade75 · Mandarin / Hanyu Pinyin Name Voice · 2026-10-29
- Route Chinese player names inside Vietnamese commentary as separate Mandarin segments instead of letting vi-VN TTS spell/read them as Vietnamese/English-like text.
- Auto-detect Hanzi and conservative multi-syllable Hanyu Pinyin roster names; single-token Vietnamese names such as LONG are not auto-switched.
- Prefer a device zh-CN system voice. If none exists and Chinese names are present, auto-download/reuse `zh_CN-huayan-x_low` for offline Mandarin.
- Preserve captions/team data exactly; only the audio transport is language-segmented.
- Existing pronunciation dictionary remains compatible. For Chinese names, legacy RHS becomes VI fallback; new explicit modes are `PY:`, `ZH:` and `VI:`.
- Do not invent lexical tones from unmarked Latin Pinyin; use `ZH:` Hanzi or an explicit Pinyin reading when an exact reading must be locked.

## Upgrade74 · Mobile Score Visibility + Contract Registry · 2026-10-29
- Fix portrait mobile referee scoreboard where the right/left score could be pushed outside the visible viewport.
- On portrait <=600px, score A/B become two equal top-row columns; team names move to a full-width row below.
- Add runtime score visibility guard.
- Add self-describing package manifest, feature registry, mandatory regression contract and SHA-256 source upgrade index.

## Upgrade73 · Low Latency + Full Audit
- Remove repeated silent audio unlock before every point; one unlock per browser session.
- Dedupe Piper warmup and legacy Service Worker registration/update.
- Preserve `eventAt` through commentary queue for real latency measurement.
- Restore Upgrade67 Start Gate CSS and remove missing Upgrade68 CSS reference.

## Upgrade72 · Auto Voice Bootstrap
- Auto-detect Vietnamese system voice; otherwise auto-install/reuse TOPKEY Offline Voice.
- Warm voice runtime and unlock audio from first valid user gesture while respecting browser autoplay policy.

## Upgrade71 · Set History Strip
- Show committed Set 1 result during Set 2; Set 1+2 during Set 3; preserve team identity across court swaps.

## Upgrade70 · Responsive Referee Fullscreen
- Scale score, player names, controls and court layout for laptop/tablet/phone/fullscreen.

## Upgrade69 · Opening Server Ledger
- Persist immutable 0-0 opening server snapshot for each set.
- Set 2/3 alternation derives from Set 1 opening snapshot, never the last rally server.
- Recover trustworthy legacy u63 opening server from first 0-0 point event.

## Upgrade68 · Admin Result Reset Fix
- Reset result on Firebase, clear sets/winner/finishedAt/active match, release court, purge stale queued score writes, verify by read-back.

## Upgrade67 · Start Gate + BLV FX
- Required order: choose Set 1 opening server -> Start Match -> fullscreen/live -> scoring enabled.
- Blocked actions explain the next required step.
- Add applause on tie/set/match finish and comeback encouragement when trailing 5-10 and regaining serve.

## Upgrade66 · Prestart Gate iteration
- Hardened pre-start validation before fullscreen. Superseded by Upgrade67 contract.

## Upgrade65 · Opening Server Fix
- Automatic Set 2/3 rotation assigns a concrete player in even court slot, preventing "team rotated but no serverPlayer" deadlock.

## Upgrade64 · Set Commit Fix
- Commit completed set before creating next set; mirror committed sets to match record; repair stale started/finished flags.

## Upgrade63 · Automatic Set Rotation
- Initial automatic Set 1 -> Set 2 side swap and alternating opening team. Later hardened by Upgrades 64/65/69.

## Earlier upgrades
- Source files Upgrade9-62 remain in this package. Their exact historical semantics were not reconstructed in Upgrade74; do not invent them. Inspect the corresponding source files before modifying legacy behavior.

## Upgrade88D - Cloudflare TURN + compact Viewer announcement
- Viewer #spectator: latest announcement is a compact top-right chip; opens modal only on click.
- WebRTC: fetches short-lived Cloudflare Realtime TURN iceServers from EdgeOne `/api/turn-credentials`.
- TURN long-term secret remains server-side in EdgeOne environment variables.
- Keeps STUN-only fallback if TURN endpoint is not configured.

- Upgrade94 was applied directly onto the user-supplied Upgrade93 baseline; TURN and Firebase Rules were left unchanged.

## Upgrade95 Performance Safe (2026-10-30)
- Bundle 68 CSS -> 1 hashed CSS, 90 app JS -> 1 hashed JS; giữ preboot riêng.
- CDN Firebase/QRCode chuyển khỏi HEAD để không chặn first paint.
- Badminton Service Worker precache còn 11 shell/audio assets; hashed bundle cache-first.
- Không đổi Firebase Rules, TURN, scoring, WebRTC protocol hoặc BLV Upgrade94.
## Upgrade96 — Performance Safe + Viewer BLV Lifecycle Fix (2026-10-30)
- Fix production bug reproduced from Upgrade95: enabling public Viewer audio replayed the existing Firebase `commentary/<court>/latest` snapshot.
- Viewer BLV no longer sets global `App.audioUnlocked`, isolating Viewer TTS from legacy BTC Local BLV.
- Firebase initial/rebind commentary snapshots are baseline-only; dedupe is tracked per court.
- Fresh commentary still speaks once; activeMatches fallback remains ~700 ms.
- Performance Safe bundles/cache retained; Firebase Rules, TURN, scoring and WebRTC protocol unchanged.


## Upgrade97 — Viewer Orientation Guard (2026-10-30)
- Public Viewer large-view no longer uses native fullscreen, avoiding Android/PWA forced landscape regression.
- Entering #spectator releases stale orientation locks left by prior fullscreen/replay flows.
- Umpire/Replay fullscreen, scoring, TURN, WebRTC and BLV lifecycle remain unchanged.

## Upgrade98 — Referee Readability + Viewer Landscape Live
- Viewer Xem ngang: native fullscreen + best-effort landscape lock.
- Auto-rotate portrait-sized WebRTC track 90° when physical live is horizontal; manual rotate fallback.
- Referee landscape phone typography/touch targets enlarged; scoring/TURN/Rules unchanged.

## Upgrade99 Viewer Freeze Fix (2026-10-30)
- Fix recursive MutationObserver loop introduced in Upgrade98 public Viewer landscape patch.
- Observer now disconnects before DOM mutation; button writes are idempotent.
- Keeps Upgrade98 landscape Live correction and referee readability.


## Upgrade103 — Render & Runtime Stability
- Active-tab DOM rendering / background render deferral.
- Retire legacy Viewer BLV polling; Upgrade94 binding is event-driven.
- Add passive runtime latency metrics in Health.
- No scoring/Rules/TURN/WebRTC protocol changes.

## Upgrade120 — Full Tournament Test Lab
- Added Admin Test Lab launcher for all 7 sports.
- Each run uses an isolated test tournament ID and never targets main_2026.
- Added synthetic full-tournament seed data, TEST LAB banners, reset control, and smoke checks.
- Bumped Hub/VNext/Badminton service-worker cache versions.

## Upgrade122
- Production Fixture Test Lab: one-click full seed + auto regression report stored inside isolated test tournament.


## Upgrade122 Hotfix2
- Auto-recover lost production tournament TID after Test Lab overwrite in old Upgrade122.
- Dedicated production TID backup for Badminton and multisport VNext.

## Upgrade122 Hotfix3
- Badminton referee fullscreen now includes active-court-player fun commentary controls.
- Player selection is limited to rendered A1/A2/B1/B2 competitors, not roster-wide names.

## Upgrade122 Hotfix6 — Fun Commentary Resilient Mount
- Restored referee fun commentary with late-mount/re-mount logic and active A1/A2/B1/B2 player selection.

## Upgrade122 Hotfix7
- Force referee Fun Commentary visible in fullscreen for ADMIN/UMPIRE; place it between court and score actions; keep A1/A2/B1/B2 selector.

- U122 Hotfix9: fun commentary now parses MEN/WOMEN prefix in player names and provides Auto/Anh/Chị override buttons.

## Upgrade122 Hotfix10 — 2026-11-02
- UMPIRE auto route to Referee after login; Auto BLV preference restored/armed automatically.
- Login gesture primes browser audio; start/score actions recover Android autoplay and reevaluate BLV gate.
- Automatic offline voice download begins when no Vietnamese engine is available and network is online.
- Referee mobile fullscreen compacted; team names wrap fully; Fun Commentary controls rearranged for phone use.

- 2026-11-02: Upgrade122 Hotfix11 — persistent opening-server ledger mirror + non-blocking/fast BLV fallback.

## Upgrade122 Hotfix17
- Restore persistent per-day `Sắp time` buttons in Badminton schedule headers.
- Re-mount after DOM/render/search/sync changes.

- Upgrade122 Hotfix18: Offline UMPIRE Readiness, precache Admin bundle/Firebase SDK runtime cache, sửa dứt điểm nút Sắp time theo ngày.

## Upgrade122 Hotfix22 - Offline Snapshot Reconcile (2026-11-02)
- UMPIRE offline scoring keeps the latest local court snapshot authoritative while reconnecting.
- Pending SCORE writes compact intermediate activeMatches snapshots before Firebase flush; event history remains preserved.
- Firebase stale reconnect snapshots cannot visually roll the umpire score backward and replay points forward.
- Offline-finished matches sync FINISHED/match result/events without reloading the old match into the referee screen.
- If a new match is started after an offline finish, the newer local active match remains on the referee screen during reconnect.
- Added Health status for pending offline reconciliation shadows.

## Hotfix23
- ADMIN ↑/↓ ordering for matches within each day; swaps time slots and persists/audits.

## Upgrade122 Hotfix25 - Fullscreen Applause Offline
- Replaced legacy Crowd FX settings card with one referee-fullscreen applause button.
- Applause playback uses packaged local OGG and is independent from BLV/Piper.
- Applause files remain Service Worker precached and are warmed on first online visit.

## Upgrade122 Hotfix25 - Fullscreen Applause Offline
- Replaced legacy Crowd FX settings card with one referee-fullscreen applause button.
- Applause playback uses packaged local OGG and is independent from BLV/Piper.
- Applause files remain Service Worker precached and are warmed on first online visit.

## Upgrade122 Hotfix27 - 2026-11-02
- Fixed ADMIN up/down schedule buttons that rendered but did not visibly move matches.
- Uses Firebase keys, direct online update, optimistic render, and read-back verification.
- Supersedes Hotfix24 order-button mount to avoid competing handlers.

## Upgrade122 Hotfix29 — Commentary Coalesce / Manual-only Score Voice
- Suppress all automatic score-derived commentary for ADMIN/UMPIRE during referee scoring.
- A burst of +1/-1 clears stale score commentary instead of replaying intermediate scores.
- `🎙 Tỷ số` waits for a short quiet window and speaks only the latest score once.
- Duplicate manual score text within 1.8s is ignored.


## Upgrade122 Hotfix31 — 2026-11-03
- Stability consolidation: non-blocking login boot, IndexedDB timeout/fail-safe, unified runtime version authority, multisport VNext boot hardening.

## Upgrade122 Hotfix32 — Auth Readiness (2026-11-03)
- Fix H31 login race: `Topkey.Auth.login` is never called before `Topkey.Data.auth` exists.
- Core `Auth.login()` now performs bounded readiness recovery instead of throwing immediately.
- New immutable admin core hash prevents stale H31 core reuse.
- Firebase SDK/Auth fallback waits up to 8 seconds with clear failure reporting.
- Source `src/auth.js`, bundle manifest, Service Worker and runtime references are synchronized.

## Upgrade122 Hotfix34 - Main-thread Stability
- Fixed post-login UI freeze caused by a self-triggering Hotfix30 MutationObserver/render loop.
- Removed redundant perpetual polling in Hotfix6, Hotfix7 and Upgrade121.
- Added Hotfix34 main-thread stability regression.

## Upgrade122 Hotfix35 - Canonical Day Order
- Fixed ADMIN up/down buttons not moving matches reliably.
- Added persistent `scheduleOrder` per match.
- Recalculate the entire day from 17:15 using `estimatedMatchMinutes` after every move.
- Unified day-time optimizer and order buttons under one scheduling formula.
- Removed H27 render wrapper / MutationObserver conflict; H21 is the sole schedule lifecycle owner.

## 2026-11-03 — Upgrade122 Hotfix36 Simple Confirm
- Removed all phrase-typing confirmations from the shared Badminton `confirmDanger()` path.
- Confirmation dialogs now have only Cancel / Confirm.
- Hidden compatibility input remains in DOM but is never displayed or validated.
- Other open common modals are closed before the confirmation dialog is shown.
- Bumped admin-core hash, build version and PWA cache to Hotfix36.

## Upgrade122 Hotfix37 - Mobile Admin + Test Lab Permissions
- Rebuilt ADMIN mobile layout for portrait and landscape: compact header/nav, responsive grids/forms, schedule card view, touch-friendly actions.
- Fixed Test Lab PERMISSION_DENIED design: isolated ADMIN-only rules for `__testlab_u122_20261031_badminton_*`.
- Added automatic local Test Lab fallback when cloud rules have not yet been deployed, avoiding a blocked test screen or retry loop.
- Bumped immutable admin-core hash and PWA cache to H37.

## 2026-11-03 — Upgrade122 Hotfix38
- Rebuilt standings rules around GROUP-only results.
- MEN/WOMEN/MIX are isolated at calculation time.
- Withdrawn teams are ineligible for qualification while historical results still affect opponents according to withdrawal policy.
- WALKOVER remains 2-0 with 11-0, 11-0 defaults under KEEP_PLAYED_WO.
- RETIRED counts match win for the opponent; only completed sets affect set differential.
- Removed unsafe implicit “team B wins” fallback when winner is missing.
- Added H38 withdrawal/standings audit API and WOMEN regression test.

## 2026-11-03 - Upgrade122 Hotfix40 Historical Match Integrity
- BXH khong con bo qua tran chi vi doi thu da bi xoa khoi `teams`.
- Luu `teamASnapshot/teamBSnapshot` vao match khi xu ly bo cuoc.
- Cho phep xoa an toan doi da bo cuoc khoi roster nhung giu nguyen match/ty so/winner/BXH.
- Them auditTeam de doi chieu tong tran lien quan, tran duoc tinh va ly do tran bi bo qua.

## Upgrade122 Hotfix42 — Missing Withdrawal Fixtures
- Standings reconstruct missing round-robin pairings against withdrawn teams when policy is `KEEP_PLAYED_WO`.
- Missing pairings are virtual standings-only WO results; they do not recreate schedule rows.
- Existing real matches always win over virtual fixtures; no double counting.
- `KEEP_PLAYED_CANCEL` and `CANCEL_ALL` do not receive virtual WO fixtures.
- Withdrawn-team deletion now archives a tombstone so standings can reconstruct missing pairings later.
- Historical actual scores cannot be guessed if the original match/result was already destroyed; fallback is administrative WO.

## Hotfix43 - Withdrawal Pair Completion
- Policy 2 now completes every uncounted GROUP pairing against a withdrawn team with a standings-only WO.
- Stale CANCELLED/SCHEDULED records no longer suppress the WO.
- Existing counted results remain authoritative and prevent double counting.
- Configured lossPoints are still awarded to the withdrawn loser.

## 2026-11-04 - Upgrade122 Hotfix44 Standings Single Result
- Khóa BXH về 1 điểm mỗi trận thắng; thắng WO cũng 1 điểm, thua 0.
- Mỗi cặp vòng bảng chỉ được tính một kết quả authoritative.
- Ưu tiên FINISHED/RETIRED/DISQUALIFIED thật hơn WALKOVER/virtual cũ.
- Thêm auditStandingTeam để truy vết từng cặp đóng góp vào BXH.

## 2026-11-04 - Upgrade122 Hotfix45 Core Standings Authority
- Moved standings authority into admin-core; removed H38/H40/H43/H44 from production runtime.
- Exactly one counted GROUP result per team pair; real result beats stale/virtual WO.
- Standings points are invariant: 1 point per win, including WO; 0 per loss.
- Virtual WO is created only when a withdrawn KEEP_PLAYED_WO opponent has no counted result for that pair.
- Withdrawn team deletion preserves tournament history via snapshots/archive in core.
- Top 3 / Knockout qualification uses rankingEligible and excludes withdrawn teams without erasing standings history.

## 2026-11-04 - Upgrade122 Hotfix46 Withdrawal Policy Recovery
- Recover KEEP_PLAYED_WO from live team, archive, match snapshots and historical withdrawal match metadata.
- Complete every missing active-vs-withdrawn GROUP pair exactly once.
- Preserve real counted results; virtual WO is only used when the pair has no valid counted result.
- Core remains the single standings authority.

## 2026-11-05 — Upgrade122 Hotfix51 Ranking Explain Report
- ADMIN: thêm nút `🧾 Giải trình BXH` tại BXH nhanh.
- Chọn nội dung và sinh báo cáo toàn bảng + giải thích Top 1–2–3.
- Báo cáo bám Ranking Engine hiện hành: Điểm → H2H/mini-league → HS set → HS điểm → set thắng → điểm ghi được.
- Xuất HTML, CSV và In/Save PDF.
- Không thay đổi Firebase/ranking data; giữ Hotfix50 auth-session no-auto-reload.

## 2026-11-05 - Upgrade122 Hotfix52
- Báo cáo Giải trình BXH mở rộng từ Top 3 thành Top 4.
- Tên file HTML/CSV/PDF theo quy tắc: `ddmmyyyy_Báo cáo BXH_Nội dung_Tên giải ngắn`.
- Tên giải `GIẢI CẦU LÔNG ĐÔI CÔNG TY TOPKEY - LẦN 8` được rút gọn thành `TOPKEY L8`.
- Không thay đổi Ranking Engine; báo cáo tiếp tục dùng trực tiếp `App.ranking({category})`.

## Upgrade122 Hotfix53 - 2026-11-05
- Admin ranking report: attach company logo locally when generating report.
- Report footer: BTC - tournament name, report date, signature area.
- HTML/Print-PDF embeds logo; CSV appends BTC/date and logo filename.
- Ranking and Top 1-2-3-4 explanation rules unchanged from Hotfix52.

- Hotfix54: Ranking report language selector (Vietnamese / English / bilingual Vietnamese-English).

## Hotfix55 - Ranking report Chinese language
- Added Simplified Chinese, Vietnamese-Chinese bilingual and Vietnamese-English-Chinese trilingual ranking report modes.
- HTML, CSV and Print/PDF report content now follows the selected report language.

## 2026-11-06 - Upgrade122 Hotfix57
- Moved/renamed public link management to **Setup · Liên kết & Chia sẻ**.
- Access: ADMIN + BTC/Organizer with Setup/Settings view/edit permission.
- Default UMPIRE remains hidden from this management block.

## Hotfix59 - BTC system role
- Added BTC to account role dropdown and built-in permission presets across MultiSport VNext.


## Hotfix61 - Permission hard-hide & auto layout
- Permission = none now hard-hides the full related UI shell/card/row/button instead of leaving empty headings/containers.
- Tabs with no module access disappear.
- Remaining cards/forms automatically reflow to fill available width on desktop and mobile.
- Applied to Badminton and shared multi-sport VNext.

## Hotfix67 - BTC Scope Save + Auto Close
- Fix sport scope save validation and auto-close permission dialog after successful save.

## 2026-11-06 - Hotfix69 Club Config Central Admin
- Chuyển Cấu hình CLB từ Hub Dashboard sang Quản trị hệ thống.
- Áp dụng systemAdmin:view/edit cho xem/sửa cấu hình CLB.
- Hub không còn nút Cấu hình CLB.


## 2026-11-07 - Hotfix71 Hub Auth Flow
- Mọi trang vận hành môn phải được mở từ Sports Hub bằng ticket phiên.
- Khi chọn môn từ Hub, phiên Firebase cũ không được tự động cho vào; trang môn hiện form đăng nhập mới.
- Sau đăng nhập, kiểm tra `sportScope/assignedSport` trước khi mở app. ADMIN vào mọi môn; BTC bắt buộc đúng môn được gán.
- Sai quyền: đăng xuất, quay về Hub và hiển thị thông báo không có quyền truy cập.
- Hub luôn hiện đầy đủ thẻ môn, không còn bị tài khoản BTC cũ làm ẩn các môn khác.

## Hotfix73 - 2026-11-07
- TOPKEY logo added to Hub header.
- Corporate title updated to HỆ THỐNG QUẢN LÝ THỂ THAO & HOẠT ĐỘNG XÃ ĐOÀN.
- Responsive header layout added.


# UPGRADE122 HOTFIX75 - BTC SPORT SCOPE GUARD FIX

- Sửa vòng lặp đăng nhập/chặn sai đối với tài khoản BTC đã được gán đúng môn.
- `Hotfix64` trước đây chỉ đọc `T.SPORT.key`; riêng Badminton có thời điểm biến này rỗng nên bị hiểu nhầm là đang mở môn khác.
- Xác định môn hiện tại theo thứ tự: `T.SPORT.key` -> query `sport` -> pathname `/badminton/`.
- Chuẩn hóa `sportScope/assignedSport` để tương thích dữ liệu cũ như `Cầu lông`, `🏸 Cầu lông`, `badminton`.
- Khi Firebase đã đăng nhập và tài khoản BTC đúng môn, giữ nguyên phiên và vào app; không bắt đăng nhập lại.
- Chỉ từ chối khi tài khoản disabled, BTC chưa gán môn, hoặc môn được gán thực sự khác môn đang mở.


# UPGRADE122 HOTFIX76 - FINAL REPORT IMAGE INSERT
- Thêm ảnh tạm vào Báo cáo toàn giải, chọn vị trí, tiêu đề ảnh tùy chọn, mục ảnh cuối tùy tên, xuất PDF/PPTX; không lưu ảnh vào hệ thống.

## 2026-11-07 - Upgrade122 Hotfix79
- Thêm Cơ cấu giải thưởng tùy biến ngay khi tạo giải và trong Cấu hình giải.
- Snapshot cơ cấu giải thưởng vào Báo cáo toàn giải.
- Sửa exporter PDF trắng bằng render từng trang A4 thay vì một canvas siêu dài.
- PowerPoint báo cáo dùng phong cách template TKT nâu/vàng, có ảnh/collage, giải thưởng và slide cảm ơn.

## Hotfix80
- Added report export language selector: Việt-Anh, Anh-Việt-Trung, Việt-Trung.
- Applied to PDF and PPTX report labels/headings.

## Hotfix82 - 2026-11-07
- Fixed Hub -> sport login loop and `reason=select-sport` redirect after successful login.

## 2026-11-07 - Upgrade122 Hotfix87 Schedule Group Parity
- Fixed VNext Hotfix58 global row append that separated date headers from Football/Volleyball matches.
- Reorders only inside each date group; WALKOVER/administrative-loss rows stay at bottom of their own day.
- Fixed Hotfix86 row-index mapping; stage/status/quick-result now bind by match ID/code.
- Preserved H86 auth session contract while bumping atomic release/cache to H87.
- Real Chromium regression: Football + Volleyball day grouping PASS.
- Full acceptance: 423 checks PASS.

## Hotfix90 - Referee + Auth Stability (2026-11-07)
- Fixed Badminton Firebase bootstrap: create/reuse the DEFAULT Firebase app before Database/Auth are requested.
- Football main referee console is sport-specific: goals, yellow/red cards, substitutions, period/stoppage-time, undo and event log.
- Volleyball main referee console is sport-specific: set score, points, serving team, timeouts, substitutions, sanctions, undo and event log.
- H90 Service Worker cache authority replaces H89 cache names across Hub/Badminton/VNext.
- Preserves H89 full-interface i18n, H88 report/judging/public and H87 schedule-group parity.
- Full source acceptance: 466 checks PASS.

## H93 · 2026-11-08 · Compact Hub + Admin Content
- Moved the sport selector above the executive dashboard and reduced each sport to icon + name only.
- Removed the large select-sport warning panel; expired selection is shown as a compact note inside the picker.
- Moved club-plan editing (profile, milestones, budget, assignments) to System Admin. Hub remains read-only reporting.
- Added System Admin settings for Hub eyebrow, main title and background image/URL.
- Background uploads are resized/compressed before saving to Firebase.
- Preserved H92 club-plan reporting, backup behavior and all previous auth/report/referee/public-link features.
