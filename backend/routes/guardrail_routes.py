"""
AI Compliance Platform - Guardrail routes
"""

import json
import logging
import re
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from db import get_db
from schemas import GuardrailRule, LLMFilterRequest, LLMFilterResponse
from validators import validate_regex_pattern

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Guardrails"])

# Module-level regex cache
_regex_cache: dict = {}


@router.get("/guardrails", response_model=List[GuardrailRule])
async def get_guardrail_rules(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rules = conn.execute("SELECT * FROM guardrail_rules ORDER BY name").fetchall()
        return [dict(rule) for rule in rules]


@router.post("/guardrails", response_model=GuardrailRule)
async def create_guardrail_rule(rule_data: GuardrailRule, current_user: dict = Depends(get_current_user)):
    try:
        validate_regex_pattern(rule_data.pattern)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid guardrail pattern: {e}")

    with get_db() as conn:
        cursor = conn.execute(
            """
            INSERT INTO guardrail_rules (name, rule_type, pattern, action, is_active, industry_profile)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
            """,
            (
                rule_data.name,
                rule_data.rule_type,
                rule_data.pattern,
                rule_data.action,
                rule_data.is_active,
                rule_data.industry_profile,
            ),
        )
        rule_id = cursor.fetchone()["id"]
        conn.commit()

        conn.execute(
            "INSERT INTO audit_trail (user_id, action, resource_type, resource_id, details) VALUES (%s, %s, %s, %s, %s)",
            (current_user["id"], "CREATE", "guardrail_rule", rule_id, json.dumps({"name": rule_data.name})),
        )
        conn.commit()

        rule_data.id = rule_id
        rule_data.created_at = datetime.utcnow()
        return rule_data


@router.post("/guardrails/filter", response_model=LLMFilterResponse)
async def filter_llm_content(filter_request: LLMFilterRequest, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rules = conn.execute(
            "SELECT * FROM guardrail_rules WHERE is_active = TRUE AND industry_profile = %s",
            (filter_request.industry_profile,),
        ).fetchall()

        filtered_content = filter_request.content
        violations = []
        applied_rules = []
        is_compliant = True

        for rule in rules:
            rule_dict = dict(rule)
            pattern = rule_dict["pattern"]

            try:
                if pattern not in _regex_cache:
                    validate_regex_pattern(pattern)
                    _regex_cache[pattern] = re.compile(pattern, re.IGNORECASE)
                regex = _regex_cache[pattern]

                matches = regex.findall(filter_request.content)
                if matches:
                    applied_rules.append(rule_dict["name"])

                    if rule_dict["action"] == "block":
                        filtered_content = regex.sub("[REDACTED]", filtered_content)
                        violations.append(f"Blocked content matching rule: {rule_dict['name']}")
                        is_compliant = False
                    elif rule_dict["action"] == "flag":
                        violations.append(f"Flagged content matching rule: {rule_dict['name']}")
            except (re.error, ValueError) as e:
                logger.warning(f"Skipping invalid guardrail pattern '{rule_dict['name']}': {e}")
                continue

        conn.execute(
            """
            INSERT INTO audit_trail (user_id, action, resource_type, resource_id, details)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                current_user["id"],
                "FILTER",
                "llm_content",
                None,
                json.dumps(
                    {"violations": len(violations), "applied_rules": applied_rules, "is_compliant": is_compliant}
                ),
            ),
        )
        conn.commit()

        return LLMFilterResponse(
            filtered_content=filtered_content,
            is_compliant=is_compliant,
            violations=violations,
            applied_rules=applied_rules,
        )
