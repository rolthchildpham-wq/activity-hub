# Upgrade122 Hotfix38 — Withdrawal & Standings Rules

## Canonical standings rules
1. MEN / WOMEN / MIX are calculated independently.
2. Standings count GROUP / round-robin matches only. KNOCKOUT never changes group standings.
3. Counted statuses: FINISHED, WALKOVER, RETIRED, DISQUALIFIED. CANCELLED never counts.
4. WALKOVER under KEEP_PLAYED_WO is 2–0 sets, default 11–0 / 11–0; winner gets walkoverWinPoints, loser gets lossPoints.
5. RETIRED gives the opponent the match win. Only completed sets count toward set differential; actual recorded rally points remain in point differential.
6. Missing/ambiguous winner is never defaulted to team B. The match is skipped from W-L/match points and flagged by audit.
7. A withdrawn team may remain in audit history but is not eligible for standings qualification / Top 3 / knockout selection.
8. If both teams are withdrawn, the match must be CANCELLED and not counted.
9. Category mismatches are flagged by audit instead of silently cross-counting categories.

## Withdrawal policies
- CANCEL_ALL: cancel every related match; no related result counts in standings.
- KEEP_PLAYED_WO (default): keep already completed matches; unplayed matches become WALKOVER 11–0,11–0 to the opponent; active match becomes RETIRED to the opponent.
- KEEP_PLAYED_CANCEL: keep already completed matches; unplayed matches become CANCELLED; active match becomes RETIRED to the opponent.

## Regression focus
- WOMEN withdrawal mid-group.
- Knockout result isolation from group standings.
- Missing winner safety.
- MEN/WOMEN/MIX category isolation.
