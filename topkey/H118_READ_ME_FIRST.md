# TOPKEY H118 — Đồng bộ đăng nhập và quyền cho 7 môn

**Bản phát hành:** H118 · `u122h118-20261109`  
**Nguồn:** gói H117 do người dùng cung cấp.  
**Phạm vi:** sửa mã nguồn + đóng gói để triển khai; **chưa tự triển khai lên EdgeOne/Firebase production**.

## I. Đã sửa lỗi và đồng bộ cơ chế

1. **Xác thực một lõi dùng chung:** `topkey-shared-auth.js` là module duy nhất xác minh Firebase Auth + hồ sơ `topkey_badminton_vnext_2026/users/<uid>` của Cầu lông và sáu môn VNext: Bóng đá, Bóng chuyền, Chạy bộ, Đá cầu, Nấu ăn, DIY/Handmade. Hai `src/auth.js` và hai bundle production chỉ còn gọi adapter `TopkeySharedAuth.create(T)`.
2. **Chống vòng lặp ở phiên cũ:** không bắt đăng xuất vì Hub phát vé chọn môn mới; đăng nhập lại cùng UID luôn chủ động xác minh hồ sơ, không chờ Firebase lặp sự kiện `onAuthStateChanged`; bỏ qua callback null cũ nếu SDK đang có phiên hợp lệ. Đọc quyền thất bại thì không cấp quyền, nhưng hiển thị nút **Thử kiểm tra quyền (không đăng nhập lại)**; chỉ retry trên cùng Firebase user.
3. **Không mở quyền trước xác minh:** `topkey:admin-ready` chỉ phát sau khi hồ sơ Firebase được đọc và kiểm tra quyền thành công. Cầu lông dùng `topkey:core-ready` cho khởi tạo công khai, không kích hoạt các add-on quản trị quá sớm. Thu hồi quyền RTDB làm đóng giao diện bảo vệ. Truy cập sai môn trả về Hub mà không `signOut()` Firebase toàn cục, tránh làm mất phiên của môn khác.
4. **Một Hub guard:** `topkey-hub-guard-core.js` dùng chung cho cả hai entrypoint; hai `hub-entry-guard.js` của từng môn là adapter. Không tự tạo vé hợp lệ khi URL cung cấp vé không trùng với nonce phiên Hub. Cho phép route công khai đúng quy định. Cùng policy `TopkeyHubSession.canProfileAccess` được áp dụng khi xác minh hồ sơ.
5. **Tối ưu thời gian đăng nhập:** `h108-auth-guard.js` không chặn thao tác tối đa 3,5 giây để chờ observer khởi tạo và không quay vòng chờ quyền tối đa 8 giây sau khi xác minh đã có kết quả. Nếu retry lỗi, trả lỗi thực thay vì giữ trang ở trạng thái bận. Khôi phục giải được chuyển **sau khi** giao diện đã hiện và kiểm tra tối đa 10 ứng viên song song.
6. **Dọn listener:** sửa `off()` tại module Firebase của cả hai nhánh và hai bundle production, bảo đảm listener bị xóa khỏi registry sau unsubscribe, giảm tích lũy giữa lần đổi giải/chuyển vai trò/đăng nhập.
7. **Firebase Rules triển khai thống nhất:** `firebase.database.rules.json` và `firebase.storage.rules` ở gốc luôn là authority cho 7 môn. Hai tệp trùng tên cũ trong `sports/badminton/` được đồng bộ **100% nội dung** từ gốc để tránh vô tình đem bản rules chỉ có Cầu lông đi deploy. `tools/build_release.py` tiếp tục tự đồng bộ các bản sao. Chúng tôi **không thay đổi** biểu thức cấp quyền/ghi dữ liệu trong canonical rules ở gốc.
8. **Chống chờ Hub vô hạn:** kiểm tra đồng bộ build của 3 điểm vào có timeout 5,5 giây và thông báo thử lại khi CDN/EdgeOne chậm, không tự reload và không bỏ qua điều kiện đồng bộ.
9. **Cập nhật đồng bộ phiên bản/cache:** root, Cầu lông, VNext, các `build.json`, Service Worker và toàn bộ URL scripts cùng tag `u122h118-20261109`. Hai SW ưu tiên network-first cho các file điều phối đăng nhập.

### Giới hạn kiến trúc có chủ ý

Một tài khoản Firebase, một cơ chế session / Hub / quyền / xác minh, một bộ rules để deploy. **CSDL nghiệp vụ vẫn có namespace riêng từng môn**, để không trộn giải đấu. Luật thi đấu (set, tính điểm, tính giờ, chấm giám khảo), quy trình trọng tài và màn hình chuyên biệt vẫn theo cấu hình từng môn; **H118 không tuyên bố đã hợp nhất mọi chức năng hay kiểm tra 185 chức năng end-to-end**.

## II. Kết quả kiểm tra tại môi trường tệp cục bộ

- `node tests/h118/shared_auth_vm.cjs`: **29/29** tình huống Firebase mock (7 môn, phiên restore, stale-null, cùng UID, retry, phân quyền và khóa tài khoản).
- `node tests/h118/unified_rules_and_assets.cjs`: **28/28** kiểm tra rules/manifest/auth/bootstrap/SW.
- `python tests/h118/dom_auth_smoke.py`: **3/3** tương tác trên DOM thật trong Chromium, Firebase giả lập, gồm nút retry. Không dùng credentials production.
- `node tests/h117/auth_session_restore.cjs`: **PASS**.
- `node tests/h117/club_plan_conflicts.cjs`: **14/14 PASS**.
- `node tests/h117/production_loader.cjs`: **PASS**.
- `node tests/h117/release_integrity.cjs`: **38/38 PASS**.
- `node tests/h117/inline_syntax.cjs`: **14/14 PASS**.
- Test HTTP E2E tự động trên local không chạy được vì Chromium của môi trường chặn điều hướng `http://127.0.0.1` (`ERR_BLOCKED_BY_ADMINISTRATOR`). Không được xem kết quả mô phỏng là xác nhận đăng nhập Firebase production.
- `tests/h117/production_entry_smoke.cjs` cần thư viện npm `playwright` chưa có trong môi trường Node hiện tại; không tính là PASS.

## III. Bắt buộc khi triển khai

1. **Backup** Firebase RTDB/Storage và lưu bản H117 production đang chạy để rollback. Nên thử trên staging trước.
2. Upload/deploy **toàn bộ thư mục trong ZIP lên web root cùng một lần**: Hub + `topkey-shared-auth.js` + `topkey-hub-guard-core.js` + hai `sports` + `release-runtime.js` + assets. Nếu chỉ upload mỗi thư mục `sports/badminton`, bundle sẽ không tìm thấy module xác thực dùng chung ở cấp root.
3. Kiểm tra `release.json`, `build.json`, `sports/badminton/build.json`, `sports/vnext/build.json` đều là H118 / `u122h118-20261109`. Xác nhận URL các scripts trên trả **HTTP 200** và không bị CDN cache bản cũ. Khi nghi ngờ bản cũ, dùng **hard refresh**, không xóa phiên Firebase của người dùng.
4. Nếu cần deploy Firebase rules: chạy từ **gốc dự án**, dùng **tệp `firebase.json` ở gốc** để áp dụng **cả 7 môn**, không triển khai một bộ rules con làm mất ACL của các môn khác. Kiểm tra bằng Emulator hoặc staging trước khi đưa vào production.
5. Kiểm thử thực tế với 1 ADMIN, 1 BTC đúng môn, 1 BTC sai môn, tài khoản disabled: chuyển Hub ↔ Cầu lông ↔ VNext, F5, mạng chậm/RTDB bị gián đoạn, đăng nhập lại cùng UID, thay đổi role từ thiết bị thứ hai và quyền giữ nguyên sau refresh.
6. Đối chiếu chức năng vốn có của từng môn: giải / lịch / kết quả / BXH / LIVE / tài chính / báo cáo, đặc biệt đường dẫn lưu và ghi RTDB; H118 không thay thuật toán tính điểm đang hoạt động. Quan sát console + Network (404, `permission_denied`, 401), và đo thời gian tải từ hệ thống thật trước khi kết luận hết chậm.

**Rollback:** nếu có lỗi production, khôi phục nguyên bộ file H117 (và Firebase rules từ backup nếu có deploy rule). Không chỉ hạ version HTML vì các bundle và SW sẽ không khớp.
