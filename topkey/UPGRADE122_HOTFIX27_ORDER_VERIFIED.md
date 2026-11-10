# Upgrade122 Hotfix27 - Verified Admin Match Order

- Replaces the Hotfix24 match-order implementation.
- ADMIN arrows use the Firebase object key as the authoritative match key.
- Optimistic UI update: the selected match visibly moves immediately by swapping time slots.
- Online writes go directly to Firebase and are read back for verification.
- Offline writes fall back to the existing IndexedDB queue.
- On write/verification failure the local optimistic change is rolled back and an error toast is shown.
- Hotfix24 order mount is superseded to prevent duplicate/competing arrow handlers.
- Simple OK/Cancel confirmation behavior remains provided by Hotfix27.
