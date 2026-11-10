# TOPKEY H111 – Multilingual UI parity (VI / 中文 / EN)

**Base:** H110 Public Spectator Bootstrap Repair. This is a **STAGING** build, not certified for production Firebase.

## Changes made

1. Fixed the real cause of the mixed Chinese/Vietnamese spectator interface: the public Badminton viewer is rendered by `sports/badminton/assets/u122/viewer.56627d273293.js`, a separate runtime not fully covered by the existing DOM translator. Its static and dynamically generated UI strings now follow the selected language.
2. Localized the spectator schedule, score/status, group categories, standings summaries, match counts, search and filters, live controls, announcement labels, and error states. Language changes trigger a UI refresh **without resubscribing Firebase**. The public viewer is still read-only.
3. Added a standard-tournament-title display adapter for the known TOPKEY tournament naming pattern (`GIẢI … CÔNG TY TOPKEY – LẦN N`). Custom titles, athlete names, team names, announcements and other user-entered content remain unchanged.
4. Added 118 shared UI translation keys/variants to Hub and the VNext translation runtime (including the shipping `h97-vnext.bundle.js`), and its source copies. This covers all seven sports' common navigation components and the public viewer. Dynamic Chinese/English messages are generated with the correct language, not replaced by brittle DOM text matching.
5. Fixed long Chinese/English title wrapping and the Hub return link on mobile widths.
6. Stamped H111 from the shared `release.json`, updated all three build manifests, Service Worker caches, and cache-busted HTML/JS references.

## Automated tests performed

- **407** JavaScript files: parser PASS.
- **43** executable inline HTML scripts: parser PASS.
- Release manifests and H111 cache consistency: PASS.
- Local JS/CSS/manifest references from the three entry pages: PASS.
- **21/21** Chromium spectator tests at 1440px; **21/21** at 390px: PASS.
- **26/26** tests of shared i18n runtime, 118 keys, seven sport labels, dynamic DOM and language switching: PASS.
- Static HTML residual scan for the three entry pages: zero detected Vietnamese-accent residuals in the scope tested (not a guarantee for the entire authenticated app).
- Six existing regression suites (Auth security, permissions, awards, PDF/HTML report translations, club planning and Firebase v2): PASS.
- Firebase Database Rules and Firebase V2 engine source files: SHA-256 identical to H110.

`H111_RELEASE_TEST_MATRIX.json` contains the exact test details.

## Important caveats

- A **live Firebase Auth login** and authenticated CRUD across seven sports **were not executed** against the actual EdgeOne production site. This package must not be described as globally bug-free or production certified.
- User-authored team names, athlete names, organization names, descriptions, notifications and archived text are deliberately preserved, even when written in Vietnamese; these are not UI defects.
- Some legacy H93/H109 test files assert older startup mechanics or old hard-coded Service Worker cache keys and are not compatible with H110/H111; the release check instead tests the actual H111 build and records the incompatibilities.
- Translation quality for infrequently used administrative modal dialogs still requires in-app user review with Firebase staging data. This is a localization update, not a data migration or Rules change.

## Deployment

1. Retain a complete backup of the currently working production ZIP. Deploy **the whole H111 archive**, never single JS directories, into a **separate staging site**.
2. Verify Hub → Badminton → each VNext sport with `?v=u122h111-20261109` and inspect `/release.json` and both `/sports/*/build.json` to confirm they agree.
3. Open the public Badminton URL `sports/badminton/index.html?tid=main_2026#spectator` without login. Switch **VI → 中文 → EN → VI** and check schedule, standings, prize button and Live controls. Ensure team/athlete names are not translated.
4. Repeat language switching after Firebase updates a match, with an admin session and in a separate viewer session; inspect browser Console for errors.
5. Verify Auth, roles, scheduling, scores, finance, PDF/PPT, and full-screen on staging. Only deploy to production after these gates pass; keep H110 for rollback.
6. If an old cache survives staging deploy, close all PWA tabs and reload the new build. Do not manually delete match data or Firebase Records.
