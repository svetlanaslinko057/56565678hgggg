#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class LeaderboardAPITester:
    def __init__(self, base_url="https://b8f41f9c-0691-4c5e-ab7e-ea96241f853c.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.test_wallet = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if headers:
            print(f"   Headers: {headers}")
        
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
                    return success, response_data
                except:
                    result["response_data"] = response.text[:200]
                    print(f"   Response: {response.text[:200]}...")
                    return success, {}
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

    def test_global_leaderboard(self):
        """Test GET /api/leaderboard?type=global"""
        success, response = self.run_test(
            "Global Leaderboard", 
            "GET", 
            "leaderboard", 
            200,
            params={"type": "global"}
        )
        
        if success and response.get('data'):
            data = response['data']
            self.validate_leaderboard_structure(data, "Global")
            
        return success, response

    def test_global_leaderboard_with_wallet(self):
        """Test GET /api/leaderboard?type=global with wallet header"""
        success, response = self.run_test(
            "Global Leaderboard with Wallet", 
            "GET", 
            "leaderboard", 
            200,
            params={"type": "global"},
            headers={"x-wallet-address": self.test_wallet}
        )
        
        if success and response.get('data'):
            data = response['data']
            self.validate_leaderboard_structure(data, "Global with Wallet")
            
            # Check for user-specific data
            if 'userRank' in data:
                print(f"   ✅ User rank found: {data['userRank']}")
            else:
                print(f"   ⚠️  User rank not found in response")
                
            if 'userEntry' in data:
                print(f"   ✅ User entry found: {data['userEntry']}")
            else:
                print(f"   ⚠️  User entry not found in response")
            
        return success, response

    def test_weekly_leaderboard(self):
        """Test GET /api/leaderboard/weekly"""
        success, response = self.run_test(
            "Weekly Leaderboard", 
            "GET", 
            "leaderboard/weekly", 
            200
        )
        
        if success and response.get('data'):
            data = response['data']
            self.validate_leaderboard_structure(data, "Weekly")
            
            # Check period is set to weekly
            if data.get('period') == 'This Week':
                print(f"   ✅ Period correctly set to: {data['period']}")
            else:
                print(f"   ⚠️  Period not set correctly: {data.get('period')}")
            
        return success, response

    def test_weekly_leaderboard_with_wallet(self):
        """Test GET /api/leaderboard/weekly with wallet header"""
        success, response = self.run_test(
            "Weekly Leaderboard with Wallet", 
            "GET", 
            "leaderboard/weekly", 
            200,
            headers={"x-wallet-address": self.test_wallet}
        )
        
        if success and response.get('data'):
            data = response['data']
            self.validate_leaderboard_structure(data, "Weekly with Wallet")
            
        return success, response

    def test_duels_leaderboard(self):
        """Test GET /api/leaderboard/duels"""
        success, response = self.run_test(
            "Duels Leaderboard", 
            "GET", 
            "leaderboard/duels", 
            200
        )
        
        if success and response.get('data'):
            data = response['data']
            self.validate_leaderboard_structure(data, "Duels")
            
            # Check sortBy is set to duelWins
            if data.get('sortBy') == 'duelWins':
                print(f"   ✅ SortBy correctly set to: {data['sortBy']}")
            else:
                print(f"   ⚠️  SortBy not set correctly: {data.get('sortBy')}")
            
        return success, response

    def test_duels_leaderboard_with_wallet(self):
        """Test GET /api/leaderboard/duels with wallet header"""
        success, response = self.run_test(
            "Duels Leaderboard with Wallet", 
            "GET", 
            "leaderboard/duels", 
            200,
            headers={"x-wallet-address": self.test_wallet}
        )
        
        if success and response.get('data'):
            data = response['data']
            self.validate_leaderboard_structure(data, "Duels with Wallet")
            
        return success, response

    def test_xp_leaderboard(self):
        """Test GET /api/leaderboard/xp"""
        success, response = self.run_test(
            "XP Leaderboard", 
            "GET", 
            "leaderboard/xp", 
            200
        )
        
        if success and response.get('data'):
            data = response['data']
            self.validate_leaderboard_structure(data, "XP")
            
            # Check sortBy is set to xp
            if data.get('sortBy') == 'xp':
                print(f"   ✅ SortBy correctly set to: {data['sortBy']}")
            else:
                print(f"   ⚠️  SortBy not set correctly: {data.get('sortBy')}")
            
        return success, response

    def test_xp_leaderboard_with_wallet(self):
        """Test GET /api/leaderboard/xp with wallet header"""
        success, response = self.run_test(
            "XP Leaderboard with Wallet", 
            "GET", 
            "leaderboard/xp", 
            200,
            headers={"x-wallet-address": self.test_wallet}
        )
        
        if success and response.get('data'):
            data = response['data']
            self.validate_leaderboard_structure(data, "XP with Wallet")
            
        return success, response

    def test_leaderboard_with_limit(self):
        """Test leaderboard with custom limit parameter"""
        success, response = self.run_test(
            "Global Leaderboard with Limit", 
            "GET", 
            "leaderboard", 
            200,
            params={"type": "global", "limit": "5"}
        )
        
        if success and response.get('data'):
            data = response['data']
            entries = data.get('entries', [])
            
            if len(entries) <= 5:
                print(f"   ✅ Limit respected: {len(entries)} entries returned")
            else:
                print(f"   ⚠️  Limit not respected: {len(entries)} entries returned (expected ≤5)")
            
        return success, response

    def test_invalid_leaderboard_type(self):
        """Test leaderboard with invalid type parameter"""
        success, response = self.run_test(
            "Invalid Leaderboard Type", 
            "GET", 
            "leaderboard", 
            200,  # Should default to global
            params={"type": "invalid"}
        )
        
        return success, response

    def validate_leaderboard_structure(self, data, leaderboard_type):
        """Validate the structure of leaderboard response"""
        print(f"   Validating {leaderboard_type} leaderboard structure...")
        
        required_fields = ['entries', 'total', 'period', 'sortBy']
        for field in required_fields:
            if field in data:
                print(f"   ✅ Found required field: {field}")
            else:
                print(f"   ❌ Missing required field: {field}")
        
        # Validate entries structure
        entries = data.get('entries', [])
        print(f"   Found {len(entries)} entries")
        
        if entries:
            # Check first entry structure
            first_entry = entries[0]
            entry_fields = ['rank', 'wallet', 'pnl', 'winrate', 'totalBets', 'wins', 'losses', 'duelWins', 'duelLosses', 'xp', 'level', 'streak']
            
            for field in entry_fields:
                if field in first_entry:
                    print(f"   ✅ Entry has field: {field} = {first_entry[field]}")
                else:
                    print(f"   ⚠️  Entry missing field: {field}")
            
            # Validate ranking order
            if len(entries) > 1:
                ranks_correct = all(entries[i]['rank'] == i + 1 for i in range(len(entries)))
                if ranks_correct:
                    print(f"   ✅ Ranking order is correct")
                else:
                    print(f"   ⚠️  Ranking order may be incorrect")

    def test_duels_self_match_protection(self):
        """Test duels self-match protection by checking duels data"""
        print(f"\n🔍 Testing Duels Self-Match Protection...")
        
        # First, try to get duels data to check if creator !== opponent
        success, response = self.run_test(
            "Duels Data Check", 
            "GET", 
            "duels", 
            200
        )
        
        if success and response.get('data'):
            duels = response['data']
            print(f"   Found {len(duels)} duels")
            
            self_matches = []
            for duel in duels:
                creator = duel.get('creatorWallet')
                opponent = duel.get('opponentWallet')
                
                if creator and opponent and creator == opponent:
                    self_matches.append(duel.get('id'))
            
            if not self_matches:
                print(f"   ✅ No self-matches found - protection working")
                return True, {"self_matches": 0}
            else:
                print(f"   ❌ Found {len(self_matches)} self-matches: {self_matches}")
                return False, {"self_matches": len(self_matches), "duel_ids": self_matches}
        else:
            print(f"   ⚠️  Could not retrieve duels data to check self-match protection")
            return False, {}

    def print_summary(self):
        """Print test summary"""
        print(f"\n" + "="*60)
        print(f"📊 Leaderboard API Test Summary")
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
    print("🚀 Starting Leaderboard API Tests...")
    print("="*60)
    
    # Setup
    tester = LeaderboardAPITester()

    # Run all leaderboard tests
    print("\n🏆 Testing Leaderboard APIs...")
    
    # Test all leaderboard types without wallet
    tester.test_global_leaderboard()
    tester.test_weekly_leaderboard()
    tester.test_duels_leaderboard()
    tester.test_xp_leaderboard()
    
    # Test all leaderboard types with wallet header
    print("\n👤 Testing Leaderboard APIs with Wallet Header...")
    tester.test_global_leaderboard_with_wallet()
    tester.test_weekly_leaderboard_with_wallet()
    tester.test_duels_leaderboard_with_wallet()
    tester.test_xp_leaderboard_with_wallet()
    
    # Test additional functionality
    print("\n⚙️  Testing Additional Leaderboard Features...")
    tester.test_leaderboard_with_limit()
    tester.test_invalid_leaderboard_type()
    
    # Test duels self-match protection
    print("\n🛡️  Testing Duels Protection...")
    tester.test_duels_self_match_protection()

    # Print results
    tester.print_summary()
    
    # Save detailed results
    with open('/app/test_reports/leaderboard_api_results.json', 'w') as f:
        json.dump({
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            "results": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/test_reports/leaderboard_api_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())