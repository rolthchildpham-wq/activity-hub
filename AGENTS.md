# Repository Engineering Instructions

This repository follows the user's ECC engineering baseline:
- Canonical baseline: https://github.com/rolthchildpham-wq/ECC
- ECC is the default planning, implementation, review, security, and testing standard for future code changes in this repository.
- Browser verification baseline: https://github.com/ChromeDevTools/chrome-devtools-mcp

## Required workflow for every web-code task

1. **Inspect before editing**
   - Read the relevant source, dependencies, deployment workflow, existing tests, and recent commits.
   - Trace the actual runtime path; do not infer behavior from filenames or static markup alone.
   - Preserve the existing architecture and established coding conventions unless a verified defect requires a change.

2. **Plan and protect production behavior**
   - For multi-file or architectural changes, write a concise implementation plan and identify data, authentication, permission, offline, and deployment risks before coding.
   - Preserve Firebase paths/schema, account roles, authorization, tournament rules, scheduling, scoring, match history, live state, finance, audit, and public-viewer behavior unless the user explicitly requests a business-rule change.
   - Never migrate or merge data roots as a side effect of a UI consolidation.
   - Do not remove a legacy capability until an equivalent replacement is implemented and verified.

3. **Test-driven implementation**
   - Add or update regression tests before changing behavior where practical.
   - Run focused tests after each logical change, then the complete relevant regression suite.
   - Aim for at least 80% coverage for new testable logic where the repository has measurable coverage tooling; report coverage honestly and do not invent a project-wide percentage.
   - Fix the implementation when a valid test fails; do not weaken a test merely to obtain a pass.

4. **Review and security**
   - Review every changed file for correctness, maintainability, accessibility, and unintended behavior.
   - Validate user input and authorization at system boundaries.
   - Never add secrets, credentials, tokens, or private user data to source, logs, fixtures, or screenshots.
   - Do not expose test fixtures in production data. Use isolated test namespaces and disposable accounts.

5. **Real-browser verification**
   - Use the official Chrome DevTools MCP project: https://github.com/ChromeDevTools/chrome-devtools-mcp
   - Use its maintained CLI/MCP tooling with a real Chrome session to inspect the deployed page, console, network, computed styles, responsive layouts, and actual user interactions.
   - Exercise every relevant navigation tab, nested card, form, and primary workflow; capture screenshots and machine-readable results.
   - A static test or HTTP 200 is not proof that a page works. Distinguish source tests, browser interaction tests, and production deployment verification.

6. **Commit and release**
   - Use conventional commit messages: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `perf:`, or `ci:`.
   - Prefer a reviewable branch/PR for substantial changes. Do not force-push or overwrite unrelated user work.
   - Verify the exact commit SHA and workflow results before reporting success.
   - Never claim deployment until the production deployment workflow and the deployed URL/build have both been verified.

## TOPKEY Sports Hub invariants

- All sports must be discoverable from one consistent Sports Hub and use consistent navigation and visual language.
- Badminton must appear as a first-class sport alongside the other sports, not as a detached or visually special destination.
- A unified Hub does **not** authorize merging sport-specific Firebase roots or weakening sport-specific rules.
- Preserve badminton's specialized umpire, scoring, multi-court, schedule, live/commentary, finance, reporting, and tournament lifecycle capabilities when consolidating navigation or presentation.
- Use collapsible sub-cards for dense feature groups; each card must be independently operable and accessible with keyboard support and correct `aria-expanded` / `aria-controls`.
- Validate text contrast, visible focus, touch targets, mobile layout, and horizontal overflow across every sport.

## Required completion report

For each substantial task, report:
- changed files and commit SHA;
- tests actually executed and their pass/fail results;
- Chrome DevTools MCP routes/tabs/interactions actually exercised;
- known gaps or blocked checks;
- deployment status separately from code/test status.

Do not substitute an estimate, screenshot-only review, or a successful HTTP response for a completed interaction test.
