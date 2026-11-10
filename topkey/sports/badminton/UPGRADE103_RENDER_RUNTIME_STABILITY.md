# Upgrade103 — Render & Runtime Stability

Baseline: Upgrade102 Firebase Latency.

- Retires legacy Upgrade90 BLV polling when Upgrade94 is present.
- Removes Upgrade94 continuous 700 ms Viewer polling; event-driven court/listener updates remain.
- Firebase state continues updating for all core branches, but DOM rendering is limited to the active authenticated tab.
- Hidden-tab admin DOM work is deferred and flushed once when visible again.
- Hidden Overview KPI DOM writes are skipped outside the Overview tab.
- Adds passive latency metrics for score tap -> local referee UI, SCORE Firebase write, and Viewer Firebase receive.
- No scoring, Rules, TURN, WebRTC signaling, BLV semantics, or Viewer orientation protocol changes.
