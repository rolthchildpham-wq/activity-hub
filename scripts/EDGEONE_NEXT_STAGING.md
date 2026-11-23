# TOPKEY EdgeOne: legacy + SvelteKit deploy bundle

## Cause of the /next/ 404 (23 November 2026)

The live EdgeOne project currently serves the static `topkey/` directory, while SvelteKit source is in `next-ui/`. A successful `next-ui/npm run build` in GitHub Actions does **not** copy its `build/` output into the deployed static root. The paths `/next/` and `/next/sports` therefore do not exist in EdgeOne even after the code is merged into main.

## Reproducible staging

From the repository root with Node 22:

```sh
npm --prefix next-ui install --no-audit --no-fund
npm --prefix next-ui run build
node scripts/stage-edgeone-next.mjs
node --test scripts/tests/stage-edgeone-next.test.mjs
```

The script creates `dist-edgeone/` containing the original `topkey/` static files unchanged alongside compiled `next-ui/build` at `dist-edgeone/next/`. It includes scoped EdgeOne rewrites for `/next/sports` and `/next/sports/*` to the compiled SvelteKit `/next/index.html`, not a global SPA catch-all, so existing Hub, badminton and other sport links remain independent.

## EdgeOne Preview settings

For a preview project connected to the repository root (not a production switch):

- Project root: `./`
- Node version: 22
- Build command: `npm --prefix next-ui install --no-audit --no-fund && npm --prefix next-ui run build && node scripts/stage-edgeone-next.mjs`
- Build output directory: `dist-edgeone`

Check the actual Preview host returns HTML with real `/next/_app/` assets at `/next/`, and verify `/next/sports`, a deep route, /index.html and the badminton/volleyball apps. Verify served commit SHA, authenticated ADMIN/BTC/referee/read-only viewer cases and both mobile and desktop performance. Do not switch the production project to this bundle before the TOPKEY production gate passes.

## CI-only validation

PR job `next-ui-validation.yml` constructs this bundle in GitHub Actions and uploads a short-lived artifact `topkey-edgeone-composed-site` for inspection; it **does not trigger EdgeOne deployment**.

## Rollback and security

No RTDB/Storage Rules, credentials or production data are changed. Revert the staging script/configuration change or return EdgeOne output directory to the original `topkey/` when a preview test fails. Do not use the static artifact as proof that all migrated write workflows work.
