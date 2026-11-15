"""Regression tests for EdgeOne Firebase JWT verification without live user secrets."""
import base64
import importlib.util
import json
import pathlib
import time
import unittest
from unittest.mock import patch
from google.auth.exceptions import TransportError

module_path = pathlib.Path(__file__).resolve().parents[1] / "topkey/cloud-functions/api/tiktok-metadata.py"
spec = importlib.util.spec_from_file_location("vlog_edgeone_api", module_path)
api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api)


def encoded(data):
    return base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip("=")


def sample_token(**overrides):
    header = {"alg": "RS256", "kid": "test-cert-id"}
    claims = {
        "aud": "topkey-badminton",
        "iss": "https://securetoken.google.com/topkey-badminton",
        "sub": "test-user",
        "iat": int(time.time()) - 60,
        "exp": int(time.time()) + 3600,
    }
    claims.update(overrides)
    return encoded(header) + "." + encoded(claims) + ".fake-signature"


class TokenVerificationTests(unittest.TestCase):
    def test_bad_tokens_do_not_trigger_certificate_request(self):
        with patch.object(api.id_token, "verify_firebase_token",
                          side_effect=AssertionError("network should not run")):
            for token in ("", "bad", "a.b.c", sample_token(aud="other-project"),
                          sample_token(exp=0), sample_token(iss="wrong")):
                with self.subTest(token=token[:20]):
                    with self.assertRaises(ValueError):
                        api.verify_user_token(token)

    def test_good_claims_require_google_signature_verification(self):
        with patch.object(api.id_token, "verify_firebase_token",
                          return_value={"sub": "test-user", "user_id": "test-user"}) as verify:
            self.assertEqual(api.verify_user_token(sample_token())["sub"], "test-user")
            self.assertEqual(verify.call_args.kwargs["audience"], "topkey-badminton")

    def test_certificate_outage_is_not_bad_token(self):
        with patch.object(api.id_token, "verify_firebase_token",
                          side_effect=TransportError("network blocked")):
            with self.assertRaises(TransportError):
                api.verify_user_token(sample_token())

    def test_identity_mismatch_rejected(self):
        with patch.object(api.id_token, "verify_firebase_token",
                          return_value={"sub": "different"}):
            with self.assertRaises(ValueError):
                api.verify_user_token(sample_token())


if __name__ == "__main__":
    unittest.main()
