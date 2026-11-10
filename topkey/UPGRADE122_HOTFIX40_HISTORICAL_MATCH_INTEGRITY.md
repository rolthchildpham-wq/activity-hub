# Upgrade122 Hotfix40 - Historical Match Integrity

## Muc tieu
Khong de viec doi bo cuoc bi xoa khoi danh sach doi lam mat lich su tran va lam giam so tran/W-L/HS cua doi thu.

## Rule
- BXH chi tinh GROUP va cac trang thai FINISHED/WALKOVER/RETIRED/DISQUALIFIED.
- Mot tran van duoc tinh cho doi con ton tai ngay ca khi doi thu da bi xoa khoi `teams`.
- Khi ap dung policy bo cuoc, match duoc gan snapshot ten/ma/noi dung hai doi.
- Doi `withdrawn` co the duoc xoa khoi roster; match, ty so, winner va snapshot van duoc giu.
- Doi chua bo cuoc van khong duoc xoa neu con match tham chieu.
- `rankingEligible()` van loai withdrawn khoi suat di tiep; `ranking()` giu so lieu lich su.

## Case acceptance BAC
7 tran tong: 2 tran thang doi da xoa khoi roster, 4 tran binh thuong, 1 WO. Ket qua bat buoc: played=7.
