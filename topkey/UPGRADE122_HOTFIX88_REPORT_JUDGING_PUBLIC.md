# Upgrade122 Hotfix88 - Report + Judging + Public

Release: `2026.11.07-vnext-upgrade122-hotfix89-full-interface-i18n`  
Cache: `u122h89-20261107`

## 1. Report export
- PDF uses the exact report HTML used by Preview and browser print in A4 landscape. The old SVG `foreignObject`/canvas path is no longer the export path, avoiding tainted-canvas failures.
- Print CSS pins 4 KPI cards per row, 2-column achievement/prize/photo layouts, repeated table headers, compact signature/footer, and avoids an extra blank last page in the production fixture.
- PowerPoint uses local PptxGenJS and a visible TKT structure card with 9 sections: Cover, Overview, Champions, Prize structure, Rankings, Schedule & Results, Finance, Moments, Thanks.
- Each section can be toggled and renamed. Images assigned to a section are inserted immediately after that section.
- Report languages remain Việt-Anh, Việt-Trung, Anh-Việt-Trung.

## 2. Cooking / DIY judging
- Applies only to `cooking` and `handmade`.
- BTC configures criteria and weights before publishing. Total weight must equal 100%.
- Public-device mode: one browser/device ID can create one vote for the tournament. Firebase Rules are create-only for that device hash.
- Judge-code mode: BTC creates 8-digit judge codes. Only SHA-256 code hashes are stored; plaintext codes are shown only when created. Each code can score each team once.
- Public judging form lets the judge choose a team, score every criterion 0-10, see the weighted /100 total, and add an optional note.
- Admin statistics rank teams by average weighted score; ranks 1/2/3 have separate highlights.

### Anti-repeat limitation
Browser/device ID is a best-effort browser identity, not a tamper-proof hardware identity. Clearing browser storage or using another browser/device can create a new identity. Use Judge-code mode for official judging.

## 3. Public links no longer present a login screen
- VNext `#spectator`, `#register`, and `#judge` are detected before the app shell renders. Login/app shell are hidden immediately.
- VNext public routes skip loading Firebase Auth SDK; Database is loaded directly.
- Badminton `#register` bypasses the protected auth flow.
- Badminton public Viewer loads Firebase Database immediately without Auth. Firebase Anonymous Auth is lazy-loaded only if the viewer actually starts WebRTC Live signaling; schedule/results/standings do not wait for Auth.

## 4. Firebase Rules deployment is required
`firebase.database.rules.json` contains the new `judgeAccessCodes` and `judgingVotes` rules for Cooking and Handmade. Deploy the rules together with the static H88 package; otherwise public judging writes will be denied or the previous rule set will remain active.

## 5. Regression
- Source package full acceptance: `444/444 PASS`.
- Includes ADMIN + BTC Badminton + BTC Volleyball auth matrix, reload/sport switching, H87 schedule grouping, standings regressions, report translation, real PptxGenJS export, real Chromium PDF print, public route contracts, and browser judging flows.
