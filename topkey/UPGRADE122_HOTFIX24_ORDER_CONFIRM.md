# Upgrade122 Hotfix24 — Match Order + Simple Confirmation
- Fix ADMIN ↑/↓ when match objects do not contain `id`; Firebase key is authoritative fallback.
- Mount controls from actual rendered match code/day.
- Swap persisted time slots and update local state immediately.
- Replace typed confirmation phrase with OK/Cancel confirmation across Badminton via `Topkey.U.confirmDanger`.
- Confirmation is appended last / highest z-index; closing it closes other edit modals and returns to current tab.
