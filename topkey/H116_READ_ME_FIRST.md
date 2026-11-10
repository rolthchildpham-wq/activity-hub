# TOPKEY H116 — PDF/PPT Report Consistency + EdgeOne AI Admin Integration (STAGING)

**Base:** H115 (preserves Firebase V2, 7 sports, Login/Auth, Reports, Prize Structure, finance/receipts and Test Lab).  **DO NOT DEPLOY TO PRODUCTION without real staging verification.**

## Changes

1. **Final report PDF (all seven sports)**: The main button `📄 Xuất PDF đã kiểm nội dung (H116)` renders all sections using the local canvas PDF writer; validates its result before triggering the download. This fixes the prior sequencing bug where the file was downloaded before the validation. The secondary `🖨️ Xem trước / In PDF thủ công` opens the full HTML report with a user-click **Print / Save as PDF** button, without automatic printing before fonts and images finish loading. Both use the same report snapshot; they reject incomplete match data.
2. **Prizes**: The `Cơ cấu giải thưởng` section follows `Thành tích chung cuộc`. When prizes aren't configured, it remains visible with a clear note rather than vanishing. `report.prizeStructure` must exist even if it is an empty array. The HTML view, H106 PDF, and per-sport PPT all preserve the award list when present. The archived tournament snapshot remains authoritative for closed/archived tournaments.
3. **PowerPoint**: Export uses the original 9-slide PPTX per sport (badminton, football, volleyball, running, handmade, shuttle, cooking), not a generic brown deck. It appends sections for long results / awards and places user-provided photos. The original editable PPTX downloads are still in `report-templates/`. New `h116-custom-ppt.js` lets an operator import a previously edited compatible 9-slide PPTX into the current browser for that specific sport. It is stored via IndexedDB, shared in the same browser between Production and Test Lab, and may be reset. This DOES NOT sync edited PPTX to other devices; original structural placeholders must remain editable.
4. **Admin AI assistant slot**: Added to `system-admin.html` only after a Firebase profile with ADMIN role and edit rights is confirmed. The slot embeds the `/widget` endpoint from an explicitly provided HTTPS EdgeOne AI Chat Assistant site. It does not send tokens, passwords, Firebase data or admin user lists to the iframe. **It does NOT create the remote Agent, chart API, or data-access backend.** To access real statistics, deploy an authorized read-only server API that verifies Firebase ID tokens and ADMIN permissions on the server.
5. Release manifests and Service Worker cache tags stamped consistently `H116` / `u122h116-20261109` for Hub, Badminton and VNext. Full ZIP deployment needed; do not copy an isolated JS file.

## Tests completed (local / simulated)

- Static JS/syntax/entry assets/release verification: **39/39 PASS**, includes 419 JS files.
- Browser-mocked report generation: **7/7 PPTX** and **7/7 PDF** created, plus custom football PPTX template injection. No JS page errors in these tests.
- MuPDF + pixel inspection of saved PDFs: **49/49 rendered pages** have nonblank body content. Both the award table and summary/finance sections render.
- The H107 prize contract, H108 auth/security regression, H88 report HTML, H88 security contract, H93 club-planning rules, H83 PDF binary tests pass locally.
- Two legacy tests are **FAIL** due to exact hardcoded old cache values H96/H108: `tests/auth_bootstrap_h93.js` and `tests/h108_release_parity.js`. They must be modernized, not silently counted as pass. They do NOT demonstrate real login failure in H116, nor prove successful login.

## Must-do staging acceptance before production

1. Deploy **entire ZIP** to separate staging. Verify `release.json` and both `build.json` display H116; clear only obsolete service-worker caches. Confirm no redirect loop when entering each sport.
2. Sign in with a safe test ADMIN and restricted BTC/VIEWER account. Verify one-time login, permission enforcement, mobile and desktop. Never grant client-side admin bypass.
3. Run Test Lab for **all seven sports**, ensure same buttons and functions as real Production but with `__testlab_...` Tournament IDs. Verify winner / score / finance after edits on independent devices.
4. For each sport, open `Xuất Báo cáo toàn giải`, confirm award section, select `📄 Xuất PDF đã kiểm nội dung (H116)` and open actual saved PDF. Confirm the prize table and at least two actual pages. Test with many matches, long team names, and multi-language data.
5. Check HTML print route separately with manual click, including image readiness and page breaks. Print an actual local PDF for physical print validation.
6. Open / edit each sports-specific PPTX via PowerPoint, keep placeholders, optionally import it back in the dialog; generate and validate in Test Lab & Production-like staging. Check uploaded photo location and custom text persistence.
7. Configure EdgeOne AI Chat Assistant endpoint to see an iframe. For statistics data, provision a server-side authenticated read-only endpoint, verify server access controls and data minimization; **not implemented in H116**.
8. Check measured cold/warm times (Network and Performance panels) and Firebase data totals. Fail release if any report is blank, a number differs or scope leaks.

## Rollback

Retain the verified previous full ZIP and Firebase backup. H116 migration is code only and does not mutate Firebase schema. If failing staging, restore full H115 release plus matching Service Worker, rebuild manifest, and test login/reports; do not mix H115 and H116 assets.
