# Upgrade122 Hotfix63 - Executive Association Dashboard

- Replaces Hub technical-intro blocks with an executive dashboard for the multi-club association.
- Aggregates club count, tournament history, participant reach, champions and finance across all sports.
- Adds club metadata configuration: club display name, founded year, head organizer and active status.
- Adds leadership alerts for missing governance metadata, negative balance and pending financial items.
- Adds the independent permission card `Dashboard lãnh đạo` to account permission editors.
- ADMIN computes and saves the central aggregate snapshot. BTC/leadership accounts read the saved aggregate only.
- Adds Firebase rules for the central `associationDashboard` snapshot/config node.
