# Upgrade122 Hotfix52 - Ranking Top 4 + Export Filename Rule

- Ranking explanation report now explains Top 1-2-3-4.
- HTML, CSV and Print/PDF use one filename base rule:
  `ddmmyyyy_Báo cáo BXH_Nội dung_Tên giải ngắn`
- Example: `05112026_Báo cáo BXH_Đôi Nam Nữ_TOPKEY L8.html`
- Print/PDF browser title uses the same base name so Save as PDF proposes the same filename.
- Ranking calculation itself is unchanged and continues to use the canonical Admin `App.ranking({category})`.
