# H101 - Safety preflight (STAGING, not deployable)

This package retains H100 source as-is. It **does not** claim the requested v2 application changes have been implemented.

Run `python3 tools/h101/verify_backup_v2.py backup.json --out report.json` for a read-only backup inventory, SHA-256 and basic match references. Do not use the result alone to authorize a migration.

Required before deployment: implement and browser-test all seven sports CSV roundtrips; auth restore; winner determination; paged Firebase queries with rules and indexes; live subscriptions; financial aggregates; resumable migration and reversible rollback; regression, large-data and real-device tests. None of these gates is passed by this script.

Never upload supplied backup files to a public host or commit them into a public repository. This package intentionally excludes user-provided backups.
