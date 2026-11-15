"""TOPKEY TikTok public stats - EdgeOne Python Cloud Function.

No service-account key, no server-side RTDB write. The signed-in browser
writes through existing Firebase Realtime Database Rules after approval.
"""
from http.server import BaseHTTPRequestHandler
import json
import re
from urllib.parse import urlparse

import firebase_admin
from firebase_admin import auth
import yt_dlp

PROJECT_ID = "topkey-badminton"
HOSTS = {"www.tiktok.com", "tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"}
VIDEO = re.compile(r"^/(?:@[^/]+/video/|share/video/)[0-9]{15,22}/?$")
SHORT = re.compile(r"^/[A-Za-z0-9_-]+/?$")
if not firebase_admin._apps:
    firebase_admin.initialize_app(options={"projectId": PROJECT_ID})


def validate_url(value):
    if not isinstance(value, str) or len(value) > 500:
        raise ValueError("TikTok URL required")
    p = urlparse(value)
    if p.scheme != "https" or p.hostname not in HOSTS or p.port or p.username or p.password:
        raise ValueError("HTTPS TikTok URL required")
    if p.hostname in ("vm.tiktok.com", "vt.tiktok.com"):
        if not SHORT.fullmatch(p.path):
            raise ValueError("Invalid short link")
    elif not VIDEO.fullmatch(p.path):
        raise ValueError("Individual TikTok video required")
    return value


def extract(value):
    validate_url(value)
    opts = {"quiet": True, "no_warnings": True, "skip_download": True,
            "noplaylist": True, "socket_timeout": 8, "retries": 0,
            "extractor_retries": 0, "ignoreerrors": False}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(value, download=False)
    if not isinstance(info, dict):
        raise RuntimeError("Metadata not available")
    stats = {}
    for name, source in (("views", "view_count"), ("likes", "like_count"), ("shares", "repost_count")):
        v = info.get(source)
        stats[name] = v if type(v) is int and 0 <= v <= 1_000_000_000 else None
    if all(v is None for v in stats.values()):
        raise RuntimeError("No public counters")
    return {"ok": True, "videoId": str(info.get("id") or ""), "stats": stats,
            "source": "yt-dlp public TikTok metadata"}


class handler(BaseHTTPRequestHandler):
    def respond(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self.respond(405, {"ok": False, "message": "POST required"})

    def do_POST(self):
        token = self.headers.get("Authorization", "")
        if not token.startswith("Bearer ") or len(token) > 12000:
            self.respond(401, {"ok": False, "message": "Firebase sign-in required"})
            return
        try:
            claims = auth.verify_id_token(token[7:], check_revoked=False)
            if not claims.get("uid"):
                raise ValueError("Missing UID")
        except Exception:
            self.respond(401, {"ok": False, "message": "Invalid Firebase ID token"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 2048:
                raise ValueError("Invalid request size")
            body = json.loads(self.rfile.read(length))
            url = validate_url(body.get("url"))
        except (ValueError, TypeError, KeyError, json.JSONDecodeError):
            self.respond(422, {"ok": False, "message": "Invalid TikTok URL"})
            return
        try:
            result = extract(url)
            self.respond(200, result)
        except Exception:
            # Avoid echoing raw network, video or third-party exceptions.
            self.respond(502, {"ok": False, "message": "TikTok metadata unavailable"})
