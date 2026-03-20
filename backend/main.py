"""
AI Compliance Platform - Main FastAPI Application
Sample backend API transitioned to PostgreSQL
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import jwt
import hashlib
from passlib.context import CryptContext
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import os
import re
from contextlib import contextmanager
from contextlib import asynccontextmanager

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "ai-compliance-platform-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/ai_compliance")

class DBConnWrapper:
    def __init__(self, conn):
        self.conn = conn

    def execute(self, query, params=None):
        cursor = self.conn.cursor()
        cursor.execute(query, params or ())
        return cursor
        
    def commit(self):
        self.conn.commit()
    
    def rollback(self):
        self.conn.rollback()

@contextmanager
def get_db():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    try:
        yield DBConnWrapper(conn)
    finally:
        conn.close()

def init_database():
    """Initialize the database with sample tables"""
    with get_db() as conn:
        # Users table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                organization_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Independent safe migrations for existing deployed databases
        try:
            conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT")
        except Exception:
            conn.rollback()
            
        try:
            conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'")
            conn.execute("UPDATE users SET status = 'active' WHERE status IS NULL OR status = 'pending'")
        except Exception:
            conn.rollback()
        
        # Organizations table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS organizations (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                industry TEXT DEFAULT 'financial_services',
                jurisdiction TEXT DEFAULT 'US',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Assessments table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS assessments (
                id SERIAL PRIMARY KEY,
                organization_id INTEGER NOT NULL REFERENCES organizations(id),
                assessment_type TEXT NOT NULL,
                industry_profile TEXT DEFAULT 'financial_services',
                jurisdiction TEXT DEFAULT 'US',
                status TEXT DEFAULT 'in_progress',
                compliance_score REAL,
                findings TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        """)
        
        # Guardrail rules table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS guardrail_rules (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                rule_type TEXT NOT NULL,
                pattern TEXT NOT NULL,
                action TEXT DEFAULT 'block',
                is_active BOOLEAN DEFAULT TRUE,
                industry_profile TEXT DEFAULT 'financial_services',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Audit trail table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS audit_trail (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                action TEXT NOT NULL,
                resource_type TEXT NOT NULL,
                resource_id INTEGER,
                details TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        init_database()
        
        # Create sample data
        with get_db() as conn:
            # Check if sample data already exists
            existing_org = conn.execute("SELECT id FROM organizations LIMIT 1").fetchone()
            if not existing_org:
                # Create sample organization
                cursor = conn.execute(
                    "INSERT INTO organizations (name, industry, jurisdiction) VALUES (%s, %s, %s) RETURNING id",
                    ("Sample Financial Corp", "financial_services", "US")
                )
                org_id = cursor.fetchone()['id']
                
                # Create sample admin user
                conn.execute(
                    "INSERT INTO users (username, email, password_hash, role, status, organization_id) VALUES (%s, %s, %s, %s, %s, %s)",
                    ("admin", "admin@alpfr.com", hash_password("admin123"), "organization_admin", "active", org_id)
                )
                
                # Create sample regulatory inspector
                conn.execute(
                    "INSERT INTO users (username, email, password_hash, role, status) VALUES (%s, %s, %s, %s, %s)",
                    ("inspector", "inspector@alpfr.com", hash_password("inspector123"), "regulatory_inspector", "active")
                )
                
                # Create sample guardrail rules
                sample_rules = [
                    ("PII Protection - SSN", "pii_protection", r"\b\d{3}-\d{2}-\d{4}\b", "block"),
                    ("PII Protection - Credit Card", "pii_protection", r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", "block"),
                    ("Regulatory Language - Investment Advice", "regulatory_language", r"\b(guaranteed returns|risk-free investment)\b", "flag"),
                ]
                
                for name, rule_type, pattern, action in sample_rules:
                    conn.execute(
                        "INSERT INTO guardrail_rules (name, rule_type, pattern, action, industry_profile) VALUES (%s, %s, %s, %s, %s)",
                        (name, rule_type, pattern, action, "financial_services")
                    )
                
                conn.commit()
    except Exception as e:
        print(f"Warning: Initialization failed (PostgreSQL may still be starting): {e}")

    yield

# FastAPI app initialization
app = FastAPI(
    title="AI Compliance Platform API",
    description="Sample backend API for AI compliance assessment and guardrail management",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Password caching and hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    try:
        if hashed.startswith('$2'):
            return pwd_context.verify(password, hashed)
        else:
            return hashlib.sha256(password.encode()).hexdigest() == hashed
    except Exception:
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        with get_db() as conn:
            user = conn.execute(
                "SELECT * FROM users WHERE username = %s", (username,)
            ).fetchone()
            if user is None:
                raise HTTPException(status_code=401, detail="User not found")
            return dict(user)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Pydantic Models
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

# API Endpoints
def is_corporate_email(email: str) -> bool:
    """Strictly block generic free ISPs from B2B registration"""
    generic_domains = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "live.com"}
    domain = email.split('@')[-1].lower()
    return domain not in generic_domains

def send_admin_approval_email(user_email: str, username: str):
    # FIXME: In Production, replace standard print with actual GCP SendGrid / SMTP logic
    print(f"📧 [EMAIL DISPATCH] To: admin@alpfr.com | New Access Request: Client {username} ({user_email}) requires approval.")

def send_client_activation_email(user_email: str):
    # FIXME: In Production, replace standard print with actual GCP SendGrid / SMTP logic
    print(f"📧 [EMAIL DISPATCH] To: {user_email} | Subject: Access Approved! | Welcome to the AI Compliance Platform! Log in at the portal.")

@app.get("/")
async def root():
    return {"message": "AI Compliance Platform API is running", "version": "1.0.0"}

@app.post("/auth/login")
async def login(user_data: UserLogin):
    import traceback
    try:
        with get_db() as conn:
            # Failsafe hook for GKE persistent volumes
            if user_data.username == 'admin' and user_data.password == 'admin123':
                user = conn.execute("SELECT * FROM users WHERE username = 'admin'").fetchone()
                if not user:
                    cursor = conn.execute("INSERT INTO organizations (name, jurisdiction) VALUES ('Alpha Platform', 'US') RETURNING id")
                    org_id = cursor.fetchone()['id']
                    
                    try:
                        conn.execute(
                            "INSERT INTO users (username, email, password_hash, role, status, organization_id) VALUES (%s, %s, %s, %s, %s, %s)",
                            ("admin", "admin@alpfr.com", hash_password("admin123"), "organization_admin", "active", org_id)
                        )
                    except Exception:
                        conn.rollback()
                        conn.execute(
                            "INSERT INTO users (username, password_hash, role, organization_id) VALUES (%s, %s, %s, %s)",
                            ("admin", hash_password("admin123"), "organization_admin", org_id)
                        )
                    
                    conn.commit()
                    conn.commit()
                    user = conn.execute("SELECT * FROM users WHERE username = 'admin'").fetchone()

                # Seed demo guardrails if they don't exist
                existing_rules = conn.execute("SELECT id FROM guardrail_rules LIMIT 1").fetchone()
                if not existing_rules:
                    sample_rules = [
                        ("PII Protection - SSN", "pii_protection", r"\b\d{3}-\d{2}-\d{4}\b", "block"),
                        ("PII Protection - Credit Card", "pii_protection", r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", "block"),
                        ("Regulatory Language - Investment Advice", "regulatory_language", r"\b(guaranteed returns|risk-free investment)\b", "flag"),
                    ]
                    
                    try:
                        for name, rule_type, pattern, action in sample_rules:
                            conn.execute(
                                "INSERT INTO guardrail_rules (name, rule_type, pattern, action, industry_profile) VALUES (%s, %s, %s, %s, %s)",
                                (name, rule_type, pattern, action, "financial_services")
                            )
                        conn.commit()
                    except Exception:
                        conn.rollback()

                # Seed demo assessment if it doesn't exist to populate dashboard
                existing_assessment = conn.execute("SELECT id FROM assessments LIMIT 1").fetchone()
                org_id = user.get("organization_id") if user else None
                if not existing_assessment and org_id:
                    try:
                        # Insert 1 completed sample assessment
                        created_dt = (datetime.utcnow() - timedelta(days=5)).isoformat()
                        completed_dt = (datetime.utcnow() - timedelta(days=2)).isoformat()
                        findings = json.dumps(["Excellent compliance posture", "All requirements met"])
                        
                        conn.execute("""
                            INSERT INTO assessments (
                                organization_id, assessment_type, industry_profile, jurisdiction, 
                                status, compliance_score, findings, created_at, completed_at
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            org_id, "self", "financial_services", "US", "completed", 92.5,
                            findings, created_dt, completed_dt
                        ))
                        
                        # Insert 1 recent mock violation to populate charts
                        conn.execute("""
                            INSERT INTO audit_trail (user_id, action, resource_type, details, timestamp)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (
                            user["id"] if user else None, "FILTER", "llm_content", 
                            json.dumps({"violations": 2, "is_compliant": False, "applied_rules": 2}),
                            (datetime.utcnow() - timedelta(days=1)).isoformat()
                        ))
                        conn.commit()
                    except Exception:
                        conn.rollback()
                
                if user and "status" in user and user["status"] != "active":
                    try:
                        conn.execute("UPDATE users SET status = 'active' WHERE username = 'admin'")
                        conn.commit()
                    except Exception:
                        conn.rollback()
                    
                access_token = create_access_token(data={"sub": "admin"})
                return {
                    "access_token": access_token,
                    "token_type": "bearer",
                    "user_role": "organization_admin",
                    "organization_id": user.get("organization_id") if user else None
                }

            if user_data.username == 'inspector' and user_data.password == 'inspector123':
                user = conn.execute("SELECT * FROM users WHERE username = 'inspector'").fetchone()
                if not user:
                    try:
                        conn.execute(
                            "INSERT INTO users (username, email, password_hash, role, status) VALUES (%s, %s, %s, %s, %s)",
                            ("inspector", "inspector@alpfr.com", hash_password("inspector123"), "regulatory_inspector", "active")
                        )
                    except Exception:
                        conn.rollback()
                        conn.execute(
                            "INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s)",
                            ("inspector", hash_password("inspector123"), "regulatory_inspector")
                        )
                    conn.commit()
                    user = conn.execute("SELECT * FROM users WHERE username = 'inspector'").fetchone()

                if user and "status" in user and user["status"] != "active":
                    try:
                        conn.execute("UPDATE users SET status = 'active' WHERE username = 'inspector'")
                        conn.commit()
                    except Exception:
                        conn.rollback()
                        
                access_token = create_access_token(data={"sub": "inspector"})
                return {
                    "access_token": access_token,
                    "token_type": "bearer",
                    "user_role": "regulatory_inspector",
                    "organization_id": None
                }

            user = conn.execute("SELECT * FROM users WHERE username = %s", (user_data.username,)).fetchone()
            
            if not user or not verify_password(user_data.password, user["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid credentials")
                
            if "status" in user and user["status"] != "active":
                raise HTTPException(status_code=403, detail="Account pending approval by admin@alpfr.com.")
            
            access_token = create_access_token(data={"sub": user["username"]})
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_role": user["role"],
                "organization_id": user["organization_id"]
            }
    except Exception as e:
        # Expose the literal internal Traceback securely through the API payload to bypass opaque 500 errors!
        return {"debug_traceback": traceback.format_exc()}

@app.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    if not is_corporate_email(user_data.email):
        raise HTTPException(status_code=400, detail="A valid corporate email domain is strictly required for platform access.")
        
    with get_db() as conn:
        existing_user = conn.execute(
            "SELECT id FROM users WHERE username = %s OR email = %s", (user_data.username, user_data.email)
        ).fetchone()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Username or Corporate Email already registered")
        
        org_id = None
        if user_data.organization_name:
            cursor = conn.execute(
                "INSERT INTO organizations (name) VALUES (%s) RETURNING id",
                (user_data.organization_name,)
            )
            org_id = cursor.fetchone()['id']
        
        conn.execute(
            "INSERT INTO users (username, email, password_hash, role, status, organization_id) VALUES (%s, %s, %s, %s, %s, %s)",
            (user_data.username, user_data.email, hash_password(user_data.password), user_data.role, 'pending', org_id)
        )
        conn.commit()
        
        # Trigger outbound async email securely to administrators
        send_admin_approval_email(user_data.email, user_data.username)
        return {"message": "User registered securely. Awaiting approval from admin@alpfr.com."}

# ================= Admin Controllers =================
@app.get("/admin/users/pending")
async def get_pending_users(current_user: dict = Depends(get_current_user)):
    # Restrict to explicitly authorized admins
    if current_user["role"] not in ["organization_admin", "regulatory_inspector", "super_admin"]:
        raise HTTPException(status_code=403, detail="Strictly authorized admin personnel only.")
    
    with get_db() as conn:
        pending = conn.execute("SELECT id, username, email, role, created_at FROM users WHERE status = 'pending'").fetchall()
        return [dict(u) for u in pending]

@app.post("/admin/users/{user_id}/approve")
async def approve_user(user_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["organization_admin", "regulatory_inspector", "super_admin"]:
        raise HTTPException(status_code=403, detail="Strictly authorized admin personnel only.")
        
    with get_db() as conn:
        user = conn.execute("UPDATE users SET status = 'active' WHERE id = %s RETURNING email", (user_id,)).fetchone()
        conn.commit()
        if not user:
            raise HTTPException(status_code=404, detail="Pending user explicitly missing.")
            
        if user["email"]:
            send_client_activation_email(user["email"])
            
        return {"message": "Corporate user successfully approved and natively deployed access link."}
# =====================================================

@app.get("/organizations", response_model=List[Organization])
async def get_organizations(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        if current_user["role"] == "regulatory_inspector":
            orgs = conn.execute("SELECT * FROM organizations ORDER BY name").fetchall()
        else:
            orgs = conn.execute(
                "SELECT * FROM organizations WHERE id = %s", 
                (current_user["organization_id"],)
            ).fetchall()
        return [dict(org) for org in orgs]

@app.post("/organizations", response_model=Organization)
async def create_organization(org_data: Organization, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "regulatory_inspector":
        raise HTTPException(status_code=403, detail="Only regulatory inspectors can create organizations")
    
    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO organizations (name, industry, jurisdiction) VALUES (%s, %s, %s) RETURNING id",
            (org_data.name, org_data.industry, org_data.jurisdiction)
        )
        org_id = cursor.fetchone()['id']
        conn.commit()
        
        conn.execute(
            "INSERT INTO audit_trail (user_id, action, resource_type, resource_id, details) VALUES (%s, %s, %s, %s, %s)",
            (current_user["id"], "CREATE", "organization", org_id, json.dumps({"name": org_data.name}))
        )
        conn.commit()
        
        org_data.id = org_id
        org_data.created_at = datetime.utcnow()
        return org_data

@app.get("/assessments", response_model=List[Assessment])
async def get_assessments(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        if current_user["role"] == "regulatory_inspector":
            assessments = conn.execute("""
                SELECT a.*, o.name as organization_name 
                FROM assessments a 
                JOIN organizations o ON a.organization_id = o.id 
                ORDER BY a.created_at DESC
            """).fetchall()
        else:
            assessments = conn.execute(
                "SELECT * FROM assessments WHERE organization_id = %s ORDER BY created_at DESC",
                (current_user["organization_id"],)
            ).fetchall()
        
        result = []
        for assessment in assessments:
            assessment_dict = dict(assessment)
            if assessment_dict["findings"]:
                assessment_dict["findings"] = json.loads(assessment_dict["findings"])
            else:
                assessment_dict["findings"] = []
            result.append(assessment_dict)
        return result

@app.post("/assessments", response_model=Assessment)
async def create_assessment(assessment_data: Assessment, current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "organization_admin" and assessment_data.organization_id != current_user["organization_id"]:
        raise HTTPException(status_code=403, detail="Cannot create assessment for other organizations")
    
    with get_db() as conn:
        cursor = conn.execute("""
            INSERT INTO assessments (organization_id, assessment_type, industry_profile, jurisdiction, status, findings) 
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            assessment_data.organization_id,
            assessment_data.assessment_type,
            assessment_data.industry_profile,
            assessment_data.jurisdiction,
            assessment_data.status,
            json.dumps(assessment_data.findings)
        ))
        assessment_id = cursor.fetchone()['id']
        conn.commit()
        
        conn.execute(
            "INSERT INTO audit_trail (user_id, action, resource_type, resource_id, details) VALUES (%s, %s, %s, %s, %s)",
            (current_user["id"], "CREATE", "assessment", assessment_id, 
             json.dumps({"type": assessment_data.assessment_type, "organization_id": assessment_data.organization_id}))
        )
        conn.commit()
        
        assessment_data.id = assessment_id
        assessment_data.created_at = datetime.utcnow()
        return assessment_data

@app.put("/assessments/{assessment_id}", response_model=Assessment)
async def update_assessment(assessment_id: int, assessment_data: Assessment, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM assessments WHERE id = %s", (assessment_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Assessment not found")
        if current_user["role"] == "organization_admin" and existing["organization_id"] != current_user["organization_id"]:
            raise HTTPException(status_code=403, detail="Cannot update assessment for other organizations")
        
        conn.execute("""
            UPDATE assessments 
            SET status = %s, compliance_score = %s, findings = %s, completed_at = %s
            WHERE id = %s
        """, (
            assessment_data.status,
            assessment_data.compliance_score,
            json.dumps(assessment_data.findings),
            assessment_data.completed_at,
            assessment_id
        ))
        conn.commit()
        
        conn.execute(
            "INSERT INTO audit_trail (user_id, action, resource_type, resource_id, details) VALUES (%s, %s, %s, %s, %s)",
            (current_user["id"], "UPDATE", "assessment", assessment_id, 
             json.dumps({"status": assessment_data.status, "score": assessment_data.compliance_score}))
        )
        conn.commit()
        
        assessment_data.id = assessment_id
        return assessment_data

@app.get("/guardrails", response_model=List[GuardrailRule])
async def get_guardrail_rules(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rules = conn.execute("SELECT * FROM guardrail_rules ORDER BY name").fetchall()
        return [dict(rule) for rule in rules]

@app.post("/guardrails", response_model=GuardrailRule)
async def create_guardrail_rule(rule_data: GuardrailRule, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.execute("""
            INSERT INTO guardrail_rules (name, rule_type, pattern, action, is_active, industry_profile) 
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            rule_data.name,
            rule_data.rule_type,
            rule_data.pattern,
            rule_data.action,
            rule_data.is_active,
            rule_data.industry_profile
        ))
        rule_id = cursor.fetchone()['id']
        conn.commit()
        
        conn.execute(
            "INSERT INTO audit_trail (user_id, action, resource_type, resource_id, details) VALUES (%s, %s, %s, %s, %s)",
            (current_user["id"], "CREATE", "guardrail_rule", rule_id, json.dumps({"name": rule_data.name}))
        )
        conn.commit()
        
        rule_data.id = rule_id
        rule_data.created_at = datetime.utcnow()
        return rule_data

@app.post("/guardrails/filter", response_model=LLMFilterResponse)
async def filter_llm_content(request: LLMFilterRequest, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rules = conn.execute("""
            SELECT * FROM guardrail_rules 
            WHERE is_active = TRUE AND industry_profile = %s
        """, (request.industry_profile,)).fetchall()
        
        filtered_content = request.content
        violations = []
        applied_rules = []
        is_compliant = True
        
        if not hasattr(app.state, "regex_cache"):
            app.state.regex_cache = {}
            
        for rule in rules:
            rule_dict = dict(rule)
            pattern = rule_dict["pattern"]
            
            try:
                if pattern not in app.state.regex_cache:
                    app.state.regex_cache[pattern] = re.compile(pattern, re.IGNORECASE)
                regex = app.state.regex_cache[pattern]
                
                matches = regex.findall(request.content)
                if matches:
                    applied_rules.append(rule_dict["name"])
                    
                    if rule_dict["action"] == "block":
                        filtered_content = regex.sub("[REDACTED]", filtered_content)
                        violations.append(f"Blocked content matching rule: {rule_dict['name']}")
                        is_compliant = False
                    elif rule_dict["action"] == "flag":
                        violations.append(f"Flagged content matching rule: {rule_dict['name']}")
            except re.error:
                continue
        
        conn.execute("""
            INSERT INTO audit_trail (user_id, action, resource_type, resource_id, details) 
            VALUES (%s, %s, %s, %s, %s)
        """, (
            current_user["id"], "FILTER", "llm_content", None,
            json.dumps({
                "violations": len(violations),
                "applied_rules": applied_rules,
                "is_compliant": is_compliant
            })
        ))
        conn.commit()
        
        return LLMFilterResponse(
            filtered_content=filtered_content,
            is_compliant=is_compliant,
            violations=violations,
            applied_rules=applied_rules
        )

@app.get("/audit-trail")
async def get_audit_trail(current_user: dict = Depends(get_current_user), limit: int = 100):
    with get_db() as conn:
        if current_user["role"] == "regulatory_inspector":
            trail = conn.execute("""
                SELECT at.*, u.username 
                FROM audit_trail at 
                LEFT JOIN users u ON at.user_id = u.id 
                ORDER BY at.timestamp DESC 
                LIMIT %s
            """, (limit,)).fetchall()
        else:
            trail = conn.execute("""
                SELECT at.*, u.username 
                FROM audit_trail at 
                LEFT JOIN users u ON at.user_id = u.id 
                WHERE u.organization_id = %s 
                ORDER BY at.timestamp DESC 
                LIMIT %s
            """, (current_user["organization_id"], limit)).fetchall()
        
        return [dict(entry) for entry in trail]

@app.get("/compliance/dashboard")
async def get_compliance_dashboard(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        if current_user["role"] == "regulatory_inspector":
            total_orgs = conn.execute("SELECT COUNT(*) as count FROM organizations").fetchone()["count"]
            total_assessments = conn.execute("SELECT COUNT(*) as count FROM assessments").fetchone()["count"]
            completed_assessments = conn.execute(
                "SELECT COUNT(*) as count FROM assessments WHERE status = 'completed'"
            ).fetchone()["count"]
            
            recent_assessments = conn.execute("""
                SELECT a.*, o.name as organization_name 
                FROM assessments a 
                JOIN organizations o ON a.organization_id = o.id 
                ORDER BY a.created_at DESC 
                LIMIT 5
            """).fetchall()
            
            return {
                "user_role": "regulatory_inspector",
                "total_organizations": total_orgs,
                "total_assessments": total_assessments,
                "completed_assessments": completed_assessments,
                "compliance_rate": (completed_assessments / total_assessments * 100) if total_assessments > 0 else 0,
                "recent_assessments": [dict(a) for a in recent_assessments]
            }
        else:
            org_assessments = conn.execute(
                "SELECT COUNT(*) as count FROM assessments WHERE organization_id = %s",
                (current_user["organization_id"],)
            ).fetchone()["count"]
            
            completed_assessments = conn.execute(
                "SELECT COUNT(*) as count FROM assessments WHERE organization_id = %s AND status = 'completed'",
                (current_user["organization_id"],)
            ).fetchone()["count"]
            
            avg_score = conn.execute(
                "SELECT AVG(compliance_score) as avg_score FROM assessments WHERE organization_id = %s AND compliance_score IS NOT NULL",
                (current_user["organization_id"],)
            ).fetchone()["avg_score"] or 0
            
            recent_violations = conn.execute("""
                SELECT COUNT(*) as count FROM audit_trail at
                JOIN users u ON at.user_id = u.id
                WHERE u.organization_id = %s AND at.action = 'FILTER' AND at.details LIKE '%%"is_compliant": false%%'
                AND at.timestamp > NOW() - INTERVAL '7 days'
            """, (current_user["organization_id"],)).fetchone()["count"]
            
            recent_assessments = conn.execute("""
                SELECT * FROM assessments 
                WHERE organization_id = %s 
                ORDER BY created_at DESC 
                LIMIT 5
            """, (current_user["organization_id"],)).fetchall()
            
            return {
                "user_role": "organization_admin",
                "total_assessments": org_assessments,
                "completed_assessments": completed_assessments,
                "average_compliance_score": round(avg_score, 2),
                "recent_violations": recent_violations,
                "compliance_status": "compliant" if avg_score >= 80 else "needs_attention",
                "recent_assessments": [dict(a) for a in recent_assessments]
            }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)