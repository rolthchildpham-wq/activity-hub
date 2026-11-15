"""TOPKEY TikTok public stats - EdgeOne Python Cloud Function.

No service-account key, no server-side RTDB write. The signed-in browser
writes through existing Firebase Realtime Database Rules after approval.
"""
from http.server import BaseHTTPRequestHandler
import base64
import json
import re
import time
from urllib.parse import urlparse

import cachecontrol
import requests
import google.auth.transport.requests
from google.auth.exceptions import TransportError
from google.oauth2 import id_token
import yt_dlp

PROJECT_ID = "topkey-badminton"
HOSTS = {"www.tiktok.com", "tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"}
VIDEO = re.compile(r"^/(?:@[^/]+/video/|share/video/)[0-9]{15,22}/?$")
SHORT = re.compile(r"^/[A-Za-z0-9_-]+/?$")
# Google-signed Firebase JWTs can be verified without service-account credentials.
# Cloud Functions may lack ADC; Admin SDK token checks can hang probing metadata.
# Honor Google's Cache-Control/max-age for Firebase signing certificates.
# A reused warm function can verify many requests without repeated Google calls.
CERT_HTTP_SESSION = cachecontrol.CacheControl(requests.Session())
GOOGLE_HTTP = google.auth.transport.requests.Request(session=CERT_HTTP_SESSION)


def verify_user_token(token):
    # Unverified claims here are used only to *reject* obviously invalid tokens.
    # All accepted tokens must still pass Google's RS256 signature check below.
    if not isinstance(token, str) or token.count(".") != 2 or len(token) > 11000:
        raise ValueError("Malformed Firebase ID token")

    try:
        head, body, _ = token.split(".")
        def decode_part(part):
            raw = base64.urlsafe_b64decode(part + "=" * (-len(part) % 4))
            return json.loads(raw)
        header, claims = decode_part(head), decode_part(body)
        now = time.time()
        if (header.get("alg") != "RS256" or
            not isinstance(header.get("kid"), str) or
            not 0 < len(header["kid"]) <= 256 or
            claims.get("aud") != PROJECT_ID or
            claims.get("iss") != "https://securetoken.google.com/" + PROJECT_ID or
            not isinstance(claims.get("sub"), str) or
            not claims["sub"] or len(claims["sub"]) > 128 or
            type(claims.get("iat")) is not int or
            type(claims.get("exp")) is not int or
            claims["iat"] > now + 60 or claims["exp"] <= now - 60):
            raise ValueError("Firebase token claims invalid")
    except (ValueError, KeyError, TypeError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("Malformed or expired Firebase ID token") from exc

    def request_with_timeout(**params):
        params["timeout"] = 4
        return GOOGLE_HTTP(**params)

    # This may fail due to EdgeOne-to-Google network connectivity.
    # TransportError is NOT a bad user token and must not be called a 401.
    verified = id_token.verify_firebase_token(token, request_with_timeout,
                                               audience=PROJECT_ID)
    if not verified or verified.get("sub") != claims["sub"]:
        raise ValueError("Firebase token identity invalid")
    return verified


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
            claims = verify_user_token(token[7:])
        except TransportError:
            self.respond(503, {"ok": False, "code": "FIREBASE_CERTS_UNAVAILABLE",
                               "message": "Google token verification temporarily unavailable"})
            return
        except Exception:
            self.respond(401, {"ok": False, "code": "INVALID_FIREBASE_TOKEN",
                               "message": "Invalid Firebase ID token"})
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
