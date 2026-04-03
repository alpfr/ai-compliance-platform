"""
AI Compliance Platform - Admin routes
"""

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from config import ADMIN_ROLES
from db import get_db
from notifications import send_client_activation_email

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users/pending")
async def get_pending_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in {r.value for r in ADMIN_ROLES}:
        raise HTTPException(status_code=403, detail="Authorized admin personnel only.")

    with get_db() as conn:
        pending = conn.execute(
            "SELECT id, username, email, role, created_at FROM users WHERE status = 'pending'"
        ).fetchall()
        return [dict(u) for u in pending]


@router.post("/users/{user_id}/approve")
async def approve_user(user_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in {r.value for r in ADMIN_ROLES}:
        raise HTTPException(status_code=403, detail="Authorized admin personnel only.")

    with get_db() as conn:
        user = conn.execute(
            "UPDATE users SET status = 'active' WHERE id = %s RETURNING email", (user_id,)
        ).fetchone()
        conn.commit()
        if not user:
            raise HTTPException(status_code=404, detail="Pending user not found.")

        if user["email"]:
            send_client_activation_email(user["email"])

        return {"message": "User approved successfully."}
