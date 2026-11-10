# TOPKEY Sports Hub VNext - H117 Production Stability P1

**Build tag:** `u122h117p1-20261109`  
**Version:** `2026.11.09-vnext-upgrade122-hotfix117-production-stability-p1`

This P1 package keeps the H117 plan reconciliation work and hardens the production startup path:

- A persisted non-anonymous Firebase user is no longer signed out merely because Hub created a new sport-entry ticket. Every protected entry still reads the server-side profile and checks active role/sport scope before opening the app.
- Hub carries the current Firebase UID across sport navigation. Explicit logout, anonymous-to-protected entry, inactive accounts and wrong-sport profiles remain fail-closed.
- Badminton and VNext show the protected shell after verified Auth/profile restore, then stage compatibility and indexed-data runtime during browser idle time.
- PDF/PPT/ZIP/finance-report dependencies are removed from initial HTML and Service Worker precache. They load once, on report/export intent.
- QRCode and HLS in VNext no longer block Auth startup; they load after verified `topkey:admin-ready`.
- Hub, Badminton, VNext, build manifests and all Service Workers use one new atomic cache tag so an older installed PWA cannot mix H117 files.

Local regression evidence is recorded in `H117_PRODUCTION_STABILITY_REPORT.md`. Actual Firebase credentials, EdgeOne network timing, Security Rules, Storage CORS and mobile camera/WebRTC remain environment gates and must be checked during deployment verification.

**Base:** H116/H117 plan reconciliation. **Production stability tag:** `u122h117p1-20261109`.

## Why this release exists

H116 displayed local Badminton Excel seed data even when no Firebase record existed, and some UI flows could treat an unchanged first Save as a no-op. On concurrent edits to `clubPlan`, the H115/H116 transaction rejected the whole form if *any* field had changed remotely, even if users edited different fields. The Hub calendar was not guaranteed to update when another device saved a plan. Test Lab admin plan aggregation could access other sports under a sport-specific testlab TID.

The uploaded **PRO AUDIT & REALITY** worksheet was used as an audit checklist. Its claims are **not** substitutes for evidence from real Firebase/EdgeOne E2E tests.

## Code changes actually delivered

1. `club-planning.js`: No unsaved Excel seed masquerading as persisted financial/plan data. The purple **Nạp mẫu Excel Cầu lông** button explicitly loads the template. The first real Save persists the plan even if it was unchanged.
2. `club-planning.js`: Three-way merge of disjoint field changes within an RTDB transaction. Two users editing *the same field* receive a conflict instead of silent overwrite. Schedule saves can proceed when only budget/info changed remotely, but not when the schedule itself changed.
3. `club-planning.js`: Separate **Lưu lịch** does not discard unsaved unrelated info/budget/tasks. An actionable Firebase permission-denied message distinguishes access errors from version conflict.
4. `club-planning.js`: Lightweight real-time `clubPlan` listeners refresh the Hub calendar across tabs/devices; only render totals after all requested plans arrive. The editor becomes interactive before cross-CLB calendar hydration. Listeners detach on auth/session disposal, while the system-admin editor watches only its selected sport.
5. `club-planning.js`: Test Lab uses the exact production plan code against `/tournaments/__testlab_.../clubPlan`, watching only its own sport and never another sport's production record.
6. `sports/badminton/index.html`: When a login form is submitted after a spectator/register link, remove stale public hash before proceeding with verified Firebase Auth. No client-side admin bypass.
7. Active `sports/badminton/assets/u122/admin-core.h85full.js`: Keep the existing index-only tournament recovery (no full `/tournaments` scan); cap candidate validation to 10 metadata reads in parallel.
8. `sports/badminton/tests/h45,h46,h47,h48`: Fix tests that treated `?v=` as part of the filesystem JS filename; existing standings and withdrawal tests then execute without altering scoring rules.
9. `release.json` + `tools/build_release.py`: Stamp H117 Hub, Badminton, VNext and 3 SW caches from one manifest. Preserve H116 PDF/PPT, finance, role, security rules and scoring systems.

## Local test results verified in this package

- JavaScript syntax: 419/419. Inline HTML scripts: 48/48.
- Selected existing regressions: 11/11 (including H45, H46, H48, H108 auth, H115 club CRUD & i18n).
- H117 concurrency tests: 14/14, including seed first save, non-overlap merge, overlap denial, Test Lab isolation and budget-safe schedule updates.
- H117 release checks: 29/29.
- Chromium with mocked RTDB + actual UI handler: Save button wrote the test record, remote update refreshed editor, no `pageerror`, seven scoped listeners on Hub view. The smoke screenshot is a **test fixture**, not a production screenshot.
- Existing H116 PDF examples: 7 files inspected by independent PDF renderer; PPT templates: 8 files ZIP-valid. **These are inherited reference files; H117 did not re-export PDF/PPT from EdgeOne.**
- **Full 139 historical-test inventory:** H116 baseline 47-48 PASS, 90 FAIL, 1-2 TIMEOUT (run variability); H117 52 PASS, 86 FAIL, 1 TIMEOUT. Many are obsolete hardcoded-version assertions, but they are NOT counted as passed and have not all been triaged.

## Production/Test Lab parity requirement

Identical JavaScript and business functions; only path/TID differ. Do not report the entire 185-function inventory as covered from the 18/18 presence-only Test Lab report. The H117 path has passed only the specifically documented plan tests; other features need dedicated browser E2E tests.

## Production deployment gate

This is the H117 P1 production-stability deployment candidate. Deploy the package atomically and keep rollback available until the following environment-only gates are observed on the target Firebase/EdgeOne environment:

- Auth on actual Firebase staging including first profile creation and role rules; don't grant ADMIN from self-write or browser cache.
- Cross-device LIVE scoring vs end-of-tournament transaction/lock and offline queue reconciliation.
- PDF/Excel receipt rendering on actual Storage bucket under EdgeOne CORS, iOS/Android and large files.
- Full multi-sport Test Lab parity for 185 inventory items; dedicated browser tests rather than presence-only checks.
- WebRTC/camera/BLV on real mobile devices.
- Cold/warm time-to-interactive, heap, listener count, and bandwidth on 4G with 100+ tournaments.
- CI cleanup of the remaining historical test failures (86 FAIL + 1 TIMEOUT in the last run).

### Staging verification procedure

1. Back up Firebase data and retain your previous deployed H116 ZIP. Use a **separate staging environment** and do not migrate production values.
2. Deploy the **entire ZIP** at the site root. Confirm all three `/build.json` contain `u122h117p1-20261109`, and SW caches are `topkey-h117-*`. Do not copy directories individually.
3. Open `system-admin.html` as ADMIN. Select Badminton. If the plan has no stored record, expect an empty plan, not phantom Excel income. Click `Nạp mẫu Excel`, then **Lưu hồ sơ BTC**. Refresh and check Firebase `topkey_badminton_vnext_2026/clubPlan` exists.
4. In a second authenticated staging browser, change a different field (e.g., location versus income). Confirm both changes survive. Change the SAME field in both browsers and confirm one side gets a conflict, not an overwrite.
5. Open Hub in another session: calendar, planned income/expense, and task counts must update without a forced refresh. Confirm TESTLAB only writes inside `__testlab_*` TID and no production plan is modified.
6. Try an unauthorized user; a denial must be visible and **must not** pretend the save succeeded.
7. Run all 16 `H117 QUALITY GATES` in the attached Excel against actual Firebase staging before deciding go-live. If a P0 gate is still open, rollback to the working production release.

### Included audit/QA files

`H117_RELEASE_TEST_MATRIX.json`, `H117_LEGACY_TEST_INVENTORY.json`, and `TOPKEY_H117_Pro_Audit_Fix_Tracking.xlsx`.
