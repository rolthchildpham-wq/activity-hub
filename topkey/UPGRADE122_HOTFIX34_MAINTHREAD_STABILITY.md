# Upgrade122 Hotfix34 - Main-thread Stability

Fixes the post-login UI freeze found in Hotfix33.

Root cause: Hotfix30 observed `page-live`/`page-settings` with a broad `MutationObserver`. Its callback called `renderState()`, and `renderState()` wrote `textContent` inside the same observed subtree. That generated another child-list mutation and could create an unbounded mutation -> render -> mutation loop, saturating the browser main thread after login.

Changes:
- Remove the Hotfix30 broad MutationObserver. Refresh commentary rules only from real lifecycle/config events.
- Make Hotfix30 state rendering idempotent.
- Remove the Hotfix6 700 ms perpetual poll and body-wide class observer; scope observation to the umpire page.
- Remove the Hotfix7 900 ms perpetual layout poll.
- Remove the duplicate Upgrade121 1.2 s player refresh poll; Hotfix6 owns this refresh.
- Keep finite boot-retry timers only.

Version: `2026.11.03-vnext-upgrade122-hotfix34-mainthread-stability`
Cache tag: `u122h34-20261103`
