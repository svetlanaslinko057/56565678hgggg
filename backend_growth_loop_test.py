#!/usr/bin/env python3
"""
FOMO Arena Growth Loop Backend API Testing
Tests Growth Loop APIs: Weekly Competition, Rival Pressure, Deep Links, Win Cards
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class GrowthLoopAPITester:
    def __init__(self, base_url="https://d21137f1-fc3d-469c-9e06-cfa3fa2870be.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test wallet addresses
        self.test_wallet = "0x1234567890123456789012345678901234567890"
        self.rival_wallet = "0x9876543210987654321098765432109876543210"

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {name}")
        if details:
            print(f"    {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None, params: Optional[Dict] = None) -> tuple[bool, Any]:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        
        # Default headers
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
            
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
                
            details = f"Status: {response.status_code} (expected {expected_status})"
            if not success:
                details += f" | Response: {response.text[:200]}"
                
            self.log_test(name, success, details, response_data)
            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_weekly_competition(self):
        """Test weekly competition data endpoint"""
        print("\n🔍 Testing Weekly Competition API...")
        success, response_data = self.run_test(
            "Weekly Competition Data",
            "GET", 
            f"api/growth/weekly/{self.test_wallet}",
            200
        )
        
        if success and response_data.get('success'):
            data = response_data.get('data', {})
            required_fields = ['endsIn', 'yourRank', 'yourProfit', 'yourPotentialReward', 'topUsers', 'isInTop10']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Weekly Competition Data Structure", False, f"Missing fields: {missing_fields}")
                return False, response_data
            else:
                self.log_test("Weekly Competition Data Structure", True, "All required fields present")
                
                # Validate data types
                if isinstance(data.get('topUsers'), list) and len(data['topUsers']) > 0:
                    self.log_test("Weekly Competition Top Users", True, f"Found {len(data['topUsers'])} top users")
                else:
                    self.log_test("Weekly Competition Top Users", False, "No top users found")
                    
        return success, response_data

    def test_rival_pressure(self):
        """Test rival pressure data endpoint"""
        print("\n🔍 Testing Rival Pressure API...")
        success, response_data = self.run_test(
            "Rival Pressure Data",
            "GET",
            f"api/growth/rivals/{self.test_wallet}",
            200
        )
        
        if success and response_data.get('success'):
            data = response_data.get('data', [])
            if isinstance(data, list):
                self.log_test("Rival Pressure Data Structure", True, f"Found {len(data)} rivals")
                
                # Check structure of first rival if exists
                if len(data) > 0:
                    rival = data[0]
                    required_fields = ['rivalWallet', 'rivalName', 'yourWins', 'rivalWins', 'streak', 'streakHolder']
                    missing_fields = [field for field in required_fields if field not in rival]
                    
                    if missing_fields:
                        self.log_test("Rival Data Structure", False, f"Missing fields: {missing_fields}")
                    else:
                        self.log_test("Rival Data Structure", True, "All required fields present")
            else:
                self.log_test("Rival Pressure Data Structure", False, "Expected array of rivals")
                
        return success, response_data

    def test_telegram_deeplink_generation(self):
        """Test Telegram deep link generation"""
        print("\n🔍 Testing Telegram Deep Link Generation...")
        
        # Test different link types
        link_types = [
            {'type': 'market', 'marketId': 'test_market_123'},
            {'type': 'rival', 'rivalWallet': self.rival_wallet},
            {'type': 'win', 'shareId': 'win_share_123'},
            {'type': 'leaderboard'},
            {'type': 'referral', 'refWallet': self.test_wallet}
        ]
        
        all_passed = True
        for link_params in link_types:
            success, response_data = self.run_test(
                f"Deep Link - {link_params['type']}",
                "GET",
                "api/growth/deeplink",
                200,
                params=link_params
            )
            
            if success and response_data.get('success'):
                deep_link = response_data.get('data', {}).get('deepLink')
                if deep_link and 't.me' in deep_link:
                    self.log_test(f"Deep Link {link_params['type']} Format", True, f"Valid Telegram link: {deep_link}")
                else:
                    self.log_test(f"Deep Link {link_params['type']} Format", False, f"Invalid link format: {deep_link}")
                    all_passed = False
            else:
                all_passed = False
                
        return all_passed, {}

    def test_win_card_generation(self):
        """Test enhanced win card data generation"""
        print("\n🔍 Testing Win Card Generation...")
        
        win_card_data = {
            "wallet": self.test_wallet,
            "positionId": "pos_123456",
            "profit": 150.75,
            "stake": 50.0
        }
        
        success, response_data = self.run_test(
            "Win Card Generation",
            "POST",
            "api/growth/win-card",
            201,
            data=win_card_data
        )
        
        if success and response_data.get('success'):
            data = response_data.get('data', {})
            required_fields = ['profit', 'roi', 'badges', 'achievements', 'streak', 'shareMessage', 'deepLink']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Win Card Data Structure", False, f"Missing fields: {missing_fields}")
                return False, response_data
            else:
                self.log_test("Win Card Data Structure", True, "All required fields present")
                
                # Validate ROI calculation
                expected_roi = ((win_card_data['profit'] - win_card_data['stake']) / win_card_data['stake']) * 100
                actual_roi = data.get('roi', 0)
                if abs(actual_roi - expected_roi) < 0.1:  # Allow small floating point differences
                    self.log_test("Win Card ROI Calculation", True, f"ROI correctly calculated: {actual_roi}%")
                else:
                    self.log_test("Win Card ROI Calculation", False, f"ROI mismatch: expected {expected_roi}, got {actual_roi}")
                    
                # Check badges and achievements
                badges = data.get('badges', [])
                achievements = data.get('achievements', [])
                self.log_test("Win Card Badges", True, f"Generated {len(badges)} badges: {badges}")
                self.log_test("Win Card Achievements", True, f"Generated {len(achievements)} achievements: {achievements}")
                
        return success, response_data

    def test_rival_pressure_notification(self):
        """Test rival pressure notification endpoint"""
        print("\n🔍 Testing Rival Pressure Notification...")
        
        notification_data = {
            "wallet": self.test_wallet,
            "rivalWallet": self.rival_wallet,
            "rivalName": "TestRival",
            "yourWins": 2,
            "rivalWins": 5,
            "streak": 3
        }
        
        success, response_data = self.run_test(
            "Rival Pressure Notification",
            "POST",
            "api/growth/notify/rival-pressure",
            201,
            data=notification_data
        )
        
        return success, response_data

    def test_weekly_pressure_notification(self):
        """Test weekly pressure notification endpoint"""
        print("\n🔍 Testing Weekly Pressure Notification...")
        
        notification_data = {
            "wallet": self.test_wallet,
            "rank": 15,
            "hoursLeft": 24
        }
        
        success, response_data = self.run_test(
            "Weekly Pressure Notification",
            "POST",
            "api/growth/notify/weekly-pressure",
            201,
            data=notification_data
        )
        
        return success, response_data

    def test_backend_health(self):
        """Test backend health check"""
        print("\n🔍 Testing Backend Health...")
        return self.run_test(
            "Backend Health Check",
            "GET", 
            "api/health",
            200
        )

    def test_fomo_engine_still_working(self):
        """Test that FOMO Engine is still working"""
        print("\n🔍 Testing FOMO Engine Still Working...")
        
        # Test FOMO stats endpoint
        success1, _ = self.run_test(
            "FOMO Engine Stats",
            "GET",
            "api/fomo/stats",
            200
        )
        
        # Test FOMO best signal endpoint
        success2, _ = self.run_test(
            "FOMO Engine Best Signal",
            "GET",
            "api/fomo/best-signal",
            200
        )
        
        return success1 and success2, {}

    def run_all_tests(self):
        """Run all Growth Loop API tests"""
        print("🚀 Starting FOMO Arena Growth Loop API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Backend health check
        self.test_backend_health()
        
        # FOMO Engine still working
        self.test_fomo_engine_still_working()
        
        # Growth Loop specific tests
        self.test_weekly_competition()
        self.test_rival_pressure()
        self.test_telegram_deeplink_generation()
        self.test_win_card_generation()
        self.test_rival_pressure_notification()
        self.test_weekly_pressure_notification()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All Growth Loop tests passed!")
            return 0
        else:
            print("⚠️  Some Growth Loop tests failed. Check details above.")
            return 1

    def save_results(self, filename: str = "/app/test_reports/growth_loop_api_results.json"):
        """Save test results to file"""
        try:
            with open(filename, 'w') as f:
                json.dump({
                    "summary": {
                        "total_tests": self.tests_run,
                        "passed_tests": self.tests_passed,
                        "success_rate": f"{(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%",
                        "timestamp": datetime.now().isoformat()
                    },
                    "results": self.test_results
                }, f, indent=2)
            print(f"📄 Results saved to: {filename}")
        except Exception as e:
            print(f"❌ Failed to save results: {e}")

def main():
    """Main test runner"""
    tester = GrowthLoopAPITester()
    exit_code = tester.run_all_tests()
    tester.save_results()
    return exit_code

if __name__ == "__main__":
    sys.exit(main())