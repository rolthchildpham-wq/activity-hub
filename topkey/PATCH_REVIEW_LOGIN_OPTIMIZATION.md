# Review of uploaded login/optimization patches

Release review target: **H85 Production Atomic Release**.

## `topkey-login-fix-full.zip`

**Decision: do not replace the current authentication module.**

Reason: its `auth.js` does not authenticate the password against Firebase or a trusted backend. It derives the role from the username on the client (`admin` in the name => admin), stores that result in `localStorage`, and reloads the page. In production this would allow an authentication/RBAC bypass.

Useful idea retained conceptually: a small in-memory cache can reduce repeated synchronous storage access, but it must never be the source of authentication authority.

## `topkey-optimization-patch-v2.zip`

**Decision: do not replace the current authentication module.**

Reason: it calls `/api/auth/login`, but when that request fails it falls back to mock local user data and can assign an admin role based on the username. A network/backend outage must fail closed, not grant a local session.

Useful ideas retained safely:

- prevent duplicate login submissions;
- keep debounce for high-frequency UI input;
- use `DocumentFragment`/batched DOM updates where a real table renderer benefits;
- escape user-supplied text before inserting HTML.

H85 implements duplicate-submit protection in both Badminton and VNext without replacing Firebase Auth/RBAC. Existing `U.debounce` remains the shared debounce utility.

## Credential format note

The production application currently uses Firebase **Email/Password**. Login inputs are email fields. A bare username such as `ADMIN` is not a Firebase email identity by itself. Supporting username aliases safely would require a trusted alias resolver / backend mapping to the Firebase email; H85 intentionally does not introduce an insecure client-side username-to-role fallback.
