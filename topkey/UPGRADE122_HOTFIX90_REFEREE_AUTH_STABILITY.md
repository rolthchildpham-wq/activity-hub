# UPGRADE122 HOTFIX90 - REFEREE + AUTH STABILITY

Release: `u122h91-20261107`
Version: `2026.11.07-vnext-upgrade122-hotfix91-auth-i18n-parity`

## 1. Badminton Firebase Auth bootstrap fix

Root cause of `No Firebase App '[DEFAULT]' has been created`:
- Badminton bootstrap loaded Firebase App/Database/Auth SDKs and called `firebase.auth()` before a DEFAULT Firebase app existed.
- The ADMIN bundle contained initialization, but it was loaded only after Auth had already been requested.

H90 boot order is now strict:
1. load `src/config.js`;
2. load Firebase App compat SDK;
3. call `firebase.initializeApp(Topkey.FIREBASE_CONFIG)` only when no app exists;
4. load Database/Auth compat SDKs;
5. call Firebase Auth;
6. load ADMIN/runtime bundles.

The initializer is idempotent and reuses the existing DEFAULT app on reload.

## 2. Sport-specific referee console

### Football
The main referee console now provides:
- live clock;
- period selection and stoppage time;
- goal +1 / score undo;
- yellow card;
- red card;
- substitution;
- per-team card/substitution counters;
- match event log;
- period advance;
- end-match confirmation.

Score remains in the same `scoreA/scoreB` data used by standings. Official incidents are stored in `officialMeta` + Event Log.

### Volleyball
The main referee console now provides:
- current set;
- current points and sets won;
- set-score chips;
- point +1 / -1;
- serving team;
- timeout;
- substitution;
- sanction;
- per-set timeout/substitution counts;
- next set;
- score/event undo;
- referee/scorer event log;
- end-match confirmation.

## 3. Regression protection

H90 preserves H89 full-interface i18n, H88 report/judging/public-link behavior, H87 schedule grouping, central RBAC, session-safe Hub flow, reporting, finance and ranking rules.

Service Worker cache authority is bumped to `u122h90-referee-auth-stability` for Hub, Badminton and VNext.
