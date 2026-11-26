# Web engineering baseline: ECC + Frontend System Design

This document defines the reference hierarchy for future web-development requests in TOPKEY Activity Hub.

## Reference responsibilities

| Reference | Responsibility | Must not be used to |
|---|---|---|
| ECC (https://github.com/rolthchildpham-wq/ECC) | Research-first engineering, impact mapping, TDD, secure coding, review, test discipline and evidence-based delivery | Replace the target project's architecture or product contracts |
| Frontend System Design (https://github.com/rolthchildpham-wq/frontend-system-design) | Framework-agnostic checklist for requirements, user journeys, platform, state, APIs, auth/roles, component design, responsive UX, accessibility, performance, versioning and QA | Mandate React, Redux, micro-frontends, a new router/backend or any specific implementation stack |
| TOPKEY Activity Hub (https://github.com/rolthchildpham-wq/activity-hub) | The only repository where TOPKEY product code and project-specific engineering standards are changed | Move TOPKEY product code into reference repositories |
| Chrome DevTools MCP (https://github.com/rolthchildpham-wq/chrome-devtools-mcp) | Real-browser inspection and interaction evidence for the actual web application | Be replaced by static checks or source inspection alone |

## Non-negotiable project boundaries

1. Inspect the actual runtime and identify the owner of each route, component, state transition, API and data path before changing code.
2. Preserve existing architecture and business behavior by default. A reference repository supplies methods and questions—not an automatic architecture migration.
3. Do not change Firebase project/configuration, RTDB roots/schema, auth/session handoff, roles, detailed permissions, tournament IDs, teams, members, schedules, courts, scores, results, history, finance, audit, offline queues, public links or deployment behavior unless explicitly required.
4. A data migration or architecture change requires a written proposal covering evidence, alternatives, compatibility, backup/dry-run, rollout, rollback and explicit approval.
5. UI unification is not domain unification. Sports share one Hub catalog, navigation, header, workspace frame and design system; sport-specific scoring and tournament engines remain behind compatible adapters where necessary.
6. Never test UI fixtures by writing to production business data. Use isolated fixtures or approved emulator environments.

## Required delivery gates

- **G0 — Understand:** read AGENTS.md, this standard, the TOPKEY web skill, relevant ECC skills and FSD checklist; inspect the live route/runtime and current tests.
- **G1 — Specify:** write acceptance criteria as observable user actions/results; map changed files, routes, roles, data paths, dependent sports and explicit no-touch invariants.
- **G2 — Test-first:** add or update a regression test that reproduces the defect; identify whether it is unit, integration, emulator, browser or production-host evidence.
- **G3 — Implement:** make one coherent, bounded patch; avoid broad rewrites and unrelated refactors.
- **G4 — Review:** inspect the full diff for data loss, auth/permission regressions, accessibility, responsive layout, caching, security and rollback.
- **G5 — Verify:** run static and domain tests, emulator/security tests when relevant, then Chrome DevTools MCP on the actual browser UI. Open the real app, click each affected tab/card/control, inspect console/network, verify viewport behavior and save screenshots/JSON evidence.
- **G6 — Release:** merge only when required checks pass. Report Git merge and hosting deployment as separate states.
- **G7 — Production:** verify the served HTML and changed asset versions, then repeat affected user journeys on the production URL. Do not infer deployment from a successful merge or HTTP 200.

## Chrome DevTools MCP evidence contract

For every affected workflow, evidence must identify the URL, viewport, signed-in role or isolated fixture, actions performed, expected and observed outcomes, console errors, failed network requests and screenshot/artifact references. A test that only checks DOM existence or runs JavaScript without clicking through the UI is not a full interaction test.

Classify each item explicitly:
- **PASS** — action executed and expected result observed with evidence.
- **FAIL** — action executed and expected result not observed; preserve diagnostics.
- **BLOCKED** — could not execute due to environment/credential/service limitation.
- **NOT TESTED** — no execution evidence exists.

A green static test, synthetic fixture, merge commit, production HTTP 200 or screenshot alone cannot prove full product correctness or Firebase persistence.

## Required completion report

Every web task closes with repository/branch/commit/PR; files changed and reasons; architecture/data/business contracts intentionally preserved; exact test PASS/FAIL/BLOCKED/NOT TESTED counts; Chrome actions, viewport matrix and evidence artifact; production deployment/build status; remaining defects and next concrete action.
