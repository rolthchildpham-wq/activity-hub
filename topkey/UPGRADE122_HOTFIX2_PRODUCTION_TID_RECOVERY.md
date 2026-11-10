# Upgrade122 Hotfix2 — Production TID Recovery

- Fixes Upgrade122 old behavior that could overwrite the production tournament preference with a Test Lab TID.
- Test TIDs never become production preferences.
- Keeps a dedicated production TID backup in localStorage.
- If the app falls back to an empty `main_2026`, ADMIN startup searches tournamentIndex and then the tournaments tree for the newest non-Test production tournament containing real data, restores it, and reloads with the recovered TID.
- Test Lab data remains isolated under `__testlab_*`; no production dataset is deleted by this hotfix.
