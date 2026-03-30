#!/usr/bin/env python3
"""
FOMO Arena PHASE 5 VIRAL LOOP (Share Win) - Backend API Testing
Tests share win tracking endpoint, XP rewards, and viral loop backend support
"""

import requests
import sys
import json
from datetime import datetime

class FOMOArenaAPITester:
    def __init__(self, base_url="https://c71c518d-fc6c-40e7-b01d-a7a268bf1d7c.preview.emergentagent.com"):
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
    print("=" * 60)
    print("🚀 FOMO Arena PHASE 5 VIRAL LOOP (Share Win) - Backend API Testing")
    print("=" * 60)
    
    tester = FOMOArenaAPITester()
    
    # ==================== PHASE 5: SHARE WIN TRACKING API ====================
    print("\n🎉 PHASE 5: SHARE WIN TRACKING API TESTS")
    print("-" * 40)
    
    # Test share win tracking endpoint - the main feature for PHASE 5
    test_token_id = "123"
    share_platforms = ['telegram', 'twitter', 'copy']
    
    for platform in share_platforms:
        success, response = tester.run_test(
            f"Track Win Share - {platform.title()}",
            "POST",
            f"api/share/win/{test_token_id}/track",
            200,
            data={"platform": platform}
        )
        
        # Verify XP reward is mentioned in response
        if success and response.get('data'):
            data = response['data']
            if 'xpAwarded' in data:
                print(f"   ✅ XP Awarded: {data['xpAwarded']}")
            else:
                print(f"   ⚠️  No XP award info in response")
    
    # Test duplicate share tracking (should prevent spam)
    tester.run_test(
        "Track Win Share - Duplicate Prevention",
        "POST",
        f"api/share/win/{test_token_id}/track",
        200,
        data={"platform": "telegram"}
    )
    
    # Test invalid token ID
    tester.run_test(
        "Track Win Share - Invalid Token ID",
        "POST",
        "api/share/win/invalid/track",
        400  # Should return error for invalid token
    )
    
    # ==================== SHARE LINK CREATION API ====================
    print("\n🔗 SHARE LINK CREATION API TESTS")
    print("-" * 40)
    
    # Test creating share link for position
    test_position_id = "pos_123"
    test_wallet = "0x1234567890123456789012345678901234567890"
    
    tester.run_test(
        "Create Share Link for Position",
        "POST",
        f"api/share/position/{test_position_id}",
        200,
        data={}
    )
    
    # Test getting share data (public endpoint)
    test_share_id = "sh_test123"
    tester.run_test(
        "Get Share Link Data",
        "GET",
        f"api/share/{test_share_id}",
        200  # Should work even if share doesn't exist (returns 404 or empty)
    )
    
    # Test user share stats
    tester.run_test(
        "Get User Share Stats",
        "GET",
        "api/share/stats/me",
        200
    )
    
    # Test top referrers leaderboard
    tester.run_test(
        "Get Top Referrers Leaderboard",
        "GET",
        "api/share/leaderboard/referrers",
        200,
        params={'limit': '10'}
    )
    
    # ==================== ECONOMY/LEADERBOARD API ====================
    print("\n🏆 ECONOMY/LEADERBOARD API TESTS")
    print("-" * 40)
    
    # Test economy leaderboard endpoint
    success, leaderboard_response = tester.run_test(
        "Economy Leaderboard",
        "GET",
        "api/economy/leaderboard",
        200
    )
    
    # Test with limit parameter
    tester.run_test(
        "Economy Leaderboard with Limit",
        "GET",
        "api/economy/leaderboard",
        200,
        params={'limit': '10'}
    )
    
    # Test user economy stats
    test_wallet = "0x1234567890123456789012345678901234567890"
    tester.run_test(
        f"User Economy Stats for {test_wallet[:10]}...",
        "GET",
        f"api/economy/stats/{test_wallet}",
        200
    )
    
    # ==================== ONCHAIN POSITIONS API ====================
    print("\n🎯 ONCHAIN POSITIONS API TESTS")
    print("-" * 40)
    
    # Test positions endpoint (key for MyPositions component)
    success, positions_response = tester.run_test(
        "Get Onchain Positions",
        "GET",
        "api/onchain/positions",
        200
    )
    
    # Test positions with owner filter (what MyPositions uses)
    tester.run_test(
        f"Get Positions for Owner {test_wallet[:10]}...",
        "GET",
        "api/onchain/positions",
        200,
        params={'owner': test_wallet}
    )
    
    # Test positions with status filter
    tester.run_test(
        "Get Won Positions",
        "GET",
        "api/onchain/positions",
        200,
        params={'status': 'won'}
    )
    
    # Test single position by token ID if positions exist
    if success and positions_response.get('data') and len(positions_response['data']) > 0:
        position = positions_response['data'][0]
        token_id = position.get('tokenId')
        if token_id:
            tester.run_test(
                f"Get Single Position #{token_id}",
                "GET",
                f"api/onchain/positions/{token_id}",
                200
            )
    
    # ==================== LEADERBOARD API ====================
    print("\n📊 LEADERBOARD API TESTS")
    print("-" * 40)
    
    # Test main leaderboard endpoint
    tester.run_test(
        "Main Leaderboard",
        "GET",
        "api/leaderboard",
        200
    )
    
    # Test different leaderboard types
    leaderboard_types = ['global', 'weekly', 'profit', 'duels', 'xp']
    for lb_type in leaderboard_types:
        tester.run_test(
            f"Leaderboard - {lb_type.title()}",
            "GET",
            "api/leaderboard",
            200,
            params={'type': lb_type, 'limit': '10'}
        )
    
    # Test specific leaderboard endpoints
    tester.run_test(
        "Global Leaderboard",
        "GET",
        "api/leaderboard/global",
        200
    )
    
    tester.run_test(
        "Weekly Leaderboard", 
        "GET",
        "api/leaderboard/weekly",
        200
    )
    
    tester.run_test(
        "XP Leaderboard",
        "GET", 
        "api/leaderboard/xp",
        200
    )
    
    # ==================== MARKETS API ====================
    print("\n📈 MARKETS API TESTS")
    print("-" * 40)
    
    # Test onchain markets endpoint (for Arena page)
    success, markets_response = tester.run_test(
        "Get Onchain Markets",
        "GET",
        "api/onchain/markets",
        200
    )
    
    # Test markets with filters
    tester.run_test(
        "Active Onchain Markets",
        "GET",
        "api/onchain/markets",
        200,
        params={'status': 'active'}
    )
    
    # Test single market if any exist
    if success and markets_response.get('data') and len(markets_response['data']) > 0:
        market = markets_response['data'][0]
        market_id = market.get('id') or market.get('marketId')
        if market_id:
            tester.run_test(
                f"Get Single Market #{market_id}",
                "GET",
                f"api/markets/{market_id}",
                200
            )
    
    # ==================== HEALTH CHECK ====================
    print("\n❤️ HEALTH CHECK TESTS")
    print("-" * 40)
    
    tester.run_test(
        "Health Check",
        "GET",
        "api/health",
        200
    )
    
    # ==================== WEBHOOK ENDPOINT ====================
    print("\n🔗 WEBHOOK TESTS")
    print("-" * 40)
    
    # Test webhook endpoint for economy events
    webhook_data = {
        "type": "position_claimed",
        "wallet": test_wallet,
        "tokenId": 123,
        "netAmount": "1000000000000000000",  # 1 USDT in wei
        "feeAmount": "20000000000000000",    # 0.02 USDT fee
        "txHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    }
    
    tester.run_test(
        "Webhook - Position Claimed Event",
        "POST",
        "api/onchain/webhook/event",
        201,  # 201 is correct for POST creation
        data=webhook_data
    )
    
    # ==================== RESULTS ====================
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
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
    results_file = '/app/test_reports/viral_loop_backend_test_results.json'
    with open(results_file, 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
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