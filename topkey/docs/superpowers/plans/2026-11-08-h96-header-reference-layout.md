# H96 Header Reference Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match the Hub title layout to the supplied reference image and publish it as atomic H96.

**Architecture:** Use semantic block spans for the two default title lines and CSS for responsive layout. Preserve Hub Appearance custom text and leave all H95 runtime/data behavior unchanged.

**Tech Stack:** Static HTML, CSS, JavaScript, Node assertion tests

**Spec:** `docs/superpowers/specs/2026-11-08-h96-header-reference-layout-design.md`

## Global Constraints
- Default title breaks exactly after `&` on desktop.
- Custom Hub Appearance titles remain plain text and wrap safely.
- No Firebase schema or runtime changes.
- Atomic H96 metadata/cache across all three applications.

## Review Focus
- Long custom title must not overlap status badges.
- Tablet and mobile header must stack without horizontal overflow.
- Vietnamese, English, and Chinese title translations remain usable.
- Service workers must use the same H96 cache tag.
- H95 performance tests must remain green.

---

### Task 1: Header contract

**Files:**
- Create: `tests/header_layout_h96.js`
- Modify: `index.html`
- Modify: `hub-layout94.css`

**Interfaces:**
- Consumes: existing `.brand-title`, `.status`, and Hub Appearance behavior.
- Produces: `.hub-title-line` block lines in the default `h1`.

- [ ] Write assertions for two semantic title lines, correct text order, subtitle placement, responsive rules, and plain-text custom title behavior.
- [ ] Run the test and verify it fails against H95.
- [ ] Implement the minimal HTML/CSS layout.
- [ ] Run the test and verify it passes.

### Task 2: Atomic H96 release

**Files:**
- Modify: release/build JSON, HTML/JS cache references, service workers, manifest, translations, and current-release tests.
- Create: `UPGRADE122_HOTFIX96_HEADER_REFERENCE_LAYOUT.md`
- Create: `H96_ACCEPTANCE_REPORT.md`

**Interfaces:**
- Consumes: H95 atomic release pattern.
- Produces: H96 build/cache/version authority across Hub, Badminton, and VNext.

- [ ] Update current-release tests to require H96 and verify they fail first.
- [ ] Apply H96 metadata/cache and release badge changes.
- [ ] Run header, atomic release, H95 performance, syntax, and JSON checks.
- [ ] Package and integrity-check the H96 deployment ZIP.
