# H104-R1: public EdgeOne access / verification limits

- Visited https://topkey-activity-management.edgeone.dev/ via public web retrieval on 2026-11-08. All seven sport links are present.
- Read the Badminton public HTML, which shows H103 STABLE RUNTIME in a visible label. Hub points to `?v=u122h89-20261107`.
- Read six sport URLs (`football`, `volleyball`, `running`, `handmade`, `shuttle`, `cooking`) that show VNext H96 HEADER REFERENCE label; Hub links include H89 query.
- These are HTML labels only, not a complete `build.json` verification. The container browser cannot resolve the EdgeOne hostname; actual runtime JS/Firestore/Auth tests were NOT performed.
- Real-user action checks (login, role permissions, import/export, scoring, finance, backup/rollback) are **NOT VERIFIED**. Do not infer they work merely from their buttons appearing in HTML.
- Real page load time and lag cannot be measured from this static retrieval.

## Deployment advice
Deploy the complete package to an isolated staging host (not the live main domain), confirm the Hub/Badminton/VNext build manifests are identical, then conduct authenticated tests. Do not migrate data or publish new Firebase Security Rules as part of this UI patch.
