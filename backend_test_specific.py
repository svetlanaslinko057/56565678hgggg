#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class FOMAArenaSpecificTester:
    def __init__(self, base_url="https://f4904d02-45cf-4af2-bac8-acdcf84269d3.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, validation_func=None):
        """Run a single API test with optional validation"""
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
            response_data = {}
            
            if success and response.content:
                try:
                    response_data = response.json()
                    # Run custom validation if provided
                    if validation_func:
                        validation_result = validation_func(response_data)
                        if not validation_result:
                            success = False
                            print(f"❌ Validation Failed")
                        else:
                            print(f"✅ Validation Passed")
                except Exception as e:
                    print(f"⚠️  JSON parsing error: {e}")
                    response_data = {"raw_response": response.text}

            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "timestamp": datetime.now().isoformat(),
                "response_data": response_data
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
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
            return success, response_data

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

    def validate_stats(self, response_data):
        """Validate stats response has expected values"""
        if not response_data.get('success'):
            print("   ❌ Response success is not true")
            return False
        
        data = response_data.get('data', {})
        total_markets = data.get('totalMarkets', 0)
        total_positions = data.get('totalPositions', 0)
        
        print(f"   📊 Total Markets: {total_markets}")
        print(f"   📊 Total Positions: {total_positions}")
        
        if total_markets != 1:
            print(f"   ❌ Expected totalMarkets: 1, got: {total_markets}")
            return False
        
        if total_positions != 1:
            print(f"   ❌ Expected totalPositions: 1, got: {total_positions}")
            return False
            
        return True

    def validate_config(self, response_data):
        """Validate config response has expected values"""
        if not response_data.get('success'):
            print("   ❌ Response success is not true")
            return False
        
        data = response_data.get('data', {})
        min_bet_formatted = data.get('minBetFormatted', '')
        claim_fee_bps = data.get('claimFeeBps', 0)
        
        print(f"   📊 Min Bet Formatted: {min_bet_formatted}")
        print(f"   📊 Claim Fee BPS: {claim_fee_bps}")
        
        if min_bet_formatted != '10.0':
            print(f"   ❌ Expected minBetFormatted: '10.0', got: '{min_bet_formatted}'")
            return False
        
        if claim_fee_bps != 200:
            print(f"   ❌ Expected claimFeeBps: 200, got: {claim_fee_bps}")
            return False
            
        return True

    def validate_positions(self, response_data):
        """Validate positions response has 1 position"""
        data = response_data.get('data', [])
        total = response_data.get('meta', {}).get('total', 0)
        
        print(f"   📊 Total Positions: {total}")
        print(f"   📊 Positions in response: {len(data)}")
        
        if total != 1:
            print(f"   ❌ Expected total positions: 1, got: {total}")
            return False
            
        return True

    def validate_markets(self, response_data):
        """Validate markets response has 1 market"""
        data = response_data.get('data', [])
        total = response_data.get('meta', {}).get('total', len(data))
        
        print(f"   📊 Total Markets: {total}")
        print(f"   📊 Markets in response: {len(data)}")
        
        if len(data) != 1:
            print(f"   ❌ Expected 1 market in response, got: {len(data)}")
            return False
            
        return True

    def validate_indexer_running(self, response_data):
        """Validate indexer is running"""
        if not response_data.get('success'):
            print("   ❌ Response success is not true")
            return False
        
        data = response_data.get('data', {})
        is_running = data.get('isRunning', False)
        
        print(f"   📊 Indexer Running: {is_running}")
        
        if not is_running:
            print(f"   ❌ Expected isRunning: true, got: {is_running}")
            return False
            
        return True

def main():
    print("🚀 Starting FOMO Arena Specific Requirements Tests...")
    print("="*70)
    
    # Setup
    tester = FOMAArenaSpecificTester()

    # Run specific tests from review request
    print("\n📋 Running Specific Backend API Tests...")
    
    # 1. Health endpoint returns 200
    tester.run_test("Health Check", "GET", "health", 200)
    
    # 2. Stats returns correct data (totalMarkets: 1, totalPositions: 1)
    tester.run_test(
        "On-chain Stats (totalMarkets: 1, totalPositions: 1)", 
        "GET", 
        "onchain/stats", 
        200,
        validation_func=tester.validate_stats
    )
    
    # 3. Config returns minBetFormatted: 10.0 and claimFeeBps: 200
    tester.run_test(
        "Contract Config (minBetFormatted: 10.0, claimFeeBps: 200)", 
        "GET", 
        "onchain/config", 
        200,
        validation_func=tester.validate_config
    )
    
    # 4. Markets returns 1 market
    tester.run_test(
        "On-chain Markets (1 market)", 
        "GET", 
        "onchain/markets", 
        200,
        validation_func=tester.validate_markets
    )
    
    # 5. Positions for specific owner returns 1 position
    tester.run_test(
        "On-chain Positions for 0x413cD446676a75a536d15Fa6c7396013E7809017 (1 position)", 
        "GET", 
        "onchain/positions", 
        200,
        params={"owner": "0x413cD446676a75a536d15Fa6c7396013E7809017"},
        validation_func=tester.validate_positions
    )
    
    # 6. Activities returns activities
    tester.run_test("On-chain Activities", "GET", "onchain/activities", 200)
    
    # 7. Indexer status shows isRunning: true
    tester.run_test(
        "Indexer Status (isRunning: true)", 
        "GET", 
        "onchain/indexer/status", 
        200,
        validation_func=tester.validate_indexer_running
    )

    # Print results
    print(f"\n" + "="*70)
    print(f"📊 FOMO Arena Specific Requirements Test Summary")
    print(f"="*70)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.tests_run - tester.tests_passed > 0:
        print(f"\n❌ Failed Tests:")
        for result in tester.test_results:
            if not result["success"]:
                print(f"   - {result['test_name']}: {result.get('error', 'Status ' + str(result['actual_status']))}")
    
    # Save detailed results
    with open('/app/test_reports/backend_specific_results.json', 'w') as f:
        json.dump({
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            "results": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/test_reports/backend_specific_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())