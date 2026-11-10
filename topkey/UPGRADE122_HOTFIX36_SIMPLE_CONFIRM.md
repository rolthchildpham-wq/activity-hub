# Upgrade122 Hotfix36 — Simple Confirmation

- Removes phrase-typing confirmation globally from Badminton `U.confirmDanger()`.
- All dangerous actions now use one modal with only **Hủy** and **Xác nhận**.
- The legacy `phrase` argument is retained only for API compatibility and is ignored.
- The old `#confirm-input` remains as a hidden compatibility node; it is never shown or validated.
- Before opening the confirmation modal, other `.modal` dialogs are closed so the confirmation is always the top/last dialog.
- Admin core hash and PWA cache/version are bumped so old typed-confirm code cannot be reused from cache.

Version: `2026.11.03-vnext-upgrade122-hotfix36-simple-confirm`
Cache tag: `u122h36-20261103`
