# TOPKEY Badminton + VNext regression triage — 17/11/2026

## Baseline
- PR #59: merged; baseline `main` = `46abe4c4779964b8d7379e6afd9122768d3e5fb3` at audit start.
- Previous audit on before-merge snapshot: badminton **31 PASS / 50 FAIL**; VNext **1 PASS / 2 FAIL**.
- The 50/2 are **old baseline counts**, not rerun counts after PR #59.
- Work isolated in `fix/badminton-vnext-regression-gate-20261117`; no GitHub Actions, no Firebase write or production deploy.

## Root causes identified and changes

### VNext test 1: H95 10k rows
File `topkey/sports/vnext/tests/h95_large_data_render_vm.js`
- Previous VM failure: `document.createDocumentFragment is not a function`.
- Runtime `renderTeams`/`renderMatches` legitimately use a native `DocumentFragment`.
- Fix test DOM mock: add `createDocumentFragment` and flatten fragment children on `appendChild`; keep 10k dataset and 300-row assertions.
- **Focused Node reproduction PASS** with extracted render methods and 10k rows; full repo test still **NOT TESTED**.

### VNext test 2: H95 subscription/render
File `topkey/sports/vnext/tests/h95_subscription_render_vm.js`
- Old assertion required full-tree `audit` subscription. Current runtime uses `Data.readPage('audit', {size:100,...})`, intentionally no live audit tree listener.
- Fix mock to implement `readPage` and `renderAudit`, and assertions for one bounded audit-page read without duplicate listeners.
- **Focused Node reproduction PASS** using a local copy of the current performance runtime and updated mocks; full repo test still **NOT TESTED**.

### Badminton H38 withdrawn team contract
File `topkey/sports/badminton/tests/h38_withdrawal_standings_test.js`
- Historical results intentionally retain withdrawn teams; `App.rankingEligible` filters them from qualification.
- Previous test assumed withdrawn teams are excluded from the historical standings.
- Correct assertions for distinct display vs qualification contracts; **full source regression rerun NOT TESTED**.

### Re-measure old 50 badminton failures
File `scripts/triage_badminton_regressions.cjs`
- Execute all 81 files from `topkey/sports/badminton/tests/`, with `cwd` set to `topkey/sports/badminton/` so tests using relative asset paths are valid.
- Per-test output: PASS/FAIL, timeout, legacy-version-pinned candidate, unclassified failure.
- Older tests hardcode build tags H31/H33/U118 while current `build.json` uses `u122h123-20261111`; failures from those old expectations are not automatically live runtime bugs.
- **NOT TESTED on full repository** in this session: private archive could be fetched through connector, but no complete repository mount could be obtained in code-execution container. Do not fabricate a new 81-test count.

## Test matrix
| Gate | Result |
|---|---|
| PR #59 merge confirmation | PASS |
| VNext subscription mock (isolated Node, current runtime copied) | PASS |
| VNext large-data mock (isolated Node, extracted render methods) | PASS |
| H38 historical vs eligibility source contract review | PASS (static review only) |
| Full 81 badminton tests after correct cwd | NOT TESTED |
| Full VNext tests from checkout | NOT TESTED |
| Firebase Emulator/role matrix | NOT TESTED |
| Real EdgeOne desktop/mobile performance | NOT TESTED |
| EdgeOne preview SHA/deployment | NOT TESTED |

## Next iteration and release decision
1. Run `node scripts/triage_badminton_regressions.cjs badminton-triage.json` from repository root and inspect every remaining failure; do not blanket-rewrite old tests to pass.
2. On a full repo checkout, run both `node topkey/sports/vnext/tests/h95_large_data_render_vm.js` and `node topkey/sports/vnext/tests/h95_subscription_render_vm.js`.
3. For surviving current-contract failures, reproduce, apply minimal source fix, add regression and rerun.
4. Gate production on real authenticated desktop/mobile, Firebase Emulator, EdgeOne preview SHA and performance checks.

**RELEASE BLOCKED — NOT VERIFIED.** No production edits or deploy. Revert fix-branch changes / close PR to roll back this isolated test-only patch.
