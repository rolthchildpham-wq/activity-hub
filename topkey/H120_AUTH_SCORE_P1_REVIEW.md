# TOPKEY H120 - Auth and Badminton Score Review (P1)

## Changes
- Shared auth: ignore brief null Firebase-auth callbacks for up to 1.2 seconds before closing a verified session. Preserve generation check to prevent stale callbacks from affecting a new session.
- Shared auth: retry one recoverable profile-read failure after Firebase sign-in without requesting the password a second time. No retry for permission denial.
- Badminton quick score: prevent double save, disable Save while pending, and require an active Firebase connection.
- Badminton quick score: persist match, active-court cleanup and audit log in one atomic RTDB multi-location update, instead of two separate queued writes.
- Update badminton service-worker cache name and entrypoint asset query to avoid loading the old score handler from offline cache.

## Test results
- `node --check topkey-shared-auth.js`: PASS
- `node --check sports/badminton/assets/u122/admin-core.h85full.js`: PASS
- `node tests/h118/shared_auth_vm.cjs`: 29/29 PASS
- `node tests/h118/unified_rules_and_assets.cjs`: 28/28 PASS

## Remaining verification
- Test login from Hub on the real Firebase project, including first login, refresh and slow connection.
- Test save score with production-like data (authorized admin), match finished / active-court cleanup, audit and standings.
- Check existing IndexedDB queue backlog on the affected device. A large backlog or denied writes may still make processing slow.
- Not deployed; no live Firebase rules, users or data were modified.
