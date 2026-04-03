"""
AI Compliance Platform - Authentication routes
"""

import logging

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from auth import hash_password, verify_password, create_access_token
from config import UserStatus
from db import get_db
from notifications import send_admin_approval_email
from schemas import UserLogin, UserCreate
from validators import is_corporate_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, user_data: UserLogin):
    try:
        with get_db() as conn:
            user = conn.execute(
                "SELECT * FROM users WHERE username = %s", (user_data.username,)
            ).fetchone()

            if not user or not verify_password(user_data.password, user["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid credentials")

            if "status" in user and user["status"] != UserStatus.ACTIVE:
                raise HTTPException(
                    status_code=403,
                    detail="Account pending approval. Contact your administrator.",
                )

            access_token = create_access_token(data={"sub": user["username"]})
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_role": user["role"],
                "organization_id": user.get("organization_id"),
            }
    except HTTPException:
        raise
    except Exception:
        logger.exception("Login failed with unexpected error")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/register", response_model=dict)
@limiter.limit("3/minute")
async def register(request: Request, user_data: UserCreate):
    if not is_corporate_email(user_data.email):
        raise HTTPException(
            status_code=400,
            detail="A valid corporate email domain is strictly required for platform access.",
        )

    with get_db() as conn:
        existing_user = conn.execute(
            "SELECT id FROM users WHERE username = %s OR email = %s",
            (user_data.username, user_data.email),
        ).fetchone()

        if existing_user:
            raise HTTPException(status_code=400, detail="Username or Corporate Email already registered")

        org_id = None
        if user_data.organization_name:
            cursor = conn.execute(
                "INSERT INTO organizations (name) VALUES (%s) RETURNING id",
                (user_data.organization_name,),
            )
            org_id = cursor.fetchone()["id"]

        conn.execute(
            "INSERT INTO users (username, email, password_hash, role, status, organization_id) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (
                user_data.username,
                user_data.email,
                hash_password(user_data.password),
                user_data.role,
                UserStatus.PENDING,
                org_id,
            ),
        )
        conn.commit()

        send_admin_approval_email(user_data.email, user_data.username)
        return {"message": "User registered. Awaiting admin approval."}
