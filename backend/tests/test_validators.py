"""
Unit tests for validators module.
"""

import pytest
import sys
import os

# Add parent dir to path so we can import backend modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Set required env vars before importing anything that touches config
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests")
os.environ.setdefault("DATABASE_URL", "postgresql://localhost/test")

from validators import validate_regex_pattern, is_corporate_email


class TestValidateRegexPattern:
    def test_valid_simple_pattern(self):
        assert validate_regex_pattern(r"\b\d{3}-\d{2}-\d{4}\b") == r"\b\d{3}-\d{2}-\d{4}\b"

    def test_valid_credit_card_pattern(self):
        assert validate_regex_pattern(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b")

    def test_invalid_regex_raises(self):
        with pytest.raises(ValueError, match="Invalid regex pattern"):
            validate_regex_pattern(r"[invalid")

    def test_pattern_too_long_raises(self):
        with pytest.raises(ValueError, match="too long"):
            validate_regex_pattern("a" * 501)

    def test_dangerous_nested_quantifier_plus_plus(self):
        with pytest.raises(ValueError, match="dangerous"):
            validate_regex_pattern(r"(.+)+")

    def test_dangerous_nested_quantifier_plus_star(self):
        with pytest.raises(ValueError, match="dangerous"):
            validate_regex_pattern(r"(.+)*")

    def test_dangerous_nested_quantifier_star_star(self):
        with pytest.raises(ValueError, match="dangerous"):
            validate_regex_pattern(r"(.*)*")

    def test_max_length_boundary(self):
        # r"\d" is 2 chars, so 250 repeats = 500 chars exactly at boundary
        pattern = r"\d" * 250
        assert validate_regex_pattern(pattern) == pattern

    def test_empty_pattern(self):
        # Empty pattern is valid regex
        assert validate_regex_pattern("") == ""


class TestIsCorporateEmail:
    def test_corporate_email(self):
        assert is_corporate_email("user@acme.com") is True

    def test_gmail_blocked(self):
        assert is_corporate_email("user@gmail.com") is False

    def test_yahoo_blocked(self):
        assert is_corporate_email("user@yahoo.com") is False

    def test_hotmail_blocked(self):
        assert is_corporate_email("user@hotmail.com") is False

    def test_outlook_blocked(self):
        assert is_corporate_email("user@outlook.com") is False

    def test_case_insensitive(self):
        assert is_corporate_email("user@Gmail.COM") is False

    def test_subdomain_allowed(self):
        # subdomain of blocked domain is allowed (corp.gmail.com is not gmail.com)
        assert is_corporate_email("user@corp.gmail.com") is True
