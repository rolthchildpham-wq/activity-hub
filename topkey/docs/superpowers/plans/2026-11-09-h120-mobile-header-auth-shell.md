# H120 Mobile Header and Unified Auth Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one lightweight protected Auth shell for Badminton and VNext and add a persistent mobile Hub header toggle.

**Architecture:** `topkey-platform-core.js` owns the shared Auth shell and deferred core hydration. Sport bundles preserve shell Firebase/Auth instances, while entrypoint HTML only supplies config and core URLs. `hub-layout94.js` owns the responsive header toggle.

**Tech Stack:** Static HTML/CSS/JavaScript, Firebase compat 9.23, Node VM tests.

**Spec:** `docs/superpowers/specs/2026-11-09-h120-mobile-header-auth-shell-design.md`

## Global Constraints

- Preserve all Badminton-specific features and all Firebase paths/rules.
- One Auth service and observer must survive core hydration.
- The business bundle must not be required before the first profile verification.
- Desktop Hub header behavior remains expanded.
- Optional report/media modules remain outside the Auth critical path.

## Review Focus

- Restored Firebase user hydrates core once without flashing login.
- First manual login hydrates core once without a second sign-in.
- Core load failure keeps the verified Auth session retryable.
- Public routes do not start protected Auth shell work.
- Mobile toggle survives reload and desktop ignores a mobile-collapsed preference.

### Task 1: Shared Auth shell and deferred sport core

**Files:**
- Modify: `topkey-platform-core.js`
- Modify: `h108-auth-guard.js`
- Modify: `topkey-shared-auth.js`
- Modify: `sports/badminton/index.html`
- Modify: `sports/vnext/index.html`
- Modify: `sports/badminton/src/firebase.js`
- Modify: `sports/vnext/src/firebase.js`
- Modify: both active sport bundles and Auth adapters
- Test: `tests/h120/unified_auth_shell.cjs`

**Interfaces:**
- Produces: `TopkeyPlatform.startSport(options)`, `window.__TOPKEY_SPORT_BOOT`, `window.__TOPKEY_ENSURE_CORE`, `Auth.attachApp()`.

- [x] Write a failing VM test proving pre-auth core deferral, one Auth instance and one core hydration.
- [x] Run the test and confirm H119 lacks `startSport()` and still requires Badminton `ensureAdmin()`.
- [x] Implement the shared shell and preserve shell objects during bundle hydration.
- [x] Switch both protected entrypoints and the login adapter to the common contract.
- [x] Run H120, H119 and H118 Auth/public-route regressions.
- [x] Commit the Auth shell change (`f9ef6c6`).

### Task 2: Mobile collapsible Hub header

**Files:**
- Modify: `hub-layout94.js`
- Modify: `hub-layout94.css`
- Test: `tests/h120/mobile_header_toggle.cjs`

**Interfaces:**
- Produces: `TopkeyHubLayout94.setHeaderCollapsed(value)` and a mobile toggle button with `aria-expanded`.

- [x] Write a failing VM test for mobile default collapse, click expansion, persistence and desktop expansion.
- [x] Implement the accessible toggle and responsive styles.
- [x] Run the H120 test and current Hub syntax regressions. The historical H96 cache-name assertion is stale against H119+.
- [x] Commit the mobile header change (`f9ef6c6`).

### Task 3: H120 atomic release and deployment package

**Files:**
- Modify: `release.json` and generated release surfaces
- Create: `H120_READ_ME_FIRST.md`
- Create: `H120_VERIFICATION.json`
- Create: production ZIP under `/workspace/output/`

**Interfaces:**
- Consumes: Tasks 1-2.
- Produces: one H120 cache tag and verified deployment archive.

- [x] Stamp H120 through `tools/build_release.py` and update service-worker shells.
- [x] Run syntax, Auth, policy, release, public-route and Hub regression suites.
- [x] Record live/browser-only gates honestly.
- [x] Archive the verified commit and validate ZIP contents/checksum.

