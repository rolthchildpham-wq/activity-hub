"""TikTok public metadata worker for TOPKEY. No TikTok OAuth, no media download.

Run behind an authenticated reverse proxy. Use a persistent disk for SQLite.
This is an optional backend, NOT an EdgeOne Pages static function.
"""
import json
import os
import re
import sqlite3
import subprocess
import sys
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

DB_PATH = os.environ.get("TOPKEY_TIKTOK_QUEUE_DB", "tiktok_queue.sqlite3")
TIKTOK_HOSTS = {"www.tiktok.com", "tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"}
VIDEO_RE = re.compile(r"^/(?:@[^/]+/video/|share/video/)([0-9]{15,22})/?$")


def validate_url(url):
    if not isinstance(url, str) or len(url) > 500:
        raise ValueError("Invalid TikTok link")
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in TIKTOK_HOSTS or parsed.username or parsed.password or parsed.port:
        raise ValueError("Only HTTPS TikTok links are supported")
    if parsed.hostname in {"vm.tiktok.com", "vt.tiktok.com"}:
        if not re.match(r"^/[A-Za-z0-9_-]+/?$", parsed.path):
            raise ValueError("Invalid TikTok short link")
    elif not VIDEO_RE.match(parsed.path):
        raise ValueError("Expected an individual TikTok video URL")
    return url


def extract(url, timeout=35):
    """yt-dlp returns metadata only. Missing metrics remain null, never zero."""
    validate_url(url)
    command = [sys.executable, "-m", "yt_dlp", "--dump-single-json",
               "--skip-download", "--no-playlist", "--no-warnings", "--", url]
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=timeout,
                                check=False, env={**os.environ, "PYTHONUNBUFFERED": "1"})
    except subprocess.TimeoutExpired:
        raise RuntimeError("TikTok metadata read timed out")
    if result.returncode != 0:
        raise RuntimeError("TikTok metadata unavailable or rate limited")
    try:
        raw = json.loads(result.stdout)
    except (ValueError, TypeError):
        raise RuntimeError("Invalid extractor response")
    stats = {}
    for output, field in (("views", "view_count"), ("likes", "like_count"),
                          ("shares", "repost_count")):
        v = raw.get(field)
        stats[output] = v if isinstance(v, int) and not isinstance(v, bool) and v >= 0 else None
    return {"ok": any(v is not None for v in stats.values()), "videoId": str(raw.get("id") or ""),
            "url": str(raw.get("webpage_url") or url), "stats": stats,
            "source": "yt-dlp public TikTok metadata",
            "fetchedAt": datetime.now(timezone.utc).isoformat()}


def connect():
    db = sqlite3.connect(DB_PATH, timeout=30)
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("""CREATE TABLE IF NOT EXISTS jobs (
       id TEXT PRIMARY KEY, url TEXT NOT NULL, status TEXT NOT NULL,
       result TEXT, attempts INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL)""")
    db.commit()
    return db


def enqueue(db, items):
    """IDs are assigned by the caller; duplicate IDs are ignored for safe retries."""
    accepted = 0
    for item in items:
        identifier = str(item["id"])
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,128}", identifier):
            raise ValueError("Invalid job id")
        url = validate_url(item["url"])
        cursor = db.execute("INSERT OR IGNORE INTO jobs(id,url,status,updated_at) VALUES (?,?,?,?)",
                            (identifier, url, "pending", int(time.time())))
        accepted += cursor.rowcount
    db.commit()
    return accepted


def work_one(db):
    item = db.execute("SELECT id,url,attempts FROM jobs WHERE status IN ('pending','retry') "
                      "AND attempts < 3 ORDER BY updated_at LIMIT 1").fetchone()
    if not item:
        return False
    identifier, url, attempts = item
    db.execute("UPDATE jobs SET status='running',attempts=attempts+1,updated_at=? WHERE id=?",
               (int(time.time()), identifier))
    db.commit()
    try:
        result = extract(url)
        status = "done" if result["ok"] else "no_data"
    except (ValueError, RuntimeError) as exc:
        result = {"ok": False, "message": str(exc)}
        status = "retry" if attempts < 2 else "failed"
    db.execute("UPDATE jobs SET status=?,result=?,updated_at=? WHERE id=?",
               (status, json.dumps(result), int(time.time()), identifier))
    db.commit()
    return True


def export(db):
    for identifier, url, status, result in db.execute(
            "SELECT id,url,status,result FROM jobs ORDER BY id"):
        print(json.dumps({"id": identifier, "url": url, "status": status,
                          "result": json.loads(result) if result else None}, ensure_ascii=False))


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python worker.py enqueue items.json | run | export")
    with connect() as db:
        if sys.argv[1] == "enqueue":
            with open(sys.argv[2], encoding="utf-8") as source:
                print("Enqueued:", enqueue(db, json.load(source)))
        elif sys.argv[1] == "run":
            while work_one(db):
                time.sleep(float(os.environ.get("TOPKEY_TIKTOK_DELAY_SECONDS", "3")))
        elif sys.argv[1] == "export":
            export(db)
        else:
            raise SystemExit("Unknown command")


if __name__ == "__main__":
    main()
