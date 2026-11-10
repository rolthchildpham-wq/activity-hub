# H84 Full Acceptance Report

Build: `u122h84-20261107`
Version: `2026.11.07-vnext-upgrade122-hotfix84-session-safe-update-authority`

## Root causes fixed

1. Legacy focus/timer handlers (notably older ranking/version modules) could overwrite `T.VERSION`, `__TOPKEY_BOOT_VERSION`, cacheTag and Health UI after the consolidated build loaded.
2. The Health manual update path could misread that downgrade as a real server mismatch and enter the old repair/reload flow.
3. A controlled reload did not carry an explicit authenticated Hub handoff, so migration from an older Hub session could force Firebase sign-out/login.
4. VNext clean-URL reload needed to recover the selected sport from the authenticated Hub session when `?sport=` was absent.

## H84 behavior

- Final version authority is loaded last and pins runtime/boot version for the lifetime of the page.
- Clicking “Kiểm tra / đồng bộ bản mới” does **not** reload when server build equals H84.
- A genuinely newer server build creates a short-lived authenticated handoff (UID + sport + Hub session), then performs a controlled cache/SW reload.
- H83 authenticated Hub sessions migrate to H84 without forcing login again.
- Badminton and VNext use the same session-safe behavior.

## Regression result

`FULL_WEB_ACCEPTANCE_OK 365`

Includes:
- ADMIN + BTC Badminton + BTC Volleyball role/auth matrix.
- Firebase auth mock login and reload persistence.
- H84 legacy-version downgrade resistance.
- H84 controlled-update authentication handoff.
- Badminton + VNext Hub guard migration/reload.
- Report/PDF/PPT language/image/prize smoke tests.
- Cross-sport venue/delete parity.
- Current standings regressions H44-H48.
