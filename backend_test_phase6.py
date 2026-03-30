#!/usr/bin/env python3
"""
FOMO Arena PHASE 6 REAL-TIME ADDICTION ENGINE - Backend API Testing
Tests live activity, push notifications, WebSocket connections, and user subscriptions
"""

import requests
import sys
import json
import time
import websocket
import threading
from datetime import datetime

class FOMOArenaPhase6Tester:
    def __init__(self, base_url="https://repo-setup-54.preview.emergentagent.com"):
        self.base_url = base_url
        self.ws_url = base_url.replace('https://', 'wss://').replace('http://', 'ws://')
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = {}
        self.ws_messages = []
        self.ws_connected = False

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

    def test_websocket_connection(self):
        """Test WebSocket connection for live activity"""
        print(f"\n🔌 Testing WebSocket Connection...")
        print(f"   URL: {self.ws_url}/live")
        
        try:
            def on_message(ws, message):
                self.ws_messages.append(json.loads(message))
                print(f"   📨 WebSocket message: {message[:100]}...")

            def on_open(ws):
                self.ws_connected = True
                print(f"   ✅ WebSocket connected")
                # Subscribe to market activity
                ws.send(json.dumps({
                    "event": "subscribe:market",
                    "data": {"marketId": "test_market_123"}
                }))

            def on_error(ws, error):
                print(f"   ❌ WebSocket error: {error}")

            def on_close(ws, close_status_code, close_msg):
                print(f"   🔌 WebSocket closed")

            ws = websocket.WebSocketApp(
                f"{self.ws_url}/live",
                on_message=on_message,
                on_open=on_open,
                on_error=on_error,
                on_close=on_close
            )

            # Run WebSocket in thread for 5 seconds
            ws_thread = threading.Thread(target=ws.run_forever)
            ws_thread.daemon = True
            ws_thread.start()
            
            time.sleep(5)  # Wait for connection and messages
            ws.close()
            
            if self.ws_connected:
                self.tests_passed += 1
                self.test_results['WebSocket Connection'] = {
                    'status': 'PASSED',
                    'messages_received': len(self.ws_messages)
                }
                return True
            else:
                self.failed_tests.append({'name': 'WebSocket Connection', 'error': 'Failed to connect'})
                self.test_results['WebSocket Connection'] = {
                    'status': 'FAILED',
                    'error': 'Failed to connect'
                }
                return False

        except Exception as e:
            print(f"   ❌ WebSocket test failed: {str(e)}")
            self.failed_tests.append({'name': 'WebSocket Connection', 'error': str(e)})
            self.test_results['WebSocket Connection'] = {
                'status': 'FAILED',
                'error': str(e)
            }
            return False
        finally:
            self.tests_run += 1

def main():
    print("=" * 70)
    print("🚀 FOMO Arena PHASE 6 REAL-TIME ADDICTION ENGINE - Backend API Testing")
    print("=" * 70)
    
    tester = FOMOArenaPhase6Tester()
    
    # ==================== HEALTH CHECK ====================
    print("\n❤️ HEALTH CHECK")
    print("-" * 40)
    
    tester.run_test(
        "Health Check",
        "GET",
        "api/health",
        200
    )
    
    # ==================== LIVE ACTIVITY STATS ====================
    print("\n📊 LIVE ACTIVITY STATS")
    print("-" * 40)
    
    tester.run_test(
        "Live Activity Stats",
        "GET",
        "api/live/stats",
        200
    )
    
    # ==================== PUSH NOTIFICATIONS API ====================
    print("\n🔔 PUSH NOTIFICATIONS API")
    print("-" * 40)
    
    test_wallet = "0x1234567890123456789012345678901234567890"
    
    # Test get user subscriptions
    success, sub_response = tester.run_test(
        "Get User Subscriptions",
        "GET",
        f"api/push/subscriptions/{test_wallet}",
        200
    )
    
    # Test update notification settings
    notification_settings = {
        "edgeAlerts": True,
        "whaleAlerts": True,
        "closingAlerts": True,
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
        data=notification_settings
    )
    
    # Test add market to watchlist
    test_market_id = "market_123"
    tester.run_test(
        "Add Market to Watchlist",
        "POST",
        f"api/push/subscriptions/{test_wallet}/watch-market",
        201,  # POST creation should return 201
        data={"marketId": test_market_id}
    )
    
    # Test add rival to watchlist
    test_rival_wallet = "0x9876543210987654321098765432109876543210"
    tester.run_test(
        "Add Rival to Watchlist",
        "POST",
        f"api/push/subscriptions/{test_wallet}/watch-rival",
        201,  # POST creation should return 201
        data={"rivalWallet": test_rival_wallet}
    )
    
    # Test remove market from watchlist
    tester.run_test(
        "Remove Market from Watchlist",
        "DELETE",
        f"api/push/subscriptions/{test_wallet}/watch-market/{test_market_id}",
        200
    )
    
    # Test link Telegram ID
    tester.run_test(
        "Link Telegram ID",
        "POST",
        f"api/push/subscriptions/{test_wallet}/link-telegram",
        201,  # POST creation should return 201
        data={"telegramId": "123456789"}
    )
    
    # Test get notification stats
    tester.run_test(
        "Get Notification Stats",
        "GET",
        f"api/push/stats/{test_wallet}",
        200
    )
    
    # Test track notification click
    test_notification_id = "notif_123"
    tester.run_test(
        "Track Notification Click",
        "POST",
        f"api/push/track-click/{test_notification_id}",
        200
    )
    
    # Test send test notification (dev endpoint)
    tester.run_test(
        "Send Test Notification",
        "POST",
        f"api/push/test/{test_wallet}",
        200,
        data={
            "type": "edge_alert",  # Use lowercase enum value
            "message": "Test edge alert notification"
        }
    )
    
    # ==================== WEBSOCKET CONNECTION ====================
    print("\n🔌 WEBSOCKET CONNECTION")
    print("-" * 40)
    
    # Test WebSocket connection
    tester.test_websocket_connection()
    
    # ==================== ADDITIONAL API ENDPOINTS ====================
    print("\n🔗 ADDITIONAL API ENDPOINTS")
    print("-" * 40)
    
    # Test markets endpoint (needed for frontend)
    tester.run_test(
        "Get Markets",
        "GET",
        "api/markets",
        200
    )
    
    # Test onchain markets
    tester.run_test(
        "Get Onchain Markets",
        "GET",
        "api/onchain/markets",
        200
    )
    
    # Test positions endpoint
    tester.run_test(
        "Get Positions",
        "GET",
        "api/onchain/positions",
        200
    )
    
    # Test leaderboard
    tester.run_test(
        "Get Leaderboard",
        "GET",
        "api/leaderboard",
        200
    )
    
    # ==================== RATE LIMITING TESTS ====================
    print("\n⏱️ RATE LIMITING TESTS")
    print("-" * 40)
    
    # Test multiple rapid requests to check rate limiting
    print("Testing rate limiting with rapid requests...")
    rate_limit_passed = 0
    for i in range(3):
        success, _ = tester.run_test(
            f"Rate Limit Test {i+1}",
            "POST",
            f"api/push/test/{test_wallet}",
            200,  # Should work for first few, then potentially rate limited
            data={"type": "edge_alert", "message": f"Rate limit test {i+1}"}  # Use lowercase enum
        )
        if success:
            rate_limit_passed += 1
        time.sleep(0.5)  # Small delay between requests
    
    print(f"Rate limiting: {rate_limit_passed}/3 requests passed")
    
    # ==================== DEEP LINK TESTS ====================
    print("\n🔗 DEEP LINK TESTS")
    print("-" * 40)
    
    # Test deep link format (should be handled by frontend, but test API response)
    deep_link_data = {
        "type": "market",
        "marketId": test_market_id,
        "action": "bet"
    }
    
    # This might not exist as a specific endpoint, but test if there's a deep link handler
    tester.run_test(
        "Deep Link Handler",
        "GET",
        f"api/deeplink/market/{test_market_id}",
        200  # May return 404 if not implemented, that's ok
    )
    
    # ==================== RESULTS ====================
    print("\n" + "=" * 70)
    print("📊 PHASE 6 TEST RESULTS SUMMARY")
    print("=" * 70)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {len(tester.failed_tests)}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Categorize results
    critical_features = [
        "Health Check",
        "Live Activity Stats", 
        "Get User Subscriptions",
        "Update Notification Settings",
        "Add Market to Watchlist"
    ]
    
    critical_passed = sum(1 for test in critical_features if tester.test_results.get(test, {}).get('status') == 'PASSED')
    print(f"\nCritical Features: {critical_passed}/{len(critical_features)} passed")
    
    if tester.ws_connected:
        print("✅ WebSocket connection successful")
    else:
        print("❌ WebSocket connection failed")
    
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
                'success_rate': f"{(tester.tests_passed/tester.tests_run)*100:.1f}%",
                'critical_features_passed': f"{critical_passed}/{len(critical_features)}",
                'websocket_connected': tester.ws_connected,
                'websocket_messages_received': len(tester.ws_messages)
            },
            'failed_tests': tester.failed_tests,
            'detailed_results': tester.test_results,
            'websocket_messages': tester.ws_messages[:5]  # First 5 messages only
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: {results_file}")
    
    # Return appropriate exit code
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())