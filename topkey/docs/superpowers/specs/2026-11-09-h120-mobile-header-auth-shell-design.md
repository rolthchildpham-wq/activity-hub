# H120 Mobile Header and Unified Auth Shell Design

## Intent

Reduce the Hub header footprint on phones and make Badminton use the same first-login boot mechanism as VNext without removing Badminton-specific business features.

## Root Cause

H119 centralized Firebase SDK loading, Auth state and access policy, but Badminton still enters through `ensureAdmin()`. That path loads and parses a 1.25 MB admin bundle before the Auth service is available. Its first login can therefore race the app boot/profile verification path and appear to return to login before a later attempt succeeds.

## Approved Approach

- Add one `TopkeyPlatform.startSport()` auth shell used by protected Badminton and VNext entrypoints.
- The shell loads config, Firebase App/Auth/Database, creates a minimal shared `T.Data`, creates one `TopkeySharedAuth` instance and starts session restoration.
- Keep the same `T.Data` Firebase handles and the same `T.Auth` object when the sport bundle hydrates.
- Load the business bundle only after a profile is verified; then attach the full app once.
- Keep public Badminton viewer/register paths lazy and separate from protected Auth boot.
- Add a mobile-only header toggle. Mobile defaults collapsed, desktop remains expanded, and the mobile preference is stored locally.

## Non-Goals

- Do not replace Badminton business rules or scoring with the generic VNext implementation.
- Do not change Firebase paths, role decisions, tournament data or Security Rules.
- Do not add optional reports/media to the login critical path.

## Acceptance

- Badminton and VNext protected pages expose the same `__TOPKEY_SPORT_BOOT` and `__TOPKEY_ENSURE_CORE` contracts.
- First login uses one Auth object and one profile verification before and after bundle hydration.
- Badminton admin bundle is absent from the pre-auth critical path.
- Mobile Hub header can collapse/expand without hiding sport cards and remembers the chosen mobile state.

