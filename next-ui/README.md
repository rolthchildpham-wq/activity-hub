# TOPKEY VNext – frontend rewrite foundation

This is the **new** Svelte 5 / SvelteKit / TypeScript / Tailwind CSS 4 application. It intentionally coexists with the existing TOPKEY app. Production modules under `topkey/` are unchanged.

## Install & verify
```sh
cd next-ui
npm ci  # once a lockfile has been generated and committed; otherwise npm install
npm run check
npm test
npm run build
```

Build uses SvelteKit static adapter and base path `/next`. Published files must be served from the TOPKEY project's `/next` path on a test EdgeOne deployment. **Not production-ready until preview, Firebase roles, backend, all sports and performance tests pass.**

## Scope now
- Real responsive shell, consistent design tokens, light/dark contrast, compact navigation, mobile bottom bar.
- Existing Firebase Auth and read-only tournament snapshot subscription; tournament switcher accepts explicit TID. Visible loading/error/empty states.
- Dashboard from live teams, matches and activeMatches; phase groups shown only when in actual records.
- Every existing sport has a route back to its original operational module until migrated.

## Not migrated yet
Scoring, scheduling, admin permissions, full standings, public registration, Live WebRTC and BLV publishing, financial editing and audit writes. These **must not** be simulated or exposed as active operations. Preserve RTDB security rules unchanged. Existing legacy links remain the operational source of truth.

## Release gate
Real Android/iOS and desktop screenshots, role matrix ADMIN/BTC/umpire/viewer, Firebase emulator, live score, test lab, all sports, performance and rollback evidence required before a production swap.

## 2026-11-23 refactor (source documents 1 and 2)

The following work was implemented in the existing `next-ui`, preserving the legacy operational system:

- UI components: `src/lib/shared/ui/Button.svelte`, `Card.svelte`, `StateView.svelte`.
- Widgets: `src/lib/widgets/DashboardStats.svelte`, `ScheduleTable.svelte`.
- Stronger null-safe domain entities, reliable Firebase branch subscriptions and cleanup.
- Timeout/error state: **never treat missing/unreadable branches as real zero values**. Empty RTDB branches emit initial `null`; a missing initial callback times out with a visible error.
- Responsive dashboard and mobile navigation retained; no new dead /live or /sports routes.
- Existing production Firebase keys/project unchanged (client API keys are public identifiers, not credentials).

Do not merge or deploy to production without evidence from `npm run check`, `npm test`, `npm run build`, EdgeOne Preview, desktop/mobile screenshots and Firebase role-emulator testing. The new frontend still lacks parity for full scoring, bracket editing, live publisher, finance and permissions.

### Why we did not copy the sample snippets verbatim

The attached examples use `auth.onAuthStateChanged` and a simplified login form. This repo uses Firebase modular Auth and has a working login/logout form; replacing it with those sample snippets would regress functionality. Also, partial Firebase snapshots must not be represented as a complete tournament scorecard.

## 2026-11-23: expanded operational navigation

This branch extends the existing `next-ui` (SvelteKit 5, TypeScript, Tailwind 4) with:
- Dynamic routes for 8 sports (Vlog delegates to its live legacy module), tournament switcher, shared authenticated workspace, responsive desktop/tablet/mobile navigation.
- Read-only overview, schedule, group/pool breakdown, bracket, live score, team/check-in status, finance branch display, history and referee hand-off.
- Single shared tournament store with listener cleanup and stale-response protection; domain grouping/scheduling/finance unit tests.
- Playwright public/read-only authenticated test suite for preview; `.github/workflows/next-ui-validation.yml` validates pull requests **only**, with no deployment or Firebase writes.

### Important production exclusions

**Do not merge into main or deploy based on the existence of routes.** Write transactions, official standings, sport-specific scoring, account administration, QR, live streaming/video, complete finance, and app permissions still run through the existing `topkey/` application. New read-only screens may be partially populated because production RTDB uses legacy schemas/role scopes. We did not replace production Firebase Rules or change them to simplified `auth.token.role` claims: that would break existing ADMIN/BTC detailed permissions and public viewer routes.

The `next-ui` SvelteKit SPA is configured under `/next/` with a `200.html` fallback. The EdgeOne preview rewrite handling for deep links is unverified. EdgeOne preview URL and deployed SHA must be checked separately.

### Validation

```sh
cd next-ui
npm install
npm run check
npm test
npm run build
npm run test:e2e -- --project=desktop --project=mobile-chromium
```

Authenticated Test Lab screenshot runs require `TOPKEY_STORAGE_STATE`, `TOPKEY_TEST_TID`, and optionally `TOPKEY_TEST_SPORT`; no credentials belong in Git. Run the real browser, Firebase Rules emulator role matrix and performance checks before any production release.
