# Upgrade122 Hotfix22 - Offline Snapshot Reconcile

Purpose: make offline umpire scoring reconcile as a final snapshot instead of visually replaying queued scores on reconnect.

Key rules:
- Local umpire state remains authoritative while offline queue exists.
- SCORE event history is preserved, but intermediate `activeMatches/<court>` snapshots are compacted before flush.
- A stale Firebase snapshot received on reconnect is overwritten in-memory by the local shadow before UI rendering.
- `MATCH_FINISHED` recorded offline remains FINISHED locally and syncs result/BXH data without reopening the old match.
- Starting a subsequent match offline supersedes the previous court shadow; reconnect must keep the newer match on screen.

Build: `2026.11.02-vnext-upgrade122-hotfix22-offline-snapshot-reconcile`
Cache: `u122h22-20261102`
