# H83 ACCEPTANCE REPORT

Build: `u122h83-20261107`  
Ngày kiểm tra: 2026-11-07

## Tổng kết

**FULL_WEB_ACCEPTANCE_OK 363**  
Không có FAIL trong bộ acceptance cuối trước đóng gói.

## Nhóm test chính

- Auth state matrix: **26 PASS**
  - Direct access không có Hub session bị từ chối.
  - ADMIN Cầu lông/VNext.
  - BTC Cầu lông đúng scope.
  - BTC Bóng chuyền đúng scope.
  - BTC sai môn bị từ chối.
  - DISABLED bị từ chối.
  - Login -> authenticated -> reload/F5 không quay lại login.
  - Chọn môn mới tạo fresh session.
  - VNext clean URL reload khôi phục sport từ session.
  - Alias cho toàn bộ 6 VNext sports.

- Auth integration với source auth thật + Firebase mocks: **8 PASS**
  - BTC Badminton login/reload.
  - ADMIN Badminton.
  - BTC sai Badminton scope.
  - BTC Volleyball login/reload.
  - ADMIN Volleyball.
  - Disabled account.

- Report fixture: **6 PASS**
  - Badminton + VNext.
  - `vi-en`, `vi-zh`, `en-vi-zh`.
  - Rankings, schedule/results, finance, prize structure, image block.

- PDF binary smoke: PASS
  - 2 trang.
  - File khoảng 109 KB.
  - Render lại bằng PDF renderer thành công.
  - Nội dung trang xác nhận không trắng.

## Parity Cầu lông / VNext

Các hotfix chia sẻ được kiểm tra byte-parity:

- Hotfix60
- Hotfix61
- Hotfix63
- Hotfix64
- Hotfix65
- Hotfix66
- Hotfix67
- Hotfix68
- Hotfix76
- Hotfix80

Active report module Cầu lông/VNext được kiểm tra exact parity.

## 7 môn được kiểm tra

- Cầu lông
- Bóng chuyền
- Bóng đá
- Chạy bộ
- Đá cầu
- Nấu ăn
- DIY/Handmade

ADMIN và BTC đúng sportScope được kiểm tra trên ma trận sport; alias `Đ/đ` đã có normalization riêng.

## Venue parity

- Rename venue: PASS.
- Delete venue: PASS.
- LIVE/history protection: PASS.
- Nấu ăn + DIY/Handmade: label **Khu vực (Sảnh)**: PASS.

## Báo cáo

- 3 ngôn ngữ: PASS.
- Cơ cấu giải thưởng: PASS.
- Ảnh báo cáo: PASS fixture/state.
- Local PptxGenJS bundle: PASS asset/reference checks.
- Internal PDF builder: PASS binary/render smoke.
- Blank-page detection/fallback code path: PASS static/fixture checks.

## Regression standings

- H44: PASS.
- H45: PASS.
- H46: PASS.
- H47: PASS.
- H48: PASS.
- Consolidated H53 ranking/report features: PASS.

## Version/cache/package

- Manifest H83: PASS.
- Hub H83: PASS.
- Badminton H83: PASS.
- VNext H83: PASS.
- H83 release authority loaded: PASS.
- H83 release badge present: PASS.
- Service Worker/cache tag H83: PASS.
- EdgeOne no-cache auth routes: PASS.
- Local referenced JS/assets exist: PASS.
- Inline/referenced JS syntax checks: PASS.

## Production observation trước deploy

Public production được audit trước khi đóng gói và vẫn đang phục vụ H82 cho trang Cầu lông. Vì vậy phải xác nhận badge **H83 · FULL CONSOLIDATED** sau deploy trước khi test tài khoản thật.

## Giới hạn kiểm thử

- Không dùng/không yêu cầu mật khẩu production của người dùng. Auth được kiểm thử bằng source auth thực + Firebase mocks và role fixtures.
- Headless Chromium của container không chạy ổn định do môi trường runtime/D-Bus, vì vậy browser-click PDF automation không được dùng làm bằng chứng. Thay vào đó PDF binary được tạo thật và render lại bằng PDF renderer.
