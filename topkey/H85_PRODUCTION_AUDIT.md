# H85 Production Audit and Regression Report

Date: 2026-11-07 (Asia/Ho_Chi_Minh)

## Public production audit

Observed before H85 deployment:

- Hub: H83 Full Consolidated.
- Badminton: H83 Full Consolidated.
- Shared VNext route: H84 Session-Safe Consolidated.

This is a mixed deployment and is treated as a production defect. It can cause route version, Hub ticket/session, service-worker cache, and version authority disagreements.

## Authentication review

The live login UI is Firebase Email/Password. The supplied identifier `ADMIN` is not an email, so a literal username-only live login cannot be validated through the current Firebase flow without a trusted alias mapping. No password or test credential is embedded in this release or report.

The two supplied authentication patches were reviewed and rejected as drop-in replacements because they contain client-side/mock fallback behavior capable of granting local sessions without trusted Firebase/backend authentication.

## Automated regression executed on H85 source

Tests cover:

- ADMIN + BTC Badminton + BTC Volleyball role/sport matrix;
- correct sport, wrong sport, disabled account;
- Hub selection -> login transition -> authenticated state -> reload;
- clean-URL reload and sport switching;
- H83/H84 session migration into H85;
- atomic root/Badminton/VNext release mismatch handling;
- no client-side role guessing/mock auth fallback;
- duplicated login submit guard in Badminton and VNext;
- report fixture on Badminton and VNext with all 3 language modes;
- prize structure and report image pipeline;
- non-empty multi-page PDF binary smoke;
- venue rename/delete parity, including `Khu vực (Sảnh)` for Cooking and Handmade;
- shared hotfix parity;
- current H44-H48 standings/withdrawal regressions;
- local JS syntax and referenced local asset existence.

A full graphical Chromium navigation could not be executed in the current tool environment because Chromium navigation is blocked by an administrator policy. For that reason, H85 does **not** claim a real live credential submission. Public production pages were audited separately and the source/integration suite was used for authentication behavior.
