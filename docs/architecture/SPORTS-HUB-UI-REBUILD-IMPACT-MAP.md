# Sports Hub UI rebuild — impact map (2026-11-27)

## Decision

Replace the presentation layer as one controlled migration. Do not switch the production entrypoint to `next-ui` yet: the current SvelteKit app is a read-only dashboard and hands operational actions back to legacy pages. It is a useful visual/layout prototype, not feature parity.

## Audited runtime boundaries

### Current operational runtime

- Canonical operational entry: `topkey/sports/vnext/index.html`.
- Runtime bootstrap: `release-runtime.js`, `topkey-platform-core.js`, `topkey-hub-guard-core.js`, `hub-entry-guard.js`, `topkey-shared-auth.js`, `h108-auth-guard.js`.
- Domain/service runtime is split across `topkey/sports/vnext/src/config.js`, `auth.js`, `firebase.js`, `app.js`, `utils.js`, `idb.js`, sport modules, live/referee/commentary/scheduler/CSV modules and numerous `upgrade*` / `hotfix*` scripts.
- HTML owns a large set of direct DOM contracts: stable IDs, forms, tables, tab buttons, public route hashes and feature mount points. Existing handlers query those IDs. A markup rewrite must inventory and preserve/adapter-map every live contract before deleting it.
- The entry currently loads a long chain of historical CSS layers, sport identity/contrast/responsive sheets, live/referee sheets, dashboard layers and inline styles. This is the verified source of cascade complexity; a one-selector patch is not a stable architecture.

### Existing `next-ui` candidate

- SvelteKit routes exist for sport selection and tournament workspaces, with schedule, bracket, live, leaderboard, analytics, check-in, referee, finance and history pages.
- `next-ui/src/lib/firebase.ts` subscribes to the four allowed branches `config`, `teams`, `matches`, `activeMatches` under seven explicit RTDB roots. It waits for all initial snapshots and has a 10-second timeout.
- `next-ui/src/lib/domain.ts` contains shared display helpers and legacy handoff URLs.
- `next-ui/src/routes/+page.svelte` and workspace pages describe the UI as read-only; the workspace disclaimer explicitly sends scoring, permissions and edits to the current TOPKEY modules.
- `next-ui/src/lib/firebase.ts` currently creates a Firebase client directly and the layouts authenticate with Firebase Auth. This is not proof of parity with the current shared auth/profile/role/permission handoff.
- The adapter catalog currently has a badminton handoff to `sports/badminton/index.html`, while the target product requirement is a shared VNext workspace. Do not treat that redirect as completed integration.
- Existing contract tests verify seven RTDB root names, the four branch subscriptions, route handoffs and TEST LAB ID isolation. They do not prove operational feature parity or fine-grained role permissions.

## Sport/data boundaries (no-touch)

| Sport | Existing RTDB root | Existing domain mode | UI migration constraint |
|---|---|---|---|
| Football | `topkey_football_vnext_2026` | score | Preserve football-specific standings, team/field-size categories and match engine |
| Volleyball | `topkey_volleyball_vnext_2026` | sets | Preserve group A/B separation, best-of-five and scoring/tie-break rules |
| Running | `topkey_running_vnext_2026` | time | Preserve individual/relay entries and timing model |
| Handmade | `topkey_handmade_vnext_2026` | judged | Preserve rubric scoring and judge workflow |
| Shuttlecock | `topkey_shuttle_vnext_2026` | sets | Preserve individual/pair/team formats and sport scoring rules |
| Cooking | `topkey_cooking_vnext_2026` | judged | Preserve cooking-specific rubric and judge workflow |
| Badminton | `topkey_badminton_vnext_2026` | sets + legacy adapter | Preserve all three match-format profiles, referee/live workflows and existing badminton engine |
| Vlog | separate module; no VNext sport root | separate | Keep separate; not counted as one of the seven sports |

The operational `config.js` is the current authoritative source for sport-specific roots, labels, categories, formats, scoring/rules and badminton engine adapter. The UI must consume an adapter contract; it must not duplicate these values as a second source of truth.

## Identity, access, routes and persistence invariants

- Keep Firebase project/config and each sport RTDB root/schema/record IDs unchanged.
- Keep Firebase Auth UID/session, shared profile resolution, role names and fine-grained permission checks unchanged.
- Keep tournament IDs, teams/members, categories, courts, schedules, scheduler constraints, score events, standings, results, history, registrations, finance, announcements, audit and offline queue unchanged.
- Keep public spectator/registration/judge routes, query parameters, hash routes, QR targets, share links and livestream endpoints.
- Keep service-worker, static hosting and EdgeOne cache behavior compatible.
- Do not point the UI at a parent RTDB node where rules permit only individual child branches.
- Never write to production while running visual or UI-only acceptance tests.

## Required UI replacement boundary

Build one shared shell (catalog, navigation, header, workspace frame, page visibility, responsive navigation, tokens and reusable primitives). Each sport contributes an explicit adapter for its labels, rules, permitted modules, data projections and engine handoffs. Feature views must call existing domain/service boundaries; UI code must not own Firebase paths or reimplement scoring/scheduling/permissions.

A page navigation action must result in exactly one visible workspace. Back/Forward, deep links and query/hash values must survive. Normal text contrast target is WCAG AA 4.5:1, with visible keyboard focus and no horizontal overflow at 360, 390, 768 and 1440 px.

## Safe implementation sequence

1. Complete a machine-readable inventory of entry scripts/styles, DOM IDs, delegated/direct handlers, routes, Firebase roots/paths, auth/permission calls, service-worker/cache and all seven sport rule definitions.
2. Define and test the adapter/service contracts against current source (RED before implementation).
3. Build the replacement shell and page primitives in the existing approved stack. Do not introduce another runtime or database.
4. Port feature views by domain boundary, with parity tests for every current operational workflow and role.
5. Switch the canonical entry only after all route, feature, role and data contracts pass. Remove obsolete UI CSS/markup/scripts only after reference searches prove they are presentation-only and unused.
6. Run static/domain/security/emulator checks and the official Chrome DevTools MCP full browser matrix in one persistent MCP session. If MCP bootstrap or tools fail, browser verification is BLOCKED.
7. Keep the branch unmerged and do not deploy until the required gates are green and the user explicitly approves release.

## Initial acceptance inventory

- [ ] Hub catalog and seven sports in one shared workspace
- [ ] Admin/BTC/Umpire/Viewer/Live-only allowed and denied controls
- [ ] Overview and single-page visibility after every navigation
- [ ] Teams, members, registrations, QR, check-in, CSV import/export
- [ ] Manual schedule, round-robin, smart-scheduler preview/apply, date locks, busy teams, priorities and daily limits
- [ ] Sport-specific score/time/judging engines, undo, next set/heat, end event
- [ ] Volleyball A/B group standings and all tie-break rules
- [ ] Badminton three match-format profiles, umpire, fullscreen, live overlay and commentary
- [ ] Live publish/stream, spectator and public results
- [ ] Finance, announcements, audit, backup/import/export, offline queue/reconnect
- [ ] Vietnamese and Traditional Chinese UI coverage
- [ ] Desktop/tablet/mobile, keyboard, contrast, console/network and Back/Forward
