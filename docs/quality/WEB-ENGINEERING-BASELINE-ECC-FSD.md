# Web Engineering Baseline: ECC + Frontend System Design + Chrome DevTools MCP

## Purpose

Establish one repeatable, evidence-based delivery process for every future TOPKEY web change. This is an engineering and quality baseline, not an architecture migration.

## References and responsibilities

| Reference | Responsibility | Does not authorize |
|---|---|---|
| ECC | Engineering discipline: research-first, impact analysis, TDD, security, review, verification and evidence | Replacing TOPKEY's stack or business architecture |
| Frontend System Design | Framework-agnostic checklist for requirements, journeys, platform, state, roles, component boundaries, responsive UX, accessibility, performance and QA | Adopting a specific framework or component system |
| Chrome DevTools MCP | Real-browser interaction, inspection, responsive checks and evidence via MCP protocol | Using a companion CLI or static tests as a browser-test substitute |
| TOPKEY Activity Hub | Sole source repository for TOPKEY product code and contracts | Unreviewed schema, root, auth or data migration |

## Safety boundaries

- Keep TOPKEY Activity Hub as the only repository for TOPKEY product code.
- Reference repositories are read-only engineering/design references unless the user explicitly asks for a change there.
- Preserve Firebase roots/schema, auth/session, roles/permissions, tournament IDs, teams, schedules, scores, results, finance, audit, history, offline queues and public links by default.
- Sports Hub shares one catalog/navigation/header/workspace shell. Sport-specific domain engines remain compatible behind adapters.
- Architecture/data migrations require evidence, alternatives, compatibility plan, rollback and explicit approval.
- No production writes during UI fixture tests. Use isolated fixtures or a dedicated Firebase emulator.
- Merge and deployment are separate gates. No deployment claim without checking the actual host and active build.

## Delivery gates

### G0 — Discover
Read project rules and relevant ECC/FSD references. Inspect real runtime ownership, entrypoints, routes, callers, state, APIs, Firebase contracts, auth, roles, styles, service worker, cache keys, tests and deployment configuration.

### G1 — Impact and specification
Map affected files, sports, user journeys, roles, data roots, records, public routes, assets and integrations. Write acceptance criteria, failure/empty/loading/denied states, accessibility and responsive expectations, evidence plan and rollback.

### G2 — Test first
Add a failing regression test for the defect (RED). Implement a bounded compatible patch (GREEN). Refactor only with tests remaining green. Do not disable a failing acceptance assertion to make CI pass.

### G3 — Implement
Keep presentation, domain logic, adapters, routing and persistence boundaries explicit. Prefer existing TOPKEY patterns. Reference repositories do not justify framework or runtime migrations.

### G4 — Review
Review the complete diff for auth/session, data integrity, permissions, security, accessibility, responsive behavior, performance, caching and deployment effects.

### G5 — Automated verification
Run syntax/static checks, focused tests, repository regressions, Firebase emulator/security tests and integration tests as applicable. Preserve logs and continue independent suites after failures.

### G6 — Real browser verification through MCP
Use the exact protocol in the project QA standard:
1. Checkout the official ChromeDevTools MCP repository at a pinned commit and record its SHA.
2. Install/build from that repository using the pinned revision's supported Node version and required submodules.
3. Start the official `chrome-devtools-mcp` server entrypoint as an MCP stdio child process.
4. Connect a compatible TypeScript MCP `Client`; prove the initialize handshake.
5. Call `tools/list` and assert required navigation, snapshot, evaluation, screenshot, viewport, console and network tools exist.
6. Create/select a page through MCP, capture its page ID, and use `client.callTool` for every browser action.
7. Keep one persistent MCP client/server/browser session across Hub and all seven sports.
8. Capture screenshots, DOM snapshots, console/network records and call diagnostics.
9. If any MCP prerequisite fails, browser verification is BLOCKED. Do not fall back to CLI, CDP, Puppeteer or Playwright. Continue independent checks and fail the aggregate gate.

### G7 — Release and production verification
Merge only after required tests are green and release is authorized. Verify deployment trigger, deployed HTML/assets/cache keys, actual browser user journeys and active build independently. If no deployment was triggered, say so.

### G8 — Report
Report PR/commit, tests executed, exact pass/fail/blocked/not-tested coverage, browser artifacts, unresolved defects and deployment status. Do not overstate evidence.

## TOPKEY product invariants

- Preserve each sport's Firebase root/schema and existing records.
- Preserve Auth UID/session lifecycle and detailed role permissions.
- Preserve tournament IDs, teams, members, schedules, scheduler constraints, scores, standings, results, history, finance, audit and offline data.
- Preserve spectator, registration and judge routes/query/hash contracts.
- Keep sport-specific scoring/rules engines behind adapters.
- Shared Sports Hub shell must not leak content between tabs or create duplicate workspaces.
- Badminton shared-workspace acceptance requires the canonical VNext shared shell with `sport=badminton`; a redirect to a standalone legacy page is not acceptance.

## Visual and accessibility baseline

Warm ivory canvas, white cards, deep navy navigation and primary actions, terracotta accents, readable typography, compact utility bar, clear KPI/calendar/chart hierarchy, independent collapsible groups and responsive layouts. Normal text contrast target is WCAG AA 4.5:1. Check keyboard focus and accessible names as well as color.

## Evidence contract

Every required check is explicitly classified:
- PASS: executed directly with supporting evidence.
- FAIL: executed and failed its assertion.
- BLOCKED: prerequisite/service/credential prevented execution.
- NOT TESTED: no execution or evidence.

The Chrome MCP artifact must include server version/SHA, Node version, build log, initialize/tools-list proof, MCP tool-call log, Hub desktop/tablet/mobile screenshots and snapshots, each sport/tab screenshot and snapshot, console/network output, route/HTTP logs, aggregate summary and server stderr.

A static test is not a browser test. A fixture is not proof of Firebase persistence. HTTP 200 is not a complete user journey. A merge is not a deployment.
