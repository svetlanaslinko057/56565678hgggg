#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class PredictionMarketTester:
    def __init__(self, base_url="https://repo-launch-20.preview.emergentagent.com/api"):
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
                    print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
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

    def test_health_endpoint(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_predictions_endpoint(self):
        """Test predictions endpoint - should return list of markets"""
        success, response = self.run_test("Predictions API", "GET", "predictions", 200)
        
        if success and response.get('data'):
            predictions = response['data']
            print(f"   Found {len(predictions)} prediction markets")
            
            # Check prediction structure
            if len(predictions) > 0:
                first_prediction = predictions[0]
                required_fields = ['id', 'title', 'status']
                for field in required_fields:
                    if field in first_prediction:
                        print(f"   ✅ Field '{field}': {first_prediction[field]}")
                    else:
                        print(f"   ❌ Missing field '{field}'")
                        
        return success, response

    def test_onchain_config_endpoint(self):
        """Test onchain config endpoint - should return smart contract configuration"""
        success, response = self.run_test("Onchain Config", "GET", "onchain/config", 200)
        
        if success and response.get('data'):
            config = response['data']
            print(f"   Config keys: {list(config.keys())}")
            
            # Check for expected config fields
            expected_fields = ['contractAddress', 'chainId']
            for field in expected_fields:
                if field in config:
                    print(f"   ✅ {field}: {config[field]}")
                else:
                    print(f"   ❌ Missing {field}")
                    
        return success, response

    def test_onchain_markets_endpoint(self):
        """Test onchain markets endpoint"""
        success, response = self.run_test("Onchain Markets", "GET", "onchain/markets", 200)
        
        if success and response.get('data'):
            markets = response['data']
            print(f"   Found {len(markets)} onchain markets")
            
            # Check market structure
            if len(markets) > 0:
                first_market = markets[0]
                print(f"   Sample market: {json.dumps(first_market, indent=2)[:200]}...")
                
        return success, response

    def test_onchain_stats_endpoint(self):
        """Test onchain stats endpoint"""
        return self.run_test("Onchain Stats", "GET", "onchain/stats", 200)

    def test_onchain_activities_endpoint(self):
        """Test onchain activities endpoint for live bets"""
        success, response = self.run_test("Onchain Activities", "GET", "onchain/activities", 200)
        
        if success and response.get('data'):
            activities = response['data']
            print(f"   Found {len(activities)} activities")
            
        return success, response

    def test_onchain_leaderboard_endpoint(self):
        """Test onchain leaderboard endpoint"""
        success, response = self.run_test("Onchain Leaderboard", "GET", "onchain/leaderboard", 200)
        
        if success and response.get('data'):
            leaderboard = response['data']
            print(f"   Found {len(leaderboard)} leaderboard entries")
            
        return success, response

    def test_specific_market_endpoint(self):
        """Test getting a specific market by ID"""
        # First get markets to find a valid ID
        success, response = self.run_test("Get Markets for ID", "GET", "onchain/markets", 200)
        
        if success and response.get('data') and len(response['data']) > 0:
            market_id = response['data'][0].get('marketId', '1')
            print(f"   Testing with market ID: {market_id}")
            
            # Test specific market endpoint
            return self.run_test(
                f"Specific Market {market_id}", 
                "GET", 
                f"onchain/markets/{market_id}", 
                200
            )
        else:
            print("   ❌ No markets found to test specific market endpoint")
            return False, {}

    def print_summary(self):
        """Print test summary"""
        print(f"\n" + "="*60)
        print(f"📊 Prediction Market API Test Summary")
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
    print("🚀 Starting Prediction Market API Tests...")
    print("="*60)
    
    # Setup
    tester = PredictionMarketTester()

    # Run all tests
    print("\n📋 Running Backend API Tests...")
    
    # Core health check
    tester.test_health_endpoint()
    
    # Test specific APIs mentioned in review request
    print("\n🎯 Testing Prediction Market APIs...")
    tester.test_predictions_endpoint()
    tester.test_onchain_config_endpoint()
    tester.test_onchain_markets_endpoint()
    tester.test_onchain_stats_endpoint()
    tester.test_onchain_activities_endpoint()
    tester.test_onchain_leaderboard_endpoint()
    tester.test_specific_market_endpoint()

    # Print results
    tester.print_summary()
    
    # Save detailed results
    with open('/app/test_reports/prediction_market_results.json', 'w') as f:
        json.dump({
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            "results": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/test_reports/prediction_market_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())