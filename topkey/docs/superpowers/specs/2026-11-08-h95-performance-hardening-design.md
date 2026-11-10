# H95 Performance Hardening Design

## Intent

Keep the H94 feature set and Firebase schema intact while preventing overlapping background work, reducing long-session memory growth, and keeping the UI responsive as tournament data grows.

## Goals

- Serialize and coalesce VNext offline queue flushes.
- Keep only core live data subscribed continuously; attach heavy branches only for the active authorized tab.
- Coalesce Firebase-driven renders and avoid rebuilding inactive views.
- Replace high-frequency perpetual maintenance polling with lifecycle events or bounded settling.
- Preserve full in-memory datasets for exports, scheduling, standings, and existing compatibility modules.
- Prove behavior with VM regressions and a synthetic large-data render benchmark.

## Non-goals

- No Firebase path or Rules schema migration.
- No removal of H94 features or report formats.
- No framework conversion or full rebundle of VNext.
- No server-side pagination in this release; that requires query indexes and a separate migration design.

## Constraints

- Deployment remains a static atomic package.
- Public routes, authentication, role scope, offline queue semantics, and existing build authority must remain compatible.
- Badminton's consolidated core remains unchanged unless a shared active hotfix requires the same lifecycle correction.

## Approaches

1. Selected: targeted runtime hardening. Add single-flight queue ownership, tab-scoped subscriptions, render scheduling, and lifecycle-driven maintenance. This addresses measured bottlenecks without changing stored data.
2. Full bundle and paginated Firebase redesign. Better theoretical ceiling, but it changes queries, indexes, and deploy risk.
3. Timer-only patch. Lowest risk, but it leaves full live subscriptions and concurrent queue scans intact.

## Design

`DataService.flushQueue()` owns one active promise. Calls arriving while it is active set a rerun flag and share the promise; the owner performs at most one additional pass so writes queued during the first pass are not stranded. Network listeners are bound once.

VNext keeps `config`, `teams`, `matches`, `courts`, `activeMatches`, and `announcements` as core subscriptions. `finance`, `registrations`, `audit`, `commentary`, and global users are attached only when their authorized view is active. Subscription callbacks mark a branch dirty and schedule one animation-frame render. Inactive branches retain their state but do not rebuild DOM.

Large list views render a bounded window with an explicit count while exports and computations continue to use complete state. Maintenance modules use bounded settle retries plus `focus`, `pageshow`, `visibilitychange`, and application lifecycle events instead of perpetual sub-second polling.

## Success Criteria

- Concurrent queue triggers produce one writer at a time and no lost queued item.
- Repeated tab switches do not increase Firebase handler counts.
- A burst of branch updates produces one render per dirty branch per frame and no inactive heavy render.
- A 10,000-record fixture renders a bounded DOM window.
- Existing H94 acceptance remains green after correcting environment-only output-directory assumptions.
