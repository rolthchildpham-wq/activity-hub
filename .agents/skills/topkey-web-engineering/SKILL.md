---
name: topkey-web-engineering
description: ECC-first brownfield-safe workflow for all TOPKEY web development.
license: MIT
---

# TOPKEY Web Engineering Standard

Use the user's canonical ECC fork: https://github.com/rolthchildpham-wq/ECC

## Required sequence
1. Research actual runtime ownership, routes, callers, data contracts, styles, tests, and deployment.
2. Plan a coherent patch with acceptance criteria and rollback.
3. Write regression tests before implementation (RED), implement (GREEN), then refactor.
4. Review the full diff for auth, data, permissions, accessibility, responsive behavior, cache and deployment effects.
5. Verify static tests, repository regression, backend/emulator where relevant, then real browser behavior with the user's Chrome DevTools MCP repository.
6. Verify deployed URL and active build separately; never equate commit, CI, HTTP 200, or screenshot with successful deployment.

## TOPKEY invariants
Preserve Firebase Auth/session, roles and fine-grained permissions, each sport's Firebase root/schema/records, teams, schedules, scheduler constraints, scores, standings, referee/live workflows, finance/audit, offline persistence, public spectator/registration/judge routes, service-worker and EdgeOne behavior.

Unify the Sports Hub catalog and visual system. Badminton is a peer sport alongside football, volleyball, running, handmade, shuttle and cooking. Keep sport-specific engines behind adapters when schemas differ. Never merge Firebase roots or downgrade schemas merely to unify navigation.

## Visual system
Use warm ivory canvas, white cards, deep navy navigation/primary actions, terracotta accents, high-contrast readable typography, compact utility bar, clear KPI/calendar/chart hierarchy, independently collapsible feature groups, and responsive layouts without horizontal overflow.

## Browser acceptance
Use Chrome DevTools MCP for actual route and interaction checks at desktop/mobile sizes: all tabs, controls, forms, accordions, keyboard focus, empty/loading/error states, console/network, and screenshots. Do not bypass production authentication or write real business data during tests.

## Completion reporting
Report code commit, static/regression tests, backend tests, Chrome runtime tests, and production deployment/build verification as separate gates. State exact evidence and any untested scope.
