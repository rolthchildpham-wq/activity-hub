# Upgrade122 Hotfix33 — Stable Runtime

## Mục tiêu
H33 thay đổi cách ổn định hệ thống thay vì tiếp tục xếp thêm hotfix. Trọng tâm là boot/login deterministic, giảm runtime chồng chéo, thống nhất asset/build/cache và giảm self-heal timer.

## Thay đổi kiến trúc
- Một bootstrap production duy nhất (`STABLE_BOOTSTRAP_001`).
- Firebase App/Auth/Database có CDN failover: cdnjs -> gstatic.
- Admin core production nằm đúng `assets/u122/` và dùng tên hash nội dung.
- Viewer route không tải admin core.
- Service Worker chỉ precache foundation nhỏ; admin runtime được cache theo nhu cầu / Offline Readiness.
- Runtime chỉ load các hotfix còn hiệu lực. H3/H4/H12/H13/H16/H17/H23/H24/H31/H32 không còn chạy production.
- H15 chỉ sở hữu optimizer; H21 sở hữu day-header schedule button/render hook; H27 sở hữu order buttons qua DOM observer/event.
- H26/H28/H29/H30 bỏ steady self-heal timers; event/observer là nguồn mount chính.
- Legacy audit/source-order comments được loại khỏi production HTML.

## Login/Auth
- Submit trước khi core sẵn sàng được bootstrap giữ độc quyền, đảm bảo core load một lần và signIn một lần.
- Sau khi App bind static handler, bootstrap không chặn submit nữa.
- Data/Auth init dùng single-flight và deterministic Firebase instance.

## Acceptance H33
PASS:
- `upgrade122_hotfix33_stable_runtime_regression.js`
- `upgrade122_hotfix33_bootstrap_vm.js`
- `upgrade122_hotfix33_auth_vm.js`
- `upgrade122_hotfix33_integrity_regression.js`
- `upgrade122_hotfix33_early_submit_vm.js`
- `upgrade122_hotfix33_runtime_ownership_regression.js`
- Firebase latency VM
- render runtime VM
- scoring fast-lane VM
- schedule DOM safety VM
- atomic score pipeline VM
- runtime authority/data/UI boundary VMs
- atomic-score soak + long-session soak + production-hardening VM
- BLV gate / viewer BLV / BLV lifecycle current runtime tests

## Giới hạn test
Không tuyên bố real-browser E2E PASS trong môi trường build này. Chromium bị policy chặn localhost/file URL; thử nhúng toàn bộ bundle qua DevTools bị timeout do kích thước. Vì vậy acceptance hiện tại dựa trên static integrity + VM/runtime/soak tests. Sau deploy production cần smoke test thật: ADMIN login, UMPIRE login, offline score/reconnect, schedule order, BLV/manual/auto rules.
