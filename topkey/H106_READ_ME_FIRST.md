# TOPKEY H106 - Final Report PDF Blank-Page Fix

**Base:** H105 (including H104-R1 / H104 Firebase V2 / previous report and award features).
**Status:** Local testing passed; STAGING ONLY, NOT production-certified.

## Problem
- Badminton export opened a print window before report had rendered.
- VNext export depended on remote html2pdf/html2canvas and did not inspect whether exported pages contained visible content.

## Changes
1. A new local `h106-final-report-pdf.js` generates A4-landscape PDF from the verified report object. It uses no CDN and does not auto-print a new window.
2. Both Badminton and six VNext sports call the same export engine from their existing **Export PDF** control. The original ranking-explanation/print export and PPT are retained.
3. It renders cover / overview, award structure, standings, fixtures/results, finances, report photos and signature/confirmation. Images assigned to report sections stay in their chosen section.
4. Guards refuse to download a report if the source match count indicates missing data or a PDF page is empty. User sees an error instead.
5. Hub, Badminton and VNext manifests and service-worker cache tags are synchronized to H106.

## Tests run locally
- 400 JS syntax checks and 73 static/regression checks passed.
- Chromium PDFs generated for all seven sports, all pages opened with an independent PDF parser and checked for visible ink.
- Badminton 99 simulated matches: 17 pages, all nonblank.
- The actual "Export PDF" button downloaded PDFs in simulated Badminton and Football UI, 7 pages each.
- 12 custom photos stress case: 16 pages, images retained in correct sections.
- Read-only test using user-provided historical backup: 26 teams, 99 matches, 4 financial records, 13-page PDF. The private PDF is NOT included.
- Firebase V2 pagination stress: 12,000 simulated records per group; inherited PPT and ranking explanation regression passed.

See `H106_RELEASE_TEST_MATRIX.json` and `H106_STATIC_TEST_REPORT.json`.

## Technical limits and deployment
- **Important:** new PDFs render each page as an image; text may not be selected/copied/searchable. HTML preview and print from browser remain available for a text-based PDF workflow.
- Chromium local tests cannot certify authentication, permissions, finance writes, performance or network behavior on a real Firebase or EdgeOne deployment.
- Deploy the **entire ZIP** to a separate staging site. Do not copy only `h106-final-report-pdf.js`. Check all seven sports: login, report sections, and export PDF with real staging data. Compare with award/standings/finance source before production rollout.
- No changes to Firebase database records, rules, winner logic or score calculation in this patch.
