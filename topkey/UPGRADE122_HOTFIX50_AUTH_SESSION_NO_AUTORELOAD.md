# Upgrade122 Hotfix50 — Auth session / no automatic reload

Build: `2026.11.05-vnext-upgrade122-hotfix50-auth-session-no-autoreload`  
Cache tag: `u122h50-20261105`

## Fix
- Preboot update probe is detect-only; it never calls `location.replace()`.
- Upgrade55 background/focus/pageshow checks use `repair:false`; no automatic reload after login.
- Runtime authority defaults to non-repairing checks.
- Only an explicit manual **Kiểm tra bản mới** action may execute repair/reload.
- Email/password login explicitly sets Firebase Auth persistence to `LOCAL` before sign-in.
- New immutable admin/viewer bundle hashes prevent stale EdgeOne asset reuse.
