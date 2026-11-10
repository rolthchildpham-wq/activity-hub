# TOPKEY H103 - runtime stability on H102

## Root causes confirmed from H102 source
1. Hub and both build.json were H98, while hub-entry-guard.js, hub-auth-flow.js, updater Hotfix85 and entry points still pinned H96. Manual update injected v=H98; guard immediately redirected to the Hub.
2. Badminton Hotfix85 was the final one of >30 serialized runtime script loads. The older updater handlers remained active until it loaded.
3. All three service workers intercepted same-origin requests with no-store/network-first, and VNext SW intercepted cross-origin requests as well. Each installation fetched a large legacy asset list (and Badminton warmed Firebase SDK), delaying activation and increasing network churn.
4. VNext H95 performance runtime still subscribes to whole teams/matches/finance branches; this package does not claim true server-side pagination or schema v2 migration.

## Changes
- H103 release manifest, build manifests, Hub ticket, route guards and updater version authorities use one version tag.
- Checking for updates is read-only, with no redirect. When a different version is detected, a separate Apply verified update control requires matching Hub/Badminton/VNext manifests and user confirmation.
- Preserve URL sport/tournament/entry ticket during deliberate update; remove the stale v query that tripped the old guard.
- Load Badminton Hotfix85 first after its admin bundle, not last among >30 sequential scripts.
- Use scoped first-party SW fetch handling and cache-first static resources; do not prewarm all legacy assets on install.
- Coalesce a global VNext DOM observer to at most one pass per 200ms.

## Limitations
- Real Firebase sign-in and write/read performance require an authorized staging Firebase environment.
- Legacy Firebase full-tree listeners remain in some screens. No schema migration/data write is performed.
- Offline first-use of optional scripts not visited online is not guaranteed after trimming precache; normal visited resources are cached.
- Browser/CDN timings cannot be inferred precisely from static source.
- NO production deployment approval without staging auth/permissions/Live/BXH/finance parity tests.
