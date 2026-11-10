# TOPKEY H114 - Integrated close, finance, evidence, login, Test Lab (STAGING)

Base: **H113**; H105-H112 fixes retained. Release: `u122h114-20261109`.

## Confirmed changes

1. **Close tournament:** ADMIN re-reads the entire `matches` branch from Firebase before closing; the Cài đặt panel shows the IDs and statuses still open. The close routine rechecks the data immediately before writing. No score/status is automatically changed, and it cannot finalize if reads fail, online is unavailable, or unfinished fixtures remain.
2. **Finance:** ADMIN gets `Sửa` and `Xóa` buttons on the finance list. Updates and deletes use Firebase RTDB transactions with a timestamp conflict guard and append Audit events. Edit form allows replacing evidence, while original finance creation and approval flows remain.
3. **Auth startup:** Keeps H113's Firebase verified profile guard, deduplicates overlapping after-login work, defers noncritical schema/fixture setup, and avoids the prior redirect to recover an active tournament. The objective is lower perceived startup delay; **no EdgeOne load-speed metric has been verified**.
4. **Deep Test Lab:** new `🧪 Kiểm tra sâu H114` and JSON download in the isolated `__testlab_*` namespace. Verifies data relationships, lifecycle, finance totals, awards, reports, roles and permitted CRUD. Explicit `UNTESTED` for referee, camera, genuine PDF.js, two-device conflicts, live Firebase/EdgeOne. The legacy `18/18` suite remains but is NOT comprehensive.
5. **Receipt uploads:** accepts **JPEG/PNG/WEBP, PDF, XLSX** (25 MB maximum original). Compresses large images to JPEG at up to 2400px, quality .86 only when file becomes smaller. PDFs and XLSX files are internally compressed formats: keep originals to avoid degrading printable source. Binary files go to **Firebase Storage**; Realtime Database stores metadata/URLs, not the binary payload. Old `.xls` is not supported; convert to `.xlsx`.
6. **Finance PDF:** appendix renders each source PDF page, workbook cell sheet, embedded workbook image, and photo onto individual printable pages, each labeled with finance category and transaction/receipt IDs. No separate embedded attachments are required. Print/Save PDF gives each source page a separate print page. Requires PDF.js from public CDN to render original PDF file pages in browser; on network error export rejects rather than silently omitting evidence. Very complex Excel layout/chart objects are not reproduced pixel-exactly (cell contents and embedded images are printed).

## Tests run locally

- JS syntax check across entire full site (see `H114_RELEASE_TEST_MATRIX.json`).
- 3 build manifests, 3 Service Worker cache scopes.
- H107 awards report contracts all 7 sports; H108 Firebase profile-auth and permissions smoke; H95 runtime lifecycle; H104 Firebase v2 synthetic 36,000 record pagination scenarios.
- Chromium DOM/mock: 1 LIVE fixture prevents closure, all FINISHED permits closure; an ADMIN transaction edits a finance row, then deletes it, with Audit records; test fixture matches preserved.
- Chromium mock PDF engine: 7 A4 pages with finance summary, receipt photo, 2 simulated PDF pages, Excel sheet. Independent PyMuPDF verification checks every page for non-empty raster and 0 attached files. **Original source PDF pages were simulated, not rendered with the actual PDF.js library** in this offline test environment.
- JS mocked deep Test Lab: 18 PASS, 0 FAIL, **8 UNTESTED** (status PARTIAL). These do not replace manual live integrated tests.

## Mandatory staging acceptance (not yet done)

- Sign in a valid ADMIN and BTC account in Firebase staging; open each of the seven sports, reload and navigate Hub in incognito and PWA.
- With one truly LIVE fixture, verify closure refusal; finish it on a second device, verify recheck and close; verify reports, history and score.
- Create, approve, edit and delete an isolated finance record with a photo, PDF with multiple pages, and XLSX with embedded picture; download both PDF and print-to-PDF; inspect each page and check amounts.
- Run full Test Lab per sport and manually test its UNTESTED categories; compare all production UI features, camera and live scoring on real hardware.
- Check Firebase Storage read/write and CORS rules for receipt uploads and fetching.
- Measure cold and warm startup timing on EdgeOne (Network/Performance) and listener count; not quantified by local mock testing.

**NO production DB operations have been performed. This ZIP is a STAGING build, not a certified production release. Deploy the complete ZIP atomically to staging, keep H113 as rollback.**
