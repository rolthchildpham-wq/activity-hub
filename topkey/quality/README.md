# TOPKEY source and visual audit

Source repositories provided by the owner:
- ProjectVisBug: https://github.com/rolthchildpham-wq/ProjectVisBug — **visual/manual** browser inspection; not a CLI source-code linter.
- ESLint: https://github.com/rolthchildpham-wq/eslint — JavaScript static analysis.
- Biome: https://github.com/rolthchildpham-wq/biome — JS/TS formatting and linting.
- Semgrep: https://github.com/rolthchildpham-wq/semgrep — source pattern/security scanning.

These are upstream source repositories. They do not become installed executables just because they are accessible via GitHub.

## Audit commands (on a checked-out repo with dependencies installed)

```sh
cd topkey
node --check sport-dashboard-h201.js
node --check sports/vnext/src/dashboard-truth-h202.js
npx --no-install @biomejs/biome check --config-path=quality/biome.json sport-dashboard-h201.js sports/vnext/src/dashboard-truth-h202.js
semgrep scan --config quality/semgrep.yml sport-dashboard-h201.js sports/vnext/src/dashboard-truth-h202.js
```

Run the root project's JavaScript static checks and all existing regression tests before considering release. A warning or tool not installed is **NOT TESTED**, not PASS.

## Visual QA

Use the user's VisBug browser extension on a **real authenticated EdgeOne Preview** to inspect typography, low contrast, table overflow, and responsive layout at 360px, 768px and 1280px. The existing read-only screenshot/contrast helper is `topkey/scripts/visual-audit-h203.mjs`. Store actual screenshots and tested URL/commit metadata. Do not confuse mock images with website evidence.

## Known reproduction (2026-11-23)

Volleyball production displayed 4 recorded matches, 1 completed, and a standings table, but left KPI placeholders loading while H201 displayed zeros. H204 repairs the **false zeros** and **late enhancement attachment** defects; it does **not** certify the underlying data-loading pipeline or production deployment.
