# TOPKEY production release gate

**Status: BLOCKED until all required checks pass.** GitHub Actions green by itself is not approval to deploy.

## Pre-release sequence
1. Work on feature/fix branch. Create pull request against main. Do not edit live Firebase Rules or real tournament data.
2. GitHub source-regressions workflow **must pass**. A red job blocks release. The workflow covers QR, short links, public spectator, auth/cache, Firebase default-deny and common UI regressions.
3. Deploy the candidate to an isolated EdgeOne preview URL with a release SHA. Verify preview URL serves the exact commit's index, JS, CSS and SW.
4. Test on real Chrome desktop, Android Chrome/WebView, and iOS Safari (where available); collect console and network errors and screenshots of **actual** execution.
5. Run public spectator without login, registration using a test token, and authenticated login/logout (ADMIN, BTC, UMPIRE, VIEWER) in a **test tournament** for each sport. Validate actual Firebase read/write permissions using emulator and compare deployed rules, not merely UI menu hiding.
6. Measure cold and warm performance (three repetitions each) and record usable paint, errors, Firebase request counts, JS transfer and slow 4G/mobile long tasks.
7. Document evidence, reviewer, PASS/FAIL/NOT TESTED, rollback commit, deployment permissions and backup. Critical FAIL or NOT TESTED means **NO PRODUCTION RELEASE**.
8. Only after review, merge PR and explicitly deploy EdgeOne through approved provider workflow. Verify live SHA, link QR, mobile spectator and login again. Roll back on any failure.

## Mandatory evidence
- Screenshot/screen recording of every UI screen and critical path, with timestamps and URL/device in report.
- HTTP trace + console errors, including script failures and Firebase permission_denied.
- Firebase Database and Storage rules matrix for anonymous, ADMIN, BTC scoped/unscoped, UMPIRE, VIEWER, disabled account.
- Preview, production commit ID and SW cache version matched.
- Metrics for at least 3 cold/3 warm runs on mobile and desktop.
- A dedicated signoff from an authorized owner (not a bot or old test report).

## Known blockers on 2026-11-14
- H137 mobile viewer has source-mock PASS but not proved working live on an authenticated or public physical mobile browser.
- EdgeOne production deployment may not match main GitHub source; no deploy hook verification.
- The live Firebase Rules and real role matrix have not been authenticated/tested.
- No measured production navigation/first paint/network benchmark.

This checklist requires human/authorized browser access. Do not mislabel static tests as live tests.
