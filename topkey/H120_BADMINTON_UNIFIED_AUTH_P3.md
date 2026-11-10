# TOPKEY H120 - Badminton unified login P3 (review only)

- Uses the same `TopkeySharedAuth` identity/profile single-flight and retry for all sports.
- Retry transient Firebase profile reads up to two extra times without signing out.
- Keep backend security profile verification mandatory; no access based only on Hub session.
- Keep badminton-scoring and standings rules untouched.
- Badminton afterLogin now is idempotent for one UID and moves heartbeat/schema/legacy checks off the critical path.
- Version query on updated badminton admin bundle bumped to prevent stale cache.
- No Firebase data or security rules changed.

## Testing limits
Syntax and offline regression tests run locally; Firebase live timings and end-to-end browser login still need validation in a staging environment.
