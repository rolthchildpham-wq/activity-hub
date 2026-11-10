# H87 Acceptance Report

Release: `2026.11.07-vnext-upgrade122-hotfix87-schedule-group-parity`
Cache: `u122h87-20261107`

## Result
`FULL_WEB_ACCEPTANCE_OK 423`

## Schedule-specific browser regression
Executed with real headless Chromium against the actual VNext modules after patching:
- Volleyball: PASS
- Football: PASS
- No page JavaScript errors
- Every match row is under its matching date header
- Today header remains highlighted
- Administrative loss / WALKOVER is moved only to the end of its own day
- Stage labels and status labels are mapped by match identity rather than row index

## Existing contracts re-run
- ADMIN + BTC Badminton + BTC Volleyball auth matrix
- Firebase-auth integration mocks + reload
- atomic Hub/Badminton/VNext release guard
- session-safe update authority
- secure auth contract / no client-side role guessing
- PDF smoke
- real PptxGenJS exports for Badminton and VNext
- 3 report language modes
- prize structure, report images and finance fixture
- venue delete/rename and Cooking/Handmade `Khu vực (Sảnh)` contract
- current Badminton standings/withdrawal regressions
- shared report module byte parity between Badminton and VNext

H87 deliberately preserves the stable H86 authentication session key (`topkey_hub_session_v86`) to avoid introducing an unrelated login migration in a schedule-only release.
