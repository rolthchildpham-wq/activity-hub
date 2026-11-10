# Upgrade122 Hotfix26 - Commentary Single Fire

- Fixes duplicate playback when pressing the Fun Commentary microphone button.
- Root cause: the same button had both the Hotfix6 addEventListener handler and the Hotfix11 onclick handler.
- Hotfix26 replaces the button with a clean clone and attaches exactly one handler.
- Adds a 900 ms same-sentence double-tap guard.
- Keeps Hotfix25 applause, Hotfix24 schedule order controls, Hotfix22 offline reconcile, and all prior behavior.
