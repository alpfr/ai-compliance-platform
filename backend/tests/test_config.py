"""
Unit tests for config module - enums and constants.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests")
os.environ.setdefault("DATABASE_URL", "postgresql://localhost/test")

from config import (
    UserRole,
    UserStatus,
    AssessmentStatus,
    GuardrailAction,
    ModelStatus,
    ADMIN_ROLES,
    BLOCKED_EMAIL_DOMAINS,
)


class TestEnums:
    def test_user_roles(self):
        assert UserRole.ORGANIZATION_ADMIN == "organization_admin"
        assert UserRole.REGULATORY_INSPECTOR == "regulatory_inspector"
        assert UserRole.SUPER_ADMIN == "super_admin"

    def test_user_statuses(self):
        assert UserStatus.PENDING == "pending"
        assert UserStatus.ACTIVE == "active"
        assert UserStatus.DISABLED == "disabled"

    def test_assessment_statuses(self):
        assert AssessmentStatus.IN_PROGRESS == "in_progress"
        assert AssessmentStatus.COMPLETED == "completed"
        assert AssessmentStatus.UNDER_REVIEW == "under_review"

    def test_guardrail_actions(self):
        assert GuardrailAction.BLOCK == "block"
        assert GuardrailAction.FLAG == "flag"
        assert GuardrailAction.ESCALATE == "escalate"

    def test_model_statuses(self):
        assert ModelStatus.ACTIVE == "active"
        assert ModelStatus.DEPRECATED == "deprecated"

    def test_admin_roles_set(self):
        assert UserRole.ORGANIZATION_ADMIN in ADMIN_ROLES
        assert UserRole.REGULATORY_INSPECTOR in ADMIN_ROLES
        assert UserRole.SUPER_ADMIN in ADMIN_ROLES

    def test_blocked_email_domains(self):
        assert "gmail.com" in BLOCKED_EMAIL_DOMAINS
        assert "yahoo.com" in BLOCKED_EMAIL_DOMAINS
        assert "acme.com" not in BLOCKED_EMAIL_DOMAINS

    def test_enum_string_comparison(self):
        """Enums should work as string comparisons (str mixin)."""
        assert UserRole.ORGANIZATION_ADMIN == "organization_admin"
        assert "organization_admin" == UserRole.ORGANIZATION_ADMIN
