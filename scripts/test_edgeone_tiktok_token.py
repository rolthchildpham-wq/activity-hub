"""Unit tests for EdgeOne Firebase public-certificate verification (no service account)."""
import importlib.util
import pathlib
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
PATH = ROOT / "topkey/cloud-functions/api/tiktok-metadata.py"
spec = importlib.util.spec_from_file_location("topkey_edgeone_tiktok", PATH)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FirebaseTokenTests(unittest.TestCase):
    def test_malformed_jwt_rejected_without_network(self):
        with patch.object(module.id_token, "verify_firebase_token",
                          side_effect=AssertionError("unexpected verification")):
            for token in ("", "invalid", "a.b", "a.b.c.d"):
                with self.subTest(token=token):
                    with self.assertRaises(ValueError):
                        module.verify_user_token(token)

    def test_calls_firebase_signature_verifier_for_correct_project(self):
        claims = {"sub": "firebase_uid", "user_id": "firebase_uid"}
        with patch.object(module.id_token, "verify_firebase_token", return_value=claims) as verify:
            self.assertEqual(module.verify_user_token("head.body.sig"), claims)
            self.assertEqual(verify.call_args.kwargs["audience"], "topkey-badminton")

    def test_requires_user_identity(self):
        with patch.object(module.id_token, "verify_firebase_token",
                          return_value={"sub": "firebase_uid"}):
            with self.assertRaises(ValueError):
                module.verify_user_token("head.body.sig")

    def test_url_hosts_must_be_tiktok(self):
        self.assertEqual(module.validate_url("https://vt.tiktok.com/ZSpqUnyWQ/"),
                         "https://vt.tiktok.com/ZSpqUnyWQ/")
        for url in ("https://example.com/x",
                    "http://www.tiktok.com/@test/video/7707908008235355412"):
            with self.assertRaises(ValueError):
                module.validate_url(url)


if __name__ == "__main__":
    unittest.main()
