# TOPKEY Sports Hub — ECC Unified Rebuild

Status: implementation branch / not production-ready.

## Engineering baseline
- Canonical playbook: https://github.com/rolthchildpham-wq/ECC
- Required project skill: `.agents/skills/topkey-web-engineering/SKILL.md`
- Browser verification: https://github.com/rolthchildpham-wq/chrome-devtools-mcp
- Browser CI entry point: `.github/workflows/topkey-chrome-devtools-mcp.yml`

## Product outcome
One TOPKEY Sports Hub and one sports catalog. Badminton is a first-class sport beside football, volleyball, running, handmade, shuttle and cooking. A user enters one common workspace shell; sport-specific feature engines remain isolated behind adapters where their data contracts differ.

## Visual direction from the user's reference
- Warm ivory / light neutral application canvas.
- White content surfaces with restrained radius and subtle shadow.
- Deep navy navigation and primary actions.
- Terracotta / warm red for important actions and selected states.
- Readable dark text, muted secondary text with WCAG AA contrast target.
- Compact top utility bar, stable primary navigation, clear KPI / calendar / chart hierarchy.
- Feature groups are separate, independently collapsible sections; avoid a long single-page stack.

## Non-negotiable data and behavior invariants
Preserve Firebase Auth and sessions; role and fine-grained permissions; every sport's current Firebase root/schema and records; team/member data; schedules and scheduler constraints; scores, standings and match history; referee and live workflows; finance/audit; offline queue and persistence; public spectator/registration/judge routes; service-worker and cache behavior; EdgeOne static deployment paths.

Do not merge Firebase roots just to unify navigation. Do not run destructive migrations or delete old runtime assets until compatibility and rollback have been demonstrated.

## Current brownfield findings
- `topkey/index.html` is the Sports Hub entry point and currently loads multiple generations of CSS and JS overrides.
- The Hub catalog has seven sport entries, but badminton currently points to `sports/vnext/badminton.html`, which redirects to `sports/badminton/index.html`.
- `sports/vnext/index.html` loads the badminton production loader, but its prepaint allow-list currently contains only football, volleyball, running, handmade, shuttle and cooking.
- Badminton still owns a separate runtime and large feature asset tree. Integration must be through an explicit adapter/route contract, not by blindly merging source files.
- Existing `AGENTS.md` already mandates ECC and Chrome DevTools MCP; retain it as a repository guardrail.

## Planned implementation sequence
1. Inventory the actual Hub and all sport runtime entry points, route contracts, data roots, permissions, and deployment workflows.
2. Add failing regression tests for one-catalog routing, badminton first-class sport selection, shared shell, and preservation of public routes.
3. Build one shared Hub shell and design-token system based on the reference direction.
4. Integrate badminton into the common sports catalog and common shell while retaining its proven data engine through an adapter.
5. Migrate each Hub feature (dashboard, calendar, analytics, notifications, settings) to the shared shell; remove legacy Hub-only CSS/JS imports only after equivalent behavior and tests are in place.
6. Run repository regression and security checks.
7. Run Chrome DevTools MCP against Hub and all seven sport workspaces at desktop and mobile sizes; test all navigation tabs, accordions, keyboard access, console/network, and screenshots.
8. Verify EdgeOne deployment and active build separately. Only then remove superseded Hub assets.

## Acceptance gates
- One visible sports catalog and one consistent navigation/shell.
- Badminton appears and opens as a peer sport, not as a detached Hub.
- No changes to data roots, auth, permissions, scores, schedules or public link behavior.
- No dead links, uncaught exceptions, unexpected failed assets, horizontal overflow, or unreadable text.
- All critical interactions verified in Chrome DevTools MCP.
- Production is not marked complete until deployed build/version is confirmed.

## Rollback
Keep this work on `rebuild/sports-hub-ecc-unified`. Do not delete or overwrite production data. Keep the current `main` branch and EdgeOne deployment untouched until all gates pass.
