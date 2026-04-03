"""
AI Compliance Platform - Organization routes
"""

import json
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from config import UserRole
from db import get_db
from schemas import Organization

router = APIRouter(tags=["Organizations"])


@router.get("/organizations", response_model=List[Organization])
async def get_organizations(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        if current_user["role"] == UserRole.REGULATORY_INSPECTOR:
            orgs = conn.execute("SELECT * FROM organizations ORDER BY name").fetchall()
        else:
            orgs = conn.execute(
                "SELECT * FROM organizations WHERE id = %s",
                (current_user["organization_id"],),
            ).fetchall()
        return [dict(org) for org in orgs]


@router.post("/organizations", response_model=Organization)
async def create_organization(org_data: Organization, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.REGULATORY_INSPECTOR:
        raise HTTPException(status_code=403, detail="Only regulatory inspectors can create organizations")

    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO organizations (name, industry, jurisdiction) VALUES (%s, %s, %s) RETURNING id",
            (org_data.name, org_data.industry, org_data.jurisdiction),
        )
        org_id = cursor.fetchone()["id"]
        conn.commit()

        conn.execute(
            "INSERT INTO audit_trail (user_id, action, resource_type, resource_id, details) VALUES (%s, %s, %s, %s, %s)",
            (current_user["id"], "CREATE", "organization", org_id, json.dumps({"name": org_data.name})),
        )
        conn.commit()

        org_data.id = org_id
        org_data.created_at = datetime.utcnow()
        return org_data
