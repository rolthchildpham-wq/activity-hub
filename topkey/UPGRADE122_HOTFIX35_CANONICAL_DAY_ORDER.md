# Upgrade122 Hotfix35 - Canonical Day Order

- ADMIN order buttons use `scheduleOrder` as persistent day order.
- Every order change recalculates the complete day from 17:15.
- Slot formula: `17:15 + scheduleOrder * config.rules.estimatedMatchMinutes`.
- Day Time optimizer uses the same formula; no second competing scheduling algorithm.
- H21 owns schedule table lifecycle; H27 no longer wraps `renderMatches` or observes the table.
