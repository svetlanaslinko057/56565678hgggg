#!/usr/bin/env python3
"""
FOMO Arena Rivals System Backend API Test
Tests all rivals endpoints and functionality
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class RivalsAPITester:
    def __init__(self, base_url: str = "https://b8f41f9c-0691-4c5e-ab7e-ea96241f853c.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test wallets for rivalry testing
        self.alice_wallet = "0x1111111111111111111111111111111111111111"
        self.bob_wallet = "0x2222222222222222222222222222222222222222"
        self.charlie_wallet = "0x3333333333333333333333333333333333333333"

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple[bool, Dict, int]:
        """Make HTTP request and return success, response, status_code"""
        url = f"{self.base_url}/api/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=10)
            else:
                return False, {"error": "Unsupported method"}, 0
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            return response.status_code < 400, response_data, response.status_code
        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_get_rivals_for_wallet(self):
        """Test GET /api/rivals/:wallet"""
        print(f"\n🔍 Testing GET /api/rivals/{self.alice_wallet}")
        
        success, response, status = self.make_request('GET', f'rivals/{self.alice_wallet}')
        
        if not success:
            self.log_test("GET /api/rivals/:wallet", False, f"Request failed with status {status}", response)
            return
        
        # Check response structure
        if 'success' not in response:
            self.log_test("GET /api/rivals/:wallet", False, "Missing 'success' field in response", response)
            return
        
        if not response['success']:
            self.log_test("GET /api/rivals/:wallet", False, f"API returned success=false: {response.get('message', '')}", response)
            return
        
        # Check data structure
        data = response.get('data', [])
        if not isinstance(data, list):
            self.log_test("GET /api/rivals/:wallet", False, "Data should be a list", response)
            return
        
        # If there are rivals, check structure
        if len(data) > 0:
            rival = data[0]
            required_fields = ['opponent', 'totalDuels', 'wins', 'losses', 'dominance', 'canRematch']
            missing_fields = [field for field in required_fields if field not in rival]
            
            if missing_fields:
                self.log_test("GET /api/rivals/:wallet", False, f"Missing fields in rival data: {missing_fields}", response)
                return
        
        self.log_test("GET /api/rivals/:wallet", True, f"Found {len(data)} rivals", response)

    def test_get_head_to_head(self):
        """Test GET /api/rivals/:wallet/:opponent"""
        print(f"\n🔍 Testing GET /api/rivals/{self.alice_wallet}/{self.bob_wallet}")
        
        success, response, status = self.make_request('GET', f'rivals/{self.alice_wallet}/{self.bob_wallet}')
        
        if not success:
            self.log_test("GET /api/rivals/:wallet/:opponent", False, f"Request failed with status {status}", response)
            return
        
        # Check response structure
        if 'success' not in response:
            self.log_test("GET /api/rivals/:wallet/:opponent", False, "Missing 'success' field in response", response)
            return
        
        if not response['success']:
            self.log_test("GET /api/rivals/:wallet/:opponent", False, f"API returned success=false: {response.get('message', '')}", response)
            return
        
        # Check data structure
        data = response.get('data', {})
        if not isinstance(data, dict):
            self.log_test("GET /api/rivals/:wallet/:opponent", False, "Data should be an object", response)
            return
        
        # Check required fields for head-to-head
        required_fields = ['wallet', 'opponent', 'totalDuels', 'wins', 'losses', 'winRate', 'dominanceText']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            self.log_test("GET /api/rivals/:wallet/:opponent", False, f"Missing fields in h2h data: {missing_fields}", response)
            return
        
        # Validate dominanceText exists
        if not data.get('dominanceText'):
            self.log_test("GET /api/rivals/:wallet/:opponent", False, "dominanceText should not be empty", response)
            return
        
        self.log_test("GET /api/rivals/:wallet/:opponent", True, f"H2H: {data['wins']}-{data['losses']}, dominance: {data['dominanceText']}", response)

    def test_get_rivalry_summary(self):
        """Test GET /api/rivals/summary with wallet header"""
        print(f"\n🔍 Testing GET /api/rivals/summary")
        
        headers = {'x-wallet-address': self.alice_wallet}
        success, response, status = self.make_request('GET', 'rivals/summary', headers=headers)
        
        if not success:
            self.log_test("GET /api/rivals/summary", False, f"Request failed with status {status}", response)
            return
        
        # Check response structure
        if 'success' not in response:
            self.log_test("GET /api/rivals/summary", False, "Missing 'success' field in response", response)
            return
        
        if not response['success']:
            self.log_test("GET /api/rivals/summary", False, f"API returned success=false: {response.get('message', '')}", response)
            return
        
        # Check data structure
        data = response.get('data', {})
        if not isinstance(data, dict):
            self.log_test("GET /api/rivals/summary", False, "Data should be an object", response)
            return
        
        # Check required fields for summary
        required_fields = ['totalRivals', 'totalRivalryDuels', 'dominatedCount', 'dominatedByCount', 'longestStreak']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            self.log_test("GET /api/rivals/summary", False, f"Missing fields in summary data: {missing_fields}", response)
            return
        
        # Check that topRival and nemesis are present (can be null)
        if 'topRival' not in data or 'nemesis' not in data:
            self.log_test("GET /api/rivals/summary", False, "Missing topRival or nemesis fields", response)
            return
        
        self.log_test("GET /api/rivals/summary", True, f"Summary: {data['totalRivals']} rivals, {data['totalRivalryDuels']} duels", response)

    def test_get_my_rivals(self):
        """Test GET /api/rivals with wallet header"""
        print(f"\n🔍 Testing GET /api/rivals (my rivals)")
        
        headers = {'x-wallet-address': self.alice_wallet}
        success, response, status = self.make_request('GET', 'rivals', headers=headers)
        
        if not success:
            self.log_test("GET /api/rivals (my rivals)", False, f"Request failed with status {status}", response)
            return
        
        # Check response structure
        if 'success' not in response:
            self.log_test("GET /api/rivals (my rivals)", False, "Missing 'success' field in response", response)
            return
        
        if not response['success']:
            self.log_test("GET /api/rivals (my rivals)", False, f"API returned success=false: {response.get('message', '')}", response)
            return
        
        # Check data structure
        data = response.get('data', [])
        if not isinstance(data, list):
            self.log_test("GET /api/rivals (my rivals)", False, "Data should be a list", response)
            return
        
        self.log_test("GET /api/rivals (my rivals)", True, f"Found {len(data)} rivals for authenticated user", response)

    def test_missing_wallet_header(self):
        """Test that endpoints requiring wallet header fail appropriately"""
        print(f"\n🔍 Testing missing wallet header validation")
        
        # Test summary without header
        success, response, status = self.make_request('GET', 'rivals/summary')
        
        if success or status != 400:
            self.log_test("Missing wallet header validation", False, f"Should return 400 but got {status}", response)
            return
        
        self.log_test("Missing wallet header validation", True, "Correctly rejected request without wallet header", response)

    def test_streak_tracking_logic(self):
        """Test streak tracking in head-to-head data"""
        print(f"\n🔍 Testing streak tracking logic")
        
        success, response, status = self.make_request('GET', f'rivals/{self.alice_wallet}/{self.bob_wallet}')
        
        if not success:
            self.log_test("Streak tracking logic", False, f"Request failed with status {status}", response)
            return
        
        data = response.get('data', {})
        
        # Check streak fields exist
        streak_fields = ['currentStreakWallet', 'currentStreakCount']
        missing_fields = [field for field in streak_fields if field not in data]
        
        if missing_fields:
            self.log_test("Streak tracking logic", False, f"Missing streak fields: {missing_fields}", response)
            return
        
        # Validate streak logic
        current_streak_wallet = data.get('currentStreakWallet')
        current_streak_count = data.get('currentStreakCount', 0)
        
        # If there's a streak, there should be a wallet
        if current_streak_count > 0 and not current_streak_wallet:
            self.log_test("Streak tracking logic", False, "Streak count > 0 but no streak wallet", response)
            return
        
        # If no streak, count should be 0
        if current_streak_count == 0 and current_streak_wallet:
            self.log_test("Streak tracking logic", False, "Streak wallet set but count is 0", response)
            return
        
        self.log_test("Streak tracking logic", True, f"Streak: {current_streak_wallet} with {current_streak_count} wins", response)

    def run_all_tests(self):
        """Run all rivals API tests"""
        print("🚀 Starting FOMO Arena Rivals System API Tests")
        print(f"Base URL: {self.base_url}")
        print(f"Test wallets: Alice={self.alice_wallet}, Bob={self.bob_wallet}")
        
        # Test all endpoints
        self.test_get_rivals_for_wallet()
        self.test_get_head_to_head()
        self.test_get_rivalry_summary()
        self.test_get_my_rivals()
        self.test_missing_wallet_header()
        self.test_streak_tracking_logic()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = RivalsAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "failed_tests": tester.tests_run - tester.tests_passed,
        "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
        "test_details": tester.test_results
    }
    
    with open('/app/test_reports/rivals_api_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())