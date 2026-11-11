# H123: archive loading and legacy database access

Badminton runtime extensions now wait for both verified admin bootstrap and the
core application. Archive reports no longer block login. Settings fetches 25
archives at a time, ordered by closedAt with key-aware pagination. The automatic
legacy database scan is removed; explicit migration remains available. The Hub
uses its saved executive snapshot until an administrator requests refresh.

The canonical and mirrored database rules restrict six legacy roots to active
ADMIN read-only access and add closedAt/updatedAt indexes to the shared sport
archive index. Current sport namespaces remain present.

## Validation

Synthetic local fixture: 1,000 tournaments, 26 entries and 32 distinct people per
tournament, 100 finished matches and 20 finance rows per tournament. The latter
two counts are assumptions, not an export of customer data.

- Previous full archive payload: 18,516,781 JSON bytes.
- New login archive payload: zero (archives deferred to Settings).
- First query: 499,960 JSON bytes, including pagination lookahead; 25 displayed.
- All 40 pages: 1,000 distinct tournaments, no missing or duplicate entries.
- Dashboard snapshot: 312,601 JSON bytes; actual cached boot reads no archives.
- Manual dashboard refresh still reads all archived reports and recomputes totals.
- Auth-first and core-first runtime ordering, admin closed-tournament navigation,
  four auth regressions, and 69 policy/rules parity assertions pass locally.
- Existing report/account review suite: 16 checks pass.

These are local Node/jsdom tests, not measured production latency, Firebase
billing, or 1,000 simultaneous users. Real authorization checks are in
tests/rules-legacy-emulator.cjs and the dedicated GitHub Actions workflow.
Local emulator transport failed even with minimal deny-all rules; CI is the
independent runtime check. Do not interpret static parity as emulator success.

## Production prerequisites

Publishing frontend files does not publish Firebase Rules. Before applying the
rules, privately back up current live rules and data, compare the current live
policy with this revision, and run the emulator checks. The Google account
available during preparation could not access project topkey-badminton; no live
rules or customer data were modified. Until the index is published, Firebase may
download the archive collection to evaluate an unindexed query client-side.
The login and cached dashboard improvements do not depend on that new index.
