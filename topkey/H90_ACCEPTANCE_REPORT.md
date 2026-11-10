# H90 Acceptance Report

Release: `u122h91-20261107`
Version: `2026.11.07-vnext-upgrade122-hotfix91-auth-i18n-parity`

## Result

`FULL_WEB_ACCEPTANCE_OK 466`

## New H90 acceptance coverage

- Badminton Firebase DEFAULT app is initialized before any call to Auth.
- Firebase initialization is idempotent when an app already exists.
- Football referee console browser regression:
  - goal scoring;
  - yellow card;
  - red card;
  - substitution;
  - period advance.
- Volleyball referee console browser regression:
  - set scoring;
  - timeout;
  - substitution;
  - serving-team event;
  - sanction.
- Hub / Badminton / VNext Service Worker cache names are H90.

## Preserved full-web regression

The H90 suite also reruns the consolidated regression inherited from H89/H88/H87, including:
- ADMIN + BTC Badminton + BTC Volleyball auth matrix;
- Firebase auth integration + reload;
- Hub session / atomic deploy guard;
- System Admin and delegated permission contracts;
- Badminton/VNext shared hotfix parity;
- ranking/withdrawal integrity;
- date-grouped schedules;
- final report PDF/PPT + finance + images + 3 report-language modes;
- judging QR/device/judge-code contracts;
- public no-login routes;
- full-interface i18n residual-language audit.

Source tree acceptance was executed before packaging. The final deployment ZIP is separately unpacked and rerun before delivery.
