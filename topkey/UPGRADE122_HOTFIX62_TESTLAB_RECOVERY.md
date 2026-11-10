# Upgrade122 Hotfix62 - Test Lab Recovery

- Fix multi-sport Test Lab `permission_denied` on `testReports/latest`.
- Realtime Database rules grant ADMIN-only access to isolated `__testlab_u122_20261031_<sport>_*` tournaments for all VNext sports.
- Test Lab now has LOCAL FALLBACK: if Firebase rules are not deployed yet, fixture is injected into the app state and rendered immediately.
- Reports no longer fail when `testReports` cannot be written; they render locally and can be downloaded as JSON.
- Banner explicitly shows CLOUD vs LOCAL FALLBACK.
- Production namespaces remain untouched.
