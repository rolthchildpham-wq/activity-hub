# H104 R1 - Schedule Row Layout Fix (staging)

## Base
Built from the full H104 package (`Topkey_H104_H103_Indexed_Firebase_V2_STAGING.zip`). All Firebase v2, login, authorization, reports, fullscreen and sport modules remain unchanged.

## Changes
- Badminton and shared VNext schedule: team names and H104 winner badges stay on the same visual line (desktop), with horizontal scrolling if a match name is excessively long.
- Badminton schedule: direct action buttons form a balanced two-column/two-row pattern; no changes to button callbacks or permission guards.
- Mobile: keep the existing cards; long team names can scroll rather than wrap the winner badge.
- Add standalone stylesheet in each sport, unique cache-buster, and refreshed Badminton shell cache.
- All release IDs/build.json remain H104 to avoid reintroducing mismatched Hub/Badminton/VNext versions. This is a UI hotfix of H104, not a database migration.

## Production and test limitations
- Browser output in this environment does not have access to authenticated Firebase sessions. No destructive click tests were performed.
- The URL `https://topkey-activity-management.edgeone.dev/` can be read by the web crawler, but the container browser cannot resolve it. Thus live JS interaction tests and performance with Firebase cannot be verified here.
- The web fetched Hub public content showing H89, Badminton link with H103 label and VNext H96 label; these static labels do not establish the active JS build on the user's authenticated client.
- Staging-only until actual browser login, release consistency and CRUD checks pass against staging.

## Read-only live diagnostic
Open `/diagnostics/release-and-speed-check.html` on a deployed staging host. It compares the three `build.json` values and asset response times without logging in or writing Firebase. Cache/Build checks do not prove authenticated functionality.

## Visible badges
Updated stale H103/H96 HTML labels in Hub/Badminton/VNext login headers to `H104 · V2 R1`; all build/release manifest values remain aligned to H104 (this is a layout patch of H104, not a new incompatible Firebase schema).
