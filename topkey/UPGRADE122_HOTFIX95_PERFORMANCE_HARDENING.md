# Upgrade122 Hotfix95 - Performance Hardening

## Muc tieu
On dinh website khi co nhieu du lieu, tranh ghi trung/ghi xung dot, giam listener va cong viec DOM nen, dong thoi giu nguyen schema Firebase va tinh nang cua H94.

## Thay doi chinh
- Hang doi offline chi co mot luong `flush` tai mot thoi diem; cac yeu cau den trong luc dang ghi duoc gom thanh luot tiep theo.
- Du lieu can xac thuc khong bi day len Firebase khi chua co phien dang nhap hop le.
- Cac listener nang (`registrations`, `audit`, `commentary`, `users`) chi duoc gan theo tab dang dung; du lieu tai chinh van duoc dong bo nen de bao cao luon day du.
- Callback du lieu chi danh dau nhanh thay doi; viec cap nhat DOM duoc gom theo mot `requestAnimationFrame` va bo qua nhanh khong thuoc tab dang mo.
- Danh sach doi va tran dau chi tao toi da 300 dong DOM moi lan ve, trong khi du lieu day du van duoc giu trong state.
- Cac vong `setInterval` bao tri lau dai duoc thay bang bo lap lich huu han, co huy timer khi tab an/pagehide va khoi phuc khi quay lai.
- Listener duoc thu hoi tren `pagehide` va khoi phuc mot lan tren `pageshow`, ho tro BFCache va han che giu bo nho.
- Hub, Cau long va VNext dung chung build/cache `u122h95-20261108` de trien khai dong bo.

## Khong thay doi
- Cau truc du lieu va duong dan Firebase.
- Quyen, dang nhap, phien lam viec va quy trinh nghiep vu.
- Bao cao PDF/PPT, lien ket cong khai/QR, trong tai va da ngon ngu.
- Bo cuc header H94.

## Luu y trien khai
Phai trien khai nguyen goi Hub + Badminton + VNext. Khong tron file H94 va H95 vi service worker su dung cache phat hanh nguyen tu.
