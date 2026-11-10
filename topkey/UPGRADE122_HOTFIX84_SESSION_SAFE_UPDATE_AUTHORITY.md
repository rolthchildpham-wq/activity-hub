# Upgrade122 Hotfix84 — Session-Safe Update Authority

- Fixes Health showing legacy runtime versions while server is current.
- Final H84 version authority pins runtime/boot version after all legacy hotfixes.
- “Kiểm tra bản mới” never reloads when server already matches H84.
- A real newer build uses a controlled reload with Firebase/Hub authentication handoff.
- H83 Hub sessions migrate to H84 without forcing a new login.
- Applied to Badminton and VNext sports.
