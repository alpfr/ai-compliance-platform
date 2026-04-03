"""
AI Compliance Platform - AI Model management routes
"""

import json
import logging
from typing import Optional

import psycopg2
from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from config import ADMIN_ROLES
from db import get_db
from schemas import AIModel, BulkModelOperation

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/models", tags=["AI Models"])

_ADMIN_ROLE_VALUES = {r.value for r in ADMIN_ROLES}


def _require_model_admin(current_user: dict):
    if current_user["role"] not in _ADMIN_ROLE_VALUES:
        raise HTTPException(status_code=403, detail="Not authorized to manage AI models")


@router.get("")
async def get_models(
    industry_profile: Optional[str] = None,
    provider: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
):
    with get_db() as conn:
        query = "SELECT * FROM ai_models WHERE 1=1"
        params = []

        if industry_profile:
            query += " AND supported_industries LIKE %s"
            params.append(f"%{industry_profile}%")
        if provider:
            query += " AND provider = %s"
            params.append(provider)
        if status:
            query += " AND status = %s"
            params.append(status)
        if search:
            query += " AND (name ILIKE %s OR description ILIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])

        query += " ORDER BY name ASC LIMIT %s OFFSET %s"
        params.extend([limit, skip])

        models = conn.execute(query, params).fetchall()

        result = []
        for model in models:
            d = dict(model)
            d["capabilities"] = json.loads(d["capabilities"]) if d.get("capabilities") else []
            d["supported_industries"] = json.loads(d["supported_industries"]) if d.get("supported_industries") else []
            result.append(d)

        return result


@router.post("")
async def create_model(model: AIModel, current_user: dict = Depends(get_current_user)):
    _require_model_admin(current_user)

    with get_db() as conn:
        try:
            conn.execute(
                """
                INSERT INTO ai_models (
                    id, name, provider, version, description, capabilities,
                    supported_industries, is_active, is_recommended, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    model.id, model.name, model.provider, model.version,
                    model.description, json.dumps(model.capabilities),
                    json.dumps(model.supported_industries), model.is_active,
                    model.is_recommended, model.status,
                ),
            )

            conn.execute(
                "INSERT INTO audit_trail (user_id, action, resource_type, details) VALUES (%s, %s, %s, %s)",
                (
                    current_user["id"], "CREATE_MODEL", "ai_model",
                    json.dumps({"model_id": model.id, "model_name": model.name, "provider": model.provider}),
                ),
            )
            conn.commit()
            return {"success": True, "message": "Model created successfully"}
        except psycopg2.IntegrityError:
            conn.rollback()
            raise HTTPException(status_code=400, detail="Model ID already exists")


@router.put("/{model_id}")
async def update_model(model_id: str, model_update: dict, current_user: dict = Depends(get_current_user)):
    _require_model_admin(current_user)

    with get_db() as conn:
        existing = conn.execute("SELECT * FROM ai_models WHERE id = %s", (model_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Model not found")

        update_fields = []
        params = []

        for key, value in model_update.items():
            if key in ("capabilities", "supported_industries"):
                update_fields.append(f"{key} = %s")
                params.append(json.dumps(value))
            elif key != "id":
                update_fields.append(f"{key} = %s")
                params.append(value)

        if not update_fields:
            return {"success": True, "message": "No changes requested"}

        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        query = f"UPDATE ai_models SET {', '.join(update_fields)} WHERE id = %s"
        params.append(model_id)

        conn.execute(query, params)

        conn.execute(
            "INSERT INTO audit_trail (user_id, action, resource_type, details) VALUES (%s, %s, %s, %s)",
            (current_user["id"], "UPDATE_MODEL", "ai_model", json.dumps({"model_id": model_id, "changes": model_update})),
        )
        conn.commit()
        return {"success": True, "message": "Model updated successfully"}


@router.delete("/{model_id}")
async def delete_model(model_id: str, current_user: dict = Depends(get_current_user)):
    _require_model_admin(current_user)

    with get_db() as conn:
        cursor = conn.execute("DELETE FROM ai_models WHERE id = %s RETURNING id", (model_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Model not found")

        conn.execute(
            "INSERT INTO audit_trail (user_id, action, resource_type, details) VALUES (%s, %s, %s, %s)",
            (current_user["id"], "DELETE_MODEL", "ai_model", json.dumps({"model_id": model_id})),
        )
        conn.commit()
        return {"success": True, "message": "Model deleted successfully"}


@router.post("/bulk")
async def bulk_model_operation(operation: BulkModelOperation, current_user: dict = Depends(get_current_user)):
    _require_model_admin(current_user)

    if operation.operation != "delete":
        raise HTTPException(status_code=400, detail="Unsupported bulk operation")

    with get_db() as conn:
        success_count = 0
        failed_count = 0

        for model_id in operation.model_ids:
            cursor = conn.execute("DELETE FROM ai_models WHERE id = %s RETURNING id", (model_id,))
            if cursor.fetchone():
                success_count += 1
            else:
                failed_count += 1

        conn.execute(
            "INSERT INTO audit_trail (user_id, action, resource_type, details) VALUES (%s, %s, %s, %s)",
            (
                current_user["id"], "BULK_DELETE_MODELS", "ai_model",
                json.dumps({"model_ids": operation.model_ids, "success_count": success_count, "failed_count": failed_count}),
            ),
        )
        conn.commit()
        return {"success": True, "data": {"successful": success_count, "failed": failed_count}}


@router.get("/audit")
async def get_model_audit_logs(
    model_id: Optional[str] = None, limit: int = 50, current_user: dict = Depends(get_current_user)
):
    _require_model_admin(current_user)

    with get_db() as conn:
        query = """
            SELECT at.id, at.action, at.details, at.timestamp, u.username as user_name
            FROM audit_trail at
            JOIN users u ON at.user_id = u.id
            WHERE at.resource_type = 'ai_model'
        """
        params = []

        if model_id:
            query += " AND at.details LIKE %s"
            params.append(f'%"{model_id}"%')

        query += " ORDER BY at.timestamp DESC LIMIT %s"
        params.append(limit)

        logs = conn.execute(query, params).fetchall()

        result = []
        for log in logs:
            log_dict = dict(log)
            try:
                details = json.loads(log_dict["details"])
                result.append(
                    {
                        "id": log_dict["id"],
                        "timestamp": log_dict["timestamp"].isoformat(),
                        "operation_type": log_dict["action"].split("_")[0].lower(),
                        "model_name": details.get("model_name", details.get("model_id", "Unknown")),
                        "user_name": log_dict["user_name"],
                        "changes": details.get("changes", {}),
                    }
                )
            except Exception:
                continue

        return result
