"""
AI Compliance Platform - Assessment routes
"""

import json
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from config import UserRole
from db import get_db
from schemas import Assessment

router = APIRouter(tags=["Assessments"])


@router.get("/assessments", response_model=List[Assessment])
async def get_assessments(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        if current_user["role"] == UserRole.REGULATORY_INSPECTOR:
            assessments = conn.execute("""
                SELECT a.*, o.name as organization_name
                FROM assessments a
                JOIN organizations o ON a.organization_id = o.id
                ORDER BY a.created_at DESC
            """).fetchall()
        else:
            assessments = conn.execute(
                "SELECT * FROM assessments WHERE organization_id = %s ORDER BY created_at DESC",
                (current_user["organization_id"],),
            ).fetchall()

        result = []
        for assessment in assessments:
            d = dict(assessment)
            d["findings"] = json.loads(d["findings"]) if d["findings"] else []
            result.append(d)
        return result


@router.post("/assessments", response_model=Assessment)
async def create_assessment(assessment_data: Assessment, current_user: dict = Depends(get_current_user)):
    if (
        current_user["role"] == UserRole.ORGANIZATION_ADMIN
        and assessment_data.organization_id != current_user["organization_id"]
    ):
        raise HTTPException(status_code=403, detail="Cannot create assessment for other organizations")

    with get_db() as conn:
        cursor = conn.execute(
            """
            INSERT INTO assessments (organization_id, assessment_type, industry_profile, jurisdiction, status, findings)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
            """,
            (
                assessment_data.organization_id,
                assessment_data.assessment_type,
                assessment_data.industry_profile,
                assessment_data.jurisdiction,
                assessment_data.status,
                json.dumps(assessment_data.findings),
            ),
        )
        assessment_id = cursor.fetchone()["id"]
        conn.commit()

        conn.execute(
            "INSERT INTO audit_trail (user_id, action, resource_type, resource_id, details) VALUES (%s, %s, %s, %s, %s)",
            (
                current_user["id"],
                "CREATE",
                "assessment",
                assessment_id,
                json.dumps({"type": assessment_data.assessment_type, "organization_id": assessment_data.organization_id}),
            ),
        )
        conn.commit()

        assessment_data.id = assessment_id
        assessment_data.created_at = datetime.utcnow()
        return assessment_data


@router.put("/assessments/{assessment_id}", response_model=Assessment)
async def update_assessment(
    assessment_id: int, assessment_data: Assessment, current_user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM assessments WHERE id = %s", (assessment_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Assessment not found")
        if (
            current_user["role"] == UserRole.ORGANIZATION_ADMIN
            and existing["organization_id"] != current_user["organization_id"]
        ):
            raise HTTPException(status_code=403, detail="Cannot update assessment for other organizations")

        conn.execute(
            """
            UPDATE assessments
            SET status = %s, compliance_score = %s, findings = %s, completed_at = %s
            WHERE id = %s
            """,
            (
                assessment_data.status,
                assessment_data.compliance_score,
                json.dumps(assessment_data.findings),
                assessment_data.completed_at,
                assessment_id,
            ),
        )
        conn.commit()

        conn.execute(
            "INSERT INTO audit_trail (user_id, action, resource_type, resource_id, details) VALUES (%s, %s, %s, %s, %s)",
            (
                current_user["id"],
                "UPDATE",
                "assessment",
                assessment_id,
                json.dumps({"status": assessment_data.status, "score": assessment_data.compliance_score}),
            ),
        )
        conn.commit()

        assessment_data.id = assessment_id
        return assessment_data
