# H119 Unified Platform Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one stable Firebase/Auth/policy bootstrap for Badminton and all VNext sports, with no transient return to login and no sequential 30-second SDK path.

**Architecture:** `topkey-platform-core.js` owns SDK loading, role/sport policy, login submission and UI boot state. `topkey-shared-auth.js` remains the server-profile verifier but delegates state transitions and policy to the platform core; both sport entrypoints call the same platform boot contract.

**Tech Stack:** Static HTML/CSS/JavaScript, Firebase compat 9.23, Node VM tests, JSON Firebase Rules, EdgeOne static deployment.

**Spec:** `docs/superpowers/specs/2026-11-09-h119-unified-platform-auth-design.md`

## Global Constraints

- Do not weaken Firebase Authentication, live profile verification, role checks, sport-scope checks or canonical Firebase Rules.
- Do not change Firebase paths, tournament schemas, scoring, standings, finance, reporting or Test Lab behavior.
- Do not display login while session restoration or revalidation is in progress.
- Do not load optional media/report/export dependencies on the authentication critical path.
- Stamp Hub, Badminton, VNext, build manifests and Service Workers atomically with one new release tag.

## Review Focus

- A verified app receives a transient Auth `null`: keep protected UI locked/revalidating and recover without showing login.
- A verified profile listener receives a transient `null`: confirm with a server read before revoking access.
- Multiple rapid submits and simultaneous restore callback: exactly one sign-in/profile verification opens the app once.
- CDN primary timeout/error: fallback completes without duplicate Firebase initialization or duplicate observer.
- BTC scope aliases, disabled accounts and wrong-sport access produce identical outcomes for all seven sports.

---

### Task 1: Stable shared Auth state machine

**Files:**
- Modify: `topkey-shared-auth.js`
- Test: `tests/h119/auth_state_machine.cjs`

**Interfaces:**
- Consumes: existing `TopkeySharedAuth.create(T)` and Firebase Auth/RTDB contracts.
- Produces: `AuthService.state`, `transition(state, detail)`, confirmed Auth/profile revalidation and one ready event per UID.

- [ ] Write failing VM cases for transient Auth null, transient profile null, confirmed logout, confirmed profile removal and concurrent verification.
- [ ] Run `node tests/h119/auth_state_machine.cjs` and confirm transient cases reopen login on H118.
- [ ] Add explicit state transitions and coalesced revalidation without weakening confirmed revocation.
- [ ] Run new and H118 shared-auth tests until green.
- [ ] Commit the state-machine change.

### Task 2: One Firebase/bootstrap/login controller

**Files:**
- Create: `topkey-platform-core.js`
- Modify: `h108-auth-guard.js`
- Modify: `sports/badminton/index.html`
- Modify: `sports/vnext/index.html`
- Modify: `sports/badminton/assets/u122/admin-core.h85full.js`
- Modify: `sports/vnext/h97-vnext.bundle.js`
- Test: `tests/h119/platform_bootstrap.cjs`

**Interfaces:**
- Consumes: Task 1 `TopkeySharedAuth` state contract and entrypoint-specific `ensureCore()` callbacks.
- Produces: `TopkeyPlatform.loadFirebase(config)`, `bootSport(options)`, `bindLogin(options)` and `policy`.

- [ ] Write failing tests proving App/Auth+Database load order, parallel Auth/Database loading, single-flight rapid calls and one submit handler.
- [ ] Run the test and confirm H118 has no platform core and retains separate startup paths.
- [ ] Implement platform core and adapters; remove eager VNext Firebase tags and competing inline login paths.
- [ ] Synchronize active bundles from source without changing sport business logic.
- [ ] Run bootstrap, inline syntax, loader and Auth regressions.
- [ ] Commit the unified bootstrap.

### Task 3: Unified policy and rules contract

**Files:**
- Modify: `topkey-platform-core.js`
- Modify: `topkey-hub-guard-core.js`
- Modify: `sports/badminton/src/config.js`
- Modify: `sports/vnext/src/config.js`
- Modify: active Badminton/VNext bundles
- Modify: `tools/build_release.py`
- Test: `tests/h119/policy_rules_parity.cjs`

**Interfaces:**
- Consumes: Task 2 `TopkeyPlatform.policy`.
- Produces: one client role/sport decision table and a build-time parity gate for seven Firebase namespaces.

- [ ] Write failing table tests across seven sports and rules parity checks.
- [ ] Run tests and confirm duplicated role/sport policy is detected.
- [ ] Delegate Hub guard, Auth and configs to the platform policy; keep sport-specific rule values in sport config.
- [ ] Extend release build validation for canonical/mirrored rules and all seven namespaces.
- [ ] Run policy, rules, business and security regressions.
- [ ] Commit unified policy/rules gates.

### Task 4: Atomic release, verification and package

**Files:**
- Modify: `release.json`
- Modify: generated release/build/SW/HTML artifacts through `tools/build_release.py`
- Create: `H119_READ_ME_FIRST.md`
- Create: `H119_VERIFICATION.json`
- Create: deployable ZIP under `/workspace/output/`

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: one deployable H119 atomic package and verification evidence.

- [ ] Stamp one new H119 cache tag and rebuild generated release surfaces.
- [ ] Run all JavaScript/JSON syntax checks and selected H119/H118/H117/business regressions.
- [ ] Record live-only EdgeOne/Firebase/browser gates without claiming them passed.
- [ ] Archive committed release files, verify ZIP contents and SHA-256.
- [ ] Commit release documentation and metadata.

