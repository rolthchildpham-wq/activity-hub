# H119 Unified Platform Auth Design

## Mục tiêu

H119 phải loại bỏ hiện tượng Cầu lông mở giao diện rồi quay lại màn đăng nhập, giảm đường tải đăng nhập không cần thiết, và áp dụng cùng một cơ chế Auth, Hub session, policy quyền và bootstrap Firebase cho cả bảy môn.

## Nguyên nhân gốc đã xác định

1. Cầu lông tải Firebase App, Database và Auth tuần tự. Mỗi SDK thử CDNJS trước, chờ tối đa 6,5 giây rồi mới thử GStatic; khi CDN đầu chậm hoặc bị chặn, tổng thời gian có thể vượt 30 giây.
2. Ba lớp cùng xử lý submit đăng nhập: bootstrap inline của Cầu lông, `h108-auth-guard.js`, và handler trong App bundle. Chúng dùng các timeout và trạng thái busy khác nhau.
3. `topkey-shared-auth.js` có thể đưa UI về login khi nhận `null` tạm thời từ Auth observer hoặc profile listener sau khi app đã được xác minh. Không có state machine trung tâm phân biệt restoring, revalidating và signed-out.
4. Auth đã dùng chung nhưng policy vẫn bị lặp ở Hub guard, hai config sport và bundle. Firebase rules ở gốc là canonical, nhưng chưa có contract tự động chứng minh policy client và bảy namespace rules cùng phạm vi.

## Kiến trúc được chọn

### Topkey Platform Core

Tạo `topkey-platform-core.js` làm authority trình duyệt duy nhất cho:

- tải Firebase compat SDK bằng single-flight;
- GStatic là nguồn chính, CDNJS là fallback;
- App SDK tải trước, Auth và Database tải song song sau App;
- một login submit controller dùng chung;
- trạng thái boot `RESTORING`, `AUTHENTICATED`, `REVALIDATING`, `SIGNED_OUT`, `ERROR`, `DENIED`;
- policy role/sport dùng chung qua `TopkeyPlatform.policy`.

Badminton và VNext chỉ cung cấp `ensureCore()` khác nhau vì bundle vật lý khác nhau. Cả hai dùng cùng `TopkeyPlatform.bootSport()` và không tự gắn thêm login handler.

### Session và UI

- Form login không được hiển thị trong lúc Firebase đang khôi phục phiên.
- Sau khi profile đã xác minh, callback Auth `null` hoặc profile `null` đơn lẻ chuyển sang `REVALIDATING`, không được mở login ngay.
- Revalidation đọc lại Auth/profile một lần trong thời gian giới hạn. Chỉ trạng thái signed-out xác nhận, profile bị thu hồi xác nhận hoặc lỗi quyền dứt khoát mới đóng app.
- Logout do người dùng là đường duy nhất sign out chủ động cho protected session; sai môn chỉ từ chối route, không sign out Firebase toàn cục.
- `topkey:admin-ready` chỉ phát một lần cho mỗi UID sau khi server profile hợp lệ.

### Policy và Rules

`TopkeyPlatform.policy` là policy client duy nhất cho chuẩn hóa môn, tài khoản bị khóa, quyền vào môn và tab theo role. Config từng môn chỉ giữ dữ liệu môn, luật thi đấu, label và namespace.

`firebase.database.rules.json` và `firebase.storage.rules` ở gốc tiếp tục là authority backend. Build gate kiểm tra đủ bảy namespace, bản sao Badminton giống byte-for-byte, và client policy dùng cùng danh sách bảy môn/role. Không nới lỏng ACL hiện có.

### Hiệu năng

- Không tải Storage, QRCode, HLS, JSZip hoặc report trên đường login.
- Auth và Database SDK tải song song sau App SDK.
- Core bundle chỉ nạp một lần và các promise không được nhân đôi bởi click/observer.
- Không chờ release probe, tournament recovery, IndexedDB migration hoặc runtime add-on trước khi mở protected shell.

## Bảo toàn hành vi

- Không đổi Firebase project, đường dẫn users, namespace giải hoặc schema nghiệp vụ.
- Không đổi thuật toán tính điểm, BXH, lịch, trọng tài, tài chính, báo cáo hay Test Lab.
- Cầu lông và sáu môn dùng chung nền tảng, nhưng vẫn giữ rule thi đấu theo cấu hình môn.
- Không tự deploy EdgeOne hoặc Firebase Rules từ môi trường này.

## Tiêu chí chấp nhận

1. Restored user hợp lệ mở app một lần; stale Auth null và transient profile null không mở login.
2. Logout thật và profile bị thu hồi xác nhận vẫn đóng app.
3. Một submit chỉ tạo một lần sign-in/profile verification.
4. Bảy môn có cùng kết quả policy cho ADMIN, BTC đúng/sai scope, account disabled và role thường.
5. Static startup không còn Firebase CDN tags riêng của VNext hoặc loader tuần tự riêng của Badminton.
6. Toàn bộ test H118/H117 liên quan Auth, loader, rules, business và syntax tiếp tục pass.

