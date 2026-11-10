# Upgrade122 Hotfix5 — Page Unresponsive Fix

- Fix infinite MutationObserver feedback loop introduced by Hotfix4 in Badminton Health/version repaint.
- DOM version text is only written when changed.
- Auto-update checks are serialized (single in-flight promise) and throttled.
- focus/pageshow update checks are debounced.
- Keeps Hotfix4 cacheTag/version comparison and safe self-heal behavior.
