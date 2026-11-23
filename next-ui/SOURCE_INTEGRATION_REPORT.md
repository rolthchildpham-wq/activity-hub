# Đối chiếu mã người dùng cung cấp — TOPKEY Next UI

Nguồn: tệp văn bản người dùng cung cấp ngày 23/11/2026, gồm Rules cho 8 môn, GitHub Actions, Playwright và layout SvelteKit đa cấp. Các đoạn trong nguồn là ví dụ; chưa thể mặc định thay hoàn toàn mã đang hoạt động.

## Vị trí tích hợp chính xác

| Nội dung trong nguồn | Mã thực tế cần thay/giữ | Kết quả |
| --- | --- | --- |
| Firebase `database.rules.json` | `topkey/firebase.database.rules.json` | **Không ghi đè**. Giữ nguyên Rules production; đã có các kiểm thử contract và quyền tài chính trong `next-ui/tests/rules-audit.test.mjs`. |
| GitHub Actions `.github/workflows/ci.yml` | `.github/workflows/next-ui-validation.yml` | **Đã tích hợp** hai job validate/e2e, cache, `svelte-kit sync`, optional TEST LAB secrets; không thêm workflow deploy trùng lặp. |
| `e2e/*.spec.ts` | `next-ui/e2e/` | **Đã tích hợp** 9 spec chức năng, role fixtures và responsive. Tăng cường bằng ảnh chụp public sau mỗi viewport. |
| `e2e/helpers.ts` | `next-ui/e2e/fixtures/roles.ts` | Giữ fixture role từ storage-state được cấp phép thay vì tài khoản hardcode không tồn tại. |
| Root và Home/Workspace Svelte layout | `next-ui/src/routes/+layout.svelte`, `next-ui/src/routes/sports/[slug]/[tid]/+layout.svelte` | **Đã tích hợp** Home/Workspace riêng, breadcrumb 3 cấp, active state theo module, bottom nav và More menu. |
| CSS, kiểm thử hình ảnh | `next-ui/src/workspace-audit.css`, `next-ui/e2e/auth.spec.ts`, CI artifact | Bổ sung kiểm tra độ tương phản mã màu và ảnh **Playwright local preview** ở 360/390/768/1280, phân biệt với ảnh production. |

## Xung đột phát hiện trong văn bản gốc

1. **Firebase Rules trùng khóa JSON root**: cùng `topkey_*_vnext_2026` xuất hiện hai lần trong cùng object. JSON parser có thể ghi đè giá trị thứ nhất bằng giá trị sau, dẫn tới mất quy tắc cấp quyền mong muốn.
2. **Rules khác schema thực tế**: mã cũ dùng `finance` (INCOME/EXPENSE, REQUESTED/APPROVED/PAID) và `audit` (`clientAt`/`actor`); bản ví dụ dùng `transactions`/`logs` và `income`/`expense`. Các trang `next-ui` đã được sửa theo schema thật.
3. **Rules không thể thay thế máy móc**: bản ví dụ mở `.read=auth != null` trên toàn root môn, xung đột với quyền BTC theo scope, quyền xem công khai và phân quyền tài chính chi tiết hiện có. Cú pháp `.matches(/regex/)` **được Firebase Realtime Database Rules hỗ trợ** (đã đối chiếu tài liệu chính thức); không phải nguyên nhân xung đột. Rủi ro nằm ở quyền root quá rộng, khóa JSON trùng nhau và dữ liệu thực tế không khớp. Không deploy rules này.
4. **CI `npm ci` yêu cầu lockfile**: repo `next-ui` hiện chưa có `package-lock.json` trong `main`; thay nguyên workflow ví dụ sẽ khiến bước cài dependency thất bại. CI đang dùng `npm install` với cache npm, giữ nguyên khả năng chạy đến khi tạo lockfile kiểm chứng được.
5. **CI emulator chưa được bật**: chỉ đặt `FIREBASE_AUTH_EMULATOR_HOST`/DATABASE host không tự khởi động hoặc tạo user/role. Không được coi các bài E2E ghi điểm là đã xác thực.
6. **E2E ví dụ chưa thể chạy ngay**: nhập `firebase/auth` trong `page.evaluate()` không bảo đảm có bundler, dùng credential giả `admin@test.local`, giả định `/sports/football/TID-2026-A` tồn tại và selector class khác giao diện thực tế.
7. **Svelte 5 runtime**: đoạn Root `+layout.svelte` ví dụ sử dụng `{@render children()}` mà chưa khai báo `children`, và trộn mẫu reactivity cũ với `$app/state`. Không chép đè Root layout đang build PASS.
8. **Đường dẫn ứng dụng**: ứng dụng thực tế gắn tại `/next/`; ví dụ có nhiều `href="/"` làm quay sai về web chính. Bản hiện hành sử dụng `$app/paths`.

## Đánh giá độ mượt và hình ảnh

- Bộ ảnh tạo từ **Chromium của Playwright chạy build SvelteKit local trong GitHub Actions**, không phải ảnh chụp EdgeOne. Chỉ lưu ảnh trang đăng nhập và danh mục 8 bộ môn để tránh rò rỉ thông tin tài khoản/giải đấu.
- File JSON lưu chiều rộng viewport, chiều rộng tài liệu, px overflow, thời gian `PerformanceNavigationTiming.duration` và JS page errors cho từng ảnh. Đây là một lượt điều hướng/viewport, không phải thống kê cold/warm p95.
- Các bảng màu đã được kiểm tra tĩnh theo WCAG AA cho 7 cặp foreground/background xác định trong stylesheet; không tuyên bố toàn site 100% đạt WCAG hay mượt khi chưa chạy real Preview.
- Tài liệu visual artifact được lưu 7 ngày ở mục GitHub Actions của PR kiểm thử.

## Điều kiện phát hành

Dù CI PASS vẫn cần EdgeOne Preview chứa commit SHA thực, ảnh chụp desktop/mobile từ URL thật, kiểm thử role emulator và các thao tác ghi qua Test Lab, đo 3 cold + 3 warm rồi owner phê duyệt. Không merge production hoặc thay Firebase Rules tự động nếu các điều kiện này chưa đạt.
