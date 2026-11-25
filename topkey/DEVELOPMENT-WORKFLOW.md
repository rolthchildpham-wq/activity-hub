# TOPKEY Activity Hub — Engineering & Verification Workflow

This document is the project-level operating procedure. It applies to future web changes in this repository and complements the ECC engineering playbook; it does not authorize business-architecture or data changes.

## 1. Repository responsibilities

| Repository | Responsibility | Must not do |
|---|---|---|
| `rolthchildpham-wq/ECC` | Canonical engineering standards, planning/TDD/review/security practices, coding conventions and quality methods | Impose a new Activity Hub architecture, rewrite its business rules, or migrate its data |
| `rolthchildpham-wq/activity-hub` | The only target repository for Activity Hub product code, UI, tests, routes and deployment configuration | Move product changes into ECC or replace existing production behavior with mock/demo implementations |
| `rolthchildpham-wq/chrome-devtools-mcp` | Browser automation/inspection toolchain used to exercise the real web UI, inspect runtime/network/console and capture evidence | Be treated as a substitute for product tests or as the place to implement Activity Hub features |

ECC supplies *how we engineer*. Activity Hub owns *what the product does and how its business data behaves*. Chrome DevTools MCP verifies *what the user actually sees and can operate*.

## 2. Brownfield safety — default deny for business changes

Before editing, inspect the current default branch, repository instructions, runtime entry points, callers, Firebase/data contracts, permissions, stylesheets and asset load order, tests, CI and deployment workflows.

Unless the user explicitly asks otherwise, preserve:
- Firebase Auth, sessions, account identity and role/fine-grained permission checks.
- Every sport's existing Firebase root/schema, records and compatibility contracts.
- Tournament configuration/rules, teams/members, schedule and scheduler constraints.
- Scoring engine, referee/live operations, scores, standings, results and history.
- Finance/audit, registration, spectator/judge/public routes, offline persistence/queue.
- Service worker, cache keys, static asset paths and EdgeOne deployment behavior.

A UI unification request is not permission to merge database roots, normalize business records, change scoring rules, or remove a proven engine. Any requested business/data migration requires a separate explicit plan, impact assessment, backup/rollback and migration-specific tests.

## 3. Required implementation sequence

1. **Trace and inventory:** identify the exact production execution path and the owning module; inspect all affected routes, data readers/writers, permissions, CSS cascade, cache/versioning and existing tests.
2. **Plan one coherent change:** define user-visible outcomes, affected files, dependencies, risks, non-goals, acceptance criteria and rollback. Batch dependent work coherently; keep unrelated features in separate PRs.
3. **Test first:** add/update regression tests for the behavior and negative cases before or with implementation. Prefer contract/unit tests for invariants; use isolated fixtures/emulators for integration.
4. **Implement in Activity Hub only:** follow ECC coding standards and existing project patterns. Make the smallest complete change; do not add parallel production systems or mock substitutes.
5. **Review the full diff:** check unintended behavior drift, route/deep-link compatibility, data writes, permission gates, XSS/input validation, accessibility, responsive layout, script/style ordering, stale cache keys and accidental file changes.
6. **Run automated gates:** syntax/build, focused tests, complete repository regression, security and backend/emulator tests relevant to the change. A static pass does not prove browser behavior.
7. **Exercise the real UI with Chrome DevTools MCP:** use the target deployment or a branch-specific fixture that faithfully serves the checked-out code. Open the actual web pages and interact with the actual controls.
8. **Merge/deploy only after gates:** resolve branch conflicts against current main; require green checks and review the final diff. Deploy only when authorized and when regression gates pass.
9. **Verify the active deployment:** open the production URL, confirm the served build/cache version and retest critical flows. A merge, HTTP 200, CI green, or a screenshot by itself is not proof that production serves the new build.
10. **Report evidence:** distinguish committed, merged, deployed and production-verified states. List SHAs/PR, tests, browser routes and interactions, screenshots/artifacts, deployment version, and anything not tested.

## 4. Chrome DevTools MCP — mandatory real-browser checklist

For every UI change, choose the relevant sport workspaces and verify:

- **Routes and shell:** Hub entry, sport selection, back/navigation behavior, deep links and public routes that could be affected.
- **Every relevant tab and card:** click each primary tab, feature card, selector, filter, accordion/collapse control, dialog, menu, table action and primary button; verify the expected destination/state change.
- **Real data states:** loading, empty, populated, live/in-progress, completed and error states using approved test fixtures or isolated TEST LAB accounts. Never mutate production tournament data during tests.
- **Desktop and mobile:** verify at representative wide and narrow viewports; inspect overflow, clipping, sticky/fixed navigation, touch targets, table readability and text wrapping.
- **Visual quality:** computed foreground/background contrast (WCAG 2.2 AA target), typography, spacing, hierarchy, icon consistency, focus visibility and responsive behavior.
- **Runtime diagnostics:** inspect console exceptions, failed requests/assets, HTTP status, network errors and relevant runtime state.
- **Evidence:** save screenshots for important screens and interaction states plus structured test output/logs. Attach artifacts to the workflow/PR.

A DOM-presence assertion or screenshot without operating the controls is insufficient. A test fixture must exercise the same production rendering and interaction code, not a separate mock UI.

## 5. Sports Hub product architecture — mandatory rule

- All seven sports, including **Cầu lông**, are peer entries in one Sports Hub catalog.
- All sports use the **same user-facing workspace route, shell, navigation, sport selector and page-layout system**. Selecting Cầu lông changes the active sport context inside that shared workspace; it must not redirect to a detached badminton landing page or a separate badminton Hub/screen.
- Sport-specific engines may remain isolated behind internal adapters to preserve existing scoring logic, Firebase roots and historical records. Such adapters are implementation details, not separate user-facing navigation destinations.
- Shared UI does not mean shared business schema. Keep sport-specific rules and data contracts where they belong.
- Retire legacy detached entry routes only after redirects/deep links, spectator/registration/judge links, permissions and browser flows have explicit regression coverage.

## 6. Pull request and branch discipline

- One PR should represent one coherent, reviewable outcome; dependent files/tests may be batched together.
- Re-check base/head and merge conflicts immediately before merge. Do not ask the user to merge a known-conflicted PR.
- Never force-push over another active change or silently resolve conflicts by discarding newer main behavior.
- Keep tests in CI and ensure UI changes trigger Chrome DevTools MCP browser verification.
- No production deployment claim until the live asset/build marker is confirmed from the deployed site.

## 7. Completion status vocabulary

Report each layer separately:
- **Implemented:** code change exists on a branch.
- **Checks passed:** named automated tests/workflows passed.
- **Browser verified:** real Chrome DevTools MCP interactions and screenshots passed.
- **Merged:** PR is merged into the target default branch.
- **Deployed:** hosting provider reports the new deployment/build.
- **Production verified:** live URL serves the expected build and critical user flows were rechecked.

If any layer is not run or fails, state that plainly. Never label a partially completed change as complete.
