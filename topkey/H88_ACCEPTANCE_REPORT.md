# H88 Acceptance Report

Release: `2026.11.07-vnext-upgrade122-hotfix89-full-interface-i18n`  
Cache: `u122h89-20261107`

## Result
`FULL_WEB_ACCEPTANCE_OK 444`

## Covered
- ADMIN + BTC Badminton + BTC Volleyball role/auth/session matrix.
- Hub -> sport -> login -> reload -> wrong sport -> permission -> admin/update authority.
- Atomic Hub/Badminton/VNext release contract.
- Badminton and VNext schedule/ranking/withdrawal regressions.
- VNext Football/Volleyball day grouping parity.
- Final report translation in all 3 language modes.
- Real PptxGenJS PowerPoint output with embedded images.
- Real Chromium A4-landscape PDF print from the same report HTML used by Preview.
- Cooking/DIY judging rules and UI contracts.
- Browser flow: public-device one-vote lock and judge-code one-team-one-score lock.
- Public share route bypass for VNext Viewer/Register/Judge and Badminton Register/Viewer lazy Auth.

## Important production checks
1. Deploy the complete ZIP atomically.
2. Deploy `firebase.database.rules.json` to Firebase Realtime Database Rules.
3. Confirm Hub, Badminton and VNext all show `H89 · FULL INTERFACE I18N`.
4. Hard refresh once after deployment.
5. For official Cooking/DIY judging, prefer Judge-code mode; public-device mode is best-effort anti-repeat.
