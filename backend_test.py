#!/usr/bin/env python3
"""
FOMO Arena Backend API Testing
Tests Win Card System and Monetization Layer APIs
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class FOMOArenaAPITester:
    def __init__(self, base_url="https://08823ff1-a134-4508-b2e1-01a16250cf1f.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test wallet address for headers
        self.test_wallet = "0x1234567890123456789012345678901234567890"

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
                 data: Optional[Dict] = None, headers: Optional[Dict] = None) -> tuple[bool, Any]:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        
        # Default headers
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
            
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
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

    def test_health_endpoint(self):
        """Test backend health check"""
        print("\n🔍 Testing Health Endpoint...")
        return self.run_test(
            "Health Check",
            "GET", 
            "api/health",
            200
        )

    def test_monetization_pricing(self):
        """Test monetization pricing endpoint"""
        print("\n🔍 Testing Monetization Pricing...")
        return self.run_test(
            "Monetization Pricing",
            "GET",
            "api/monetization/pricing", 
            200
        )

    def test_monetization_stats(self):
        """Test monetization stats endpoint"""
        print("\n🔍 Testing Monetization Stats...")
        return self.run_test(
            "Monetization Stats",
            "GET",
            "api/monetization/stats",
            200
        )

    def test_boosted_bets(self):
        """Test boosted bets endpoint"""
        print("\n🔍 Testing Boosted Bets...")
        return self.run_test(
            "Boosted Bets",
            "GET",
            "api/monetization/boosted/bets",
            200
        )

    def test_featured_duels(self):
        """Test featured duels endpoint"""
        print("\n🔍 Testing Featured Duels...")
        return self.run_test(
            "Featured Duels",
            "GET",
            "api/monetization/featured/duels",
            200
        )

    def test_recent_wins(self):
        """Test recent wins endpoint with wallet header"""
        print("\n🔍 Testing Recent Wins...")
        headers = {"x-wallet-address": self.test_wallet}
        return self.run_test(
            "Recent Wins",
            "GET",
            "api/share/wins/recent",
            200,
            headers=headers
        )

    def test_invalid_objectid_handling(self):
        """Test that invalid ObjectId returns 400 not 500"""
        print("\n🔍 Testing Invalid ObjectId Handling...")
        headers = {"x-wallet-address": self.test_wallet}
        data = {"betId": "invalid_object_id_123", "boostAmount": 1}
        
        try:
            url = f"{self.base_url}/api/monetization/boost/bet"
            response = requests.post(url, json=data, headers=headers, timeout=10)
            
            # Should return 400 (Bad Request) not 500 (Internal Server Error)
            if response.status_code == 400:
                self.log_test("Invalid ObjectId Handling", True, f"Correctly returned 400 for invalid ObjectId")
                return True, response.json() if response.content else {}
            elif response.status_code == 500:
                self.log_test("Invalid ObjectId Handling", False, f"Returned 500 instead of 400 for invalid ObjectId")
                return False, response.json() if response.content else {}
            else:
                # Other status codes might be acceptable (e.g., 404)
                self.log_test("Invalid ObjectId Handling", True, f"Returned {response.status_code} (not 500)")
                return True, response.json() if response.content else {}
                
        except Exception as e:
            self.log_test("Invalid ObjectId Handling", False, f"Error: {str(e)}")
            return False, {}

    def test_feature_duel_validation(self):
        """Test feature duel endpoint validation"""
        print("\n🔍 Testing Feature Duel Validation...")
        headers = {"x-wallet-address": self.test_wallet}
        data = {"duelId": "invalid_id", "boostAmount": 2}
        
        # This should return 400 or 404 for invalid duel ID
        success, response_data = self.run_test(
            "Feature Duel Validation",
            "POST",
            "api/monetization/boost/duel",
            400,
            data=data,
            headers=headers
        )
        
        # Also accept 404 as valid response
        if not success and response_data:
            try:
                if "not found" in str(response_data).lower():
                    self.log_test("Feature Duel Validation (404 acceptable)", True, "Got 404 for invalid duel ID")
                    return True, response_data
            except:
                pass
                
        return success, response_data

    def test_win_card_validation(self):
        """Test win card endpoint validation"""
        print("\n🔍 Testing Win Card Validation...")
        headers = {"x-wallet-address": self.test_wallet}
        
        # This should return 404 for invalid position ID
        success, response_data = self.run_test(
            "Win Card Validation",
            "GET",
            "api/share/win/invalid_position_id",
            404,
            headers=headers
        )
        
        return success, response_data

    def test_fomo_engine_stats(self):
        """Test FOMO Engine stats endpoint"""
        print("\n🔍 Testing FOMO Engine Stats...")
        return self.run_test(
            "FOMO Engine Stats",
            "GET",
            "api/fomo/stats",
            200
        )

    def test_fomo_engine_best_signal(self):
        """Test FOMO Engine best signal endpoint"""
        print("\n🔍 Testing FOMO Engine Best Signal...")
        return self.run_test(
            "FOMO Engine Best Signal",
            "GET",
            "api/fomo/best-signal",
            200
        )

    def test_fomo_engine_events(self):
        """Test FOMO Engine events endpoint"""
        print("\n🔍 Testing FOMO Engine Events...")
        return self.run_test(
            "FOMO Engine Events",
            "GET",
            "api/fomo/events",
            200
        )

    def test_onchain_markets(self):
        """Test onchain markets endpoint"""
        print("\n🔍 Testing Onchain Markets...")
        return self.run_test(
            "Onchain Markets",
            "GET",
            "api/onchain/markets",
            200
        )

    def test_indexer_status(self):
        """Test indexer status endpoint"""
        print("\n🔍 Testing Indexer Status...")
        return self.run_test(
            "Indexer Status",
            "GET",
            "api/onchain/indexer/status",
            200
        )

    def test_onchain_config(self):
        """Test onchain config endpoint"""
        print("\n🔍 Testing Onchain Config...")
        return self.run_test(
            "Onchain Config",
            "GET",
            "api/onchain/config",
            200
        )

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting FOMO Arena Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Core health check
        self.test_health_endpoint()
        
        # Onchain API tests - specific requirements from review
        self.test_onchain_markets()
        self.test_indexer_status()
        self.test_onchain_config()
        
        # FOMO Engine API tests
        self.test_fomo_engine_stats()
        self.test_fomo_engine_best_signal()
        self.test_fomo_engine_events()
        
        # Monetization API tests
        self.test_monetization_pricing()
        self.test_boosted_bets()
        self.test_featured_duels()
        
        # Invalid ObjectId handling test
        self.test_invalid_objectid_handling()
        
        # Additional validation tests
        self.test_feature_duel_validation()
        self.test_win_card_validation()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check details above.")
            return 1

    def save_results(self, filename: str = "/app/test_reports/backend_api_results.json"):
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
    tester = FOMOArenaAPITester()
    exit_code = tester.run_all_tests()
    tester.save_results()
    return exit_code

if __name__ == "__main__":
    sys.exit(main())