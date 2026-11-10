# Upgrade122 Hotfix23 — ADMIN Match Order

- Adds ADMIN-only ↑ / ↓ controls to each scheduled match row.
- Swaps the time slots of adjacent matches within the same day.
- Keeps date and court unchanged.
- Blocks moving LIVE/started/scored/finished matches.
- If duplicate times exist in the day, the first move normalizes the day into unique sequential slots before swapping.
- Saves through Firebase queueMulti and writes ADMIN_DAY_ORDER_SWAP audit records.
- Preserves Hotfix22 offline snapshot reconciliation.
