# Hotfix78 - Auth + Report Images + Venue Management

- Redirect EdgeOne preview hosts `topkey-activity-management-*.edgeone.dev` to the canonical production host before Firebase Auth, avoiding HTTP-referrer API-key blocks on random preview domains.
- Final-report exporter now continuously reclaims the current report button from Hotfix65 and records export diagnostics; it refuses to export if image rows exist but the transient image snapshot is empty.
- VNext sports now support rename/delete venue like badminton, with safety guards for live/historical events.
- Cooking and DIY/Handmade use `Khu vực (Sảnh)` instead of `Sân`.
- Build/cache: u122h78-20261107.
