# H96 Header Reference Layout Design

## Intent
Match the Hub header in the supplied reference image before starting the separate H97 deep architecture overhaul.

## Goals
- Render the default Vietnamese title as exactly two desktop lines, breaking after `&`.
- Keep the green subtitle directly below the title.
- Keep the TOPKEY logo at the left and release/status badges at the right.
- Preserve safe responsive stacking and Hub Appearance custom titles.
- Publish an atomic H96 cache/build across Hub, Badminton, and VNext.

## Non-goals
- No VNext rebundle, Firebase pagination, schema migration, or runtime behavior change.
- No change to auth, business workflows, reports, or H95 performance hardening.

## Approaches
1. Width-based natural wrapping: small CSS change, but the break point varies by font and viewport.
2. Explicit semantic title lines: deterministic match to the reference and translations can map each line independently. Selected.
3. Rasterize the title: exact pixels but inaccessible and incompatible with custom titles. Rejected.

## Design
The default `h1` contains two block line spans. CSS sizes the middle column and title for two stable lines while the status group remains a separate right column. Below the desktop breakpoint, the header stacks and custom titles wrap naturally. `hub-layout94.js` keeps applying administrator-provided titles as text, so custom content is never interpreted as HTML.

## Release
H96 uses `u122h96-20261108`, build `upgrade122-hotfix96`, and version `2026.11.08-vnext-upgrade122-hotfix96-header-reference-layout`. H97 remains reserved for the deep overhaul.
