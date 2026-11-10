# H117 Production Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce an atomic H117 production-stability package that restores Firebase sessions once and defers nonessential work until after the protected UI is interactive.

**Architecture:** Keep Firebase Auth and RTDB profile checks as the security authorities. Split Badminton startup into auth-critical, staged compatibility runtime and intent-driven report/export phases, then stamp all release surfaces with a new cache tag.

**Tech Stack:** Static HTML/CSS/JavaScript, Firebase compat SDK 9.23, Node VM tests, Python/Playwright Chromium smoke tests, EdgeOne static deployment.

**Spec:** `docs/superpowers/specs/2026-11-09-h117-production-stability-design.md`

## Global Constraints

- Do not weaken Firebase Authentication, profile verification, role checks or sport-scope checks.
- Do not scan the full `/tournaments` branch.
- Do not change scoring, standings, finance schemas, Firebase paths or Security Rules.
- Do not load report/export modules before user intent.
- Stamp the release atomically with one new H117 production cache tag.

## Review Focus

- Persisted non-anonymous Firebase user with a newly created Hub ticket must open after profile verification without a sign-out.
- Anonymous viewer identity entering a protected route must still sign out and show protected login.
- Wrong-sport or inactive profiles must remain denied.
- A failed optional runtime file must not return an authenticated user to login or block the shell.
- Rapid repeated feature intent must not load a heavy dependency more than once.

---

### Task 1: Session restore contract

**Files:**
- Modify: `hub-auth-flow.js`
- Modify: `sports/badminton/hub-entry-guard.js`
- Modify: `sports/badminton/src/auth.js`
- Modify: `sports/badminton/assets/u122/admin-core.h85full.js`
- Test: `tests/h117/auth_session_restore.cjs`

**Interfaces:**
- Produces: Hub session state that may carry `authUid`; Auth observer always verifies RTDB profile before opening the shell.

- [x] Write a failing VM test for persisted Auth plus a fresh Hub ticket.
- [x] Run the test and confirm the existing implementation signs the user out.
- [x] Preserve the current Firebase UID in Hub navigation and remove ticket-driven sign-out from protected Auth restore.
- [x] Run new and existing Auth regressions.

### Task 2: Staged runtime and feature loading

**Files:**
- Create: `sports/badminton/production-loader.js`
- Modify: `sports/badminton/index.html`
- Test: `tests/h117/production_loader.cjs`

**Interfaces:**
- Produces: `window.TopkeyProductionLoader.loadRuntime()` and `loadFeature(name)` idempotent promises.

- [x] Write failing tests for deterministic staged runtime and intent-driven report loading.
- [x] Run tests and confirm the loader is absent.
- [x] Implement bounded preload, ordered execution, idle yielding and intent delegation.
- [x] Replace eager heavy scripts and immediate runtime boot with the loader.
- [x] Run loader and syntax tests; browser timing is recorded in Task 4.

### Task 3: Atomic release stamp

**Files:**
- Modify: `release.json`
- Modify: generated build manifests, HTML query tags and service workers through `tools/build_release.py`
- Modify: `H117_READ_ME_FIRST.md`
- Test: `tests/h117/release_integrity.cjs`

**Interfaces:**
- Produces: one cache tag and version across Hub, Badminton and VNext.

- [x] Update release metadata to H117 production stability.
- [x] Run the release builder.
- [x] Update integrity assertions for the production loader and new tag.
- [x] Run release integrity and cache tests.

### Task 4: Full verification and deliverable

**Files:**
- Create: `H117_PRODUCTION_STABILITY_REPORT.md`
- Create: final ZIP under `/workspace/output/`

**Interfaces:**
- Consumes: completed Tasks 1-3.
- Produces: deployable atomic package and evidence report.

- [x] Run JS and embedded-script syntax checks.
- [x] Run selected Auth, session, runtime, release and business regressions.
- [ ] Record cold/warm desktop/mobile request and timing evidence. BLOCKED: no Chromium binary and browser download/production endpoint are denied by the execution proxy with HTTP 403.
- [x] Record remaining live-only gates without claiming them passed.
- [ ] Package the full release and verify archive contents/checksum.
