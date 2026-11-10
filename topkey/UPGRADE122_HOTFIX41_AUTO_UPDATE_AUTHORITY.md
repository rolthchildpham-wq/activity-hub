# Upgrade122 Hotfix41 - Auto Update Authority

- Auto Update now compares exact `version` + `cacheTag`, not only the numeric `upgrade122` family.
- A mismatch purges old TOPKEY shell caches, requests a fresh Service Worker, then navigates to `index.html` with both a server tag and timestamp cache buster.
- Reload attempts are bounded (max 4 per target within 60 seconds) to avoid loops.
- Runtime authority no longer replaces the update button with a check-only handler; mismatches delegate to the repair flow.
- All loaded runtime hotfixes use the H41 authority string so delayed stamps cannot downgrade Health back to H39.
