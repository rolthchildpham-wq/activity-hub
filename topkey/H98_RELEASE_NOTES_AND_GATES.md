# H98 UI & Fullscreen - STAGING ONLY

Implemented in this package:
- Hub header desktop: one-line title and independently sized two-column status box; responsive stacking.
- VNext (football, volleyball, running, DIY/handmade, shuttlecock, cooking) and Badminton: user-triggered focus/fullscreen toggle.
- Focus mode hides header/nav/user/logout and removes 1500px main width cap; mobile one-column cards, safe-area, visually hidden scrollbars.
- Restore navigation button; session-based state. Browser fullscreen request is attempted only after a direct click; browser policies may refuse it.
- Updated root, VNext and Badminton service worker cache identifiers to H98; added focus assets to sub-app precache.
- Preserved H97 emergency login/UTF-8 fixes as source. No Firebase writes or schema changes were introduced by H98 UI.

NOT COMPLETED / BLOCKERS:
- Full Firebase pagination for teams, matches and finance is NOT implemented; their existing full-node subscriptions remain.
- No production database schema migration. This requires actual rules/indexes, a staging database snapshot, data-contract and rollback validation.
- Real Firebase integration and high-volume browser tests NOT run; no production Firebase credentials or staging dataset provided.
- Header on very narrow desktop widths will use responsive stacking to prevent overflow.
- Native fullscreen is not guaranteed on all mobile browsers; a layout-only focus mode remains available.

Before production: run browser E2E login/logout, permissions, all sports, read/write, offline sync, reports, 10k+ record profiling and service worker update checks on staging. Deploy only after tests pass; keep H96 rollback archive.
