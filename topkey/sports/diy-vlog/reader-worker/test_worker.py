"""Offline checks for TOPKEY TikTok metadata worker. Run: python -m unittest discover -s reader-worker -v"""
import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("topkey_tiktok_worker", Path(__file__).with_name("worker.py"))
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)


class TikTokWorkerTests(unittest.TestCase):
    def test_links_are_restricted_to_tiktok_https(self):
        allowed = ["https://www.tiktok.com/@creator/video/7340000000000000000",
                   "https://vt.tiktok.com/ZSample/"]
        for url in allowed:
            self.assertEqual(worker.validate_url(url), url)
        for url in ["http://www.tiktok.com/@x/video/7340000000000000000",
                    "https://evil.example/video/7340000000000000000",
                    "https://tiktok.com.evil.example/@x/video/7340000000000000000",
                    "https://www.tiktok.com@evil.example/video/7340000000000000000",
                    "file:///etc/passwd", "https://127.0.0.1/private"]:
            with self.assertRaises(ValueError):
                worker.validate_url(url)

    def test_partial_metrics_never_become_zero(self):
        url = "https://www.tiktok.com/@creator/video/7340000000000000000"
        response = {"id": "7340000000000000000", "view_count": 123, "like_count": None}
        mock = type("Result", (), {"returncode": 0, "stdout": json.dumps(response)})()
        with patch.object(worker.subprocess, "run", return_value=mock):
            result = worker.extract(url)
        self.assertTrue(result["ok"])
        self.assertEqual(result["stats"]["views"], 123)
        self.assertIsNone(result["stats"]["likes"])
        self.assertIsNone(result["stats"]["shares"])

    def test_queue_deduplicates_ids_and_exports_results(self):
        with tempfile.TemporaryDirectory() as root:
            with patch.object(worker, "DB_PATH", os.path.join(root, "queue.db")):
                with worker.connect() as db:
                    item = {"id": "entry_1", "url": "https://vt.tiktok.com/ZSample/"}
                    self.assertEqual(worker.enqueue(db, [item, item]), 1)
                    self.assertEqual(db.execute("SELECT count(*) FROM jobs").fetchone()[0], 1)

    def test_retries_failed_extraction(self):
        with tempfile.TemporaryDirectory() as root:
            with patch.object(worker, "DB_PATH", os.path.join(root, "queue.db")):
                with worker.connect() as db:
                    worker.enqueue(db, [{"id": "entry_1", "url": "https://vt.tiktok.com/ZSample/"}])
                    with patch.object(worker, "extract", side_effect=RuntimeError("rate limited")):
                        self.assertTrue(worker.work_one(db))
                    self.assertEqual(db.execute("SELECT status FROM jobs").fetchone()[0], "retry")


if __name__ == "__main__":
    unittest.main()
