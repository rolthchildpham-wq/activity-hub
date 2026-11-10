# TOPKEY H120 P2 - Review Only

## Verified root cause
- Badminton `DataService.ensureFirebase()` returned early if `auth` and `db` were injected from the shared platform shell. Therefore it never attached `.info/connected` listener. `DataService.connected` remained false and blocked quick-score save; this corresponds to the screenshot's repeated 'Chưa kết nối Firebase' toast.
- TestLab's 19 checks included lazy-load report/PDF/PPT engines, but TestLab evaluated them before its `reports` feature bundle was loaded, making a premature 16/19 possible. Also the Report button displayed a stored report rather than recomputing a fresh result.
- Authentication currently uses shared Firebase Auth plus a Hub entry ticket. Repeated sign-in may be caused by a slow session restoration; this patch extends short-lived SDK null callback grace for an authenticated Hub session. It does not remove authorization checks or grant privileges from Hub data alone.

## Changes
- Preserve injected Firebase Auth + Database but always bind exactly one `.info/connected` listener in `ensureFirebase()`.
- Badminton quick score commits match, court cleanup and audit atomically using `db.ref().update(updates)`, waiting for the Firebase promise to resolve, avoiding unrelated IndexedDB queue flush. No offline score acceptance and no optimistic success notice.
- Throttle connection warning to at most once per 4 s in quick score.
- Restore signed-in Hub session for up to 4.5 s on transient Firebase `null` and extend initial restore watchdog to 12 s; true revoked/denied profiles still fail closed.
- TestLab loads report feature group before checking 19 criteria and re-computes Report instead of reusing stale snapshot.
- Bump badminton core query asset version to auth-score-p2.

## Local checks
- `node tests/h120_auth_connection_p2.cjs`: 5/5 PASS (mocked RTDB)
- `node tests/h118/shared_auth_vm.cjs`: 29/29 PASS
- `node tests/h118/unified_rules_and_assets.cjs`: 28/28 PASS
- `node --check` patched JS: PASS

## Not yet verified
- Real Firebase sign-in on target browser, permission checks, actual RTDB update latency and TestLab with production-like data.
- Old H93 update-authority test is pinned to an older version and fails in H120 even before this patch. Do not interpret it as a P2 regression.
- There is no deployment, merge, Firebase rules update, user/data mutation, or change to another GitHub repository.
