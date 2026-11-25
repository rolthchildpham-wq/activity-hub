#!/usr/bin/env python3
"""Isolated static/UI fixture server. It never connects to Firebase or writes business data."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
import json
import sys


class FixtureHandler(SimpleHTTPRequestHandler):
    def _api_fixture(self):
        if not urlsplit(self.path).path.startswith("/api/"):
            return False
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length:
            self.rfile.read(length)
        payload = json.dumps({"ok": True, "fixture": "UI_ONLY", "data": {}}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)
        return True

    def do_GET(self):
        if not self._api_fixture():
            super().do_GET()

    def do_POST(self):
        if not self._api_fixture():
            self.send_error(405, "POST is disabled outside UI fixture endpoints")

    def do_OPTIONS(self):
        if not self._api_fixture():
            self.send_error(405, "OPTIONS is disabled outside UI fixture endpoints")


if __name__ == "__main__":
    root = sys.argv[1] if len(sys.argv) > 1 else "topkey"
    server = ThreadingHTTPServer(("127.0.0.1", 4173), partial(FixtureHandler, directory=root))
    print(f"TOPKEY UI fixture server: {root} on http://127.0.0.1:4173", flush=True)
    server.serve_forever()
