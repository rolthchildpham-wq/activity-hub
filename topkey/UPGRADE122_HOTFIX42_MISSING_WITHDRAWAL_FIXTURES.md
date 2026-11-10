# Upgrade122 Hotfix42 — Missing Withdrawal Fixtures

Canonical rule for round-robin standings when a team withdraws under `KEEP_PLAYED_WO`:

1. A real GROUP match always has priority.
2. If a GROUP pairing between an active team and a withdrawn team is absent, standings synthesize a virtual WALKOVER (2–0, 11–0 / 11–0) for the active team.
3. The virtual result affects standings only and does not create a schedule row.
4. The virtual result increments `played` and `W` and uses the configured `walkoverWinPoints`.
5. `KEEP_PLAYED_CANCEL` and `CANCEL_ALL` never synthesize the missing fixture.
6. Deleting a withdrawn team preserves an archive tombstone plus match snapshots so future standings can reconstruct missing pairings.
7. If an actual played result was previously deleted from all match/backup history, Hotfix42 cannot infer its original rally score; the fallback remains administrative WO.
