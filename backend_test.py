#!/usr/bin/env python3
"""
PHASE 3 INDEXER SYNC - Backend API Testing
Tests all indexer-related endpoints and mirror collection APIs
"""

import requests
import sys
import json
from datetime import datetime

class IndexerAPITester:
    def __init__(self, base_url="https://08823ff1-a134-4508-b2e1-01a16250cf1f.preview.emergentagent.com"):
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
    print("🚀 PHASE 3 INDEXER SYNC - Backend API Testing")
    print("=" * 60)
    
    tester = IndexerAPITester()
    
    # ==================== INDEXER STATUS ====================
    print("\n📊 INDEXER STATUS TESTS")
    print("-" * 40)
    
    success, indexer_status = tester.run_test(
        "Indexer Status",
        "GET",
        "api/onchain/indexer/status",
        200
    )
    
    if success and indexer_status.get('data'):
        status_data = indexer_status['data']
        print(f"   Last Synced Block: {status_data.get('lastSyncedBlock', 'N/A')}")
        print(f"   Is Running: {status_data.get('isRunning', 'N/A')}")
        print(f"   Updated At: {status_data.get('updatedAt', 'N/A')}")
        
        # Validate indexer is running and syncing
        if status_data.get('lastSyncedBlock', 0) > 98000000:  # BSC Testnet current block
            print("   ✅ Indexer appears to be syncing recent blocks")
        else:
            print("   ⚠️  Indexer may not be syncing recent blocks")
    
    # ==================== CONTRACT CONFIG ====================
    print("\n⚙️ CONTRACT CONFIG TESTS")
    print("-" * 40)
    
    tester.run_test(
        "Contract Config",
        "GET", 
        "api/onchain/config",
        200
    )
    
    # ==================== MARKETS MIRROR ====================
    print("\n📈 MARKETS MIRROR TESTS")
    print("-" * 40)
    
    success, markets_response = tester.run_test(
        "Get On-chain Markets",
        "GET",
        "api/onchain/markets",
        200
    )
    
    # Test with different parameters
    tester.run_test(
        "Markets with Status Filter",
        "GET",
        "api/onchain/markets",
        200,
        params={'status': 'active'}
    )
    
    tester.run_test(
        "Markets with Pagination",
        "GET", 
        "api/onchain/markets",
        200,
        params={'page': 1, 'limit': 10}
    )
    
    tester.run_test(
        "Markets Sorted by Trending",
        "GET",
        "api/onchain/markets", 
        200,
        params={'sortBy': 'trending', 'sortOrder': 'desc'}
    )
    
    tester.run_test(
        "Markets Sorted by Volume",
        "GET",
        "api/onchain/markets",
        200, 
        params={'sortBy': 'volume', 'sortOrder': 'desc'}
    )
    
    # Test single market if any exist
    if success and markets_response.get('data') and len(markets_response['data']) > 0:
        market = markets_response['data'][0]
        market_id = market.get('marketId')
        if market_id:
            tester.run_test(
                f"Get Single Market #{market_id}",
                "GET",
                f"api/onchain/markets/{market_id}",
                200
            )
            
            # Test market pressure/FOMO API
            tester.run_test(
                f"Market Pressure #{market_id}",
                "GET", 
                f"api/onchain/markets/{market_id}/pressure",
                200
            )
    
    # ==================== POSITIONS MIRROR ====================
    print("\n🎯 POSITIONS MIRROR TESTS")
    print("-" * 40)
    
    # Test with sample wallet addresses
    test_wallets = [
        "0x1234567890123456789012345678901234567890",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
    ]
    
    for wallet in test_wallets:
        tester.run_test(
            f"Get Positions for {wallet[:10]}...",
            "GET",
            "api/onchain/positions",
            200,
            params={'owner': wallet}
        )
        
        tester.run_test(
            f"Get Token IDs for {wallet[:10]}...",
            "GET",
            f"api/onchain/positions/tokens/{wallet}",
            200
        )
    
    # Test positions with filters
    tester.run_test(
        "Positions with Status Filter",
        "GET",
        "api/onchain/positions",
        200,
        params={'owner': test_wallets[0], 'status': 'open'}
    )
    
    # ==================== PROFILE API ====================
    print("\n👤 PROFILE API TESTS")
    print("-" * 40)
    
    for wallet in test_wallets:
        tester.run_test(
            f"Get Profile for {wallet[:10]}...",
            "GET",
            f"api/onchain/profile/{wallet}",
            200
        )
    
    # ==================== ACTIVITIES FEED ====================
    print("\n📋 ACTIVITIES FEED TESTS")
    print("-" * 40)
    
    tester.run_test(
        "Get Activities Feed",
        "GET",
        "api/onchain/activities",
        200
    )
    
    tester.run_test(
        "Activities with Type Filter",
        "GET", 
        "api/onchain/activities",
        200,
        params={'type': 'bet_placed'}
    )
    
    tester.run_test(
        "Activities with User Filter",
        "GET",
        "api/onchain/activities", 
        200,
        params={'user': test_wallets[0]}
    )
    
    tester.run_test(
        "Activities with Pagination",
        "GET",
        "api/onchain/activities",
        200,
        params={'page': 1, 'limit': 20}
    )
    
    # ==================== LEADERBOARD & STATS ====================
    print("\n🏆 LEADERBOARD & STATS TESTS")
    print("-" * 40)
    
    tester.run_test(
        "Get On-chain Leaderboard",
        "GET",
        "api/onchain/leaderboard",
        200
    )
    
    tester.run_test(
        "Get On-chain Stats",
        "GET", 
        "api/onchain/stats",
        200
    )
    
    # ==================== WEBHOOK ENDPOINT ====================
    print("\n🔗 WEBHOOK TESTS")
    print("-" * 40)
    
    # Test webhook endpoint (should accept POST)
    webhook_data = {
        "type": "bet_placed",
        "user": "0x1234567890123456789012345678901234567890",
        "marketId": 1,
        "tokenId": 123,
        "amount": "1000000000000000000",  # 1 USDT in wei
        "outcome": 1,
        "question": "Test market question",
        "txHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    }
    
    tester.run_test(
        "Webhook Event Processing",
        "POST",
        "api/onchain/webhook/event",
        201,  # Changed from 200 to 201 (Created is correct for POST)
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
    results_file = '/app/test_reports/indexer_backend_test_results.json'
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