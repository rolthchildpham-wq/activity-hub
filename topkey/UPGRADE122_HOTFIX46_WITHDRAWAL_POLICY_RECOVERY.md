# Upgrade122 Hotfix46 - Withdrawal Policy Recovery

Fixes standings completion when a withdrawn team's policy metadata is no longer stored directly on the live team record after restore/reschedule/withdraw cycles.

## Canonical rule
For policy `KEEP_PLAYED_WO`, every active opponent in the same category must have exactly one counted result against the withdrawn team. Existing valid GROUP results are preserved. Missing/un-counted pairs receive one virtual WALKOVER for standings only.

Policy resolution now uses, in order:
1. live team `withdrawalPolicy`,
2. withdrawn archive,
3. team snapshot on historical matches,
4. match-level `withdrawalPolicy` / `withdrawnTeamId` / `walkoverTeamId` / `retiredTeamId` evidence.

This prevents restore -> recreate schedule -> withdraw again from losing one of the withdrawal wins in standings.
