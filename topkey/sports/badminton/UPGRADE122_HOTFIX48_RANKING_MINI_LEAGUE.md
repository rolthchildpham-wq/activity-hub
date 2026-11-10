# Upgrade122 Hotfix48 — Ranking Mini-League

Ranking priority is fixed to:

1. Ranking points
2. Head-to-head when exactly 2 teams are tied; mini-league when 3+ teams are tied
3. Overall set difference
4. Overall point difference
5. Sets won
6. Points scored
7. Name only as a deterministic final fallback

For a 3+ team tie, the mini-league uses only matches among the tied teams and compares mini ranking points, mini set difference, then mini point difference. Pairwise H2H is never used directly as the comparator for a 3+ team group, preventing non-transitive A>B, B>C, C>A sorting.

Admin, public viewer, and source `src/app.js` are patched consistently. Existing withdrawal handling is preserved: withdrawn teams retain statistics but are placed after active teams; qualification continues to use `rankingEligible()`.
