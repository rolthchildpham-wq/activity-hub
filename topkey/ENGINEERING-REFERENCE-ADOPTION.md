# TOPKEY Sports Hub — Engineering Reference Adoption

This document records which repositories from the owner's GitHub account are useful to this rebuild, what is being adopted, and what must not be copied blindly.

## Governing repositories

| Repository | Relevant strengths | Adoption in TOPKEY | Explicit boundary |
|---|---|---|---|
| [ECC](https://github.com/rolthchildpham-wq/ECC) | Engineering workflow, research-first changes, TDD, review, verification loops, security and agent skills | Canonical engineering playbook; required before each substantial change | Do not bulk-copy the entire ECC monorepo or install its unrelated toolchain |
| [chrome-devtools-mcp](https://github.com/rolthchildpham-wq/chrome-devtools-mcp) | Real Chromium inspection, navigation, screenshots, console/network, accessibility and performance debugging | Official CLI in GitHub Actions; desktop/mobile and all-sport browser matrix | A CI screenshot is not a production deployment or proof of every role workflow |
| [skills](https://github.com/rolthchildpham-wq/skills) | Codebase design, domain modeling, TDD, code review, bug diagnosis and implementation specs | Use design-twice → domain contract → RED/GREEN/REFACTOR → review loop; keep source links here | Skills are process references, not runtime dependencies |
| [bulletproof-react](https://github.com/rolthchildpham-wq/bulletproof-react) | Feature-first boundaries, shared/app layers, colocation, RBAC/PBAC, integration-first tests | Adapt to framework-neutral modules in next-ui/src/lib/{entities,features,shared,widgets}; keep sport-specific workflows behind adapters | Do not introduce React, Zustand, React Query, Tailwind or Radix just to imitate its stack; TOPKEY Next UI is SvelteKit 5 |
| [animal-island-ui](https://github.com/rolthchildpham-wq/animal-island-ui) | Design tokens, component contracts, accessibility, keyboard behavior, component tests | Adopt tokenized styling, component-level behavior tests, focus/keyboard/ARIA review and explicit visual contracts | Its mint/brown/cream palette, typography and strict component aesthetics conflict with the user's navy/ivory/terracotta reference; use TOPKEY tokens instead |
| [tournado](https://github.com/rolthchildpham-wq/tournado) | Tournament domain separation, fixtures, match lifecycle, bracket preview-before-persist, testable service boundaries | Use as a design reference for fixture preview, match progression invariants and domain/service separation | It only implements single elimination and explicitly lacks fine-grained ownership/state enforcement; do not transplant its schema, auth, bracket assumptions or PostgreSQL stack |
| [ProjectVisBug](https://github.com/rolthchildpham-wq/ProjectVisBug) | Visual inspection and live CSS/layout debugging | Optional manual debugging aid when a browser defect needs direct element inspection | Not a production runtime dependency or substitute for Chrome DevTools tests |
| [semgrep](https://github.com/rolthchildpham-wq/semgrep), [biome](https://github.com/rolthchildpham-wq/biome), [eslint](https://github.com/rolthchildpham-wq/eslint) | Static analysis, linting, security patterns and formatting | Reuse the existing topkey/quality/ configuration and extend coverage only with verified, non-disruptive rules | Do not run formatters across legacy files or mass-rewrite production runtime code |
| [realworld_](https://github.com/rolthchildpham-wq/realworld_) | API contracts and cross-implementation consistency | Reference for explicit API/contract specifications if a backend API is introduced | Current application is Firebase RTDB + static EdgeOne; do not add a REST backend without a real requirement |
| [superpowers](https://github.com/rolthchildpham-wq/superpowers) | Agent workflow ideas | Keep as optional process inspiration | Repository currently contains only a README and archive; not a runtime dependency |

## Target architecture

The existing production app under topkey/ remains the operational source of truth until feature parity is demonstrated. The new SvelteKit app under next-ui/ is the migration destination and currently provides a read-only workspace foundation.

- **App shell:** routes, auth boundary, navigation, error/loading/empty states.
- **Shared:** Firebase access adapters, permission-aware utilities, reusable UI primitives.
- **Entities:** sport-neutral tournament, participant/team, fixture/match, schedule, result, finance and audit contracts.
- **Features:** independently owned workflows (auth, tournament, teams, schedule, scoring, standings, referee, live, finance, history, registration, permissions).
- **Sport adapters:** each sport supplies its own format, scoring, tie-break, participant, stage and scheduling policies; never force badminton rules onto football or judged events.
- **Widgets:** dashboard summaries and reusable data views composed from domain contracts.
- **Legacy bridge:** deep links to the existing operational module until its equivalent new workflow is tested and enabled.

The next-ui route foundation currently supports 8 catalog entries (including Vlog) and its Firebase adapter explicitly maps the 7 Firebase-backed sports. Vlog keeps its separate legacy route. Do not silently collapse those distinctions.

## Non-negotiable data and security invariants

1. Preserve Firebase project, each sport root, legacy root, schema version and branch-level security rules.
2. Never use a parent RTDB read when rules grant only child-branch reads.
3. Never present incomplete initial snapshots as valid zero-valued statistics.
4. Keep ADMIN/BTC/umpire/viewer/anonymous scopes and detailed module permissions distinct; client-side hiding is UX, not authorization.
5. Keep all writes disabled in the new UI until a role-matrix emulator test and real TEST LAB workflow prove the write path.
6. Preserve schedules, scores, standings, teams, referee/live workflows, audit and finance history.
7. Migrate one vertical slice at a time behind an adapter; compare old and new outputs before switching traffic.
8. Never deploy Firebase Rules or production data migrations from a UI-only release.

## Required validation loop

1. Research current code, routes, schemas, runtime loading order, CSS cascade and deployment behavior.
2. Write the domain contract and failure cases before implementation.
3. Add a failing test; implement the smallest coherent change; run focused tests.
4. Run all next-ui checks (npm run check, npm test, npm run build, Playwright desktop/tablet/mobile).
5. Run existing TOPKEY auth, rules, runtime-order, scale and security regression suites.
6. Run Chrome DevTools MCP against the exact branch build; inspect console, network, layout, interactions and screenshots.
7. Verify EdgeOne Preview commit SHA separately from local CI. Production deployment requires explicit release approval and rollback evidence.

## Current known gaps

- New UI remains read-only; scoring, schedule writes, permissions, full standings, public registration, live publishing and finance/audit writes are not yet at parity.
- Legacy badminton engine and its ordered hotfix loader remain protected.
- Browser CI can prove the checked-out branch locally; it cannot prove EdgeOne Preview or production serves that SHA.
- A successful contract guard proves declared invariants, not full functional equivalence.

## References reviewed

- ECC: .agents/skills/topkey-web-engineering/SKILL.md, plus relevant coding standards, frontend patterns, TDD, E2E, security and verification skills.
- skills: engineering/codebase-design, engineering/domain-modeling, engineering/tdd, engineering/code-review, engineering/diagnosing-bugs.
- bulletproof-react: AGENTS.md and feature-based source organization.
- animal-island-ui: design tokens/rules and component/accessibility test guidance.
- tournado: system architecture, database schema and functional requirements.
- chrome-devtools-mcp: official CLI and inspect-in-devtools/a11y-debugging skills.
