# H93 Acceptance Report

Release: **H93 · Compact Hub + Admin Content**  
Build: `u122h94-20261108`  
Version: `2026.11.08-vnext-upgrade122-hotfix94-header-layout`

Final source-tree result: **FULL_WEB_ACCEPTANCE_OK 509**.

New H93 regression coverage includes:
- compact 7-sport picker rendered above Executive Dashboard;
- sport cards show icon + sport name only;
- select-sport expiry note is integrated into the compact picker instead of a separate large panel;
- Hub retains read-only club calendar/report summary but no longer mounts the planning editor;
- System Admin hosts plan profile, milestones, budget and task assignment editor;
- Hub eyebrow/title/background are stored under `associationDashboard/hubAppearance`;
- uploaded Hub backgrounds are resized to max 1600 px and compressed to WebP before persistence;
- H92 club plan data, auth matrix, reports, public links, referee consoles, schedule/BXH and i18n regressions remain passing.
