"""
Unit tests for auth module.
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests")
os.environ.setdefault("DATABASE_URL", "postgresql://localhost/test")

from auth import hash_password, verify_password, create_access_token
import jwt
from config import SECRET_KEY, ALGORITHM


class TestPasswordHashing:
    def test_hash_and_verify(self):
        password = "secure-password-123"
        hashed = hash_password(password)
        assert hashed != password
        assert verify_password(password, hashed) is True

    def test_wrong_password_fails(self):
        hashed = hash_password("correct-password")
        assert verify_password("wrong-password", hashed) is False

    def test_bcrypt_format(self):
        hashed = hash_password("test")
        assert hashed.startswith("$2")

    def test_sha256_legacy_fallback(self):
        import hashlib
        legacy_hash = hashlib.sha256("legacy-pass".encode()).hexdigest()
        assert verify_password("legacy-pass", legacy_hash) is True
        assert verify_password("wrong-pass", legacy_hash) is False

    def test_invalid_hash_returns_false(self):
        assert verify_password("password", "not-a-valid-hash") is False


class TestAccessToken:
    def test_create_token_contains_sub(self):
        token = create_access_token(data={"sub": "testuser"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "testuser"

    def test_token_has_expiry(self):
        token = create_access_token(data={"sub": "testuser"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in payload

    def test_token_with_extra_data(self):
        token = create_access_token(data={"sub": "admin", "role": "organization_admin"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "admin"
        assert payload["role"] == "organization_admin"
