# H85 Full Acceptance Report

Build: `u122h85-20261107`

Version: `2026.11.07-vnext-upgrade122-hotfix85-production-atomic-release`

## Result

`FULL_WEB_ACCEPTANCE_OK 389`

The automated suite passes 389 checks on the final H85 source tree. It includes:

- ADMIN + BTC Badminton + BTC Volleyball role and sport-scope matrix;
- Firebase-auth integration mocks for login, wrong sport, disabled account and reload;
- H85 Hub session migration from H84/H83;
- atomic root/Badminton/VNext build mismatch detection;
- secure-auth contract (no client-side admin role guessing, no mock/offline auth fallback);
- duplicate-login submit protection in Badminton and VNext;
- report fixture parity in Badminton and VNext;
- Việt-Anh, Việt-Trung and Anh-Việt-Trung report modes;
- prize structure, image report pipeline and PDF binary smoke;
- venue rename/delete parity and Cooking/Handmade `Khu vực (Sảnh)` labels;
- active source syntax and referenced local asset existence;
- current standings / withdrawal regression tests H44-H48.

## Public production observation before deployment

The public production deployment was not atomic: Hub and Badminton reported H83 while the shared VNext route reported H84. H85 is designed to fail closed on this mixed-build state.

## Browser limitation

A real Chromium UI navigation test could not be run in this execution environment because Chromium navigation is blocked by an administrator policy, including localhost/file navigation. Therefore this report does not claim that the supplied live credential was submitted to Firebase. Public production pages were audited via web retrieval and auth behavior was exercised through the source/integration harness.

## Supplied patch decision

See `PATCH_REVIEW_LOGIN_OPTIMIZATION.md`. Neither uploaded authentication file is safe as a production replacement because both contain client-side/mock fallback authentication behavior. Safe performance ideas were reviewed; duplicate-submit protection was applied to VNext using the existing Firebase/RBAC architecture.
