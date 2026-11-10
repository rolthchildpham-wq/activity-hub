# Upgrade122 Hotfix6 — Referee Fun Commentary Resilient Mount

- Fixes fun commentary disappearing when the Hotfix3 script executed before `Topkey.App` was ready.
- Mounts/re-mounts the commentary controls on admin-ready, umpire render, fullscreen changes, resize and referee DOM changes.
- Player selector is limited to the four active court slots A1/A2/B1/B2 currently rendered on court, not the full team roster.
- Keeps the compact bar visible in referee score-focus/fullscreen on laptop and mobile.
- Hides the older U121/U122H3 duplicate controls so only one commentary control is shown.
- Updates the effective runtime/cache tag to `u122h6-20261031` and keeps Hotfix5 self-heal aligned with the new build.
