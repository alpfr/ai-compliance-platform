"""
AI Compliance Platform - Dashboard & audit trail routes
"""

from fastapi import APIRouter, Depends

from auth import get_current_user
from config import UserRole
from db import get_db

router = APIRouter(tags=["Dashboard"])


@router.get("/audit-trail")
async def get_audit_trail(current_user: dict = Depends(get_current_user), limit: int = 100):
    with get_db() as conn:
        if current_user["role"] == UserRole.REGULATORY_INSPECTOR:
            trail = conn.execute(
                """
                SELECT at.*, u.username
                FROM audit_trail at
                LEFT JOIN users u ON at.user_id = u.id
                ORDER BY at.timestamp DESC
                LIMIT %s
                """,
                (limit,),
            ).fetchall()
        else:
            trail = conn.execute(
                """
                SELECT at.*, u.username
                FROM audit_trail at
                LEFT JOIN users u ON at.user_id = u.id
                WHERE u.organization_id = %s
                ORDER BY at.timestamp DESC
                LIMIT %s
                """,
                (current_user["organization_id"], limit),
            ).fetchall()

        return [dict(entry) for entry in trail]


@router.get("/compliance/dashboard")
async def get_compliance_dashboard(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        if current_user["role"] == UserRole.REGULATORY_INSPECTOR:
            total_orgs = conn.execute("SELECT COUNT(*) as count FROM organizations").fetchone()["count"]
            total_assessments = conn.execute("SELECT COUNT(*) as count FROM assessments").fetchone()["count"]
            completed_assessments = conn.execute(
                "SELECT COUNT(*) as count FROM assessments WHERE status = 'completed'"
            ).fetchone()["count"]

            recent_assessments = conn.execute(
                """
                SELECT a.*, o.name as organization_name
                FROM assessments a
                JOIN organizations o ON a.organization_id = o.id
                ORDER BY a.created_at DESC
                LIMIT 5
                """
            ).fetchall()

            return {
                "user_role": UserRole.REGULATORY_INSPECTOR,
                "total_organizations": total_orgs,
                "total_assessments": total_assessments,
                "completed_assessments": completed_assessments,
                "compliance_rate": (completed_assessments / total_assessments * 100) if total_assessments > 0 else 0,
                "recent_assessments": [dict(a) for a in recent_assessments],
            }
        else:
            org_id = current_user["organization_id"]
            org_assessments = conn.execute(
                "SELECT COUNT(*) as count FROM assessments WHERE organization_id = %s", (org_id,)
            ).fetchone()["count"]

            completed_assessments = conn.execute(
                "SELECT COUNT(*) as count FROM assessments WHERE organization_id = %s AND status = 'completed'",
                (org_id,),
            ).fetchone()["count"]

            avg_score = (
                conn.execute(
                    "SELECT AVG(compliance_score) as avg_score FROM assessments WHERE organization_id = %s AND compliance_score IS NOT NULL",
                    (org_id,),
                ).fetchone()["avg_score"]
                or 0
            )

            recent_violations = conn.execute(
                """
                SELECT COUNT(*) as count FROM audit_trail at
                JOIN users u ON at.user_id = u.id
                WHERE u.organization_id = %s AND at.action = 'FILTER' AND at.details LIKE '%%"is_compliant": false%%'
                AND at.timestamp > NOW() - INTERVAL '7 days'
                """,
                (org_id,),
            ).fetchone()["count"]

            recent_assessments = conn.execute(
                "SELECT * FROM assessments WHERE organization_id = %s ORDER BY created_at DESC LIMIT 5",
                (org_id,),
            ).fetchall()

            return {
                "user_role": UserRole.ORGANIZATION_ADMIN,
                "total_assessments": org_assessments,
                "completed_assessments": completed_assessments,
                "average_compliance_score": round(avg_score, 2),
                "recent_violations": recent_violations,
                "compliance_status": "compliant" if avg_score >= 80 else "needs_attention",
                "recent_assessments": [dict(a) for a in recent_assessments],
            }
