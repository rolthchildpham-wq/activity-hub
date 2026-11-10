# Firebase Realtime Database production hardening — TOPKEY

## Live evidence (2026-11-10)
Screenshot from the project `topkey-badminton` Realtime Database Rules tab shows the same public access grants as the repository `topkey/firebase.database.rules.json`. Database: `topkey-badminton-default-rtdb`.

The following roots have unconditional `.read: true` and `.write: true`:
- `topkey_badminton_app`
- `topkey_badminton_app_ai`
- `topkey_badminton_app_ai_testing`
- `topkey_multisport_app`
- `topkey_multisport_app_v3`
- `topkey_multisport_app_v4`

IMPORTANT: A root-level `.read: false` and `.write: false` does not override `true` grants on child roots. These six paths currently allow unauthenticated clients to read/write their data.

## Do not auto-publish a blind rules replacement
P3 fixes auth initialization, but the legacy clients' actual use of these six roots is not yet mapped. Replacing the six unconditional grants with `auth != null` as a quick fix would stop public access but still let ANY signed-in Firebase user read and write all data under each root; it is not an adequate authorization policy. Setting all six to `false` can break legacy tournament viewers/editors.

## Required safe sequence
1. Back up the CURRENT live Realtime Database data and export current live rules. Do not place the backup in a public GitHub repo.
2. Inventory each of the six legacy paths, identify reads/writes, public viewer requirements, writers, and whether historical data can be migrated to the protected VNext paths.
3. For each path, use exact per-child/role-based access where possible. Preserve public reads only for explicitly public, non-personal result projections; no public writes.
4. Test using Firebase Rules Playground or Emulator: unauthenticated read/write, user A vs B, Admin, BTC scoped to sport, umpire, revoked account, and public live scoreboard.
5. Resolve reported badminton sign-in and connection race with browser E2E tests against an isolated staging project before promotion.
6. Deploy static hosting and compatible rules in a coordinated release; monitor logins, save-score latency and permission-denied errors; keep rollback steps.

## Deployment gate
The `.github/workflows/topkey-production-safety.yml` job fails if the canonical rules file still contains unconditional public grants. A failing gate intentionally prevents production approval. Do NOT remove the check just to make it green.

## Current status
- GitHub P3 source merged into `main`.
- User's screenshot confirms the live security exposure.
- Firebase project connection/administrative deployment permission is not available to this integration.
- EdgeOne production deployment permission also not available.
- No production rules or live tournament records have been modified.


## Static legacy-root usage inventory (P3 ZIP local audit)

The shipped P3 JavaScript/HTML/JSON/Markdown sources were scanned for the exact legacy root names:

| Database root | Static references outside Rules files | Interpretation |
| --- | --- | --- |
| `topkey_badminton_app` | The string appears in badminton legacy migration/reference code (also as a prefix of `topkey_badminton_app_ai`) | Must inspect actual paths before changing access |
| `topkey_badminton_app_ai` | Yes: `sports/badminton/src/config.js` sets `T.LEGACY_ROOT`; migration UI mentions reading this root | Legacy import/migration may need legitimate read access |
| `topkey_badminton_app_ai_testing` | None found | Potentially historical, still confirm clients and data |
| `topkey_multisport_app` | None found | Potentially historical, still confirm clients and data |
| `topkey_multisport_app_v3` | None found | Potentially historical, still confirm clients and data |
| `topkey_multisport_app_v4` | None found | Potentially historical, still confirm clients and data |

**Scope limitation:** Static search cannot prove no older deployed browsers, cached service workers, external integrations or previously installed apps use these paths. No live data content has been read or exported in this review.

**Security recommendation:** Once an external backup and current-client inventory are verified, prioritize disabling unauthenticated **writes** to all six roots. For legacy migration reads, prefer an authenticated admin-only migration service or explicit authorized read rather than a globally writable root. Do not deploy this migration without an authorization/compatibility test on staging.
