# H91 Acceptance Report

Release: `H91 · AUTH + I18N PARITY`
Build: `u122h91-20261107`
Version: `2026.11.07-vnext-upgrade122-hotfix91-auth-i18n-parity`

## Result

`FULL_WEB_ACCEPTANCE_OK 471`

## H91 regressions added

- Badminton and VNext Hub entry guards are byte-identical.
- Badminton declares the same central `AUTH_ROOT` and `T.SPORT` contract used by VNext.
- Badminton profile reads use the central auth root and keep the common Hub-session/sport-scope checks.
- Hotfix57 is deferred from protected login and retried in the background with cache-busting; optional runtime failure is no longer shown as a login failure.
- Executive Dashboard dynamic UI is covered by Vietnamese / English / Simplified Chinese translation, including dynamic alerts and default club names.
- Live language switching was tested across Hub, Badminton, VNext, System Admin and Change Password.

## Inherited regressions rerun

ADMIN + two BTC auth matrix, reload/session guard, atomic release, report fixture, PDF/PPT export, public links, judging QR, schedule grouping, standings, finance, password change, system-admin RBAC and football/volleyball referee consoles.
