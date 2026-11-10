# Upgrade122 Hotfix67 - BTC Scope Save + Auto Close

- Fixes BTC sport scope validation reading an empty value despite a visible selection.
- Reads the live select value directly and keeps a last-selected fallback.
- Saves `sportScope` and `assignedSport` before validating completion.
- After successful Firebase save, closes the permission modal automatically and refreshes the user list.
- Keeps Hotfix65 final tournament report and Hotfix66 sport-list recovery.
