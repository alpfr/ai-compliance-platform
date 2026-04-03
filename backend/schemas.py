"""
AI Compliance Platform - Pydantic request/response schemas
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class UserLogin(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "organization_admin"
    organization_name: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user_role: str
    organization_id: Optional[int] = None


class Organization(BaseModel):
    id: Optional[int] = None
    name: str
    industry: str = "financial_services"
    jurisdiction: str = "US"
    created_at: Optional[datetime] = None


class Assessment(BaseModel):
    id: Optional[int] = None
    organization_id: int
    assessment_type: str
    industry_profile: str = "financial_services"
    jurisdiction: str = "US"
    status: str = "in_progress"
    compliance_score: Optional[float] = None
    findings: List[str] = []
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class GuardrailRule(BaseModel):
    id: Optional[int] = None
    name: str
    rule_type: str
    pattern: str
    action: str = "block"
    is_active: bool = True
    industry_profile: str = "financial_services"
    created_at: Optional[datetime] = None


class LLMFilterRequest(BaseModel):
    content: str
    context: Dict[str, Any] = {}
    industry_profile: str = "financial_services"
    jurisdiction: str = "US"


class LLMFilterResponse(BaseModel):
    filtered_content: str
    is_compliant: bool
    violations: List[str] = []
    applied_rules: List[str] = []


class AIModel(BaseModel):
    id: str
    name: str
    provider: str
    version: Optional[str] = None
    description: Optional[str] = None
    capabilities: List[str] = []
    supported_industries: List[str] = []
    is_active: bool = True
    is_recommended: bool = False
    status: str = "active"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class BulkModelOperation(BaseModel):
    operation: str
    model_ids: List[str]
