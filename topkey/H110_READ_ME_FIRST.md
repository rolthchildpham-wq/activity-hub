# TOPKEY H110 - Sua loi cong nguoi xem Cau long

## Nen tang va pham vi
- Ke thua nguyen bo H109, khong quay ve H96.
- H110 chi sua thu tu khoi tao Firebase cho `#spectator` va `#register`, dong bo phien ban/cache, loai bo Service Worker dang ky trung trong viewer.
- Khong chinh sua Firebase Database/Storage Rules, mat khau, role, ty so, ket qua, BXH, tai chinh, bao cao PDF/PPT.

## Nguyen nhan da tai hien
- H109: `ensureViewer()` goi `ensureFirebase('public')`, nhung public route KHONG tai `src/config.js` truoc khi `firebase.initializeApp`.
- H109 tren Chromium DOM gia lap bao `Firebase config chua san sang truoc khi khoi tao Auth` (ca spectator va register).
- H109 viewer bundle dang ky SW them mot lan voi query H50, chong cheo voi SW entry H109.

## H110 thay doi
- Them `ensureConfig()` dung chung cho ADMIN, spectator va dang ky cong khai, co promise de khong tai lap va co reset khi that bai.
- Kiem tra config truoc SDK Firebase App va Database, de trang cong khai khong can tai Firebase Auth ngay luc mo.
- Live WebRTC tiep tuc chi yeu cau Anonymous Auth khi thuc su xem stream; KHONG duoc cap quyen ADMIN tu client.
- Voi viewer duoc tai qua bootstrap, chi entrypoint dang ky Service Worker mot lan; metadata viewer lay ma phien ban tu `TopkeyRelease`.
- Build H110 dong bo `release.json`, 3 `build.json`, 3 Service Worker, cache-buster, bo phan runtime. Cap nhat `tools/build_release.py` de dong dau ca `version` va `cacheTag`.

## Nghiêm thu cuc bo
- H109-before: loi duoc tai hien tren Chromium DOM: config chua nap, Firebase App khong khoi tao.
- H110-after: spectator va register PASS voi SDK/Database gia lap; thu tu nap config -> app -> database -> giao dien.
- Module viewer thuc te: dung DOM/Database stub, doc config va dang ky cac nhanh du lieu, khong co JavaScript page errors.
- Kiem tra syntax: 407/407 JS + 16/16 inline scripts; 78/78 local resources ton tai.
- Login 8/8 va role/session 26/26 regression PASS; h107 awards contract PASS.
- Generator build H111 gia lap PASS cho 3 manifest, 3 SW, core entrypoints va bundle.
- CHUA KIEM THU: Firebase/Auth that tai EdgeOne, live WebRTC production, tai cao, network/CDN that. Chromium real URL navigation bi chan boi policy `ERR_BLOCKED_BY_ADMINISTRATOR`.

## Deploy va kiem tra
1. SAO LUU ban dang chay. Deploy nguyen goi ZIP H110 len EdgeOne staging, KHONG copy rieng `index.html`.
2. Mo `https://<staging-host>/sports/badminton/index.html?tid=main_2026#spectator` trong cua so an danh.
3. Xac minh trang duoc nap, khong hien toast `Firebase config chua san sang`, Live Courts va Lich thi dau doc duoc du lieu cong khai.
4. Mo `#register` neu dang su dung form dang ky; kiem tra Firebase Rules/registration token (khong tu dang ky that neu khong co y dinh).
5. Kiem tra Hub -> Cau long -> dang nhap ADMIN va 6 mon VNext theo ma H110; neu khong dong bo thi rollback ZIP H109 truoc do.
6. Neu Live WebRTC can Anonymous Auth, bat Anonymous provider va rules phu hop; xem lich/BXH van khong can dang nhap.
7. Neu van thay H109, kiem tra EdgeOne deploy va Service Worker/cache bang DevTools; khong tu tat version gate.

## Diem bo sung can cai thien trong dot sau
- Do luong Firebase that va noi dung Live theo thoi gian thuc.
- Thu load test co ket noi staging, chua phai production PASS.
