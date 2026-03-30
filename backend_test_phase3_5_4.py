#!/usr/bin/env python3
"""
PHASE 3.5 CLAIM FLOW + PHASE 4 ECONOMY SYNC - Backend API Testing
Tests specific APIs for claim flow and economy sync functionality
"""

import requests
import sys
import json
from datetime import datetime

class ClaimEconomyAPITester:
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
    print("🚀 PHASE 3.5 CLAIM FLOW + PHASE 4 ECONOMY SYNC - Backend API Testing")
    print("=" * 60)
    
    tester = ClaimEconomyAPITester()
    
    # ==================== HEALTH CHECK ====================
    print("\n🏥 HEALTH CHECK")
    print("-" * 40)
    
    tester.run_test(
        "Backend API Health Check",
        "GET",
        "api/health",
        200
    )
    
    # ==================== ECONOMY LEADERBOARD ====================
    print("\n🏆 ECONOMY LEADERBOARD TESTS")
    print("-" * 40)
    
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
    
    # ==================== ONCHAIN POSITIONS ====================
    print("\n🎯 ONCHAIN POSITIONS TESTS")
    print("-" * 40)
    
    # Test sample wallet addresses
    test_wallets = [
        "0x1234567890123456789012345678901234567890",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e"  # Another test wallet
    ]
    
    for wallet in test_wallets:
        success, positions_response = tester.run_test(
            f"Get Positions for {wallet[:10]}...",
            "GET",
            "api/onchain/positions",
            200,
            params={'owner': wallet}
        )
        
        # If positions exist, test individual position
        if success and positions_response.get('data') and len(positions_response['data']) > 0:
            position = positions_response['data'][0]
            token_id = position.get('tokenId')
            if token_id:
                tester.run_test(
                    f"Get Position #{token_id}",
                    "GET",
                    f"api/onchain/positions/{token_id}",
                    200
                )
    
    # Test positions with different filters
    tester.run_test(
        "Positions with Status Filter (won)",
        "GET",
        "api/onchain/positions",
        200,
        params={'status': 'won'}
    )
    
    tester.run_test(
        "Positions with Status Filter (claimed)",
        "GET",
        "api/onchain/positions",
        200,
        params={'status': 'claimed'}
    )
    
    # ==================== ECONOMY STATS ====================
    print("\n📊 ECONOMY STATS TESTS")
    print("-" * 40)
    
    for wallet in test_wallets:
        success, stats_response = tester.run_test(
            f"Economy Stats for {wallet[:10]}...",
            "GET",
            f"api/onchain/stats/{wallet}",
            200
        )
        
        # Validate stats structure if successful
        if success and stats_response.get('data'):
            stats_data = stats_response['data']
            print(f"   XP: {stats_data.get('xp', 'N/A')}")
            print(f"   Level: {stats_data.get('level', 'N/A')}")
            print(f"   Total Bets: {stats_data.get('totalBets', 'N/A')}")
            print(f"   Total Wins: {stats_data.get('totalWins', 'N/A')}")
            print(f"   Current Streak: {stats_data.get('currentStreak', 'N/A')}")
    
    # ==================== XP SERVICE WEBHOOK TESTS ====================
    print("\n⚡ XP SERVICE WEBHOOK TESTS")
    print("-" * 40)
    
    # Test bet placed webhook
    bet_placed_data = {
        "type": "bet_placed",
        "wallet": "0x1234567890123456789012345678901234567890",
        "marketId": 1,
        "tokenId": 123,
        "amount": "1000000000000000000",  # 1 USDT in wei
        "outcome": 0,
        "txHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    }
    
    tester.run_test(
        "Webhook - Bet Placed Event",
        "POST",
        "api/onchain/webhook/event",
        201,  # Corrected to 201 for POST
        data=bet_placed_data
    )
    
    # Test position won webhook
    position_won_data = {
        "type": "position_won",
        "wallet": "0x1234567890123456789012345678901234567890",
        "marketId": 1,
        "tokenId": 123,
        "amount": "1000000000000000000",
        "payout": "2000000000000000000",  # 2 USDT payout
        "question": "Test market question",
        "txHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    }
    
    tester.run_test(
        "Webhook - Position Won Event",
        "POST",
        "api/onchain/webhook/event",
        201,  # Corrected to 201 for POST
        data=position_won_data
    )
    
    # Test position lost webhook
    position_lost_data = {
        "type": "position_lost",
        "wallet": "0x1234567890123456789012345678901234567890",
        "marketId": 1,
        "tokenId": 124,
        "amount": "1000000000000000000",
        "question": "Test market question",
        "txHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    }
    
    tester.run_test(
        "Webhook - Position Lost Event",
        "POST",
        "api/onchain/webhook/event",
        201,  # Corrected to 201 for POST
        data=position_lost_data
    )
    
    # Test position claimed webhook
    position_claimed_data = {
        "type": "position_claimed",
        "wallet": "0x1234567890123456789012345678901234567890",
        "tokenId": 123,
        "netAmount": "1960000000000000000",  # 1.96 USDT after fees
        "feeAmount": "40000000000000000",    # 0.04 USDT fee
        "txHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    }
    
    tester.run_test(
        "Webhook - Position Claimed Event",
        "POST",
        "api/onchain/webhook/event",
        201,  # Corrected to 201 for POST
        data=position_claimed_data
    )
    
    # ==================== ALTERNATIVE ECONOMY ENDPOINTS ====================
    print("\n🔄 ALTERNATIVE ECONOMY ENDPOINTS")
    print("-" * 40)
    
    # Test if economy endpoints are also available under /api/economy
    tester.run_test(
        "Economy Stats Alternative Endpoint",
        "GET",
        f"api/economy/stats/{test_wallets[0]}",
        200
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
    results_file = '/app/test_reports/claim_economy_backend_test_results.json'
    with open(results_file, 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'test_type': 'PHASE_3_5_CLAIM_FLOW_PHASE_4_ECONOMY_SYNC',
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