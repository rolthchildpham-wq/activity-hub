# Upgrade122 Hotfix86 - Report + Cross-Sport Parity Regression

Release: `u122h86-20261107`
Version: `2026.11.07-vnext-upgrade122-hotfix86-report-parity-regression`

## 1. Final report / PowerPoint

- Fix runtime error `BROWN is not defined` by defining the TKT theme colors as explicit HEX values.
- Restore missing `getLogoData()` helper used by the H80 PowerPoint generator.
- Real PptxGenJS regression creates a valid PPTX, embeds report images, and includes Finance Summary + Finance Detail slides.
- Test fixture finance is pushed into the live App state before H65/H80 builds the report, so Test Lab and Production use the same reporting pipeline.
- Badminton Test Lab finance fixture: Income 10,000,000 VND; Expense 4,200,000 VND; Balance 5,800,000 VND; 1 item not PAID.

## 2. Report language completeness

For the three export language profiles (`vi-en`, `vi-zh`, `en-vi-zh`), the system translates all application-owned labels/codes used by the report:

- headings and table labels;
- sport names;
- stages and match statuses;
- standard sport category codes;
- finance type/status labels;
- standard Test Lab fixture labels;
- standard prize labels and notes;
- report image section labels and thank-you slide.

User-entered proper names and arbitrary free text are preserved verbatim to avoid corrupting names, company names, team names, custom prize descriptions, or custom notes.

## 3. Badminton -> VNext UI/interaction parity

Only common features are reapplied. Badminton-only scoring/serve/rotation/audio logic is not copied to sports where it is semantically wrong.

Common VNext parity in H86:

- quick result modal for score/set sports with LIVE protection and BXH-safe finish flow;
- readable stage/status labels;
- modal team/athlete editor instead of chained browser prompts;
- confirmation before withdraw/restore;
- confirmation before registration approve/reject;
- finance KPI cards: Income / Expense / Balance / Unpaid;
- readable finance type/status labels;
- confirmation before finance approval / PAID transition;
- safe venue rename/delete retained;
- Running default venues use lanes;
- Cooking and DIY/Handmade use `Khu vực (Sảnh)`;
- one-click confirmation modal style is shared with Badminton.

Specialized modes remain specialized:

- Running: time/result screens;
- Cooking + Handmade: judged/rubric screens;
- Football/Volleyball/Shuttlecock: score/set result flow;
- Badminton: badminton-specific official/serve/audio/withdrawal-policy rules remain in Badminton.

## 4. Cross-hotfix conflicts fixed before release

- Hub was still writing `topkey_hub_session_v85` while H86 guards read `v86`. H86 now writes/reads the same session contract and migrates H83/H84/H85 safely.
- Report H80 lost theme constants and `getLogoData()` during prior consolidation; both are restored in Badminton and VNext report modules.
- H86 report implementation remains byte-parity between Badminton and VNext.

## 5. Regression gate

The final package must pass `tests/full_web_acceptance_h86.py` after packaging/unzipping. The suite covers auth roles, session/reload, atomic release, assets, syntax, report translation, Test Lab finance, real PptxGenJS generation, image embedding, venue rules, and current ranking/withdrawal regressions.
