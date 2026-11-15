"""Unit tests for Firebase writer; no live Firebase or secrets needed."""
import importlib
import os
import sys
import types
import unittest
from unittest.mock import patch

# api.py checks database URL during import. This dummy URL is never contacted.
os.environ.setdefault("FIREBASE_DATABASE_URL", "https://example.test")
import firebase_admin
from firebase_admin import db
with patch.object(firebase_admin, "initialize_app", return_value=None), patch.object(firebase_admin, "_apps", {"test": object()}):
    api = importlib.import_module("api")


class FakeReference:
    def __init__(self, value):
        self.value = value
    def get(self):
        return self.value
    def transaction(self, mutate):
        self.value = mutate(self.value)
        return self.value


class FirebaseWriterTests(unittest.TestCase):
    def test_role_matrix(self):
        cases = [
            ({"role": "ADMIN"}, True),
            ({"role": "ADMIN", "disabled": True}, False),
            ({"role": "ADMIN", "locked": True}, False),
            ({"role": "ADMIN", "active": False}, False),
            ({"role": "BTC", "sportScope": "handmade"}, True),
            ({"role": "BTC", "sportAccess": {"vlog": True}}, True),
            ({"role": "BTC", "permissions": {"modules": {"vlog": "edit"}}}, True),
            ({"role": "BTC", "sportScope": "badminton"}, False),
            ({"role": "UMPIRE", "sportScope": "vlog"}, False),
            ({"role": "VIEWER"}, False),
            ({}, False),
        ]
        for profile, expected in cases:
            with self.subTest(profile=profile):
                self.assertEqual(api.authorized_profile(profile), expected)

    def test_partial_result_preserves_missing_metrics(self):
        reference = FakeReference({"url": "https://vt.tiktok.com/Zabc/", "views": 5,
                                   "likes": 11, "shares": 9, "name": "contestant"})
        with patch.object(db, "reference", return_value=reference):
            ok = api.apply_metrics("entry_a", "https://vt.tiktok.com/Zabc/",
                                   {"stats": {"views": 23, "likes": None, "shares": None}})
        self.assertTrue(ok)
        self.assertEqual(reference.value["views"], 23)
        self.assertEqual(reference.value["likes"], 11)
        self.assertEqual(reference.value["shares"], 9)
        self.assertEqual(reference.value["name"], "contestant")

    def test_url_change_prevents_write(self):
        reference = FakeReference({"url": "https://vt.tiktok.com/Changed/", "views": 5})
        with patch.object(db, "reference", return_value=reference):
            ok = api.apply_metrics("entry_a", "https://vt.tiktok.com/Old/",
                                   {"stats": {"views": 100}})
        self.assertFalse(ok)
        self.assertEqual(reference.value["views"], 5)

    def test_invalid_numbers_are_not_written(self):
        reference = FakeReference({"url": "https://vt.tiktok.com/Zabc/", "views": 5})
        with patch.object(db, "reference", return_value=reference):
            ok = api.apply_metrics("entry_a", "https://vt.tiktok.com/Zabc/",
                                   {"stats": {"views": True, "likes": -1, "shares": "900"}})
        self.assertFalse(ok)
        self.assertEqual(reference.value["views"], 5)


if __name__ == "__main__":
    unittest.main()
