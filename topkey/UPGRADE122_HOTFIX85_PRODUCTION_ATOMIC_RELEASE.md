# Upgrade122 Hotfix85 - Production Atomic Release

Build: `u122h85-20261107`

Version: `2026.11.07-vnext-upgrade122-hotfix85-production-atomic-release`

## Why H85 exists

A production audit found a mixed deployment: the Hub and Badminton were serving H83 while the shared VNext branch was serving H84. That makes session guards, route version parameters, service workers, and runtime authority disagree even when each branch works by itself.

H85 introduces one atomic release contract for the Hub, Badminton, and VNext.

## Atomic release contract

- Root `release.json`, Badminton `build.json`, and VNext `build.json` must all match H85.
- The Hub checks all three before allowing a sport to open.
- If only one branch is out of sync, only that branch is disabled; if root is out of sync, all sport launches are blocked.
- Sport guards reject URLs carrying an old route build and return to the Hub with `reason=deploy-mismatch`.
- Build/release/guard/auth entry points are configured `no-store` in EdgeOne headers.
- Service workers use H85 cache namespaces and remove older Topkey app-shell caches.

## Session/auth contract

- New session key: `topkey_hub_session_v85`.
- H84/H83 Hub sessions migrate forward when valid.
- Update handoff key is H85-specific, while H84 handoff is accepted only for migration.
- ADMIN may access every sport; BTC must match `sportScope` / `assignedSport`.
- A sport switch creates a fresh SELECTED session and requires a fresh Firebase authentication transition for that sport.
- Reload within the same authenticated sport preserves the Firebase session.
- No client-side role guessing or local mock-auth fallback is permitted.
- Badminton and VNext both prevent duplicate login submissions.

## Deployment requirement

Deploy the **entire H85 ZIP as one release**. Do not copy only `/sports/vnext`, only Badminton, or only the Hub. During rollout the H85 coordinator intentionally blocks mixed versions instead of letting them fail later as login loops.
