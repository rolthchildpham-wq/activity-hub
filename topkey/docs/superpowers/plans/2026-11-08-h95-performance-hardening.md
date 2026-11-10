# H95 Performance Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make H94 responsive and memory-stable under large datasets without changing its Firebase schema or feature set.

**Architecture:** Harden the existing VNext data and render ownership boundaries, then retire perpetual maintenance polling. Preserve complete application state for business logic while bounding subscriptions and DOM work.

**Tech Stack:** Static HTML/JavaScript, Firebase Realtime Database compat SDK, IndexedDB, Node VM regression tests, Python acceptance tests.

**Spec:** `docs/superpowers/specs/2026-11-08-h95-performance-hardening-design.md`

## Global Constraints

- Preserve the H94 Firebase paths and Rules schema.
- Preserve public routes, authentication, roles, offline writes, reports, scheduling, and standings.
- Add no runtime dependency or framework.
- Every production behavior change requires a failing regression test first.

## Review Focus

- A queue item added during an active flush must be written by the coalesced rerun.
- Authentication restoration must not turn a protected queued write into a permanent error.
- Repeated tab switches must remove old heavy listeners before adding new ones.
- Public spectator listeners must remain independent from authenticated admin tab listeners.
- Large datasets must retain all export/computation records while bounding rendered DOM nodes.

---

### Task 1: Single-flight Firebase queue

**Files:**
- Modify: `sports/vnext/src/firebase.js`
- Create: `sports/vnext/tests/h95_queue_singleflight_vm.js`

**Interfaces:**
- Produces: `DataService.flushQueue()` sharing one active promise and coalescing one requested rerun.
- Produces: `DataService.refreshQueueStats()` for one consistent pending count refresh.

- [ ] Write a VM test that starts two flushes, inserts a second item during the first update, and asserts maximum concurrent Firebase updates is one and both items are deleted.
- [ ] Run the test and verify it fails because concurrent flushes overlap or the late item is stranded.
- [ ] Implement single-flight/coalesced flush ownership and one-time network listener binding.
- [ ] Run the focused test and existing queue/runtime regressions.

### Task 2: Tab-scoped subscriptions and render coalescing

**Files:**
- Modify: `sports/vnext/src/app.js`
- Create: `sports/vnext/tests/h95_subscription_render_vm.js`

**Interfaces:**
- Consumes: unchanged `T.Data.listen(path, callback)` unsubscribe contract.
- Produces: `App.syncTabSubscriptions()` and `App.scheduleBranchRender(branch)`.

- [ ] Write a VM test for stable listener counts across repeated tab switches and one render per dirty branch per frame.
- [ ] Run the test and verify the current all-branch subscription model fails it.
- [ ] Split core and tab subscriptions, attach them from `showTab`, and schedule branch rendering through one frame queue.
- [ ] Run focused and existing VNext interaction/auth tests.

### Task 3: Bounded large-list rendering

**Files:**
- Modify: `sports/vnext/src/app.js`
- Create: `sports/vnext/tests/h95_large_data_render_vm.js`

**Interfaces:**
- Produces: a shared `visibleRows(rows, viewKey)` bounded window used only by DOM renderers; full `App.state` remains authoritative.

- [ ] Write a 10,000-record VM fixture that asserts the teams and schedule DOM stay bounded while state remains complete.
- [ ] Run it and verify the current renderers create all nodes.
- [ ] Apply bounded windows and visible-count messaging to heavy table/list renderers without changing exports or calculations.
- [ ] Run focused tests and report/export regressions.

### Task 4: Lifecycle-driven maintenance

**Files:**
- Modify: shared active Hotfix58/60/64/65/66/79/80 modules under `sports/vnext/src/` and matching Badminton copies where byte parity is required.
- Create: `tests/h95_runtime_lifecycle.js`

**Interfaces:**
- Produces: bounded settle retries and lifecycle event refreshes; no perpetual sub-second maintenance intervals.

- [ ] Write a VM lifecycle test that counts scheduled intervals and verifies hidden pages do no maintenance work.
- [ ] Run it and verify the active modules fail the timer budget.
- [ ] Replace perpetual maintenance intervals with event hooks, debounced observers, or bounded settle timers, preserving shared-file byte parity.
- [ ] Run focused main-thread, parity, report, and full-web tests.

### Task 5: Release validation and package

**Files:**
- Update: release/build/cache metadata and service workers to H95.
- Create: `H95_ACCEPTANCE_REPORT.md`
- Create: final deployment ZIP outside the source tree.

**Interfaces:**
- Consumes: all prior task behavior.
- Produces: atomic H95 static deployment package.

- [ ] Update atomic version/cache references consistently.
- [ ] Run JS syntax, JSON parsing, focused H95 regressions, H94/H93 full acceptance, and synthetic large-data benchmark.
- [ ] Record exact results and residual limitations.
- [ ] Package the verified tree as the final ZIP.
