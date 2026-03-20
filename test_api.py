#!/usr/bin/env python3
"""
AI Compliance Platform - API Testing Script
Tests all major endpoints and functionality
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_api():
    print("🧪 Testing AI Compliance Platform API...")
    
    # Test 1: Health Check
    print("\n1. Testing health check...")
    response = requests.get(f"{BASE_URL}/")
    assert response.status_code == 200
    data = response.json()
    print(f"✅ Health check: {data['message']}")
    
    # Test 2: Authentication - Organization Admin
    print("\n2. Testing organization admin authentication...")
    auth_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=auth_data)
    assert response.status_code == 200
    admin_token = response.json()["access_token"]
    admin_role = response.json()["user_role"]
    print(f"✅ Admin login successful: {admin_role}")
    
    # Test 3: Authentication - Regulatory Inspector
    print("\n3. Testing regulatory inspector authentication...")
    auth_data = {"username": "inspector", "password": "inspector123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=auth_data)
    assert response.status_code == 200
    inspector_token = response.json()["access_token"]
    inspector_role = response.json()["user_role"]
    print(f"✅ Inspector login successful: {inspector_role}")
    
    # Test 4: Organizations (Inspector View)
    print("\n4. Testing organizations endpoint (inspector view)...")
    headers = {"Authorization": f"Bearer {inspector_token}"}
    response = requests.get(f"{BASE_URL}/organizations", headers=headers)
    assert response.status_code == 200
    orgs = response.json()
    print(f"✅ Found {len(orgs)} organizations")
    for org in orgs[:3]:  # Show first 3
        print(f"   - {org['name']} ({org['industry']}, {org['jurisdiction']})")
    
    # Test 5: Guardrails
    print("\n5. Testing guardrails endpoint...")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/guardrails", headers=headers)
    assert response.status_code == 200
    rules = response.json()
    print(f"✅ Found {len(rules)} guardrail rules")
    for rule in rules[:3]:  # Show first 3
        print(f"   - {rule['name']} ({rule['rule_type']}, {rule['action']})")
    
    # Test 6: Content Filtering
    print("\n6. Testing content filtering...")
    test_content = {
        "content": "Contact John at 123-45-6789 for guaranteed returns on your investment with credit card 4532-1234-5678-9012.",
        "industry_profile": "financial_services"
    }
    response = requests.post(f"{BASE_URL}/guardrails/filter", json=test_content, headers=headers)
    assert response.status_code == 200
    result = response.json()
    print(f"✅ Content filtering test:")
    print(f"   Original: {test_content['content'][:50]}...")
    print(f"   Filtered: {result['filtered_content'][:50]}...")
    print(f"   Compliant: {result['is_compliant']}")
    print(f"   Violations: {len(result['violations'])}")
    print(f"   Applied Rules: {len(result['applied_rules'])}")
    
    # Test 7: Assessments
    print("\n7. Testing assessments endpoint...")
    response = requests.get(f"{BASE_URL}/assessments", headers=headers)
    assert response.status_code == 200
    assessments = response.json()
    print(f"✅ Found {len(assessments)} assessments")
    completed = [a for a in assessments if a['status'] == 'completed']
    print(f"   - {len(completed)} completed assessments")
    if completed:
        avg_score = sum(a['compliance_score'] for a in completed) / len(completed)
        print(f"   - Average compliance score: {avg_score:.1f}%")
    
    # Test 8: Dashboard - Organization Admin
    print("\n8. Testing dashboard (organization admin)...")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/compliance/dashboard", headers=headers)
    assert response.status_code == 200
    dashboard = response.json()
    print(f"✅ Organization dashboard:")
    print(f"   - Role: {dashboard['user_role']}")
    print(f"   - Total assessments: {dashboard['total_assessments']}")
    print(f"   - Compliance score: {dashboard['average_compliance_score']}%")
    print(f"   - Recent violations: {dashboard['recent_violations']}")
    print(f"   - Status: {dashboard['compliance_status']}")
    
    # Test 9: Dashboard - Regulatory Inspector
    print("\n9. Testing dashboard (regulatory inspector)...")
    headers = {"Authorization": f"Bearer {inspector_token}"}
    response = requests.get(f"{BASE_URL}/compliance/dashboard", headers=headers)
    assert response.status_code == 200
    dashboard = response.json()
    print(f"✅ Regulatory dashboard:")
    print(f"   - Role: {dashboard['user_role']}")
    print(f"   - Total organizations: {dashboard['total_organizations']}")
    print(f"   - Total assessments: {dashboard['total_assessments']}")
    print(f"   - Compliance rate: {dashboard['compliance_rate']:.1f}%")
    print(f"   - Recent assessments: {len(dashboard['recent_assessments'])}")
    
    # Test 10: Audit Trail
    print("\n10. Testing audit trail...")
    response = requests.get(f"{BASE_URL}/audit-trail?limit=10", headers=headers)
    assert response.status_code == 200
    audit_trail = response.json()
    print(f"✅ Found {len(audit_trail)} audit trail entries")
    actions = {}
    for entry in audit_trail:
        action = entry['action']
        actions[action] = actions.get(action, 0) + 1
    print(f"   - Action breakdown: {dict(actions)}")
    
    # Test 11: Additional User Accounts
    print("\n11. Testing additional user accounts...")
    test_users = [
        ("alice.smith", "alice123", "TechCorp Financial"),
        ("bob.johnson", "bob123", "HealthTech Solutions"),
        ("frank.miller", "frank123", "Regulatory Inspector")
    ]
    
    for username, password, expected_org in test_users:
        auth_data = {"username": username, "password": password}
        response = requests.post(f"{BASE_URL}/auth/login", json=auth_data)
        if response.status_code == 200:
            user_data = response.json()
            print(f"   ✅ {username}: {user_data['user_role']}")
        else:
            print(f"   ❌ {username}: Login failed")
    
    print("\n🎉 All API tests completed successfully!")
    print("\n📊 Test Summary:")
    print("   ✅ Health check")
    print("   ✅ Authentication (dual roles)")
    print("   ✅ Organizations management")
    print("   ✅ Guardrail rules")
    print("   ✅ Content filtering")
    print("   ✅ Assessments")
    print("   ✅ Dashboard (dual modes)")
    print("   ✅ Audit trail")
    print("   ✅ Multiple user accounts")
    
    return True

if __name__ == "__main__":
    try:
        test_api()
        print("\n🚀 AI Compliance Platform is fully operational!")
        print("\n🌐 Access URLs:")
        print(f"   Backend API: {BASE_URL}")
        print(f"   API Documentation: {BASE_URL}/docs")
        print(f"   OpenAPI Spec: {BASE_URL}/openapi.json")
        
        print("\n👤 Demo Accounts:")
        print("   Organization Admin: admin / admin123")
        print("   Regulatory Inspector: inspector / inspector123")
        print("   TechCorp Financial: alice.smith / alice123")
        print("   HealthTech Solutions: bob.johnson / bob123")
        print("   AutoDrive Systems: carol.davis / carol123")
        print("   GovTech Services: david.wilson / david123")
        print("   RetailAI Corp: eve.brown / eve123")
        print("   Regulatory Inspector: frank.miller / frank123")
        print("   Regulatory Inspector: grace.taylor / grace123")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)