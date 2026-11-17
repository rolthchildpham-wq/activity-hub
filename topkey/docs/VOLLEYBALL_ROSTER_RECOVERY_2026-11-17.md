# TOPKEY bóng chuyền: đội đã đăng ký nhưng đội hình hiện 0 cầu thủ (17/11/2026)

## Chẩn đoán từ mã nguồn
- Người dùng mở trang `/sports/vnext/index.html?sport=volleyball`. Ảnh cho thấy 4 đội `T001–T004` được hiển thị nhưng cửa sổ “Chỉnh đội hình” có hai dòng trống, nhãn đội “0 cầu thủ”.
- `src/upgrade11.js` yêu cầu `team.roster` (mảng các mục `name,jersey,employeeId,shirtSize`), và lịch `matches` chỉ liên kết `teamAId`, `teamBId`; việc tạo lịch **không tạo cầu thủ**.
- `src/upgrade11.js` xuất CSV với các cột `Ma,Ten,DoiTruong,HLV,DonVi,NoiDung,DanhSachCauThu_JSON`.
- `src/app.js` trước sửa vẫn nhập CSV theo các cột cũ `ThanhVien1/VDV1/Member1`; không đọc cột `DoiTruong` và `DanhSachCauThu_JSON`. Do đó không thể round-trip danh sách đầy đủ và dễ mất danh sách khi nhập lại.
- Chưa kiểm tra Firebase giải thật, không khẳng định dữ liệu cầu thủ còn hay đã mất; ảnh chỉ chứng minh giao diện hiển thị 0.

## Sửa mã (không chạm giải thật)
- `src/roster-csv-recovery.js` chỉ chạy ở `football` và `volleyball` sau khi lõi VNext tải xong, thay thế lối import CSV cũ trong phạm vi hai môn đó.
- Nhận cả CSV cũ lẫn CSV mới; parse `DanhSachCauThu_JSON`, giữ tên, số áo, mã nhân viên, size áo và kiểm tra dữ liệu JSON, số áo trùng.
- Nếu `Ma` khớp mã đội hiện có **và tên đội trùng**, đội hiện có không có roster thì chỉ ghi `teams/<id>/roster` và `updatedAt`. Không thay ID, không thay trạng thái, không sửa `matches` hoặc `schedule`.
- Nếu đội hiện có đã có roster thì không ghi đè. Nếu mã khớp đội khác, hủy import để tránh đặt nhầm cầu thủ.
- Tạo đội mới chỉ khi tên đội và đội trưởng có dữ liệu. Không suy đoán các cầu thủ từ tên đội trưởng hay sinh dữ liệu giả.
- Hiện màn xác nhận trước khi import; thao tác hủy hoặc lỗi CSV không ghi dữ liệu. Trạng thái offline có lời nhắc hàng đợi.
- Thêm hướng dẫn ngay trong modal khi không có đội hình.
- `index.html` tham chiếu script bổ sung với version riêng; nguồn `h97-vnext.bundle.js` không bị sửa.

## Cách phục hồi T001–T004
1. Trên trang Bóng chuyền, **xuất CSV** và sao lưu danh sách hiện tại trước khi thay đổi.
2. Nếu có file CSV đăng ký gốc hoặc Excel còn tên cầu thủ, dùng file mẫu (có cột `DanhSachCauThu_JSON`) với `Ma` và `Ten` trùng chính xác đội cũ; import để **gắn roster vào đội hiện có**.
3. Nếu không có dữ liệu cầu thủ trong Firebase hoặc file nguồn, phải nhập từng người ở nút **Đội hình (0)** rồi bấm **Lưu đội hình**; hệ thống không thể tự phục hồi thông tin chưa từng lưu.
4. Sau thao tác, kiểm tra `Đội hình (N)`, tải lại trình duyệt, xác nhận ID đội và lịch thi đấu vẫn đúng.

## Bằng chứng
- Test `topkey/sports/vnext/tests/volleyball-roster-csv-recovery.test.cjs`: PASS trên snapshot commit 6d55eb26 (trước lượt xóa no-op).
- 4/4 bài test VNext bao gồm 10k render, subscription/pagination, queue và roster recovery: PASS.
- Static Gate snapshot: JS 513, HTML inline 52, JSON 62; 0 lỗi.
- Firebase Emulator (ADMIN/BTC/VIEWER), Chrome/Android login, EdgeOne Preview SHA, performance và dữ liệu giải thật: NOT TESTED.

## Production Gate
**BLOCKED – NOT VERIFIED**. Giữ nhánh `fix/volleyball-roster-import-recovery-20261117` cách ly, không dùng GitHub Actions, không sửa Firebase Rules / dữ liệu production. Chỉ triển khai sau preview và ma trận quyền/kiểm thử thực tế đạt.
