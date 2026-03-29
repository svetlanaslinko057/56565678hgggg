#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class FOMAArenaResolutionTester:
    def __init__(self, base_url="https://cold-start-repo.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.admin_wallet = "admin"

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, params=params, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=15)

            success = response.status_code == expected_status
            
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "timestamp": datetime.now().isoformat()
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    result["response_data"] = response_data
                    print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
                except:
                    result["response_data"] = response.text[:200]
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    result["error_data"] = error_data
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    result["error_data"] = response.text
                    print(f"   Error: {response.text}")

            self.test_results.append(result)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            self.test_results.append(result)
            return False, {}

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        return self.run_test(
            "Admin Stats", 
            "GET", 
            "admin/stats", 
            200,
            headers={'X-Admin-Wallet': self.admin_wallet}
        )

    def test_admin_markets(self):
        """Test admin markets endpoint"""
        return self.run_test(
            "Admin Markets", 
            "GET", 
            "admin/markets", 
            200,
            headers={'X-Admin-Wallet': self.admin_wallet}
        )

    def test_resolution_pending_markets(self):
        """Test resolution center - pending markets endpoint"""
        success, response = self.run_test(
            "Resolution Pending Markets", 
            "GET", 
            "admin/resolution/pending", 
            200,
            headers={'X-Admin-Wallet': self.admin_wallet}
        )
        
        if success and response.get('data'):
            markets = response['data']
            print(f"   Found {len(markets)} markets awaiting resolution")
            
            # Check market structure for resolution features
            for market in markets[:3]:  # Check first 3 markets
                required_fields = ['id', 'title', 'closeTime', 'outcomes', 'totalStake', 'positionsCount']
                for field in required_fields:
                    if field in market:
                        print(f"   ✅ Market has {field}: {market[field] if field != 'outcomes' else len(market[field])}")
                    else:
                        print(f"   ⚠️  Market missing {field}")
                        
                # Check for Event Date (closeTime) and resolution fields
                if 'closeTime' in market:
                    close_time = datetime.fromisoformat(market['closeTime'].replace('Z', '+00:00'))
                    print(f"   Event Date: {close_time.strftime('%Y-%m-%d %H:%M')}")
                    
                if 'confirmedOutcome' in market:
                    print(f"   Confirmed Result: {market['confirmedOutcome']}")
                else:
                    print(f"   Confirmed Result: Awaiting")
                    
        return success, response

    def test_market_simulation(self):
        """Test market simulation functionality"""
        # First get a market to simulate
        success, response = self.test_resolution_pending_markets()
        if not success or not response.get('data'):
            print("   ⚠️  No markets available for simulation test")
            return False, {}
            
        markets = response['data']
        if not markets:
            print("   ⚠️  No markets in resolution queue")
            return False, {}
            
        test_market = markets[0]
        market_id = test_market['id']
        outcomes = test_market.get('outcomes', [])
        
        if not outcomes:
            print("   ⚠️  Market has no outcomes to simulate")
            return False, {}
            
        # Simulate with first outcome
        outcome_id = outcomes[0].get('id') or outcomes[0].get('label')
        
        return self.run_test(
            f"Market Simulation (Market {market_id})", 
            "POST", 
            f"admin/markets/{market_id}/simulate", 
            200,
            data={"outcomeId": outcome_id},
            headers={'X-Admin-Wallet': self.admin_wallet}
        )

    def test_confirm_oracle_result(self):
        """Test confirming oracle result"""
        # Get a market to test with
        success, response = self.run_test(
            "Get Markets for Oracle Test", 
            "GET", 
            "admin/resolution/pending", 
            200,
            headers={'X-Admin-Wallet': self.admin_wallet}
        )
        
        if not success or not response.get('data'):
            print("   ⚠️  No markets available for oracle test")
            return False, {}
            
        markets = response['data']
        if not markets:
            print("   ⚠️  No markets available")
            return False, {}
            
        test_market = markets[0]
        market_id = test_market['id']
        outcomes = test_market.get('outcomes', [])
        
        if not outcomes:
            print("   ⚠️  Market has no outcomes")
            return False, {}
            
        # Confirm with first outcome
        outcome_id = outcomes[0].get('id') or outcomes[0].get('label')
        
        return self.run_test(
            f"Confirm Oracle Result (Market {market_id})", 
            "POST", 
            f"admin/markets/{market_id}/confirm-oracle", 
            200,
            data={"outcomeId": outcome_id},
            headers={'X-Admin-Wallet': self.admin_wallet}
        )

    def test_market_override(self):
        """Test market result override"""
        # Get a market to test with
        success, response = self.run_test(
            "Get Markets for Override Test", 
            "GET", 
            "admin/resolution/pending", 
            200,
            headers={'X-Admin-Wallet': self.admin_wallet}
        )
        
        if not success or not response.get('data'):
            print("   ⚠️  No markets available for override test")
            return False, {}
            
        markets = response['data']
        if not markets:
            print("   ⚠️  No markets available")
            return False, {}
            
        test_market = markets[0]
        market_id = test_market['id']
        outcomes = test_market.get('outcomes', [])
        
        if not outcomes:
            print("   ⚠️  Market has no outcomes")
            return False, {}
            
        # Override to first outcome
        outcome_id = outcomes[0].get('id') or outcomes[0].get('label')
        
        return self.run_test(
            f"Override Market Result (Market {market_id})", 
            "POST", 
            f"admin/markets/{market_id}/override", 
            200,
            data={
                "outcomeId": outcome_id,
                "reason": "Test override for resolution testing"
            },
            headers={'X-Admin-Wallet': self.admin_wallet}
        )

    def test_market_drafts_endpoint(self):
        """Test market drafts endpoint for admin review"""
        return self.run_test(
            "Market Drafts Pending Review", 
            "GET", 
            "admin/drafts/pending", 
            200,
            headers={'X-Admin-Wallet': self.admin_wallet}
        )

    def test_create_market_draft(self):
        """Test creating a market draft with Event Date"""
        # Create a test market with Event Date
        future_date = datetime.now() + timedelta(days=7)
        
        market_data = {
            "title": f"Test Resolution Market {datetime.now().strftime('%H%M%S')}",
            "description": "Testing new resolution logic with Event Date",
            "category": "crypto",
            "type": "single",
            "outcomes": [
                {"id": "1", "label": "Yes"},
                {"id": "2", "label": "No"}
            ],
            "closeTime": future_date.isoformat(),
            "creatorAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
            "stake": 100
        }
        
        return self.run_test(
            "Create Market Draft with Event Date", 
            "POST", 
            "markets/drafts", 
            201,  # Correct status for resource creation
            data=market_data,
            headers={'X-Wallet-Address': '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'}
        )

    def test_risk_monitor_endpoints(self):
        """Test risk monitoring endpoints"""
        endpoints = [
            ("Risk Whales", "admin/risk/whales"),
            ("Risk Skewed Markets", "admin/risk/skewed"),
            ("Risk Suspicious Users", "admin/risk/suspicious")
        ]
        
        results = []
        for name, endpoint in endpoints:
            success, response = self.run_test(
                name, 
                "GET", 
                endpoint, 
                200,
                headers={'X-Admin-Wallet': self.admin_wallet}
            )
            results.append((name, success, response))
            
        return results

    def test_auto_lock_status(self):
        """Test if auto-lock functionality is working by checking locked markets"""
        success, response = self.run_test(
            "Check Auto-Locked Markets", 
            "GET", 
            "admin/markets?status=locked", 
            200,
            headers={'X-Admin-Wallet': self.admin_wallet}
        )
        
        if success and response.get('data'):
            locked_markets = response['data']
            print(f"   Found {len(locked_markets)} locked markets")
            
            # Check if any markets have autoLockedAt timestamp
            auto_locked = [m for m in locked_markets if m.get('autoLockedAt')]
            print(f"   Auto-locked markets: {len(auto_locked)}")
            
            for market in auto_locked[:3]:  # Show first 3
                auto_lock_time = market.get('autoLockedAt')
                close_time = market.get('closeTime')
                print(f"   Market: {market.get('question', 'Unknown')[:40]}...")
                print(f"     Event Date: {close_time}")
                print(f"     Auto-locked: {auto_lock_time}")
                
        return success, response

    def print_summary(self):
        """Print test summary"""
        print(f"\n" + "="*60)
        print(f"📊 FOMO Arena Resolution Logic Test Summary")
        print(f"="*60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.tests_run - self.tests_passed > 0:
            print(f"\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test_name']}: {result.get('error', 'Status ' + str(result['actual_status']))}")

def main():
    print("🚀 Starting FOMO Arena Resolution Logic Tests...")
    print("="*60)
    
    # Setup
    tester = FOMAArenaResolutionTester()

    # Run resolution-specific tests
    print("\n📋 Testing Admin & Resolution APIs...")
    
    # Basic admin endpoints
    tester.test_admin_stats()
    tester.test_admin_markets()
    
    # Resolution Center functionality
    print("\n🎯 Testing Resolution Center...")
    tester.test_resolution_pending_markets()
    tester.test_market_simulation()
    tester.test_confirm_oracle_result()
    tester.test_market_override()
    
    # Market drafts and creation
    print("\n📝 Testing Market Creation with Event Date...")
    tester.test_market_drafts_endpoint()
    tester.test_create_market_draft()
    
    # Risk monitoring
    print("\n⚠️  Testing Risk Monitor...")
    tester.test_risk_monitor_endpoints()
    
    # Auto-lock functionality
    print("\n🔒 Testing Auto-Lock Functionality...")
    tester.test_auto_lock_status()

    # Print results
    tester.print_summary()
    
    # Save detailed results
    with open('/app/test_reports/backend_resolution_results.json', 'w') as f:
        json.dump({
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            "results": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/test_reports/backend_resolution_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())