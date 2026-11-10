# H117 Production Stability Design

## Goal

Turn the supplied H117 staging artifact into a production-ready candidate that restores an existing Firebase session without a second login, makes the protected UI interactive before optional features load, and avoids loading report/export dependencies until the user requests them.

## Root causes

1. Hub navigation creates a fresh `SELECTED` ticket with an empty `authUid`. The Badminton auth observer treats that ticket as stronger than Firebase's persisted identity and explicitly signs the valid Firebase user out before checking the server-side profile.
2. Badminton boot starts a 30-file compatibility runtime immediately after the admin core loads. A second bootstrap chain waits for the same runtime before loading indexed-data support. On a slow connection, retries and main-thread parsing compete with Auth/profile restore.
3. PDF, PPT, ZIP, finance, report-integrity and Test Lab export modules are included in the initial document even when the user only needs login, scoring or the dashboard.
4. Release/cache identifiers must change atomically. Reusing the H117 cache tag would allow EdgeOne and an installed service worker to combine old HTML with new JavaScript.

## Design

### Authentication authority

Firebase Auth remains the identity authority and the RTDB profile remains the role/sport authority. A valid Hub entry ticket is a navigation/CSRF-style handoff, not a reason to discard an existing Firebase identity. Hub navigation records the current non-anonymous Firebase UID when available. On sport boot, an existing Firebase user proceeds to server profile verification even when the ticket is only `SELECTED`; access is granted only after the profile is read and `hasSportAccess()` passes.

Explicit logout, anonymous-to-protected transitions, invalid Hub entry, inactive profiles and wrong-sport profiles continue to fail closed.

### Startup stages

Stage 1 loads only release guard, entry guard, auth guard, Firebase core dependencies, admin core and essential styles. This is enough to restore Auth, read the profile and show the protected shell.

Stage 2 starts after `topkey:admin-ready`. Compatibility hotfixes are fetched with bounded concurrency and executed in their declared order. Work is yielded between small batches to keep input and rendering responsive. A single shared promise prevents duplicate requests from the two existing boot callers.

Stage 3 loads heavy report/export modules through a feature loader. The loader is triggered by report, finance, export, attachment or Test Lab UI intent and is also exposed as an idempotent API for existing modules. It never grants access or changes Firebase paths.

### Release safety

The release is stamped as H117 production stability with a new cache tag across Hub, Badminton, VNext, build manifests, script query strings and all three service workers. Deployment remains atomic and requires the whole package.

## Verification

- VM regression: persisted authenticated user plus a new Hub ticket does not call `signOut`, profile verification completes, and the app shell opens.
- VM regression: explicit logout and wrong-sport profile still fail closed.
- Loader regression: initial boot does not request heavy report/export scripts; repeated feature intent loads each dependency once.
- Loader regression: runtime execution order is deterministic, concurrency is bounded and duplicate callers share one promise.
- Existing H108 auth security, H117 release integrity, H95 runtime lifecycle, syntax and selected business tests remain green.
- Headless Chromium cold/warm local runs record request count, transferred bytes, auth-to-shell timing and JavaScript errors at desktop and mobile widths.

## Live-only gates

Actual Firebase credential lifecycle, EdgeOne waterfall, Security Rules behavior, mobile hardware/WebRTC and Storage CORS still require an authorized staging/production environment. The code and package must not claim those gates passed from local mocks.

