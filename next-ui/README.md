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
