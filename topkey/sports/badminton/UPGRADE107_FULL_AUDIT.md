# TOPKEY Upgrade107 — Schedule DOM Safety Fix

## Root cause
Upgrade105/106 moved schedule content under a collapse/scroll wrapper. Legacy `upgrade16.js` still assumed `.table-wrap` / `#spectator-schedule` were direct children of the card and called `card.insertBefore(bar, reference)`. After a match status change re-render, that reference belonged to the wrapper instead of the card, causing DOM `NotFoundError`.

## Fix
- `upgrade16.js` now inserts relative to the reference node's actual parent via `safeInsertBefore()`.
- Upgrade107 adds a final repair guard for admin/public search-bar placement after re-render.
- Keeps Scoring Fast Lane Upgrade105 and internal schedule scroll Upgrade106 unchanged.

## QA
- 41/41 regression + VM PASS.
- Dynamic VM reproduces a reference node inside `collapse-body` and verifies insertion occurs in the actual parent with no exception.
- All sensitive scoring/rules/TURN/WebRTC/BLV files are byte-identical to Upgrade106 except the intended legacy UI insertion fix.
