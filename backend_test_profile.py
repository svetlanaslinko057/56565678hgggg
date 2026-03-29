#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class ProfileAPITester:
    def __init__(self, base_url="https://f4904d02-45cf-4af2-bac8-acdcf84269d3.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

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
                    print(f"   Response: {json.dumps(response_data, indent=2)}")
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

    def test_profile_api_structure(self, wallet_address):
        """Test profile API returns correct structure"""
        success, response = self.run_test(
            f"Profile API Structure for {wallet_address[:10]}...", 
            "GET", 
            f"onchain/profile/{wallet_address}", 
            200
        )
        
        if success and response.get('success'):
            data = response.get('data', {})
            
            # Check required fields
            required_fields = {
                'wallet': str,
                'stats': dict,
                'streak': dict,
                'positions': dict
            }
            
            missing_fields = []
            for field, expected_type in required_fields.items():
                if field not in data:
                    missing_fields.append(f"Missing field: {field}")
                elif not isinstance(data[field], expected_type):
                    missing_fields.append(f"Wrong type for {field}: expected {expected_type.__name__}, got {type(data[field]).__name__}")
            
            # Check stats fields
            if 'stats' in data:
                stats_fields = ['totalBets', 'wins', 'losses', 'winrate', 'totalStaked', 'totalClaimed', 'pnl', 'avgBet']
                for field in stats_fields:
                    if field not in data['stats']:
                        missing_fields.append(f"Missing stats field: {field}")
            
            # Check streak fields
            if 'streak' in data:
                streak_fields = ['current', 'best']
                for field in streak_fields:
                    if field not in data['streak']:
                        missing_fields.append(f"Missing streak field: {field}")
            
            # Check positions fields
            if 'positions' in data:
                positions_fields = ['active', 'won', 'lost', 'claimed']
                for field in positions_fields:
                    if field not in data['positions']:
                        missing_fields.append(f"Missing positions field: {field}")
            
            if missing_fields:
                print(f"❌ Structure validation failed:")
                for error in missing_fields:
                    print(f"   - {error}")
                return False, data
            else:
                print(f"✅ Profile structure validation passed")
                return True, data
        
        return success, response

    def test_profile_with_positions(self):
        """Test profile API with wallet that has positions"""
        # Using the wallet mentioned in the context that has 1 position
        wallet_with_positions = "0x413cd446676a75a536d15fa6c7396013e7809017"
        return self.test_profile_api_structure(wallet_with_positions)

    def test_profile_empty_wallet(self):
        """Test profile API with wallet that has no positions"""
        # Using a random wallet address that likely has no positions
        empty_wallet = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
        return self.test_profile_api_structure(empty_wallet)

    def validate_profile_data(self, data, wallet_address):
        """Validate profile data makes sense"""
        print(f"\n📊 Validating profile data for {wallet_address[:10]}...")
        
        stats = data.get('stats', {})
        positions = data.get('positions', {})
        streak = data.get('streak', {})
        
        validation_errors = []
        
        # Basic validation
        if stats.get('totalBets', 0) < 0:
            validation_errors.append("totalBets cannot be negative")
        
        if stats.get('wins', 0) < 0:
            validation_errors.append("wins cannot be negative")
        
        if stats.get('losses', 0) < 0:
            validation_errors.append("losses cannot be negative")
        
        # Logical validation
        total_resolved = stats.get('wins', 0) + stats.get('losses', 0)
        if total_resolved > stats.get('totalBets', 0):
            validation_errors.append("wins + losses cannot exceed totalBets")
        
        # Winrate validation
        if total_resolved > 0:
            expected_winrate = (stats.get('wins', 0) / total_resolved) * 100
            actual_winrate = stats.get('winrate', 0)
            if abs(expected_winrate - actual_winrate) > 1:  # Allow 1% tolerance
                validation_errors.append(f"winrate mismatch: expected ~{expected_winrate:.1f}%, got {actual_winrate}%")
        
        # Positions validation
        positions_total = sum([
            positions.get('active', 0),
            positions.get('won', 0),
            positions.get('lost', 0),
            positions.get('claimed', 0)
        ])
        
        # Note: won positions can be claimed, so total might not equal totalBets exactly
        # But active + resolved should make sense
        
        # Streak validation
        if streak.get('current', 0) < 0:
            validation_errors.append("current streak cannot be negative")
        
        if streak.get('best', 0) < 0:
            validation_errors.append("best streak cannot be negative")
        
        if streak.get('current', 0) > streak.get('best', 0):
            validation_errors.append("current streak cannot exceed best streak")
        
        if validation_errors:
            print(f"❌ Data validation failed:")
            for error in validation_errors:
                print(f"   - {error}")
            return False
        else:
            print(f"✅ Profile data validation passed")
            return True

    def print_summary(self):
        """Print test summary"""
        print(f"\n" + "="*60)
        print(f"📊 Profile API Test Summary")
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
    print("🚀 Starting Profile API Tests...")
    print("="*60)
    
    # Setup
    tester = ProfileAPITester()

    # Run profile tests
    print("\n📋 Running Profile API Tests...")
    
    # Test with wallet that has positions
    success1, data1 = tester.test_profile_with_positions()
    if success1 and data1:
        tester.validate_profile_data(data1, "0x413cd446676a75a536d15fa6c7396013e7809017")
    
    # Test with empty wallet
    success2, data2 = tester.test_profile_empty_wallet()
    if success2 and data2:
        tester.validate_profile_data(data2, "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6")

    # Print results
    tester.print_summary()
    
    # Save detailed results
    with open('/app/test_reports/profile_api_results.json', 'w') as f:
        json.dump({
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            "results": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/test_reports/profile_api_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())