# TOPKEY Web Engineering & Full UI QA Standard

This is the project execution contract for TOPKEY Activity Hub. ECC defines engineering discipline; Frontend System Design is a framework-agnostic design checklist; Chrome DevTools MCP is the required real-browser test channel. None of these references authorizes an architecture or framework migration.

## 1. Repository and reference boundaries

- **Product code:** `rolthchildpham-wq/activity-hub` only.
- **Engineering discipline:** `rolthchildpham-wq/ECC` — research-first, impact analysis, TDD, security, review and evidence.
- **Design checklist:** `rolthchildpham-wq/frontend-system-design` — requirements, user journeys, platform, state, roles, component boundaries, responsive UX, accessibility, performance and QA.
- **Browser test system:** official `ChromeDevTools/chrome-devtools-mcp` repository, built and run as an MCP server and controlled by an MCP client.

Do not copy a reference repository's framework, runtime, routing, state, database, component library or deployment platform into TOPKEY. Adopt a practice only after mapping it to the existing code and business contracts.

## 2. Required change lifecycle

1. **Discover:** inspect current production/runtime ownership, entrypoints, routes, callers, APIs, persistence, auth, permissions, styles, service worker/cache keys, deployment configuration and existing tests.
2. **Map impact:** enumerate touched files, sports, routes, roles, Firebase roots/paths, records, workflows, assets, cache keys and integrations. Explicitly list invariants.
3. **Specify:** write acceptance criteria as observable user journeys, including loading, empty, error, denied-permission and responsive states. Define evidence and rollback.
4. **TDD:** add a regression test that fails for the reported defect; implement a bounded patch; prove the test turns green; refactor only while keeping it green.
5. **Review:** inspect the complete diff, security/permission boundaries, data compatibility, accessibility, responsive behavior, performance, caching and deployment impact.
6. **Verify bottom-up:** syntax/static → unit/domain → repository regression → Firebase emulator/security → integration → Chrome DevTools MCP → production-host verification.
7. **Release:** do not merge or deploy before required gates are green and the user has authorized release.
8. **Report:** separate code, tests, browser evidence and deployment status. Use PASS / FAIL / BLOCKED / NOT TESTED; never infer success.

## 3. Mandatory Chrome DevTools MCP protocol

The workflow must use the actual official MCP server, not its companion CLI.

### 3.1 Build the server from the official repository

- Checkout `https://github.com/ChromeDevTools/chrome-devtools-mcp` at an explicit reviewed commit or release tag and record the resolved SHA in CI logs.
- Use a supported Node version declared by that pinned revision.
- Install dependencies and run the repository's documented build from its own checkout.
- After `npm ci`, follow the pinned repository's own dependency bootstrap: `git submodule update --init` and `node scripts/gclient-sync.ts` (or the equivalent official `npm run sync` lifecycle). Do not guess nested submodule paths; gclient-sync resolves the revision's DEPS/CIPD inputs such as GN and Ninja.
- Verify the GN binary, Ninja binary and generated server entrypoint exist before proceeding.
- Do not use `chrome-devtools start/status/navigate/evaluate/stop` or `npx chrome-devtools` as a substitute for the MCP protocol.

### 3.2 Connect a real MCP client

- Use the MCP TypeScript client/stdio transport dependency compatible with the pinned official server. Prefer the client package already pinned in the server checkout; do not independently float SDK versions.
- Start the official `chrome-devtools-mcp` server executable as a child process through `StdioClientTransport`.
- Connect `Client` and prove the MCP `initialize` handshake completed.
- Call `tools/list` and assert required tools exist: `new_page`, `list_pages`, `navigate_page`, `select_page`, `take_snapshot`, `evaluate_script`, `take_screenshot`, `resize_page`, `list_console_messages`, and `list_network_requests`.
- Open a page through `tools/call(new_page)`, resolve its returned page ID, and use that same page ID for all page-scoped calls.
- Every browser action must be issued using `client.callTool({name, arguments})`. Record the tool name, safe arguments, success/error and relevant result metadata.
- Keep one MCP client, one server process and one browser session alive for the entire Hub/sport matrix. Do not reconnect or start a new browser per tab/sport.
- On shutdown, close the MCP client/stdio transport cleanly and retain server stderr/logs.

### 3.3 MCP failure policy

Any failure in build, server startup, initialize handshake, `tools/list`, page creation/page selection, or a required `tools/call` is a hard MCP gate failure. Browser checks become BLOCKED; the workflow must not silently fall back to CLI, direct CDP, Puppeteer or Playwright. Capture diagnostics, continue independent static/regression/HTTP checks, then fail the aggregate job. Never mark the browser gate PASS.

## 4. No-touch data and security invariants

Unless a requirement explicitly authorizes a separately reviewed migration, preserve:

- Firebase project/configuration and each sport's existing RTDB root/schema.
- Auth UID, login/session handoff, profile loading and logout.
- ADMIN/BTC/UMPIRE/VIEWER/LIVE_ONLY semantics and fine-grained permission checks.
- Tournament IDs and all teams, members, categories, courts, schedules, score events, standings, results, match history, registrations, announcements, finance, audit and offline queue records.
- Spectator, registration and judge routes, query parameters, hashes and deep links.
- Existing scoring/rules engines. Shared navigation uses adapters; it does not merge engines or data roots.

Do not use a production account or browser fixture to mutate business data. UI-only tests must run against isolated fixtures and assert zero write attempts. Persistence/authorization tests that require writes must use a dedicated Firebase emulator project and explicitly scoped test data. Any production data migration requires a separate plan, backup, dry run, rollback and explicit approval.

## 5. Full Sports Hub browser matrix

### Surfaces and viewport sizes

- Hub desktop: 1440px or wider; tablet: 768px; mobile: 390px and 360px.
- Seven sports: football, badminton, volleyball, running, handmade, shuttlecock and cooking.
- Eleven workspace areas per sport: overview, control, teams/check-in, schedule/standings, umpire, live/commentary, finance, announcements, audit, health and settings.
- Roles: ADMIN, BTC, UMPIRE, VIEWER and LIVE_ONLY; verify both allowed and denied/hidden actions.
- Public spectator, registration and judge routes.

### Interaction requirements

- Click every navigation item and relevant card/control; assert route identity, selected nav state and exactly one visible workspace page.
- Assert dashboard/overview is hidden outside overview; no duplicated panels, stale content or leaked controls.
- Inspect accessible name/label, keyboard focus, disabled state, permission state, event binding and expected result for visible interactive controls.
- Exercise safe fixture interactions: accordion open/close, selectors, filters, date pickers, dialogs, validation, empty/loading/error states and responsive navigation.
- Exercise business workflows against isolated fixtures or emulator data as appropriate: team/member lifecycle, check-in, CSV import/export, schedule lifecycle, smart-scheduler preview/apply, date locks/busy teams/daily limits, scoring/undo/next set/end match, results/standings, stream lifecycle, commentary, finance, announcements, role/permission administration, audit, backup/import/export, offline queue and reconnect.
- Verify sport-specific rules from the real configuration, not a generic placeholder.
- Continue independent sports and checks after a test fails. Collect all results; the aggregate job remains failed if any required assertion fails.

### Required assertions

- URL, route and query/hash preservation; no unexpected redirect.
- App boot completion, correct sport identity and correct adapter/data-root contract.
- Exactly one active workspace page after each navigation action.
- No horizontal overflow at all supported viewports.
- WCAG AA contrast target (4.5:1 for normal text), visible focus and accessible control names.
- No uncaught console errors; warnings are captured and classified.
- Changed HTML/CSS/JS requests succeed; no missing or stale assets.
- Permission-sensitive actions match the active test role.
- Fixture write-attempt counter remains zero unless a dedicated emulator test explicitly expects writes.
- Screenshot and DOM snapshot evidence for Hub and every sport/tab; console and network evidence for each sport.

## 6. Badminton shared-workspace acceptance

Badminton is not integrated merely because its Hub card exists or a redirect opens the legacy application.

1. Hub launches the canonical shared VNext workspace with `sport=badminton`; the URL remains in the shared shell (currently `/sports/vnext/index.html?sport=badminton`, or an explicitly documented same-shell route).
2. Shared header, sport switcher, navigation, workspace frame, responsive behavior and tab semantics match other sports.
3. Existing badminton scoring/tournament engine remains behind a documented adapter, preserving rule formats, umpire flow, live score, reports, history and public routes.
4. Firebase root/schema and auth/session handoff remain unchanged.
5. Test adapter contract, every badminton tab, scoring lifecycle, public links and desktop/mobile browser UI.
6. A redirect to a standalone legacy page is a hard failure for shared-workspace acceptance.

## 7. Evidence, aggregation and release report

Upload a run artifact containing:

- MCP server commit/version, Node version, build log, initialize handshake and tools/list result.
- MCP call log with tool names, page IDs, outcomes and errors.
- Hub desktop/tablet/mobile screenshots and DOM snapshots.
- `<sport>-boot.json`, `<sport>-mobile.json`, `<sport>-tab-<tab>.png` and matching DOM/JSON snapshots.
- `<sport>-console.json`, `<sport>-network.json`, route/HTTP status logs and aggregate summary.
- Server stderr and test diagnostics even on failure.

Definitions:
- **PASS:** executed directly and evidence captured.
- **FAIL:** executed and did not meet acceptance.
- **BLOCKED:** could not execute due to a failed prerequisite, missing credential or unavailable service.
- **NOT TESTED:** no evidence was produced.

Static tests, HTTP 200, a UI-only fixture, a screenshot, PR merge and deployment are distinct evidence types. None substitutes for another.
