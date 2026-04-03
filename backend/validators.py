"""
AI Compliance Platform - Input validators
"""

import re

from config import MAX_REGEX_PATTERN_LENGTH, BLOCKED_EMAIL_DOMAINS

# Patterns known to cause catastrophic backtracking (ReDoS)
_DANGEROUS_SUBSTRINGS = [
    r"(.*){2,}",
    r"(.+)+",
    r"(.+)*",
    r"(.*)+",
    r"(.*)*",
]


def validate_regex_pattern(pattern: str) -> str:
    """Validate a regex pattern for safety and correctness.

    Raises ValueError if the pattern is too long, contains known
    catastrophic-backtracking constructs, or is not a valid regex.
    """
    if len(pattern) > MAX_REGEX_PATTERN_LENGTH:
        raise ValueError(f"Pattern too long (max {MAX_REGEX_PATTERN_LENGTH} chars)")

    for dp in _DANGEROUS_SUBSTRINGS:
        if dp in pattern:
            raise ValueError("Pattern contains potentially dangerous nested quantifiers")

    try:
        re.compile(pattern)
    except re.error as e:
        raise ValueError(f"Invalid regex pattern: {e}")

    return pattern


def is_corporate_email(email: str) -> bool:
    """Return True if the email domain is NOT a blocked free-mail provider."""
    domain = email.split("@")[-1].lower()
    return domain not in BLOCKED_EMAIL_DOMAINS
