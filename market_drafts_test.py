#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class MarketDraftsAPITester:
    def __init__(self, base_url="https://repo-launch-20.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_draft_id = None
        # Test wallet from agent context
        self.test_wallet = "0xa9c2C2a48aFa7b36555e32917a6E5a9280f9563A"

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

    def test_wallet_balance(self):
        """Test wallet balance API for test wallet"""
        headers = {'X-Wallet-Address': self.test_wallet}
        success, response = self.run_test(
            "Wallet Balance API", 
            "GET", 
            "wallet/balance", 
            200,
            headers=headers
        )
        
        if success and response.get('data'):
            balance_data = response['data']
            print(f"   Wallet: {balance_data.get('wallet')}")
            print(f"   Balance: {balance_data.get('balanceUsdt')} USDT")
            print(f"   XP: {balance_data.get('xp')}")
            print(f"   Tier: {balance_data.get('tier')}")
            
            # Validate expected balance for test wallet
            expected_balance = 10000
            actual_balance = balance_data.get('balanceUsdt', 0)
            if actual_balance >= expected_balance:
                print(f"✅ Test wallet has sufficient balance: {actual_balance} USDT")
            else:
                print(f"⚠️  Test wallet balance lower than expected: {actual_balance} vs {expected_balance}")
                
        return success, response

    def test_market_drafts_config(self):
        """Test market drafts config endpoint"""
        return self.run_test("Market Drafts Config", "GET", "markets/drafts/config", 200)

    def test_create_market_draft(self):
        """Test creating a market draft"""
        # Create a future close time (7 days from now)
        close_time = datetime.now() + timedelta(days=7)
        
        draft_data = {
            "title": f"Will BTC reach $150,000 by end of 2026? (Test {datetime.now().strftime('%H%M%S')})",
            "description": "Testing market draft creation functionality",
            "category": "crypto",
            "type": "single",
            "closeTime": close_time.isoformat(),
            "outcomes": [
                {"id": 1, "label": "Yes"},
                {"id": 2, "label": "No"}
            ],
            "creatorAddress": self.test_wallet,
            "stake": 100
        }
        
        headers = {'X-Wallet-Address': self.test_wallet}
        success, response = self.run_test(
            "Create Market Draft", 
            "POST", 
            "markets/drafts", 
            201,  # Correct status for creation
            data=draft_data,
            headers=headers
        )
        
        if success and response.get('data'):
            draft = response['data']
            self.created_draft_id = draft.get('_id')
            print(f"   Created Draft ID: {self.created_draft_id}")
            print(f"   Title: {draft.get('title')}")
            print(f"   Status: {draft.get('status')}")
            print(f"   Creator: {draft.get('creatorAddress')}")
            
        return success, response

    def test_get_my_drafts(self):
        """Test getting user's drafts"""
        headers = {'X-Wallet-Address': self.test_wallet}
        success, response = self.run_test(
            "Get My Drafts", 
            "GET", 
            "markets/drafts/my", 
            200,
            headers=headers
        )
        
        if success and response.get('data'):
            drafts = response['data']
            print(f"   Found {len(drafts)} drafts for wallet")
            
            # Check if our created draft is in the list
            if self.created_draft_id:
                found_draft = next((d for d in drafts if d.get('_id') == self.created_draft_id), None)
                if found_draft:
                    print(f"✅ Found our created draft in user's drafts list")
                else:
                    print(f"⚠️  Created draft not found in user's drafts list")
                    
        return success, response

    def test_get_draft_by_id(self):
        """Test getting draft by ID"""
        if not self.created_draft_id:
            print("⚠️  No draft ID available, skipping test")
            return False, {}
            
        success, response = self.run_test(
            "Get Draft by ID", 
            "GET", 
            f"markets/drafts/{self.created_draft_id}", 
            200
        )
        
        if success and response.get('data'):
            draft = response['data']
            print(f"   Draft Title: {draft.get('title')}")
            print(f"   Draft Status: {draft.get('status')}")
            print(f"   Outcomes: {len(draft.get('outcomes', []))}")
            
        return success, response

    def test_submit_draft_for_review(self):
        """Test submitting draft for review"""
        if not self.created_draft_id:
            print("⚠️  No draft ID available, skipping test")
            return False, {}
            
        headers = {'X-Wallet-Address': self.test_wallet}
        success, response = self.run_test(
            "Submit Draft for Review", 
            "POST", 
            f"markets/drafts/{self.created_draft_id}/submit", 
            201,  # Correct status for update operation
            headers=headers
        )
        
        if success and response.get('data'):
            draft = response['data']
            print(f"   Draft Status after submit: {draft.get('status')}")
            print(f"   Submitted at: {draft.get('submittedAt')}")
            
            # Verify status changed to 'pending'
            if draft.get('status') == 'pending':
                print(f"✅ Draft status correctly changed to 'pending'")
            else:
                print(f"⚠️  Expected status 'pending', got '{draft.get('status')}'")
                
        return success, response

    def test_oracle_price(self):
        """Test oracle price endpoint"""
        return self.run_test("Oracle Price BTC", "GET", "markets/drafts/oracle/price/BTC", 200)

    def test_oracle_evaluate(self):
        """Test oracle condition evaluation"""
        condition_data = {
            "source": "coinbase",
            "asset": "BTC",
            "operator": ">",
            "value": 50000
        }
        
        return self.run_test(
            "Oracle Evaluate Condition", 
            "POST", 
            "markets/drafts/oracle/evaluate", 
            201,  # Correct status for creation
            data=condition_data
        )

    def test_get_active_votes(self):
        """Test getting active vote sessions"""
        return self.run_test("Get Active Votes", "GET", "markets/drafts/votes/active", 200)

    def print_summary(self):
        """Print test summary"""
        print(f"\n" + "="*60)
        print(f"📊 Market Drafts API Test Summary")
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
    print("🚀 Starting Market Drafts API Tests...")
    print("="*60)
    
    # Setup
    tester = MarketDraftsAPITester()

    # Run all tests
    print(f"\n💰 Testing Wallet APIs...")
    tester.test_wallet_balance()
    
    print(f"\n📋 Testing Market Drafts APIs...")
    tester.test_market_drafts_config()
    tester.test_create_market_draft()
    tester.test_get_my_drafts()
    tester.test_get_draft_by_id()
    tester.test_submit_draft_for_review()
    
    print(f"\n🔮 Testing Oracle APIs...")
    tester.test_oracle_price()
    tester.test_oracle_evaluate()
    
    print(f"\n🗳️  Testing Voting APIs...")
    tester.test_get_active_votes()

    # Print results
    tester.print_summary()
    
    # Save detailed results
    with open('/app/test_reports/market_drafts_results.json', 'w') as f:
        json.dump({
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            "results": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/test_reports/market_drafts_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())