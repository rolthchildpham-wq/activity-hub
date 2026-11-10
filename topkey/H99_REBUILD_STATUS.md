# H99 REBUILD — H98 Release Sync + H99 Pagination Tools

This package merges the corrected H98 release manifests/header/fullscreen with the H99 RTDB cursor API and offline schema-v2 planning tools. It is **STAGING ONLY**.

## Verified locally
- H98 release manifests remain consistent across Hub, Badminton and VNext.
- The H99 bounded readPage is included in VNext source and deployed bundle.
- Synthetic 12,000-record pagination/migration test passes.
- JavaScript syntax checks and ZIP integrity pass.

## Not completed or verified
- Existing teams, matches and finance UI subscriptions still load complete collections. This rebuild DOES NOT claim end-to-end UI pagination.
- No actual Firebase staging database was migrated or tested. No real login, permission, browser or high-load tests were performed.
- Migration tool is offline and generates a shadow schema; it does not modify Firebase.

## Deployment
Do not deploy to production. Use isolated staging. Keep H98 release-sync ZIP for rollback. Before any real schema cutover, verify all ranking, scheduling, finance, roles, offline reconciliation and reports against full authoritative datasets.
