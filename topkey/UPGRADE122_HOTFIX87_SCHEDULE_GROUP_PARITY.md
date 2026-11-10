# Upgrade122 Hotfix87 - Schedule Group Parity

Date: 2026-11-07

## Problem reproduced
In VNext sports (notably Volleyball and Football), Hotfix58 detached match rows from their date header because it globally appended all matched `<tr>` nodes to the end of `#matches-list`. The visible symptom was a block of date headers at the top followed by all matches below, so dates and matches appeared mixed.

Hotfix86 also decorated rows by array index including date-header rows. Once headers existed, stage/status labels and the quick-result button could bind to the wrong match.

## Fix
- Hotfix58 now keeps the day header as the anchor and sorts only match rows inside that day.
- Administrative-loss / walkover matches stay at the bottom of their own day, matching Badminton behavior.
- Within a day, `scheduleOrder` is respected when present, then time and match code.
- Each rendered row receives `data-match-id`.
- Hotfix86 no longer maps DOM rows to matches by numeric index; it resolves by `data-match-id` or match code.
- Stage and status labels are updated without destroying the existing status-badge element/classes.
- Current Badminton ordering policy is preserved: today/upcoming groups first, historical groups below; the important parity fix is that each match stays directly under the correct day header.

## Regression coverage
Real Chromium DOM regression runs both Volleyball and Football using the same fixture shown in the reported UI:
- Today 07/11/2026 stays grouped with M012.
- 03/11, 04/11, 05/11, 06/11 each keep their own matches immediately below the header.
- Walkover rows are bottom-of-day only.
- GROUP / SEMIFINAL / FINAL render as Vòng bảng / Bán kết / Chung kết.
- SCHEDULED / LIVE / FINISHED / WALKOVER labels remain bound to the correct match.

Full acceptance is recorded in `H87_ACCEPTANCE_REPORT.md`.
