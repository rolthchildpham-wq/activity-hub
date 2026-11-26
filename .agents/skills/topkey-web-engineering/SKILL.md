---
name: topkey-web-engineering
description: ECC and Frontend System Design guided, brownfield-safe engineering and MCP-verified delivery for TOPKEY.
license: MIT
---

# TOPKEY Web Engineering Standard

## Canonical references

- ECC engineering playbook: https://github.com/rolthchildpham-wq/ECC
- Frontend System Design checklist: https://github.com/rolthchildpham-wq/frontend-system-design
- Official browser automation server: https://github.com/ChromeDevTools/chrome-devtools-mcp
- TOPKEY product repository: https://github.com/rolthchildpham-wq/activity-hub

ECC provides engineering discipline: research-first, impact mapping, TDD, security, review and evidence. Frontend System Design is a framework-agnostic checklist for requirements, user journeys, platform, state, roles, component boundaries, responsive UX, accessibility, performance and QA. Neither reference prescribes a new stack or overrides TOPKEY's current contracts.

## Required sequence

1. Read `AGENTS.md`, this skill, the relevant ECC skills and the FSD checklist.
2. Research the real TOPKEY runtime, routes, callers, state, data contracts, Firebase roots, roles, styles, service worker, cache and deployment.
3. Map affected sports, roles, user journeys, permissions, persistence, public links, assets and no-touch invariants.
4. Define acceptance criteria, error/empty/loading/denied states, rollback and evidence before editing.
5. Add a regression test first (RED), implement the smallest coherent compatible patch (GREEN), then refactor.
6. Review the full diff for security, auth, data integrity, permission bypass, accessibility, responsive UX, performance and deployment effects.
7. Run static/unit/regression/emulator tests, then the official Chrome DevTools MCP workflow.
8. Verify the production URL and active build separately. Do not equate commit, CI, HTTP 200 or screenshot with deployment success.
9. Report exact evidence and label each check PASS, FAIL, BLOCKED or NOT TESTED.

## Required Chrome DevTools MCP procedure

For real-browser acceptance, checkout and build the official `ChromeDevTools/chrome-devtools-mcp` repository at a pinned commit. Start its `chrome-devtools-mcp` server entrypoint using MCP stdio transport. Connect a compatible MCP TypeScript `Client`, complete `initialize`, call `tools/list`, then use `client.callTool` for every browser operation. Use one persistent client/server/browser session for the complete Hub and seven-sport matrix.

Required MCP tools include `new_page`, `list_pages`, `navigate_page`, `select_page`, `take_snapshot`, `evaluate_script`, `take_screenshot`, `resize_page`, `list_console_messages` and `list_network_requests`.

Do not use the companion `chrome-devtools` CLI, direct CDP, Puppeteer, Playwright or another browser automation route as a substitute. If MCP build/connection/tool calls fail, report browser verification as BLOCKED, collect diagnostics, continue independent checks and fail the aggregate gate. Never claim a browser PASS without MCP call evidence.

The detailed mandatory test matrix and evidence contract are in `docs/quality/TOPKEY-WEB-ENGINEERING-AND-FULL-UI-QA.md`.

## TOPKEY invariants

Preserve Firebase Auth/session, roles and fine-grained permissions, each sport's Firebase root/schema/records, teams, schedules, scheduler constraints, scores, standings, referee/live workflows, finance/audit, offline persistence, public spectator/registration/judge routes, service-worker and EdgeOne behavior.

Unify the Sports Hub catalog, navigation, header and workspace shell. Football, badminton, volleyball, running, handmade, shuttlecock and cooking retain compatible domain engines behind adapters. Never merge Firebase roots or replace sport-specific scoring rules merely to unify navigation.

Any architecture/data migration requires current-state evidence, alternatives, compatibility plan, backup/dry run, rollback and explicit user approval.

## Visual baseline

Use warm ivory canvas, white cards, deep navy navigation/primary actions, terracotta accents, readable high-contrast typography, compact utility bar and clear KPI/calendar/chart hierarchy. Support desktop/tablet/mobile without unintended horizontal overflow. Normal text contrast target: WCAG AA 4.5:1.

## Reference implementations

Consult ECC, skills, bulletproof-react, animal-island-ui, tournado, Chrome DevTools MCP, ProjectVisBug, Semgrep, Biome, ESLint and RealWorld only where relevant. Adapt useful patterns; do not bulk-copy unrelated repositories, add their frameworks or change TOPKEY architecture without an approved migration.
