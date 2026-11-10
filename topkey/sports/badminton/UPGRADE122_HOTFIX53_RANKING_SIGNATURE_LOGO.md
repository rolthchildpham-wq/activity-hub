# Upgrade122 Hotfix53 - Ranking report signature + company logo

Build: `2026.11.05-vnext-upgrade122-hotfix53-ranking-signature-logo`
Cache tag: `u122h53-20261105`

## Changes

- Keeps the Hotfix52 ranking report and Top 1-2-3-4 explanations unchanged.
- Adds a company-logo picker to the Admin ranking-report dialog.
- If Admin presses **Tạo báo cáo** without a logo, the local image picker opens first; after choosing an image, the report is generated automatically.
- The selected logo is read locally with `FileReader` and embedded as a data URL in the report. It is not uploaded to Firebase.
- Adds a signature block at the end of the report:
  - `BTC - <tên giải>`
  - `Ngày dd tháng mm năm yyyy`
  - blank signature area and `(Ký, ghi rõ họ tên)`.
- HTML and Print/PDF include the embedded logo and signature block.
- CSV appends the BTC/date signature text and the selected logo filename.
- Filename rule remains: `ddmmyyyy_Báo cáo BXH_<Nội dung>_<Tên giải ngắn>`.
