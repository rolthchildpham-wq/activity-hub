# TOPKEY H104 – Indexed Firebase V2 · Staging delivery

**Foundation:** H103 H102 Runtime Stability (NOT H96R3). All seven sports are retained. No production Firebase writes have been performed by this delivery.

**Release status: STAGING, not production-certified.** Static syntax, schema invariants, simulated RTDB pagination, real-backup reconciliation, Chromium component smoke tests and simulated migration passed. Live Firebase Authentication, real Security Rules, EdgeOne deployment, simultaneous multi-client edits and full seven-sport browser workflows were not exercised here.

## What is implemented

1. **Teams:** 120-row initial list with Firebase-ordered page queries (hard ceiling 200), prefix-normalized Vietnamese name search and category filter from verified v2 indexes. `queueMulti` team edits update a single canonical team and associated index keys in one multipath write, rather than refetching the entire branch.
2. **Matches:** tournament isolation via current `tid`; day/status cursor queries from v2 indexes. Live listeners are scoped to currently active match IDs; completed results/history stay canonical. Schedule view decorates winning rows. Full-data-sensitive functions only execute after an explicit complete scan.
3. **Finance:** transaction list paginated; aggregate cards use a verified complete snapshot, **never the current page sum**. After an edit, totals become untrusted until manually recalculated from a complete read or reverified on staging; outdated totals are not displayed as correct.
4. **Schema v2:** append-only companion `_v2/tables`, `_v2/meta`, `_v2/aggregates`. Migration UI is ADMIN-only and **testlab tournament ID only (`__testlab_*`)**. Full JSON backup download is mandatory before first indexed write; source SHA-256, counts, row content and references verified; activation is opt-in, rollback toggles read model to legacy without deleting original teams/matches/finance.
5. **Performance:** one small configuration listener set plus bounded page listeners for visible entries, no full-branch `value` listeners on teams/matches/finance in H104 admin adapter; H95 old tab subscription hook is neutralized. 120 DOM row target; 200/page max, queries coalesced, stale responses discarded. H104-new SW cache names evict H103 assets.
6. **Compatibility:** based on H103, retaining login/permissions/fullscreen/H98 UI code. Shared adapter injected in both Badminton and VNext entrypoints. **It is not a promise of seven-sport production E2E PASS.**

## Important design constraints and known gates

- **Do not upload this ZIP to production directly.** Use a separate Firebase staging project/database and a testlab tournament first. Deploy the matching `firebase.database.rules.json` only after reviewing them in that staging project.
- **No Cloud Function/server-side aggregate transaction is deployed.** Some older features write directly to Firebase instead of using `Data.queueMulti`, and those writes can bypass v2 index mirroring; this is why enabling v2 for a live production tournament is blocked. The safe rollback is `_v2/meta/active=false`.
- Legacy H103 modules may deliberately read a complete tournament for full ranking/scheduling/report generation. That load is **on demand**; a fully server-derived ranking snapshot has not been implemented. App guards incomplete ranking/report calculations.
- VNext guest/public spectator path uses different code than the authenticated admin adapter; spectator data fetching was not converted by H104.
- The H104 testlab migration intentionally does a complete one-time source read in the browser. This is not a routine page load.
- Auth/permissions were preserved at source level; actual account login must be tested on a staging Firebase project. Never share credentials in bug reports.
- The older H93 suite hard-codes H96 release tags and fails when pointed at H104. Badminton H38 withdrawal standalone test fails on untouched H103 as well; neither is counted as a new H104 PASS.

## Staging sequence

1. Record existing H103 backup ZIP and export current Firebase staging database. Prepare a **separate** Firebase staging project; review updated Rules before staging deployment.
2. Deploy the entire H104 package atomically, not individual folders, then validate `release.json` and both `sports/*/build.json` share build/cache/version.
3. Sign in as a staging ADMIN, navigate to Health or Settings. Create or select a `__testlab_*` tournament containing cloned non-sensitive data.
4. Click `Sao lưu & tạo chỉ mục v2 (testlab)`; save the downloaded backup. Verify `meta.complete=true`, index counts and `aggregatesTrusted=true`. Then click `Kích hoạt v2 testlab`.
5. Check first-page display, search, status filters, 7 sport-specific permissions, edits, live scores and full standings; verify all aggregate cards using complete export.
6. If any inconsistency, click `Rollback về legacy` or set `_v2/meta/active=false` with authorized staging Admin. Canonical branches stay untouched.
7. **Production activation remains blocked**, until independent live staging/E2E tests and direct-writes/aggregate transaction coverage are completed. Changing testlab-only guard requires a new reviewed release.

## Reproducing acceptance tests

```sh
node h104-tests/v2-engine.test.js '/path/to/TOPKEY_Backup_badminton_ALL_....json'
python h104-tests/chromium-ui-smoke.py
python h104-tests/chromium-migration-smoke.py
python h104-tests/acceptance.py
```

The Python scripts use a local mocked RTDB, **not live Firebase**. Browser migration test uses a deterministic digest shim because navigation to secure localhost origin is blocked in this container; SHA-256 production browser implementation remains the Web Crypto API.

See `H104_TEST_REPORT.json` for test summary and `H104_DELIVERY_MATRIX.json` for per-feature status. No private Firebase backup contents or credentials are included in the ZIP.
