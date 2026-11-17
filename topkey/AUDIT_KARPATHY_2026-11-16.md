# TOPKEY Activity Hub — Audit Karpathy (16/11/2026)

## Phạm vi và nguồn bằng chứng
- Repository: `rolthchildpham-wq/activity-hub`.
- Baseline `main`: `24dd3397109cbfcf5134818692647c6ba6f776e8`.
- Nhánh sửa cách ly: `audit/topkey-karpathy-20261116`.
- Snapshot kiểm thử sau sửa: `44686cea6787f0a1f15da44d01af371c1dad401c`.
- Chạy Node.js v24.22.1 và Python 3.13.18 trong sandbox độc lập từ archive chính commit GitHub trên. Không dùng GitHub Actions; không ghi Firebase production.

## Ma trận kết quả

| Kiểm tra | Kết quả | Bằng chứng/giới hạn |
|---|---:|---|
| JavaScript syntax | **PASS 505/505** | `python scripts/static_gate.py topkey` |
| Script JS nhúng trong HTML | **PASS 52/52** | Static gate |
| JSON parse | **PASS 62/62** | Static gate |
| Vlog mô phỏng (scan 1.000 video, lỗi 401/502, CSV, điểm, responsive, TEST LAB, i18n) | **PASS 20/20** | `node scripts/test_vlog_*.cjs` từng tệp |
| Phân quyền giả lập ADMIN/BTC/VIEWER | **PASS 14 trường hợp** | `scripts/test_vlog_permission_parity.cjs`; **không phải Firebase emulator** |
| Full regression/integration tests | **53 PASS / 53 FAIL (106 bài)** | Test runner độc lập trên snapshot của nhánh |
| Core integration | **20 PASS / 1 FAIL** | FAIL là `vlog-rules-emulator.test.cjs`: thiếu `@firebase/rules-unit-testing` |
| Cầu lông | **31 PASS / 50 FAIL** | Nhiều test legacy có kỳ vọng phiên bản bundle/layout cũ; **chưa phân loại từng FAIL** |
| VNext | **1 PASS / 2 FAIL** | VM giả lập DOM/subscription cần điều tra |
| Hạng mục khác | **1 PASS** | Local script |
| Kiểm tra HTTP live | **PASS truy cập** | Hub, Vlog, cầu lông, VNext, short links trả HTTP 200; **chưa phải browser E2E** |
| Firebase Emulator quyền ghi | **NOT TESTED** | Chưa có `@firebase/rules-unit-testing`, cần môi trường emulator |
| EdgeOne Preview sau sửa | **NOT TESTED** | Chưa có URL preview xác minh SHA |
| Admin/BTC/Viewer trên trình duyệt thực tế | **NOT TESTED** | Không có phiên test desktop/mobile + Firebase sandbox |
| Hiệu năng 3 cold + 3 warm, HAR, p95 | **NOT TESTED** | Chưa có instrumentation thực tế |
| TikTok OAuth/đọc dữ liệu nguồn thật | **NOT TESTED** | Mock test chỉ xác minh hợp đồng và an toàn dữ liệu |

## Lỗi thực tế tìm được và sửa tại nhánh

### BUG-01 — Vlog hiển thị quyền BTC khác với Firebase Rules
**Trước sửa:** frontend và EdgeOne chấp nhận cả `sportScopes[]`, `sportScope='vlog'`, `permissions.modules.vlog='EDIT'` hay role không đúng chữ hoa, trong khi RTDB write rules không chấp nhận những trường hợp đó. BTC có thể thấy bộ điều khiển nhưng lưu Firebase bị từ chối.

**Sửa:** Frontend và EdgeOne API dùng cùng các điều kiện quyền được RTDB rules hỗ trợ (role `ADMIN`; module `vlog=edit`; `BTC` có `sportAccess.vlog=true`, `sportAccess.handmade=true`, hoặc `sportScope/assignedSport` là phạm vi DIY hợp lệ). Trạng thái tài khoản bị khóa/disabled vẫn bị chặn. Không mở rộng RTDB Rules. Bổ sung ma trận 14 trường hợp.

**Giới hạn:** Thao tác cấp quyền thực tế cần trường đúng trong hồ sơ Firebase; chưa thử tài khoản BTC trên Firebase live hoặc emulator.

### BUG-02 — Nút đọc chỉ số TikTok từng video bị thiếu trên giao diện
**Trước sửa:** `tiktok-automation.js` có xử lý `tiktok-read-link` nhưng HTML không có nút, nên không có event để thao tác.

**Sửa:** Thêm nút trong biểu mẫu Admin/BTC và bản dịch VI/EN/ZH. Bổ sung integration test gọi `/api/tiktok-stats` kèm bearer giả lập; khi nguồn chỉ trả 2/3 chỉ số, dữ liệu cũ của chỉ số còn thiếu được giữ nguyên.

### TEST-03 — Bộ test Vlog lỗi thời
**Trước sửa:** 13/19 bài test `scripts/test_vlog_*.cjs` PASS, 6 FAIL do thay đổi URL cache-busting, thông báo, cấu trúc worker hoặc giả lập thiếu dependencies.

**Sửa:** Cập nhật chính xác giả lập và kỳ vọng theo hợp đồng hiện tại, giữ các kiểm tra 401 stop, dữ liệu chỉ ghi nhánh TEST, không ghi 0 khi thiếu chỉ số. Sau sửa 20/20 PASS (bao gồm test parity mới).

### TEST-04 — Hai test integration Vlog và mock xác thực H108 lỗi thời
- Cập nhật test lưu bài theo việc đọc lại Firebase, làm trống form sau khi lưu.
- Test đọc link nay mock **same-origin EdgeOne API**, không dùng endpoint AppDeploy cũ.
- Thêm `remove()`, `querySelector()` vào mock DOM H108, không đổi code production cầu lông.

## Vòng xử lý tiếp theo (chưa đủ bằng chứng để đánh dấu PASS)
1. **P0 — Quyền BTC/Firebase:** cài môi trường rules emulator, chạy ma trận anonymous/ADMIN/BTC trong-ngòai-phạm-vi/umpire/viewer/disabled/token invalid; không sửa rules thật trước khi xác nhận.
2. **P0 — Badminton 50 FAIL:** phân loại từng test thành legacy expectation, fixture thiếu hoặc lỗi runtime thực; chỉ sửa runtime với chứng cứ tái hiện và regression test cập nhật.
3. **P1 — VNext 2 FAIL:** cập nhật DOM mock hoặc sửa subscription/render nếu tái hiện trên trình duyệt.
4. **P0 — EdgeOne Preview:** triển khai preview **trực tiếp từ GitHub, không dùng Actions**, so sánh mã nguồn SHA, kiểm tra login/reload, xem bảng, cập nhật điểm và CSV trên desktop/mobile.
5. **P1 — Performance:** đo HAR, Firebase calls, p50/p95, 3 lượt cold + 3 lượt warm; kiểm tra cache/service worker.

## Quyết định phát hành
**BLOCKED — NOT VERIFIED.** Không merge hay deploy production, không thay Firebase Rules hoặc dữ liệu cuộc thi. Production EdgeOne hiện trả HTTP 200 cho Vlog nhưng vẫn chứa logic quyền `scopeList` cũ (tại thời điểm audit), nên **nhánh sửa chưa nằm trên site thật**.

**Rollback:** `main` vẫn ở baseline khi tạo nhánh; không cần rollback production nếu chưa triển khai. Khi release sau này, ghi commit base SHA và chỉ phát hành sau khi gates bắt buộc PASS.
