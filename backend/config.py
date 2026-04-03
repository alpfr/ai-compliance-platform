"""
AI Compliance Platform - Application Configuration
All settings are loaded from environment variables with no insecure defaults.
"""

import os
from enum import Enum


# --- Required secrets (no defaults — app crashes early if missing) ---
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is required. "
        "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
    )

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is required.")

# --- JWT ---
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- CORS ---
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

# --- Seed data ---
ENABLE_SEED_DATA = os.getenv("ENABLE_SEED_DATA", "false").lower() == "true"

# --- Guardrail limits ---
MAX_REGEX_PATTERN_LENGTH = 500


# --- Enums for roles & statuses ---
class UserRole(str, Enum):
    ORGANIZATION_ADMIN = "organization_admin"
    REGULATORY_INSPECTOR = "regulatory_inspector"
    SUPER_ADMIN = "super_admin"


class UserStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    DISABLED = "disabled"


class AssessmentStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    UNDER_REVIEW = "under_review"


class GuardrailAction(str, Enum):
    BLOCK = "block"
    FLAG = "flag"
    ESCALATE = "escalate"


class ModelStatus(str, Enum):
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    UNDER_REVIEW = "under_review"


# Roles allowed to manage AI models and view audit logs
ADMIN_ROLES = {UserRole.ORGANIZATION_ADMIN, UserRole.REGULATORY_INSPECTOR, UserRole.SUPER_ADMIN}

# Corporate email validation — block free email providers
BLOCKED_EMAIL_DOMAINS = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "live.com"}
