#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime

class XPSystemTester:
    def __init__(self, base_url="https://f4904d02-45cf-4af2-bac8-acdcf84269d3.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.test_wallet = "0x413cd446676a75a536d15fa6c7396013e7809017"  # Test user from context

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, validate_response=None):
        """Run a single API test with optional response validation"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=15)

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
                try:
                    response_data = response.json()
                    result["response_data"] = response_data
                    
                    # Additional response validation if provided
                    if validate_response:
                        validation_result = validate_response(response_data)
                        if not validation_result["valid"]:
                            success = False
                            result["validation_error"] = validation_result["error"]
                            print(f"❌ Failed - Response validation failed: {validation_result['error']}")
                        else:
                            print(f"✅ Passed - Status: {response.status_code}")
                            if validation_result.get("details"):
                                print(f"   Details: {validation_result['details']}")
                    else:
                        print(f"✅ Passed - Status: {response.status_code}")
                        print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
                        
                except Exception as e:
                    result["response_data"] = response.text[:200]
                    print(f"✅ Passed - Status: {response.status_code}")
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

            if success:
                self.tests_passed += 1
                
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

    def validate_xp_stats_response(self, response_data):
        """Validate XP stats response structure"""
        if not response_data.get("success"):
            return {"valid": False, "error": "Response success is false"}
        
        data = response_data.get("data", {})
        required_fields = ["wallet", "xp", "level", "xpProgress", "badges"]
        
        for field in required_fields:
            if field not in data:
                return {"valid": False, "error": f"Missing required field: {field}"}
        
        # Validate xpProgress structure
        xp_progress = data.get("xpProgress", {})
        progress_fields = ["current", "needed", "percentage"]
        for field in progress_fields:
            if field not in xp_progress:
                return {"valid": False, "error": f"Missing xpProgress field: {field}"}
        
        # Validate level calculation (level = sqrt(xp/100) + 1)
        xp = data.get("xp", 0)
        level = data.get("level", 1)
        expected_level = int((xp / 100) ** 0.5) + 1
        
        if level != expected_level:
            return {"valid": False, "error": f"Level calculation incorrect. XP: {xp}, Level: {level}, Expected: {expected_level}"}
        
        return {
            "valid": True, 
            "details": f"XP: {xp}, Level: {level}, Badges: {len(data.get('badges', []))}"
        }

    def validate_badges_response(self, response_data):
        """Validate badges response structure"""
        if not response_data.get("success"):
            return {"valid": False, "error": "Response success is false"}
        
        data = response_data.get("data", [])
        if not isinstance(data, list):
            return {"valid": False, "error": "Badges data should be an array"}
        
        # Check for required badge types
        badge_ids = [badge.get("id") for badge in data if isinstance(badge, dict)]
        required_badges = ["first_bet", "first_win"]
        
        for badge_id in required_badges:
            if badge_id not in badge_ids:
                return {"valid": False, "error": f"Missing required badge: {badge_id}"}
        
        return {"valid": True, "details": f"Found {len(data)} badges"}

    def validate_rewards_response(self, response_data):
        """Validate XP rewards response structure"""
        if not response_data.get("success"):
            return {"valid": False, "error": "Response success is false"}
        
        data = response_data.get("data", {})
        required_rewards = ["BET_PLACED", "WIN"]
        
        for reward in required_rewards:
            if reward not in data:
                return {"valid": False, "error": f"Missing reward type: {reward}"}
        
        # Validate expected reward values
        if data.get("BET_PLACED") != 10:
            return {"valid": False, "error": f"BET_PLACED should be 10, got {data.get('BET_PLACED')}"}
        
        if data.get("WIN") != 50:
            return {"valid": False, "error": f"WIN should be 50, got {data.get('WIN')}"}
        
        return {"valid": True, "details": f"BET_PLACED: {data.get('BET_PLACED')}, WIN: {data.get('WIN')}"}

    def test_xp_stats_endpoint(self):
        """Test /api/xp/stats/:wallet endpoint"""
        return self.run_test(
            "XP Stats API",
            "GET",
            f"xp/stats/{self.test_wallet}",
            200,
            validate_response=self.validate_xp_stats_response
        )

    def test_xp_badges_endpoint(self):
        """Test /api/xp/badges endpoint"""
        return self.run_test(
            "XP Badges API",
            "GET",
            "xp/badges",
            200,
            validate_response=self.validate_badges_response
        )

    def test_xp_rewards_endpoint(self):
        """Test /api/xp/rewards endpoint"""
        return self.run_test(
            "XP Rewards API",
            "GET",
            "xp/rewards",
            200,
            validate_response=self.validate_rewards_response
        )

    def test_webhook_bet_placed(self):
        """Test webhook for bet_placed event"""
        webhook_data = {
            "type": "bet_placed",
            "user": self.test_wallet,
            "marketId": 1,
            "tokenId": 123,
            "amount": "1000000000000000000",  # 1 USDT in wei
            "outcome": 1,
            "question": "Test market question",
            "txHash": "0x123456789abcdef"
        }
        
        def validate_webhook_response(response_data):
            if not response_data.get("success"):
                return {"valid": False, "error": "Webhook response success is false"}
            
            data = response_data.get("data", {})
            if not data.get("processed"):
                return {"valid": False, "error": "Event not processed"}
            
            if data.get("type") != "bet_placed":
                return {"valid": False, "error": f"Wrong event type: {data.get('type')}"}
            
            if data.get("xp") != 10:
                return {"valid": False, "error": f"Expected 10 XP for bet, got {data.get('xp')}"}
            
            return {"valid": True, "details": f"XP awarded: {data.get('xp')}, Badges: {data.get('badges', [])}"}
        
        return self.run_test(
            "Webhook Bet Placed",
            "POST",
            "onchain/webhook/event",
            201,
            data=webhook_data,
            validate_response=validate_webhook_response
        )

    def test_webhook_position_won(self):
        """Test webhook for position_won event"""
        webhook_data = {
            "type": "position_won",
            "user": self.test_wallet,
            "marketId": 1,
            "tokenId": 124,
            "amount": "2000000000000000000",  # 2 USDT in wei
            "outcome": 1,
            "question": "Test market question",
            "txHash": "0x123456789abcdef2"
        }
        
        def validate_webhook_response(response_data):
            if not response_data.get("success"):
                return {"valid": False, "error": "Webhook response success is false"}
            
            data = response_data.get("data", {})
            if not data.get("processed"):
                return {"valid": False, "error": "Event not processed"}
            
            if data.get("type") != "position_won":
                return {"valid": False, "error": f"Wrong event type: {data.get('type')}"}
            
            # XP can be 50 (base) or higher with streak bonuses
            xp_awarded = data.get("xp", 0)
            if xp_awarded < 50:
                return {"valid": False, "error": f"Expected at least 50 XP for win, got {xp_awarded}"}
            
            return {"valid": True, "details": f"XP awarded: {xp_awarded}, Streak: {data.get('streak', 0)}"}
        
        return self.run_test(
            "Webhook Position Won",
            "POST",
            "onchain/webhook/event",
            201,
            data=webhook_data,
            validate_response=validate_webhook_response
        )

    def test_level_calculation_logic(self):
        """Test level calculation with different XP values"""
        test_cases = [
            (0, 1),      # 0 XP = Level 1
            (100, 2),    # 100 XP = Level 2
            (400, 3),    # 400 XP = Level 3
            (900, 4),    # 900 XP = Level 4
            (1600, 5),   # 1600 XP = Level 5
        ]
        
        print(f"\n🧮 Testing Level Calculation Logic...")
        all_passed = True
        
        for xp, expected_level in test_cases:
            calculated_level = int((xp / 100) ** 0.5) + 1
            if calculated_level == expected_level:
                print(f"✅ XP {xp} → Level {calculated_level} (correct)")
            else:
                print(f"❌ XP {xp} → Level {calculated_level}, expected {expected_level}")
                all_passed = False
        
        self.tests_run += 1
        if all_passed:
            self.tests_passed += 1
            
        return all_passed

    def print_summary(self):
        """Print test summary"""
        print(f"\n" + "="*60)
        print(f"🎯 XP System Test Summary")
        print(f"="*60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.tests_run - self.tests_passed > 0:
            print(f"\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    error_msg = result.get('validation_error') or result.get('error', 'Status ' + str(result['actual_status']))
                    print(f"   - {result['test_name']}: {error_msg}")

def main():
    print("🚀 Starting XP System Tests...")
    print("="*60)
    
    # Setup
    tester = XPSystemTester()

    # Run all XP system tests
    print("\n📋 Running XP System API Tests...")
    
    # Core XP API endpoints
    tester.test_xp_stats_endpoint()
    tester.test_xp_badges_endpoint()
    tester.test_xp_rewards_endpoint()
    
    # Webhook tests
    print("\n🔗 Testing Webhook Events...")
    tester.test_webhook_bet_placed()
    time.sleep(1)  # Small delay between webhook calls
    tester.test_webhook_position_won()
    
    # Logic tests
    tester.test_level_calculation_logic()

    # Print results
    tester.print_summary()
    
    # Save detailed results
    with open('/app/test_reports/xp_system_results.json', 'w') as f:
        json.dump({
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            "results": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/test_reports/xp_system_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())