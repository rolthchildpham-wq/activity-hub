# Vlog direct deployment / secure Firebase integration

**Release state: source branch only; do not merge or deploy without TOPKEY Production Gate.**

The worker has TWO processes on a persistent Python host: `uvicorn api:app --host 127.0.0.1 --port 8080` behind a TLS reverse proxy, and `python api.py run` on the same persistent SQLite volume. Do not expose SQLite or Python port publicly; the TLS gateway forwards only authenticated API calls. Use a managed process supervisor and persist the worker directory.

## Secure Firebase setup

Provide Google Application Default Credentials **only in the private server runtime**, via workload identity where supported. Never place a service-account JSON, OAuth token, or private key in GitHub or any front-end static assets. Set `FIREBASE_DATABASE_URL` to the production RTDB URL. The backend verifies Firebase ID tokens with revocation checks and reads `topkey_badminton_vnext_2026/users/{uid}` to enforce ADMIN/BTC DIY/Vlog access. The default root is **topkey_vlog2026_test**. Switch to production root only after staged role tests and explicit release approval.

The authenticated `POST /v1/jobs` queues at most 100 existing entries per request, only if their URLs are unchanged. `GET /v1/jobs` reports job counts. Running `python api.py run` extracts metadata and updates only returned numeric counters and audit timestamps via Firebase Admin transaction. Missing counters remain unchanged. The API does not accept metric values from callers. Admin SDK bypasses RTDB rules, so its server-only role check and scope are mandatory. Ensure server-side access to Firebase uses least-privilege infrastructure credentials.

## UI config

Set `window.__TOPKEY_TIKTOK_WORKER_API` to the authenticated TLS worker origin **before** `tiktok-automation.js` executes. Until set, the existing JSONP Reader V2 remains active. Configure `TOPKEY_VLOG_ORIGIN` on the backend to match the exact deployed origin. Do not add the worker URL to production until its API, CORS and Firebase tests pass.

## EdgeOne direct-upload constraint

Official CLI: `npm install -g edgeone@latest`, `edgeone login --site global`, `edgeone whoami`, `edgeone makers link` (if compatible), `edgeone makers deploy -e preview`. For a production release: `edgeone makers deploy -e production` **only after** all gates and explicit approval. Existing Git-connected EdgeOne projects may not support deploying local files into the same project; verify the project type in EdgeOne console first. Never automatically create an unrelated project and claim the original domain was updated. GitHub repository remains code backup only; no GitHub Actions in this workflow.

## Mandatory tests still pending

- Full Firebase user role matrix and deployed rules comparison
- Unit tests (Python worker and API), real public TikTok sample checks; verify shares semantics
- Desktop/mobile browser tests and 3 cold + 3 warm performance runs
- Direct EdgeOne preview deploy and served build SHA verification
- Production permission and release approval

Reference: https://pages.edgeone.ai/document/edgeone-cli
