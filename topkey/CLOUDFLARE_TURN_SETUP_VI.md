# TOPKEY Upgrade88D - Huong dan Cloudflare Realtime TURN

## Muc tieu
Firebase van lam signaling. EdgeOne van host website. Cloudflare Realtime TURN chi relay video khi WebRTC P2P/STUN khong noi truc tiep duoc.

## Bao mat quan trong
KHONG dan TURN secret vao `turn-config.json`, HTML, JavaScript, Firebase Database, hoac gui secret trong chat.
Upgrade88D co Edge Function `/api/turn-credentials` de giu secret o server va cap credential ngan han cho trinh duyet.

## Buoc 1 - Tao/vao tai khoan Cloudflare
1. Dang nhap Cloudflare Dashboard: https://dash.cloudflare.com/
2. Chon account cua ban.
3. Mo Realtime -> TURN (neu giao dien thay doi, tim "Realtime TURN" trong Dashboard).

## Buoc 2 - Tao TURN key
1. Trong Realtime TURN, chon tao TURN key.
2. Dat ten vi du: `topkey-badminton-turn`.
3. Luu lai HAI gia tri do Cloudflare cap khi tao key:
   - TURN Key ID / UID -> se gan vao `CLOUDFLARE_TURN_KEY_ID`
   - TURN Key API Token / secret key -> se gan vao `CLOUDFLARE_TURN_KEY_API_TOKEN`
4. Secret phai giu kin. Neu mat/lo secret, xoa/revoke key va tao key moi.

Cloudflare tai lieu chinh thuc: https://developers.cloudflare.com/realtime/turn/generate-credentials/

## Buoc 3 - Khai bao secret tren EdgeOne
Trong project EdgeOne Pages/Makers dang deploy TOPKEY, vao phan Environment Variables / Secrets cua production deployment va tao:

- `CLOUDFLARE_TURN_KEY_ID` = TURN Key ID/UID o Buoc 2
- `CLOUDFLARE_TURN_KEY_API_TOKEN` = secret key o Buoc 2
- `TOPKEY_TURN_TTL` = `21600` (tuy chon; 6 gio)

Hai bien dau la bat buoc. KHONG tao chung trong file `.env` roi commit len website public.

## Buoc 4 - Deploy Upgrade88D
Deploy toan bo ZIP len EdgeOne. File quan trong:
- `edge-functions/api/turn-credentials.js`
- `sports/badminton/src/upgrade88.js`
- `sports/badminton/upgrade88.css`

Khong can doi Firebase Rules v3 chi de bat TURN.

## Buoc 5 - Kiem tra endpoint TURN
Sau deploy, mo tren trinh duyet:
`https://TEN-MIEN-CUA-BAN/api/turn-credentials`

Neu dung, JSON co dang:
`{"ok":true,"provider":"cloudflare-realtime-turn","ttl":21600,"iceServers":[...]}`

Neu thay `TURN_NOT_CONFIGURED`: bien moi truong EdgeOne chua duoc dat/khong vao production deployment.
Neu thay `TURN_PROVIDER_ERROR`: TURN Key ID hoac secret sai/bi revoke.

## Buoc 6 - Test TOPKEY
1. May BTC/UMPIRE: mo Camera cuc bo tren San 1 va phat Live.
2. May Viewer: nen test bang mang khac (vi du dien thoai 4G/5G trong khi BTC dung Wi-Fi).
3. Mo Viewer -> Live.
4. Neu P2P truc tiep duoc, WebRTC co the khong can relay. Neu P2P bi chan, ICE se co candidate `relay` tu Cloudflare TURN va video van phat.

## Cloudflare TURN ma Upgrade88D su dung
Cloudflare cap credential ngan han qua API. Trinh duyet khong bao gio nhan TURN key dai han. Endpoint EdgeOne goi Cloudflare va chi tra ve `iceServers` ngan han.

Cloudflare ho tro TURN UDP/TCP/TLS, trong do co TURN TLS cong 443. Upgrade88D loc cong 53 khoi danh sach vi trinh duyet thuong chan/time-out cong nay.

## Chi phi
Theo Cloudflare Realtime pricing tai thoi diem Upgrade88D: 1,000 GB/thang dau tien mien phi cho allowance Realtime SFU + TURN; sau do TURN/SFU egress tinh theo bang gia Cloudflare hien hanh. Hay kiem tra Dashboard/bang gia truoc giai neu luong Viewer lon.

## Luu y quy mo Viewer
TURN giai quyet NAT/firewall, nhung kien truc hien tai van la WebRTC P2P theo tung Viewer va broadcaster dang gioi han so peer. Neu sau nay can hang chuc/hang tram Viewer dong thoi, nen chuyen fan-out sang SFU/Stream thay vi tang P2P peer.
