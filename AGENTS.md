# Web engineering instructions — use ECC as the default

For every web development, UI, bug-fix, refactor, or deployment task in this repository:

1. Use the user's ECC repository as the canonical engineering playbook:
   - https://github.com/rolthchildpham-wq/ECC
   - Read `.agents/skills/topkey-web-engineering/SKILL.md` first, then the relevant ECC skills for coding standards, research, E2E testing, and verification.
2. Inspect the existing code and runtime before editing. This is a brownfield application; do not rebuild or replace working modules just to change presentation.
3. Preserve auth, Firebase roots/schema/data, roles, permissions, schedules, scores, referee/live workflows, offline persistence, and public routes unless explicitly requested.
4. Make a coherent plan and one integrated patch. Add regression coverage and review the full diff.
5. Use Chrome DevTools MCP for actual browser verification of routes, tabs, buttons, forms, accordions, responsive behavior, console/network, and screenshots.
6. Keep production deployment and active-version verification separate from code/CI success. Never claim a test or deployment that has no evidence.
7. For the TOPKEY Sports Hub, keep all sports—including badminton—in one unified sports catalog and shared visual system. Preserve sport-specific data engines where needed for compatibility.
8. Follow the user-provided dashboard design reference: warm ivory background, white rounded cards, deep navy navigation and primary buttons, terracotta action accents, strong readable contrast, and clear calendar/chart/KPI layouts.

ECC baseline: https://github.com/rolthchildpham-wq/ECC
TOPKEY web skill: https://github.com/rolthchildpham-wq/ECC/blob/main/.agents/skills/topkey-web-engineering/SKILL.md
