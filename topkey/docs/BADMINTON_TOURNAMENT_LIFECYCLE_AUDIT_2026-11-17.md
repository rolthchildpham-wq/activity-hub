# TOPKEY — Kiểm toán tạo giải, đóng giải, báo cáo cuối giải và lịch sử (17/11/2026)

## Phạm vi
- Repository `rolthchildpham-wq/activity-hub`, base main SHA `4c8a6c40289742627a61a4b6858e38bd0e2ffece`.
- Môn kiểm tra theo ảnh: **Cầu lông**; giao diện tạo giải là `upgrade122-hotfix80.js`, báo cáo/đóng giải là `upgrade122-hotfix65.js`, dữ liệu nền và lịch sử là `src/upgrade9.js` nằm trong gói runtime admin.
- Không đăng nhập/tạo/đóng giải thật; không ghi dữ liệu Firebase production hay đổi Rules.
- Dữ liệu trong ảnh: tên `Cầu lông 2027`, địa điểm `Sân cầu lông Công ty Topkey`, cơ cấu giải thưởng 5 dòng, thông báo `location.reload is not a function`.

## Phát hiện 1 — BUG TẠO GIẢI ĐÃ XÁC NHẬN (P0)
- Trong callback form của `upgrade122-hotfix80.js`: `const title=...,location=$('tk79-new-location').value...`, sau khi `await T.Data.db.ref().update(up)` lại gọi `location.reload()`.
- **Nguyên nhân:** biến cục bộ `location` đang là **chuỗi địa điểm**, che khuất `window.location`. Do đó gọi `reload` trên string gây lỗi.
- **Tác động:** update nhiều đường dẫn Firebase đã được yêu cầu trước khi lỗi phát sinh. Nếu update hoàn tất, giải có thể đã lưu nhưng người dùng lại thấy thông báo “Không tạo được giải”. Lần bấm thêm có thể tạo giải trùng.
- **Sửa:** đổi thành `venue` và `location:venue`; chuyển sang `window.location.assign` với tham số `tid` mới; đọc `tournamentIndex/<sport>` trước khi tạo, chặn tên giải ACTIVE trùng và cung cấp **Mở giải đã tạo**. Nút tạo khóa khi đang ghi. Sau lỗi điều hướng, hướng dẫn kiểm tra lịch sử trước khi thử lại.
- **Lưu ý thực tế:** CHƯA đọc Firebase để xác minh giải “Cầu lông 2027” đã tồn tại. **Không bấm Tạo giải lần nữa trước khi kiểm tra lịch sử.**

## Phát hiện 2 — LƯU BÁO CÁO KHI ĐÓNG GIẢI (P0)
- Lõi `finishTournament` chặn nếu còn lịch chưa hoàn tất, yêu cầu xác nhận, lưu `config.tournamentStatus='CLOSED'`, `closedAt`, `closedBy`, `finalTop3`, và index tại `topkey_badminton_vnext_2026/tournamentIndex/badminton/<tid>`.
- Phần `upgrade122-hotfix65.js` tạo `finalReport` theo giải, bao gồm kết quả, BXH, Top 4, thống kê tài chính, có thể xuất HTML / PDF / PPT qua các module khác.
- **Rủi ro cũ:** lõi đóng giải ghi **thay thế toàn bộ index**, có thể xóa `finalReport` đã lưu trước đó; wrapper lưu lại báo cáo phía sau nhưng lỗi ghi bị bỏ qua bởi `catch{}`, dễ hiện “Đã đóng” mà báo cáo lịch sử không còn.
- **Sửa:** trước khi đóng giải có trận và đủ kết quả, xác minh online + ghi báo cáo + đọc lại `finalReport/tid`. Nếu không xác minh được, **không gọi đóng giải**. Sau khi lõi đã đóng, bổ sung `finalReport`, `reportReady`, `reportGeneratedAt` trở lại index bằng `update` (không thay Top 3 hay thông tin đóng), đọc lại xác minh, tải lại lịch sử. Báo lỗi rõ nếu lưu lịch sử sau đóng thất bại.
- **Ngoại lệ đang tồn tại:** nếu giải **không có lịch đấu**, lõi vẫn có thể cho đóng sau khi xác nhận; không tạo báo cáo trận hoàn tất. Đây là hành vi cũ, chưa thay đổi.

## Phát hiện 3 — LỊCH SỬ GIẢI / HIỂN THỊ
- Lõi `loadArchives` đọc Firebase `tournamentIndex/<sport>` có phân trang qua `TopkeyArchivePage`; `renderArchives` hiển thị tên giải, ID, trạng thái ACTIVE/CLOSED, ngày đóng, “Hiện tại”.
- Hotfix65 gắn nút **⬇ Tải báo cáo** vào mỗi thẻ lịch sử; giải chưa có `finalReport` hoặc `reportReady` bị vô hiệu hóa.
- Hotfix80 tùy biến nút xuất PDF/PPT/HTML và tải `finalReport` từ index nếu dữ liệu snapshot không còn trong RAM.
- **Đã kiểm tra bằng VM mock:** giải CLOSED + có báo cáo hiển thị nút xuất hoạt động; giải chưa kết thúc thiếu báo cáo thì nút disabled.
- **Chưa xác minh Firebase thật:** các giải đã đóng trước đây có thể không có `finalReport`; báo cáo không thể được tự suy diễn từ index khi dữ liệu gốc không tồn tại.

## Cách tạo giải đúng
1. Vào Cầu lông với tài khoản ADMIN → **Cài đặt / Quản trị** → **Tạo giải mới**.
2. Điền **Tên giải** riêng biệt, **Địa điểm**; chỉnh **Giải Nhất, Nhì, Ba, Khuyến khích, quà toàn giải**, số lượng, phần thưởng, ghi chú; bỏ/thêm mục nếu cần.
3. Bấm **✓ Tạo giải** **một lần**. Mã mới kiểm tra giải ACTIVE trùng trước khi ghi.
4. Khi ghi thành công, trang điều hướng sang `index.html?tid=<mã giải mới>`; kiểm tra tên giải, ID, địa điểm/cơ cấu trong Cấu hình và lịch sử giải.
5. Tiếp tục nhập đội/VĐV, lịch, trọng tài, tỷ số, tài chính. Giải cũ không bị xóa; chỉ thay lựa chọn giải hiện tại.

## Cách đóng và xem báo cáo
1. Đảm bảo mọi trận/lượt có trạng thái kết thúc hoặc hủy hợp lệ; kiểm tra BXH, Top 3, tài chính.
2. Tại **Cài đặt / Quản trị → Quản lý vòng đời** bấm **Đóng giải** và xác nhận.
3. Kiểm tra `CLOSED`, `closedAt`, `reportReady`, `finalReport` ở lịch sử; tải báo cáo cuối giải từ thẻ của đúng `tid`.
4. Với giải cũ không có báo cáo, cần đối chiếu snapshot/backup và dữ liệu còn lưu, không tạo kết quả giả.

## Test và gate
- Test `topkey/sports/badminton/tests/tournament_lifecycle_20261117.test.cjs`: **PASS** tạo giải, địa điểm, thưởng, đổi giải theo tid, chặn trùng, đóng + lưu báo cáo + Top 3 + nút xuất lịch sử, mất mạng/permission denied/hủy.
- `upgrade96_blv_lifecycle_regression.js`: **PASS**.
- `h51_ranking_explain_report_test.js`: **FAIL** vì mock đòi `H51 runtime` không tải; chưa xác định là lỗi chức năng hiện tại, không xóa FAIL.
- Static gate snapshot: **517 JS + 52 inline HTML scripts + 62 JSON, 0 lỗi cú pháp**.
- EdgeOne live trả HTTP 200 cho các tệp, nhưng mã live còn bản cũ; **fix chưa được triển khai**. Không đánh đồng 200 với bản mới.
- Firebase Emulator role matrix: **NOT TESTED**.
- EdgeOne Preview SHA, Chrome/Android real E2E, performance 3 cold+3 warm: **NOT TESTED**.
- Release: **BLOCKED / draft**, không dùng GitHub Actions, không sửa Firebase Rules hoặc dữ liệu thật.
