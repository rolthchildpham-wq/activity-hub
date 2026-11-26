# TOPKEY web engineering rules

These rules apply to every TOPKEY web change: feature work, UI changes, bug fixes, refactors, security changes, testing and release work.

## Source-of-truth boundaries

- TOPKEY Activity Hub (`rolthchildpham-wq/activity-hub`) is the only repository for TOPKEY product code.
- ECC (`rolthchildpham-wq/ECC`) is the engineering-discipline reference: research-first, impact analysis, TDD, security, review and evidence.
- Frontend System Design (`rolthchildpham-wq/frontend-system-design`) is a framework-agnostic design checklist: requirements, journeys, platform, state, roles, component boundaries, responsive UX, accessibility, performance and QA.
- Chrome DevTools MCP (`ChromeDevTools/chrome-devtools-mcp`) is the required real-browser inspection and interaction channel.
- Reference repositories provide practices and examples only. They do not authorize framework, runtime, architecture, routing, state, database or deployment migrations.

## Required delivery sequence

1. **Research first** — read this file and `.agents/skills/topkey-web-engineering/SKILL.md`; consult the relevant ECC guidance and FSD checklist. Inspect the real entrypoints, runtime ownership, routes, callers, APIs, persistence, permissions, styles, tests, cache/service-worker and deployment configuration.
2. **Impact map** — identify affected sports, routes, user roles, Firebase roots/paths, records, workflows, assets, cache keys and integrations. Record invariants and no-touch areas.
3. **Specify** — define user journeys, responsive states, accessibility expectations, acceptance criteria, failure states, telemetry/evidence and rollback before editing.
4. **Test first** — add a failing regression test (RED), implement the smallest coherent compatible patch (GREEN), then refactor. Do not split dependent changes into disconnected hotfixes or edit the same files concurrently.
5. **Implement safely** — keep presentation, domain logic, adapters and persistence boundaries explicit. Reuse existing TOPKEY patterns unless evidence demonstrates a defect.
6. **Review** — inspect the complete diff for correctness, auth, data integrity, role/permission bypass, security, accessibility, responsive layout, performance, cache and release impact.
7. **Verify** — run syntax/static checks, focused tests, repository regressions, emulator/security tests where relevant, then the required Chrome DevTools MCP browser matrix. MCP failure means browser verification is BLOCKED; never substitute a CLI, Playwright, Puppeteer, direct CDP or a screenshot-only shortcut.
8. **Release separately** — merge only after required checks pass and approval is given. Verify EdgeOne deployment and active build separately from merge/CI.
9. **Report evidence** — provide PR/commit, exact commands and outcomes, browser matrix coverage, artifact links, unresolved defects and deployment state. Label each item PASS, FAIL, BLOCKED or NOT TESTED.

## Safety and compatibility invariants

Unless the user explicitly authorizes a separately reviewed migration, preserve:

- Firebase project/configuration, each sport's existing RTDB root, schema and record IDs.
- Firebase Auth UID, sign-in/session handoff, profile loading and logout.
- ADMIN/BTC/UMPIRE/VIEWER/LIVE_ONLY semantics and fine-grained permissions.
- Tournament IDs, teams, members, categories, courts, schedules, scheduler constraints, score events, standings, results, match history, registrations, announcements, finance, audit and offline queues.
- Spectator, registration and judge URLs, query parameters, hashes and deep links.
- Existing sport-specific rules/scoring engines. A shared Sports Hub shell uses adapters; it does not collapse distinct sport engines or Firebase roots.
- Service-worker, static hosting and EdgeOne behavior.

Architecture/data migrations require current-state evidence, alternatives, compatibility plan, backup/dry-run, rollback and explicit approval before implementation.

## Sports Hub product boundary

One shared catalog, navigation, header and workspace frame is the target. Football, badminton, volleyball, running, handmade, shuttlecock and cooking retain their compatible domain engines and data contracts behind adapters. A card or redirect alone is not proof that a sport is integrated into the shared workspace.

## Required browser verification

Use the official Chrome DevTools MCP repository as an MCP server and connect a real MCP client over stdio. All browser actions and evidence collection must be MCP `tools/call` requests in one persistent client/server/browser session. The detailed, mandatory protocol and test matrix are in `docs/quality/TOPKEY-WEB-ENGINEERING-AND-FULL-UI-QA.md`.

**Forbidden substitutes:** `chrome-devtools` CLI commands, the package's daemon CLI, direct CDP/WebSocket calls, Puppeteer, Playwright, Selenium, direct browser scripting, or treating static checks as real-browser verification. If MCP cannot initialize, list tools, create/select a page or execute a tool call, mark browser checks BLOCKED and fail the required CI gate. Do not report browser PASS.

## Visual and accessibility baseline

Use the approved TOPKEY design language: warm ivory canvas, white cards, deep navy navigation/primary actions, terracotta accents, readable high-contrast typography, compact utility bar and clear KPI/calendar/chart hierarchy. Support desktop, tablet and mobile without unintended horizontal overflow. Normal text targets WCAG AA contrast of at least 4.5:1.

## Completion and deployment

A passing unit test is not a passing UI test. A UI fixture is not proof of Firebase persistence. HTTP 200 is not proof of a successful user journey. A PR merge is not proof of EdgeOne deployment. Do not merge, deploy, change production data or claim success without the corresponding evidence and authorization.
