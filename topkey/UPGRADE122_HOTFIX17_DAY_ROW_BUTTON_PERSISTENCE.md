# Upgrade122 Hotfix17 — Day Row Time Button Persistence

- Restores the `⏱ Sắp time` button directly on every badminton schedule day header.
- Re-mounts the button after render, search/filter, Firebase sync, tab changes, and DOM rebuilds.
- Uses the Hotfix15 optimizer/verify engine; no scheduling rule changes in this hotfix.
- Removes stale H13/H15 day buttons to keep exactly one visible control per day.
- Version authority/cache tag: `u122h17-20261102`.
