# H103 - H102 runtime and update conflict repair

This is a **staging** package based on H102, not an H96R3 rollback. H96R3 was used only as a reference for script-count comparisons.

## Confirmed root-cause trace
- H102 manifests: u122h98-20261108, but Badminton/VNext guards, Hub launcher and Hotfix85 updater were pinned to H96.
- Manual check called `controlledReload`, inserted `v=H98`, then H96 route guards redirected to the Hub.
- Badminton installed its Hotfix85 version authority last among 31 sequential runtime scripts, leaving older update handlers active during loading.
- H102 service workers used network-first/no-store for regular static JS/CSS; the VNext worker also intercepted third-party scripts.
- H102 VNext loads 11 external script tags vs H96R3 47, but a single 736KB rebundled script can still block startup while the browser parses it.
- H95 VNext core still subscribes to full Firebase `teams`, `matches` and `finance` branches. This cannot be fixed without changing the data layer and aggregate calculations.

## Changes in H103
1. All three release/build manifests, launch tickets, route guards and update authorities aligned under u122h103-20261108.
2. Manual Check is read-only; a separate update action verifies manifests first and then requests explicit confirmation.
3. Controlled page refresh preserves existing tournament and entry parameters while dropping stale `v`/`__topkey_build` tokens.
4. Hotfix85 loads first after Badminton admin core, instead of after the 30 other runtime scripts.
5. New scoped service workers cache static assets, use network-first only for navigation and build/release manifests, and leave third-party URLs to the browser.
6. Coalesced an expensive VNext whole-document DOM observer to one pass every 200ms.
7. No Firebase rules, user data, match result, permissions or schema migrations were changed.

## Static/isolated test status
- Release manifest and route checks: 52 PASS, 0 FAIL (includes adapted historical expectations, not live behavior).
- Chromium DOM updater interaction tests: 5 PASS, 0 FAIL (page.set_content only).
- Simulated SW cache test: 3 worker types PASS; repeat static asset requested once instead of twice. Synthetic network only.
- JavaScript syntax: 394 checked. JSON: 22 checked.
- The complete Chrome navigation smoke test was attempted but blocked by environment policy (`ERR_BLOCKED_BY_ADMINISTRATOR`).

## Deployment status
**STAGING ONLY; NOT PRODUCTION PASS.** Live EdgeOne timing, real Firebase Authentication, permissions, Live updates, all seven sports, financial totals and migration v2 remain unverified. Do not interpret simulated SW tests as measured internet performance.

## Risk and rollback
Deploy the full ZIP atomically to staging, not individual subfolders. Keep your previous working release and exported Firebase JSON backups intact. Production rollout must be gated on login, access roles, scoring, leaderboard, finance totals, camera/Live, offline recovery, cache activation and regression checks.
