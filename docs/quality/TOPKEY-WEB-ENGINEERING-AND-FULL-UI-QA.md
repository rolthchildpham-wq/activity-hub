# TOPKEY Web Engineering & Full UI QA Standard

> Project-specific execution standard. ECC is the engineering-method baseline; this document does not import ECC's runtime architecture into TOPKEY.

## 1. Repository boundaries

- **ECC** (`rolthchildpham-wq/ECC`) is the reference for coding discipline, research-first workflow, change-impact analysis, TDD, security review, accessibility, testing and evidence.
- **Frontend System Design** (`rolthchildpham-wq/frontend-system-design`) is the framework-agnostic checklist for requirements, user flows, platform, state, API boundaries, roles, component design, responsive UX, accessibility, performance, versioning and QA. It is a review method—not an instruction to import its sample stack or redesign TOPKEY's architecture.
- **TOPKEY Activity Hub** (`rolthchildpham-wq/activity-hub`) is the only repository to change when implementing TOPKEY product requirements.
- Do not change TOPKEY's business architecture, Firebase RTDB roots/schema, Auth/session model, role/permission semantics, tournament IDs, records, schedules, scores, results, finance or audit contracts unless the requirement explicitly calls for a data migration and it has a reviewed migration/rollback plan.
- Chrome DevTools MCP is the browser-verification system. Static tests are necessary but never sufficient for UI acceptance.

## 2. Required change workflow

1. **Discover**: inspect ECC guidance and the FSD checklist, TOPKEY entrypoints, affected runtime modules, routes, data contracts, styles, service worker/cache keys, deployment configuration and existing tests.
2. **Impact map**: list touched files, public routes, roles, Firebase roots/paths, business workflows, cache keys and dependent sports. Identify no-touch invariants.
3. **Define acceptance**: write observable user actions and expected UI/data outcomes before implementation.
4. **Implement in bounded slices**: keep UI, domain logic, persistence and routing responsibilities explicit. Apply FSD principles only where they fit the existing project. Do not change framework, application topology, routing, backend, Firebase schema/root, domain model or persistence strategy unless the requirement explicitly authorizes it and a reviewed migration/rollback plan exists. Avoid broad rewrites or concurrent edits to the same files.
5. **Test bottom-up**: syntax/static → unit/domain → Firebase emulator/security → integration → real Chrome desktop/mobile → production-host checks.
6. **Review evidence**: inspect screenshots, console, network, geometry, test logs and data persistence evidence. A green static suite alone cannot close a UI issue.
7. **Release**: merge only after required checks pass. Treat GitHub merge and EdgeOne deployment as separate states.
8. **Verify production**: confirm the served HTML and every changed asset/cache key, then use Chrome against the production URL for the affected user journeys. If the EdgeOne deploy hook is absent, report that deployment was not triggered; never infer deployment from merge.
9. **Report**: provide commit/PR, test matrix, pass/fail/blocked counts, unresolved defects, deployment status and screenshot/evidence links.

## 3. Architecture and business-contract guardrails

- ECC and Frontend System Design define how changes are researched, designed, implemented and verified; they do not define TOPKEY's product architecture.
- TOPKEY Activity Hub is the implementation repository. Do not make product-code changes in ECC or the FSD reference repository.
- Prefer the smallest compatible change. Reuse existing runtime, routing, state, component, API and persistence patterns before proposing alternatives.
- Any architecture change must state the concrete problem, current-state evidence, alternatives, migration scope, compatibility strategy, rollback and explicit user approval before implementation.
- Sports Hub unification means one Hub catalog, one shared navigation/header/workspace frame and consistent responsive UI. It does not mean merging sport-specific business engines or Firebase data roots.

## 4. No-touch data and security invariants

Unless explicitly authorized, preserve:

- Firebase project/configuration and each sport's existing RTDB root.
- Auth UID, login/session handoff, profile loading and logout behavior.
- ADMIN/BTC/UMPIRE/VIEWER/LIVE_ONLY role semantics and detailed permission checks.
- Tournament IDs and all teams, members, categories, courts, schedules, score events, standings, match history, registrations, announcements, finance, audit and offline queue records.
- Spectator, registration and judge deep links, query parameters and hashes.
- Existing scoring/rules engines. UI unification must use an adapter; it must not silently replace sport-specific scoring logic with generic behavior.

Any data migration requires a separate reviewed plan, backup, dry run, rollback and explicit approval.

## 5. Full Sports Hub browser matrix

Run with official Chrome DevTools MCP on a real Chromium browser. The matrix must cover:

- Hub: desktop 1440px+, tablet 768px and mobile 390px/360px.
- Seven sports: football, badminton, volleyball, running, handmade, shuttlecock and cooking.
- Eleven workspace tabs per sport: overview, control, teams/check-in, schedule/standings, umpire, live/commentary, finance, announcements, audit, health and settings.
- Roles: ADMIN, BTC, UMPIRE, VIEWER and LIVE_ONLY, including denied/hidden actions.
- Public routes: spectator, registration and judge.
- Each tab: click the navigation control; assert exactly one page is visible; assert selected nav state; assert overview/dashboard is hidden outside overview; capture a screenshot.
- Each visible interactive control: inspect accessible name/label, disabled/permission state, event binding and expected result. Execute safe UI-only actions against isolated fixtures; never send production writes from a browser fixture.
- Workflow actions: create/edit/cancel team and member; check-in; import/export CSV; create/edit/delete schedule; smart-scheduler preview/apply; date locks/busy teams/daily limits; score +/−/undo/next set/end match; results/standings; stream apply/pause/resume/stop; commentary; finance add/export; announcements; user/role/permission changes; audit view; backup/export/import; offline queue and reconnect.
- Sport-specific rules and formats must be tested from their actual rule configuration, not generic placeholder content.

## 6. Browser assertions

At minimum capture and assert:

- Current URL and route identity; no unintended redirect or loss of query/hash.
- App boot completion, correct sport identity and correct data-root contract.
- One visible workspace page after every tab click.
- No dashboard leakage above another tab.
- No horizontal overflow at supported viewport widths.
- Readable foreground/background contrast (WCAG AA target 4.5:1 for normal text).
- No uncaught console errors; classify warnings and browser Issues.
- Changed HTML/CSS/JS requests return successful status; no missing assets.
- Forms, buttons and select controls have labels/names and expected enabled/disabled state.
- Fixture write-attempt counter remains zero unless a dedicated emulator-backed test explicitly expects a write.
- Capture screenshots for Hub desktop/mobile and every sport/tab, plus console and network snapshots.

## 7. Badminton shared-workspace acceptance

Badminton is not integrated merely because the Hub card exists or a redirect reaches the legacy application.

Acceptance requires all of the following:

1. Hub launches the canonical shared VNext workspace with `sport=badminton`; the URL stays within `/sports/vnext/index.html` (or a documented same-shell route) and does not redirect to `/sports/badminton/index.html`.
2. Shared header, sport switcher, navigation, workspace frame, responsive behavior and tab semantics are the same as other sports.
3. Existing badminton scoring/tournament engine is retained behind a documented adapter. Preserve its rule formats, umpire flow, live score, reports, history and public routes.
4. Existing Firebase root/schema and auth/session handoff remain unchanged.
5. Test the adapter contract, every badminton tab, scoring lifecycle, public links and desktop/mobile browser UI.
6. Browser evidence must prove there is one shared workspace, not a shared menu wrapped around a separate legacy screen.

## 8. Evidence and release report

Store each Chrome run as a downloadable artifact containing:

- `hub-desktop.png`, `hub-mobile.png`
- `<sport>-boot.json`, `<sport>-mobile.json`
- `<sport>-tab-<tab>.png` and matching JSON for every sport/tab
- `<sport>-console.json`, `<sport>-network.json`
- route/HTTP status logs and test summary

The release report must distinguish:

- **PASS**: directly executed and evidence captured.
- **FAIL**: executed and did not meet acceptance.
- **BLOCKED**: could not be executed due to missing credentials, unavailable service or environment.
- **NOT TESTED**: no evidence; never represent as PASS.

A UI-only fixture is not proof of real Firebase persistence. A host HTTP 200 is not proof of a complete production user journey. A merged PR is not proof of deployment.

## 9. Current baseline known gaps (2026-11-26)

- H230 dashboard visibility fix is merged and its CSS/HTML/JS cache key is verified on the live EdgeOne host.
- Current Chrome MCP workflow covers Hub desktop/mobile, all 7 sport launches, 11 tab visibility assertions per sport, accordion interaction, mobile overflow, console/network snapshots and production HTTP/assets.
- The current workflow's badminton assertion still expects the legacy route `/sports/badminton/index.html`; therefore the current green run does **not** prove shared-workspace integration. Change this assertion when the adapter implementation is ready so a redirect is a hard failure.
- The current per-tab browser loop primarily verifies navigation/visibility and captures screenshots. It does not yet execute every business action listed in section 4. Add isolated, emulator-backed interaction suites before calling the full functional matrix complete.
- Current fixtures replace data write methods and record zero write attempts. Firebase persistence, real account/role behavior, offline sync and live streaming must be reported separately as blocked/not tested unless dedicated emulator/production-safe tests provide evidence.
