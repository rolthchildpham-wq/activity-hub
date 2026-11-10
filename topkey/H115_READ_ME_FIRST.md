# TOPKEY H115 – CLB Planning CRUD / Cross-language Display / Parity Gates

**Status: STAGING (local test suite PASS; NOT production-certified)**

Base: H114 full website. No application database backup was modified, no production Firebase write was attempted. Score, standings, finance and tournament logic remain H114 unless a release/cache tag was updated.

## 1) Club / Organizer planning milestones

In System Admin -> Kế hoạch CLB -> Lịch & kế hoạch -> Mốc hoạt động:

- **+ Thêm dòng**: add draft milestone
- **✎ Sửa mốc**: focus/edit a row, editable start/end dates and labels
- **💾 Lưu lịch**: save *schedule only* with Firebase Realtime Database transaction; budget, task assignments and other plan fields are preserved
- **↻ Tải lại lịch**: discard draft only after confirmation
- **🗑 Xóa toàn bộ lịch**: confirm, then persist an empty schedule; does not delete the whole organizer/club profile
- Individual red ×: remove only from draft, then press **Lưu lịch** to persist.
- **💾 Lưu hồ sơ BTC** continues to save the entire plan with optimistic revision check; stale edits are rejected, not overwritten.
- Each committed change records `updatedAt`, `updatedBy`, and a bounded 50-entry `history` within `clubPlan`.

`clubPlan` and its schema remain backward compatible. The UI respects existing ADMIN/BTC restrictions; this is NOT an authentication bypass. Firebase rules for `clubPlan` require appropriate read/write rights; transaction operations also require read permission.

## 2) Test Lab / Production parity for club planning

**Same source code and transaction function**.

- Production: `<sport-root>/clubPlan`.
- Test Lab: `<sport-root>/tournaments/<__testlab_...>/clubPlan`.
- The Test Lab ID must begin `__testlab_`, include the chosen sport, and the operator must be ADMIN. Other IDs are rejected. Legacy Test Lab rule prefixes under `u122_20261031` are retained.
- Hub Test Lab now offers a link to the isolated System Admin planning editor after generating a fixture.
- This is a scoped parity improvement, **not proof that the other 184 feature requirements are E2E verified**.

## 3) Multilingual interface and user-entered content

- Expanded offline dictionary: `i18n/H115_TRANSLATIONS.json` (216 phrase entries, including 98 new System Admin overrides).
- Added `topkey-dynamic-i18n.js` to Hub, System Admin, Badminton and VNext, including spectator routes and password change.
- Dynamic rendered text (including athlete names, team names and user-entered descriptions) may be translated to VI/EN/Chinese through a server-side AI translator. **The underlying Firebase entity names, IDs, results, and form field values are never overwritten by a translation.** This is essential to avoid corrupting score/ranking logic.
- Images, PDFs, original evidence files, editable passwords, source-code blocks and attachments are not translated.
- Optional EdgeOne endpoint: `edge-functions/api/topkey-translate.js`, path `/api/topkey-translate`.
- **Server configuration REQUIRED for dynamic translation**: `MAKERS_MODELS_KEY` or `AI_GATEWAY_API_KEY`, optional `TOPKEY_TRANSLATE_MODEL` and `AI_GATEWAY_BASE_URL` in EdgeOne Makers environment. No key is embedded in the browser.
- Authenticated translators must supply a valid Firebase ID token. Unauthenticated public spectators need `TOPKEY_TRANSLATE_PUBLIC=1` explicitly enabled; do **not** enable until EdgeOne WAF/rate limiting, provider cost controls, and the user-name translation/privacy policy are configured. Default is OFF.
- If the backend is unavailable, UI text in the local glossary still translates, but **unrecognized names or custom text remain in their source language. Do NOT claim complete translation in this situation**.
- Text translation is a best-effort conversion, especially for proper names. Check spelling, Chinese transliteration and official names before publishing formal documents.
- Changing languages is visual only; editable input values remain canonical. Do not write translated DOM text back to the database.

## 4) Version / SW consistency

- `release.json` → generated H115 `build.json` (Hub, Badminton, VNext), `release-runtime.js`, 3 SW caches.
- Fixed obsolete H105 query strings in `system-admin.html` and `change-password.html`.
- All 5 major entrypoint pages load the same dynamic-translation script using cache-buster H115.
- Three SW shell caches now include the translation JS and local dictionary, with no change to Firebase request caching.
- Deploy the *entire ZIP* atomically; never manually copy a subset of modules over Production.

## 5) QA evidence and limitations

`H115_TEST_MATRIX.json` has 29/29 PASSED **local static / unit / mock categories**, including:

- 416 JS syntax checks and 44 inline HTML scripts
- 90 local referenced HTML assets
- 14 Club Plan CRUD mock assertions (including concurrent edit conflict and budget invariance)
- 6 dynamic translation DOM mock assertions
- 6 translation proxy security mock assertions
- 26 inherited role matrix cases and H107 award contract
- H114 SW scoping and H104 Firebase V2 simulated large-data tests

The previous H114 full-feature matrix is updated as `TOPKEY_H115_Production_TestLab_Parity_Gates.xlsx` with test status for all 185 feature rows, delta analysis and unresolved P0 release gates.

**NOT TESTED**: sign-in with live Firebase staging accounts, EdgeOne deployment/caching, Test Lab 185 production operations, multi-device matches, PDF/Excel imports/exports on real evidence, camera/WebRTC, full EN/Chinese user-generated translation with a real AI gateway, speed benchmarks. Do not replace Production without completing these release gates.

Legacy old-version tests pinned to H108/H109 may show a version mismatch by design. H91 language test has an inherited issue on the unmodified H114 baseline; its failure is retained in the updated matrix.

## 6) Rollback

Keep H114 ZIP and an exported Firebase JSON backup. For rollback, deploy the entire H114 release; no database migration is required by H115. Test Lab data remains isolated. If H115 is not deployed, its package does not change existing Firebase records.
