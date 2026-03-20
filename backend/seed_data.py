"""
AI Compliance Platform - Sample Data Seeding Script
Creates realistic demo data for testing and demonstration
"""

import sqlite3
import json
import hashlib
from datetime import datetime, timedelta
import random

DATABASE_URL = "../../ai_compliance.db"

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def seed_database():
    """Seed the database with comprehensive sample data"""
    conn = sqlite3.connect(DATABASE_URL)
    
    try:
        # Clear existing data (except users and organizations created during startup)
        print("🧹 Clearing existing sample data...")
        
        # Sample organizations
        sample_orgs = [
            ("TechCorp Financial", "financial_services", "US"),
            ("HealthTech Solutions", "healthcare", "EU"),
            ("AutoDrive Systems", "automotive", "US"),
            ("GovTech Services", "government", "UK"),
            ("RetailAI Corp", "retail", "CA"),
        ]
        
        print("🏢 Creating sample organizations...")
        for name, industry, jurisdiction in sample_orgs:
            # Check if organization already exists
            existing = conn.execute("SELECT id FROM organizations WHERE name = ?", (name,)).fetchone()
            if not existing:
                conn.execute(
                    "INSERT INTO organizations (name, industry, jurisdiction) VALUES (?, ?, ?)",
                    (name, industry, jurisdiction)
                )
        
        # Get organization IDs
        orgs = conn.execute("SELECT id, name, industry FROM organizations").fetchall()
        org_dict = {name: (id, industry) for id, name, industry in orgs}
        
        # Sample users for each organization
        sample_users = [
            ("alice.smith", "alice123", "organization_admin", "TechCorp Financial"),
            ("bob.johnson", "bob123", "organization_admin", "HealthTech Solutions"),
            ("carol.davis", "carol123", "organization_admin", "AutoDrive Systems"),
            ("david.wilson", "david123", "organization_admin", "GovTech Services"),
            ("eve.brown", "eve123", "organization_admin", "RetailAI Corp"),
            ("frank.miller", "frank123", "regulatory_inspector", None),
            ("grace.taylor", "grace123", "regulatory_inspector", None),
        ]
        
        print("👥 Creating sample users...")
        for username, password, role, org_name in sample_users:
            # Check if user already exists
            existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
            if not existing:
                org_id = org_dict.get(org_name, (None, None))[0] if org_name else None
                conn.execute(
                    "INSERT INTO users (username, password_hash, role, organization_id) VALUES (?, ?, ?, ?)",
                    (username, hash_password(password), role, org_id)
                )
        
        # Sample guardrail rules
        sample_guardrails = [
            # Financial Services Rules
            ("PII Protection - SSN", "pii_protection", r"\b\d{3}-\d{2}-\d{4}\b", "block", "financial_services"),
            ("PII Protection - Credit Card", "pii_protection", r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", "block", "financial_services"),
            ("Investment Advice Warning", "regulatory_language", r"\b(guaranteed returns|risk-free investment|sure profit)\b", "flag", "financial_services"),
            ("Financial Promises", "regulatory_language", r"\b(guaranteed|promise|ensure)\b.*\b(profit|return|income)\b", "flag", "financial_services"),
            
            # Healthcare Rules
            ("HIPAA - Patient ID", "pii_protection", r"\b(patient|medical)\s+(id|number)[\s:]+\d+\b", "block", "healthcare"),
            ("Medical Claims", "regulatory_language", r"\b(cure|treat|diagnose)\b.*\b(cancer|diabetes|disease)\b", "flag", "healthcare"),
            ("FDA Compliance", "regulatory_language", r"\b(FDA approved|clinically proven)\b", "flag", "healthcare"),
            
            # Automotive Rules
            ("Safety Critical", "safety_constraint", r"\b(autonomous|self-driving)\b.*\b(safe|safety|accident)\b", "escalate", "automotive"),
            ("Performance Claims", "regulatory_language", r"\b(crash-proof|accident-free|100% safe)\b", "block", "automotive"),
            
            # Government Rules
            ("Bias Detection", "bias_check", r"\b(race|gender|age)\b.*\b(better|worse|superior|inferior)\b", "escalate", "government"),
            ("Transparency", "regulatory_language", r"\b(classified|confidential|secret)\b", "flag", "government"),
        ]
        
        print("🛡️ Creating sample guardrail rules...")
        for name, rule_type, pattern, action, industry in sample_guardrails:
            # Check if rule already exists
            existing = conn.execute("SELECT id FROM guardrail_rules WHERE name = ?", (name,)).fetchone()
            if not existing:
                conn.execute(
                    "INSERT INTO guardrail_rules (name, rule_type, pattern, action, is_active, industry_profile) VALUES (?, ?, ?, ?, ?, ?)",
                    (name, rule_type, pattern, action, True, industry)
                )
        
        # Sample assessments
        print("📋 Creating sample assessments...")
        assessment_statuses = ["in_progress", "completed", "under_review"]
        assessment_types = ["self", "regulatory"]
        
        for org_name, (org_id, industry) in org_dict.items():
            if org_name == "Sample Financial Corp":  # Skip the default org
                continue
                
            # Create 2-4 assessments per organization
            num_assessments = random.randint(2, 4)
            
            for i in range(num_assessments):
                assessment_type = random.choice(assessment_types)
                status = random.choice(assessment_statuses)
                
                # Generate realistic compliance scores
                if status == "completed":
                    if industry == "financial_services":
                        compliance_score = random.uniform(75, 95)
                    elif industry == "healthcare":
                        compliance_score = random.uniform(80, 98)
                    elif industry == "government":
                        compliance_score = random.uniform(85, 99)
                    else:
                        compliance_score = random.uniform(70, 90)
                else:
                    compliance_score = None
                
                # Generate sample findings
                findings = []
                if status == "completed":
                    if compliance_score < 80:
                        findings = [
                            "PII detection rules need strengthening",
                            "Regulatory language compliance requires attention",
                            "Additional staff training recommended"
                        ]
                    elif compliance_score < 90:
                        findings = [
                            "Minor gaps in documentation",
                            "Consider additional guardrail rules"
                        ]
                    else:
                        findings = [
                            "Excellent compliance posture",
                            "All requirements met"
                        ]
                
                # Random creation date within last 90 days
                created_at = datetime.now() - timedelta(days=random.randint(1, 90))
                completed_at = created_at + timedelta(days=random.randint(1, 30)) if status == "completed" else None
                
                conn.execute("""
                    INSERT INTO assessments (
                        organization_id, assessment_type, industry_profile, jurisdiction, 
                        status, compliance_score, findings, created_at, completed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    org_id, assessment_type, industry, "US", status, compliance_score,
                    json.dumps(findings), created_at.isoformat(), 
                    completed_at.isoformat() if completed_at else None
                ))
        
        # Sample audit trail entries
        print("📝 Creating sample audit trail...")
        users = conn.execute("SELECT id, username FROM users").fetchall()
        
        # Generate audit trail entries for the last 30 days
        for _ in range(50):
            user_id, username = random.choice(users)
            
            actions = ["CREATE", "UPDATE", "FILTER", "LOGIN"]
            resource_types = ["assessment", "guardrail_rule", "organization", "llm_content"]
            
            action = random.choice(actions)
            resource_type = random.choice(resource_types)
            
            # Generate realistic details based on action
            if action == "CREATE":
                details = {"action": "created", "resource": resource_type}
            elif action == "UPDATE":
                details = {"action": "updated", "changes": ["status", "score"]}
            elif action == "FILTER":
                details = {
                    "violations": random.randint(0, 3),
                    "is_compliant": random.choice([True, False]),
                    "applied_rules": random.randint(1, 5)
                }
            else:  # LOGIN
                details = {"action": "login", "success": True}
            
            timestamp = datetime.now() - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            conn.execute("""
                INSERT INTO audit_trail (user_id, action, resource_type, resource_id, details, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                user_id, action, resource_type, random.randint(1, 10),
                json.dumps(details), timestamp.isoformat()
            ))
        
        conn.commit()
        print("✅ Sample data created successfully!")
        
        # Print summary
        org_count = conn.execute("SELECT COUNT(*) FROM organizations").fetchone()[0]
        user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        assessment_count = conn.execute("SELECT COUNT(*) FROM assessments").fetchone()[0]
        guardrail_count = conn.execute("SELECT COUNT(*) FROM guardrail_rules").fetchone()[0]
        audit_count = conn.execute("SELECT COUNT(*) FROM audit_trail").fetchone()[0]
        
        print(f"""
📊 Database Summary:
   Organizations: {org_count}
   Users: {user_count}
   Assessments: {assessment_count}
   Guardrail Rules: {guardrail_count}
   Audit Trail Entries: {audit_count}

👤 Sample User Accounts:
   alice.smith / alice123 (TechCorp Financial - Admin)
   bob.johnson / bob123 (HealthTech Solutions - Admin)
   carol.davis / carol123 (AutoDrive Systems - Admin)
   david.wilson / david123 (GovTech Services - Admin)
   eve.brown / eve123 (RetailAI Corp - Admin)
   frank.miller / frank123 (Regulatory Inspector)
   grace.taylor / grace123 (Regulatory Inspector)
        """)
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🌱 Seeding AI Compliance Platform database...")
    seed_database()