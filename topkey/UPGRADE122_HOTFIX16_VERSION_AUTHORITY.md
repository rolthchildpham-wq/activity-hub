# Upgrade122 Hotfix16 — Version Authority / Auto-Update Recovery

- One authoritative runtime version for build.json, bootstrap, Health and Auto Update.
- Aligns Hotfix5 updater constants with Hotfix16.
- Replaces sticky one-shot update guard with bounded retry window.
- Wraps Health rendering so legacy Upgrade118 bundle cannot overwrite the effective version label.
- Keeps Piper/crowd caches while purging stale app/SW caches.
- No MutationObserver; low-frequency idempotent repaint only.
