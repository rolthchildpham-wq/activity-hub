# Hotfix32 – Auth Readiness

Fixes the H31 login race where `Topkey.Auth.login` existed before `Topkey.Data.auth` was initialized. Login now waits for a real Firebase Auth instance with bounded retry, and the admin-core asset has a new immutable hash so stale H31 core cannot be reused.
