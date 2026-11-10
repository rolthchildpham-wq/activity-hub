# Upgrade122 Hotfix47 — Withdrawal Legacy Recovery

- Withdrawn teams using a points-preserving policy remain visible in standings but are always sorted below active teams.
- Teams withdrawn with `CANCEL_ALL` are hidden from standings.
- For `KEEP_PLAYED_WO`, a pair with no valid counted result is treated as an unplayed fixture and becomes an administrative WO, even when stale CANCELLED/hidden legacy records exist.
- Legacy withdrawn records with missing policy default to `KEEP_PLAYED_WO` unless explicit evidence says `CANCEL_ALL` or `KEEP_PLAYED_CANCEL`.
- Each pair contributes at most one counted result.
