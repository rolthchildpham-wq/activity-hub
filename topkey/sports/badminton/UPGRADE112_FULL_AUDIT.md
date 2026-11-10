# TOPKEY Upgrade112 — Viewer Firebase Window

## Goal
Reduce Firebase data transferred to Public Viewer without making standings incomplete.

## Viewer data plan
- Schedule: `orderByChild(date).endAt(today).limitToLast(20)` + `startAt(today).limitToFirst(60)`
- Standings: separate queries for `FINISHED`, `WALKOVER`, `RETIRED`, `DISQUALIFIED`
- Live match: direct listener only for match IDs referenced by `activeMatches`
- Teams: on-demand `teams/<id>` listeners only for teams referenced by schedule/standings/live
- Announcements: `orderByChild(createdAt).limitToLast(1)`
- Commentary: remains per selected court from Viewer Minimal Boot

## Firebase indexes
Both Badminton rules and FULL rules add only:
- `matches/.indexOn = [date, status]`
- `announcements/.indexOn = [createdAt]`

Permission rules are otherwise unchanged. Normalized Rules (with `.indexOn` stripped) match Upgrade111 baseline.

## Assets
- Viewer: `viewer.680e1156ac19.js` (32199 bytes)
- Viewer CSS: `viewer.6dbec66a2de5.css` (6108 bytes)
- Admin: `admin-core.cdf579ae5ed7.js` (1220547 bytes)

## QA
- 50/50 regression + VM test files PASS
- 204/204 JS syntax PASS
- 28/28 JSON PASS
- 10/10 SW assets exist
- Sensitive operational files unchanged: 14/14

## Required deploy action
Publish the root `firebase.database.rules.json` after deploying the web package. This is needed for query indexes; it does not broaden Firebase permissions.
