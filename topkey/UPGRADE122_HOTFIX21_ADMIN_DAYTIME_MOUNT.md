# Upgrade122 Hotfix21 — ADMIN Day Time Mount

- Fixes the per-day `⏱ Sắp time` button not appearing for ADMIN after auth/render races.
- Hooks `afterLogin`, `applyRole`, `renderMatches`, `renderAll`, and `showTab`.
- Keeps a MutationObserver on `#matches-list` and repairs buttons after every schedule redraw.
- ADMIN only; UMPIRE/VIEWER cannot see or invoke the optimizer.
- Button uses compatibility class `tk-h17-day-btn` so Offline Readiness counts it correctly.
