# Upgrade122 Hotfix37 – Mobile Admin + Test Lab Permissions

- ADMIN mobile layout becomes responsive: compact header/nav, single-column portrait forms/grids, schedule rows become readable cards; landscape uses two schedule cards per row.
- Test Lab no longer blocks the app on `PERMISSION_DENIED`: ADMIN attempts cloud sandbox first and automatically falls back to an isolated local fixture/report if Firebase Rules have not been deployed yet.
- Realtime Database rules add an ADMIN-only grant for tournament IDs matching `__testlab_u122_20261031_badminton_*`. Production tournament rules are unchanged.
- IMPORTANT: EdgeOne static deployment does not deploy Firebase Database Rules. To enable cloud Test Lab, deploy the included `firebase.database.rules.json` to the Firebase project. Local Test Lab fallback works without that deploy.
