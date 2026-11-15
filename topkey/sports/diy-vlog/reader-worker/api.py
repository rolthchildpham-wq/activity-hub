"""Authenticated TOPKEY Vlog ingest API and privileged Firebase writer.

Use a persistent Python server with a single worker process. This is not a
static EdgeOne Function. Do not expose the worker's SQLite file to the web.
"""
import json
import os
import re
import sqlite3
import sys
import time
from datetime import datetime, timezone

import firebase_admin
from firebase_admin import auth, credentials, db
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, Field

import worker

PROFILE_PATH = "topkey_badminton_vnext_2026/users"
ROOT = os.environ.get("TOPKEY_TIKTOK_ROOT", "topkey_vlog2026_test")
if ROOT not in ("topkey_vlog2026_test", "topkey_vlog2026"):
    raise RuntimeError("Invalid database root")
DATABASE_URL = os.environ.get("FIREBASE_DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("FIREBASE_DATABASE_URL is required")
if not firebase_admin._apps:
    firebase_admin.initialize_app(credentials.ApplicationDefault(), {"databaseURL": DATABASE_URL})
app = FastAPI(title="TOPKEY TikTok authenticated stats", docs_url=None, redoc_url=None)
ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,100}$")


def authorized_profile(profile):
    """Mirror Vlog's ADMIN/BTC access, deny explicitly disabled profiles."""
    p = profile if isinstance(profile, dict) else {}
    if any(p.get(k) is False for k in ("active", "enabled", "isActive")):
        return False
    if any(p.get(k) is True for k in ("disabled", "locked")):
        return False
    if str(p.get("status") or "").lower() in ("disabled", "blocked", "suspended", "inactive"):
        return False
    role = str(p.get("role") or "").upper().strip()
    scopes = p.get("sportScopes") or []
    if not isinstance(scopes, list):
        scopes = []
    scopes = [str(x).lower().strip() for x in scopes]
    scope = str(p.get("sportScope") or p.get("assignedSport") or "").lower().strip()
    access = p.get("sportAccess") or {}
    perms = p.get("permissions") or {}
    modules = perms.get("modules") or {}
    if role == "ADMIN":
        return True
    if role != "BTC":
        return False
    return (access.get("handmade") is True or access.get("vlog") is True
            or scope in ("handmade", "diy", "diy / handmade", "vlog")
            or any(s in ("handmade", "diy", "diy / handmade", "vlog") for s in scopes)
            or str(modules.get("vlog") or "").lower() == "edit")


def require_editor(authorization):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Firebase ID token required")
    try:
        claims = auth.verify_id_token(authorization[7:], check_revoked=True)
        profile = db.reference(PROFILE_PATH + "/" + claims["uid"]).get()
    except Exception:
        raise HTTPException(401, "Invalid or revoked Firebase token")
    if not authorized_profile(profile):
        raise HTTPException(403, "Insufficient Vlog scope")
    if ROOT == "topkey_vlog2026_test" and str(profile.get("role") or "").upper() != "ADMIN":
        raise HTTPException(403, "Test root requires ADMIN")
    return claims["uid"]


class Entry(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    url: str = Field(min_length=1, max_length=500)


class Batch(BaseModel):
    entries: list[Entry] = Field(min_length=1, max_length=100)


def validated_entry(item):
    if not ID_RE.fullmatch(item.id):
        raise HTTPException(422, "Invalid entry ID")
    try:
        worker.validate_url(item.url)
    except ValueError:
        raise HTTPException(422, "Invalid TikTok URL")
    current = db.reference(ROOT + "/entries/" + item.id).get()
    if not isinstance(current, dict) or current.get("url", "").strip() != item.url.strip():
        raise HTTPException(409, "Entry not found or URL changed")
    return current


@app.post("/v1/jobs")
def enqueue_batch(batch: Batch, authorization: str | None = Header(default=None)):
    uid = require_editor(authorization)
    # Validate the entire batch before any queue mutations.
    for item in batch.entries:
        validated_entry(item)
    now = int(time.time())
    jobs = [{"id": item.id + "_" + str(now // 900), "url": item.url}
            for item in batch.entries]
    with worker.connect() as queue:
        added = worker.enqueue(queue, jobs)
    return {"queued": added, "requested": len(jobs), "root": ROOT, "requestedBy": uid}


@app.get("/v1/jobs")
def job_status(authorization: str | None = Header(default=None)):
    require_editor(authorization)
    with worker.connect() as queue:
        counts = dict(queue.execute("SELECT status,COUNT(*) FROM jobs GROUP BY status").fetchall())
    return {"root": ROOT, "status": counts}


def apply_metrics(entry_id, expected_url, payload):
    """Transactional partial update: never clobber manual or unrelated fields."""
    stats = payload.get("stats") or {}
    allowed = {}
    for metric in ("views", "likes", "shares"):
        value = stats.get(metric)
        if type(value) is int and 0 <= value <= 1000000000:
            allowed[metric] = value
    if not allowed:
        return False
    ref = db.reference(ROOT + "/entries/" + entry_id)
    source_time = datetime.now(timezone.utc).isoformat()
    def mutate(old):
        if not isinstance(old, dict) or old.get("url", "").strip() != expected_url.strip():
            return old
        return {**old, **allowed, "statsSource": "yt-dlp public TikTok metadata",
                "statsFetchedAt": payload.get("fetchedAt") or source_time,
                "statsLastAutoSyncAt": source_time}
    before = ref.get()
    if not isinstance(before, dict) or before.get("url", "").strip() != expected_url.strip():
        return False
    result = ref.transaction(mutate)
    return isinstance(result, dict) and result.get("statsLastAutoSyncAt") == source_time


def work_once():
    """Run in ONE dedicated scheduler process; never in an HTTP request handler."""
    with worker.connect() as queue:
        row = queue.execute("SELECT id,url,attempts FROM jobs WHERE status IN ('pending','retry') "
                            "AND attempts < 3 ORDER BY updated_at LIMIT 1").fetchone()
        if not row:
            return False
        job_id, url, attempts = row
        entry_id = job_id.rsplit("_", 1)[0]
        queue.execute("UPDATE jobs SET status='running',attempts=attempts+1,updated_at=? WHERE id=?",
                      (int(time.time()), job_id))
        queue.commit()
    try:
        result = worker.extract(url)
        if not result["ok"]:
            raise RuntimeError("Metadata unavailable")
        updated = apply_metrics(entry_id, url, result)
        if not updated:
            raise RuntimeError("Entry missing or Firebase transaction failed")
        state = "done"
    except Exception as exc:
        # Do not expose secrets or raw provider errors through status API.
        result = {"ok": False, "message": type(exc).__name__}
        state = "retry" if attempts < 2 else "failed"
    with worker.connect() as queue:
        queue.execute("UPDATE jobs SET status=?,result=?,updated_at=? WHERE id=?",
                      (state, json.dumps(result), int(time.time()), job_id))
        queue.commit()
    return True


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] != "run":
        raise SystemExit("Run web: uvicorn api:app; worker: python api.py run")
    while True:
        if not work_once():
            time.sleep(5)
        else:
            time.sleep(max(2, float(os.environ.get("TOPKEY_TIKTOK_DELAY_SECONDS", "5"))))
