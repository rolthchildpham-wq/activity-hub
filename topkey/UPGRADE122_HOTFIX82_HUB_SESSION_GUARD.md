# Hotfix82 - Hub session guard

- Fix login loop caused by `hub-entry-guard.js` requiring `entry=hub&hubTicket=...` on every reload.
- First entry still requires a valid Hub ticket.
- After a valid Hub entry, the ticket stored in sessionStorage authorizes internal reloads and URL cleanup for up to 8 hours in the same browser tab/session.
- Correct sport isolation is preserved: a ticket for badminton cannot open another sport.
- Fresh-login forcing still occurs only once for a newly issued Hub ticket.
