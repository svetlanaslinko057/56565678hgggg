#!/usr/bin/env python3
"""
FOMO Arena PHASE 6 REAL-TIME ADDICTION ENGINE - Backend API Testing
Tests LiveActivityTicker, NotificationSettingsPanel, Telegram Push APIs
"""

import requests
import sys
import json
from datetime import datetime

class FOMOArenaPhase6APITester:
    def __init__(self, base_url="https://repo-setup-54.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = {}

    def run_test(self, name, method, endpoint, expected_status=200, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                
                # Try to parse JSON response
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict):
                        if 'data' in response_data:
                            print(f"   Data type: {type(response_data['data'])}")
                            if isinstance(response_data['data'], list):
                                print(f"   Data length: {len(response_data['data'])}")
                            elif isinstance(response_data['data'], dict):
                                print(f"   Data keys: {list(response_data['data'].keys())}")
                        if 'success' in response_data:
                            print(f"   Success: {response_data['success']}")
                except:
                    print(f"   Response: {response.text[:200]}...")
                    
                self.test_results[name] = {
                    'status': 'PASSED',
                    'response_code': response.status_code,
                    'response_data': response.text[:500] if response.text else None
                }
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                self.test_results[name] = {
                    'status': 'FAILED',
                    'response_code': response.status_code,
                    'error': response.text[:200]
                }

            return success, response.json() if response.text and response.status_code < 400 else {}

        except requests.exceptions.Timeout:
            print(f"❌ FAILED - Request timeout")
            self.failed_tests.append({'name': name, 'error': 'Timeout'})
            self.test_results[name] = {'status': 'FAILED', 'error': 'Timeout'}
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            self.failed_tests.append({'name': name, 'error': str(e)})
            self.test_results[name] = {'status': 'FAILED', 'error': str(e)}
            return False, {}

def main():
    print("=" * 70)
    print("🚀 FOMO Arena PHASE 6 REAL-TIME ADDICTION ENGINE - Backend API Testing")
    print("=" * 70)
    
    tester = FOMOArenaPhase6APITester()
    
    # Test wallet for API calls
    test_wallet = "0x1234567890123456789012345678901234567890"
    
    # ==================== PHASE 6: PUSH NOTIFICATIONS API ====================
    print("\n🔔 PHASE 6: PUSH NOTIFICATIONS API TESTS")
    print("-" * 50)
    
    # Test push subscriptions endpoint - main feature for Phase 6
    success, response = tester.run_test(
        "Get Push Subscriptions",
        "GET",
        f"api/push/subscriptions/{test_wallet}",
        200
    )
    
    # Verify subscription data structure
    if success and response.get('data'):
        data = response['data']
        expected_fields = ['wallet', 'telegramId', 'watchlistMarkets', 'watchlistRivals', 'settings', 'isActive']
        for field in expected_fields:
            if field in data:
                print(f"   ✅ Field '{field}' present: {type(data[field])}")
            else:
                print(f"   ⚠️  Field '{field}' missing from response")
    
    # Test notification settings update
    settings_data = {
        "edgeAlerts": True,
        "whaleAlerts": True,
        "closingAlerts": False,
        "winAlerts": True,
        "rivalAlerts": True,
        "maxDailyNotifications": 5,
        "edgeThreshold": 10,
        "whaleThreshold": 100
    }
    
    tester.run_test(
        "Update Notification Settings",
        "PUT",
        f"api/push/subscriptions/{test_wallet}/settings",
        200,
        data=settings_data
    )
    
    # Test watch market functionality
    tester.run_test(
        "Watch Market",
        "POST",
        f"api/push/subscriptions/{test_wallet}/watch-market",
        200,
        data={"marketId": "test_market_123"}
    )
    
    # Test watch rival functionality
    tester.run_test(
        "Watch Rival",
        "POST",
        f"api/push/subscriptions/{test_wallet}/watch-rival",
        200,
        data={"rivalWallet": "0x9876543210987654321098765432109876543210"}
    )
    
    # Test link Telegram
    tester.run_test(
        "Link Telegram",
        "POST",
        f"api/push/subscriptions/{test_wallet}/link-telegram",
        200,
        data={"telegramId": "123456789"}
    )
    
    # Test notification stats
    tester.run_test(
        "Get Notification Stats",
        "GET",
        f"api/push/stats/{test_wallet}",
        200
    )
    
    # Test push notification test endpoint
    tester.run_test(
        "Test Push Notification",
        "POST",
        f"api/push/test/{test_wallet}",
        200,
        data={"type": "edge_alert", "message": "Test edge alert notification"}
    )
    
    # ==================== PHASE 6: LIVE ACTIVITY API ====================
    print("\n⚡ PHASE 6: LIVE ACTIVITY API TESTS")
    print("-" * 50)
    
    # Test live stats endpoint - main feature for LiveActivityTicker
    success, response = tester.run_test(
        "Get Live Activity Stats",
        "GET",
        "api/live/stats",
        200
    )
    
    # Verify live stats data structure
    if success and response.get('data'):
        data = response['data']
        print(f"   ✅ Live stats data type: {type(data)}")
        if isinstance(data, dict):
            print(f"   ✅ Live stats keys: {list(data.keys())}")
        elif isinstance(data, list):
            print(f"   ✅ Live stats array length: {len(data)}")
    
    # ==================== SUPPORTING APIS FOR PHASE 6 ====================
    print("\n🎯 SUPPORTING APIS FOR PHASE 6")
    print("-" * 50)
    
    # Test markets API (needed for notifications)
    tester.run_test(
        "Get Onchain Markets",
        "GET",
        "api/onchain/markets",
        200
    )
    
    # Test positions API (needed for win notifications)
    tester.run_test(
        "Get Onchain Positions",
        "GET",
        "api/onchain/positions",
        200,
        params={'owner': test_wallet}
    )
    
    # Test notifications API (general notifications)
    tester.run_test(
        "Get Notifications",
        "GET",
        "api/notifications",
        200,
        params={'limit': '10'}
    )
    
    # Test activity feed (for live ticker)
    tester.run_test(
        "Get Activity Feed",
        "GET",
        "api/activity",
        200,
        params={'limit': '20'}
    )
    
    # ==================== HEALTH CHECK ====================
    print("\n❤️ HEALTH CHECK")
    print("-" * 50)
    
    tester.run_test(
        "Health Check",
        "GET",
        "api/health",
        200
    )
    
    # ==================== RESULTS ====================
    print("\n" + "=" * 70)
    print("📊 PHASE 6 TEST RESULTS SUMMARY")
    print("=" * 70)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {len(tester.failed_tests)}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ FAILED TESTS ({len(tester.failed_tests)}):")
        for i, test in enumerate(tester.failed_tests, 1):
            print(f"{i}. {test['name']}")
            if 'expected' in test:
                print(f"   Expected: {test['expected']}, Got: {test['actual']}")
            if 'error' in test:
                print(f"   Error: {test['error']}")
            if 'response' in test:
                print(f"   Response: {test['response']}")
    
    # Save detailed results
    results_file = '/app/test_reports/phase6_backend_test_results.json'
    with open(results_file, 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'phase': 'PHASE 6 - REAL-TIME ADDICTION ENGINE',
            'summary': {
                'tests_run': tester.tests_run,
                'tests_passed': tester.tests_passed,
                'tests_failed': len(tester.failed_tests),
                'success_rate': f"{(tester.tests_passed/tester.tests_run)*100:.1f}%"
            },
            'failed_tests': tester.failed_tests,
            'detailed_results': tester.test_results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: {results_file}")
    
    # Return appropriate exit code
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())