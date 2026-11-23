# TOPKEY Next source audit — 23 November 2026

Evidence level: inspected GitHub main source and the PR branch. CI runs local SvelteKit preview, not authenticated EdgeOne production.

## Four requested requirements

| Area | Verified existing behavior | Implemented on audit branch | Not yet verified |
| --- | --- | --- | --- |
| Firebase Rules | Root .read/.write=false; per-sport module permissions; some .validate and separate finance .read/.write. Uses user role/permissions; not a full custom-claims model. | Read-only regression audit; no changes to production Rules | Role matrix, detailed field validations, actual deployed Rules and custom claims migration |
| GitHub Actions | One job; typecheck/build/browser; missing role-secret setup | Separate validate/e2e jobs, explicit sync, npm/Playwright caches, optional TEST LAB storage-state secrets | Authenticated CI run |
| Playwright E2E | Two files with unauthenticated and optional auth checks | Nine named spec files, asAdmin/asReferee fixtures, 360/390/768/1280 public overflow checks | Real Admin/Referee sessions and scored-match operations |
| Layout/CSS | Single workspace sidebar; fixed 5 mobile actions; partial breadcrumb; overlapping CSS | Two-layer navigation, 3-step breadcrumbs, correct aria-current and responsive More sheet; scoped audit CSS | EdgeOne screenshots, computed contrast ratios, on-device scroll and role workflows |

## Release constraints

Do not overwrite Firebase Rules with a simplified custom-claim example. Existing fine-grained BTC scope, admin role and public viewer behavior must be preserved.
Visual fixes are scoped to next-ui. Legacy topkey/ CSS and live production data are unchanged.
CI PASS with skipped authenticated tests is NOT proof of authorization correctness.
Before merge/production: test real EdgeOne Preview SHA and desktop/mobile screenshots; Firebase emulator ADMIN/BTC/umpire/viewer/disabled/anonymous read-write matrix; performance cold/warm, all sports and rollback.
Rollback of this change is a Git revert on the audit PR; no Rules/data rollback needed because none are changed.
