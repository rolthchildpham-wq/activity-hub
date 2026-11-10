# Upgrade122 Hotfix45 - Core Standings Authority

Version: `2026.11.04-vnext-upgrade122-hotfix46-withdrawal-policy-recovery`
Cache tag: `u122h46-20261104`

## Root cause fixed
The production admin core still contained the legacy scoring formula (`winPoints`, `lossPoints`, `walkoverWinPoints`) while H38/H40/H43/H44 tried to override ranking at runtime. If any override was stale, late, cached, or not loaded, the UI returned to legacy values such as 4-0 = 8 points.

## Canonical standings rules
- GROUP / round-robin only.
- One authoritative counted result per team pair.
- Counted statuses: FINISHED, WALKOVER, RETIRED, DISQUALIFIED.
- Real counted result has priority over a virtual result.
- 1 standings point per win, including WO.
- 0 standings points per loss.
- Therefore Points is always equal to W.
- If a withdrawn team uses KEEP_PLAYED_WO and a pair has no counted result, a virtual WO (11-0, 11-0) is used for standings only.
- CANCELLED/SCHEDULED stale records do not block a required virtual WO.
- Withdrawn teams keep their historical standings but are excluded from qualification via `rankingEligible()`.

## Runtime consolidation
H38/H40/H43/H44 are no longer loaded in production runtime. The admin core is the single owner of ranking, standings, virtual WO completion, and qualification filtering.

## Historical integrity
Withdrawal processing stores team snapshots on related matches. Deleting a withdrawn team archives the team and preserves match history so standings do not lose prior results.
