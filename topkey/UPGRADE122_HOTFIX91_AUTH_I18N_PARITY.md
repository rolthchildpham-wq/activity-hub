# Upgrade122 Hotfix91 - Auth + i18n Parity

Release: `H91 · AUTH + I18N PARITY`  
Build: `u122h91-20261107`

## Fixes
- Executive Dashboard dynamic UI now participates in the same Vietnamese / English / Simplified Chinese i18n contract.
- Badminton and VNext share the same Hub entry guard and central `AUTH_ROOT` / sport-scope access contract.
- Badminton protected login no longer reports optional runtime-module timeouts as login failure; optional modules retry in background.
- Hotfix57 public-links module is deferred from the protected login path and retried with cache-busting.
- Badminton auth profile reads use the central auth root, matching VNext behavior.
