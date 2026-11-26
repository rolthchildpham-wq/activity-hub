---
name: topkey-web-engineering
description: ECC and Frontend System Design guided, brownfield-safe workflow for TOPKEY web development.
license: MIT
---

# TOPKEY Web Engineering Standard

Use the user's canonical ECC fork: https://github.com/rolthchildpham-wq/ECC
Use the framework-agnostic design checklist: https://github.com/rolthchildpham-wq/frontend-system-design

ECC defines engineering discipline and verification. Frontend System Design defines the questions/checklist for product and UI design. Neither reference overrides TOPKEY's existing architecture or business contracts.

## Required sequence
0. Read ECC guidance and use Frontend System Design to check requirements, user journeys, platform, state, roles, component boundaries, responsive behavior, accessibility, performance and testability. Treat it as a checklist, not a prescribed stack.
1. Research actual runtime ownership, routes, callers, data contracts, styles, tests, and deployment.
2. Plan a coherent patch with acceptance criteria and rollback.
3. Write regression tests before implementation (RED), implement (GREEN), then refactor.
4. Review the full diff for auth, data, permissions, accessibility, responsive behavior, cache and deployment effects.
5. Verify static tests, repository regression, backend/emulator where relevant, then real browser behavior with the user's Chrome DevTools MCP repository.
6. Verify deployed URL and active build separately; never equate commit, CI, HTTP 200, or screenshot with successful deployment.

## Reference implementations to consult

- [ECC](https://github.com/rolthchildpham-wq/ECC): canonical engineering playbook and verification workflow.
- [skills](https://github.com/rolthchildpham-wq/skills): codebase design, domain modeling, TDD, code review and bug diagnosis.
- [bulletproof-react](https://github.com/rolthchildpham-wq/bulletproof-react): feature boundaries and shared/app layering; adapt the architecture, not its React stack.
- [animal-island-ui](https://github.com/rolthchildpham-wq/animal-island-ui): design tokens, accessible component contracts and interaction tests; retain TOPKEY's own visual palette.
- [tournado](https://github.com/rolthchildpham-wq/tournado): tournament/fixture domain separation and preview-before-persist; do not assume its single-elimination model fits every sport.
- [chrome-devtools-mcp](https://github.com/rolthchildpham-wq/chrome-devtools-mcp): official browser inspection and UI verification.
- [ProjectVisBug](https://github.com/rolthchildpham-wq/ProjectVisBug): optional manual visual debugging.
- [Semgrep](https://github.com/rolthchildpham-wq/semgrep), [Biome](https://github.com/rolthchildpham-wq/biome), [ESLint](https://github.com/rolthchildpham-wq/eslint): static analysis and linting, using the existing targeted TOPKEY quality configuration.
- [RealWorld](https://github.com/rolthchildpham-wq/realworld_): API contract reference only if a real backend/API boundary is introduced.

Do not bulk-copy unrelated repositories or install their frameworks as dependencies. Do not replace TOPKEY's framework, routing, state model, Firebase topology, data schema, domain model or deployment platform merely to match a reference. Adapt useful patterns to the existing static EdgeOne + Firebase runtime and SvelteKit migration app. Architecture changes require evidence, alternatives, migration/rollback design and explicit approval. See topkey/ENGINEERING-REFERENCE-ADOPTION.md for the full adoption matrix and safety boundaries.

## TOPKEY invariants
Preserve Firebase Auth/session, roles and fine-grained permissions, each sport's Firebase root/schema/records, teams, schedules, scheduler constraints, scores, standings, referee/live workflows, finance/audit, offline persistence, public spectator/registration/judge routes, service-worker and EdgeOne behavior.

Unify the Sports Hub catalog and visual system. Badminton is a peer sport alongside football, volleyball, running, handmade, shuttle and cooking. Keep sport-specific engines behind adapters when schemas differ. Never merge Firebase roots or downgrade schemas merely to unify navigation.

## Visual system
Use warm ivory canvas, white cards, deep navy navigation/primary actions, terracotta accents, high-contrast readable typography, compact utility bar, clear KPI/calendar/chart hierarchy, independently collapsible feature groups, and responsive layouts without horizontal overflow.

## Browser acceptance
Use Chrome DevTools MCP for actual route and interaction checks at desktop/mobile sizes: all tabs, controls, forms, accordions, keyboard focus, empty/loading/error states, console/network, and screenshots. Do not bypass production authentication or write real business data during tests.

## Completion reporting
Report code commit, static/regression tests, backend tests, Chrome runtime tests, and production deployment/build verification as separate gates. State exact evidence and any untested scope.
