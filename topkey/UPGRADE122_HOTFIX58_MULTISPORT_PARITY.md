# Upgrade122 Hotfix58 - MultiSport Parity

Date: 2026-11-06

## Scope
Synchronize the shared `/sports/vnext/` application used by Football, Volleyball, Running, Handmade, Shuttlecock and Cooking with the recent stable platform features proven in Badminton, while preserving sport-specific scoring rules.

## Main changes
- Shared VNext build bumped to `2026.11.06-vnext-upgrade122-hotfix58-multisport-parity`.
- Restored Upgrade9 granular permission/lifecycle module in the runtime load chain.
- Added Upgrade27 custom role presets (e.g. BTC/Organizer) to the shared multi-sport app.
- Firebase Auth sign-in now requests LOCAL persistence before credential sign-in.
- Public `#spectator` and `#register` routes no longer require the protected login UI.
- Public Viewer now uses the same canonical ranking engine as Admin and includes a public standings block.
- Canonical standings support category filtering and sport-specific tie breakers.
- Head-to-head / mini-league handling is available where the sport rule configuration requests it.
- Administrative losses/WO/retired/disqualified results are moved to the bottom of their day in the Admin schedule without changing stored dates/times.
- Setup public links card is visible to ADMIN and BTC/Organizer-like accounts with Settings view/edit permission; default Umpire accounts do not see it.
- Added Admin standings explanation/report for Top 1-2-3-4 with company logo, organizing committee signature, date, HTML/CSV/Print-PDF and VI/EN/ZH/bilingual/trilingual output.
- Report filenames follow: `ddmmyyyy_Báo cáo BXH_<Nội dung>_<Tên giải ngắn>`.
- Service worker cache upgraded to Hotfix58.

## Sport-specific ranking remains intact
- Football: configured win/draw/loss points, goal difference, goals scored, H2H when configured.
- Volleyball/Shuttlecock: configured match points, set differential, point differential, H2H when configured.
- Running: best time ascending.
- Handmade/Cooking: best judge score descending.

No Badminton scoring rule is forced onto another sport.
