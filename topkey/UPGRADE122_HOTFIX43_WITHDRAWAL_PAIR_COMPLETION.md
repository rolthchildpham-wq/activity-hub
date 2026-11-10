# Upgrade122 Hotfix43 - Withdrawal Pair Completion

Version: `2026.11.04-vnext-upgrade122-hotfix43-withdrawal-pair-completion`

## Rule
For policy `KEEP_PLAYED_WO`, every GROUP pairing between an active team and a withdrawn team must have exactly one counted standing outcome.

- If any counted result exists (`FINISHED`, `WALKOVER`, `RETIRED`, `DISQUALIFIED`), that result is authoritative.
- If no counted result exists, stale `CANCELLED`, `SCHEDULED`, hidden, or legacy placeholder records do not suppress the administrative WO.
- An explicit `excludeFromStandings`, `manualNoStanding`, or `ADMIN_EXCLUDE_STANDINGS` marker may suppress the virtual outcome.
- Virtual WO is standings-only; it does not recreate a schedule row.
- Winner receives `walkoverWinPoints`; loser receives configured `lossPoints`.

This fixes cases where a team such as BAC had only 5 counted matches although two missing pairings against withdrawn teams should have been administrative wins.
