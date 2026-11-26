# Web engineering instructions — ECC + Frontend System Design

For every web development, UI, bug-fix, refactor, or deployment task in this repository:

1. Use two complementary references as the method baseline, not as permission to replace project architecture:
   - ECC (https://github.com/rolthchildpham-wq/ECC) is the engineering discipline baseline: research-first, impact analysis, TDD, security, review and evidence.
   - Frontend System Design (https://github.com/rolthchildpham-wq/frontend-system-design) is the design checklist: requirements, platform, user flows, state, APIs, roles, component boundaries, responsive UX, accessibility, performance, versioning and testing.
   - Read the TOPKEY web skill first, then the relevant ECC skills and project QA standard.
2. Inspect the existing code and runtime before editing. This is a brownfield application; do not rebuild or replace working modules just to change presentation. FSD is a checklist for evaluating trade-offs, not a mandate to adopt React, Redux, micro-frontends, a new router, or a new backend.
3. Preserve auth, Firebase roots/schema/data, roles, permissions, schedules, scores, referee/live workflows, offline persistence, and public routes unless explicitly requested.
4. Make a coherent plan and one integrated patch. Add regression coverage and review the full diff.
5. Use Chrome DevTools MCP for actual browser verification of routes, tabs, buttons, forms, accordions, responsive behavior, console/network, and screenshots.
6. Keep production deployment and active-version verification separate from code/CI success. Never claim a test or deployment that has no evidence.
7. For the TOPKEY Sports Hub, keep all sports—including badminton—in one unified sports catalog and shared visual system. Preserve sport-specific data engines where needed for compatibility.
8. Follow the user-provided dashboard design reference: warm ivory background, white rounded cards, deep navy navigation and primary buttons, terracotta action accents, strong readable contrast, and clear calendar/chart/KPI layouts.

ECC baseline: https://github.com/rolthchildpham-wq/ECC
Frontend System Design checklist: https://github.com/rolthchildpham-wq/frontend-system-design
Project execution/QA standard: docs/quality/TOPKEY-WEB-ENGINEERING-AND-FULL-UI-QA.md
TOPKEY web skill: https://github.com/rolthchildpham-wq/ECC/blob/main/.agents/skills/topkey-web-engineering/SKILL.md
