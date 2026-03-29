#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class CreatePredictionModalAPITester:
    def __init__(self, base_url="https://repo-launch-20.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_draft_id = None
        # Test wallet from agent context
        self.test_wallet = "0xa9c2C2a48aFa7b36555e32917a6E5a9280f9563A"

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, params=params, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=15)

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

    def test_create_prediction_with_close_time(self):
        """Test creating prediction with closeTime field (main fix)"""
        # Create a future close time (7 days from now) - this was the main issue
        close_time = datetime.now() + timedelta(days=7)
        
        draft_data = {
            "title": f"Test Prediction with closeTime {datetime.now().strftime('%H%M%S')}",
            "description": "Testing closeTime field fix - should be valid ISO 8601 date string",
            "category": "crypto",
            "type": "single",
            "closeTime": close_time.isoformat(),  # This was causing the error before
            "outcomes": [
                {"id": 1, "label": "Yes"},
                {"id": 2, "label": "No"}
            ],
            "creatorAddress": self.test_wallet,
            "stake": 100
        }
        
        headers = {'X-Wallet-Address': self.test_wallet}
        success, response = self.run_test(
            "Create Prediction with closeTime", 
            "POST", 
            "markets/drafts", 
            201,
            data=draft_data,
            headers=headers
        )
        
        if success and response.get('data'):
            draft = response['data']
            self.created_draft_id = draft.get('_id')
            print(f"   ✅ closeTime accepted: {draft.get('closeTime')}")
            print(f"   ✅ Category set: {draft.get('category')}")
            print(f"   ✅ Description included: {draft.get('description')}")
            
            # Validate closeTime format
            if draft.get('closeTime'):
                try:
                    parsed_time = datetime.fromisoformat(draft['closeTime'].replace('Z', '+00:00'))
                    print(f"   ✅ closeTime is valid ISO 8601 format")
                except:
                    print(f"   ❌ closeTime format invalid: {draft.get('closeTime')}")
            
        return success, response

    def test_create_prediction_all_categories(self):
        """Test creating predictions with all available categories"""
        categories = ["crypto", "defi", "nft", "ai", "gaming", "other"]
        
        for category in categories:
            close_time = datetime.now() + timedelta(days=7)
            
            draft_data = {
                "title": f"Test {category.upper()} Prediction {datetime.now().strftime('%H%M%S')}",
                "description": f"Testing {category} category functionality",
                "category": category,
                "type": "single",
                "closeTime": close_time.isoformat(),
                "outcomes": [
                    {"id": 1, "label": "Yes"},
                    {"id": 2, "label": "No"}
                ],
                "creatorAddress": self.test_wallet,
                "stake": 100
            }
            
            headers = {'X-Wallet-Address': self.test_wallet}
            success, response = self.run_test(
                f"Create Prediction - {category.upper()} Category", 
                "POST", 
                "markets/drafts", 
                201,
                data=draft_data,
                headers=headers
            )
            
            if success and response.get('data'):
                draft = response['data']
                if draft.get('category') == category:
                    print(f"   ✅ Category '{category}' correctly set")
                else:
                    print(f"   ❌ Category mismatch: expected '{category}', got '{draft.get('category')}'")

    def test_create_prediction_without_close_time(self):
        """Test creating prediction without closeTime - should fail with validation"""
        draft_data = {
            "title": f"Test Prediction without closeTime {datetime.now().strftime('%H%M%S')}",
            "description": "Testing validation - should fail without closeTime",
            "category": "crypto",
            "type": "single",
            # closeTime intentionally omitted
            "outcomes": [
                {"id": 1, "label": "Yes"},
                {"id": 2, "label": "No"}
            ],
            "creatorAddress": self.test_wallet,
            "stake": 100
        }
        
        headers = {'X-Wallet-Address': self.test_wallet}
        success, response = self.run_test(
            "Create Prediction without closeTime (should fail)", 
            "POST", 
            "markets/drafts", 
            400,  # Should fail with validation error
            data=draft_data,
            headers=headers
        )
        
        return success, response

    def test_create_prediction_invalid_close_time(self):
        """Test creating prediction with invalid closeTime format"""
        draft_data = {
            "title": f"Test Prediction invalid closeTime {datetime.now().strftime('%H%M%S')}",
            "description": "Testing validation with invalid closeTime format",
            "category": "crypto",
            "type": "single",
            "closeTime": "invalid-date-format",  # Invalid format
            "outcomes": [
                {"id": 1, "label": "Yes"},
                {"id": 2, "label": "No"}
            ],
            "creatorAddress": self.test_wallet,
            "stake": 100
        }
        
        headers = {'X-Wallet-Address': self.test_wallet}
        success, response = self.run_test(
            "Create Prediction with invalid closeTime (should fail)", 
            "POST", 
            "markets/drafts", 
            400,  # Should fail with validation error
            data=draft_data,
            headers=headers
        )
        
        return success, response

    def test_create_multi_level_prediction(self):
        """Test creating multi-level prediction with closeTime"""
        close_time = datetime.now() + timedelta(days=7)
        
        draft_data = {
            "title": f"Multi-level Test Prediction {datetime.now().strftime('%H%M%S')}",
            "description": "Testing multi-level prediction with closeTime",
            "category": "defi",
            "type": "multi-level",
            "closeTime": close_time.isoformat(),
            "outcomes": [
                {"id": 1, "label": "Very Bullish"},
                {"id": 2, "label": "Bullish"},
                {"id": 3, "label": "Bearish"},
                {"id": 4, "label": "Very Bearish"}
            ],
            "creatorAddress": self.test_wallet,
            "stake": 100
        }
        
        headers = {'X-Wallet-Address': self.test_wallet}
        success, response = self.run_test(
            "Create Multi-level Prediction", 
            "POST", 
            "markets/drafts", 
            201,
            data=draft_data,
            headers=headers
        )
        
        if success and response.get('data'):
            draft = response['data']
            print(f"   ✅ Multi-level type: {draft.get('type')}")
            print(f"   ✅ Outcomes count: {len(draft.get('outcomes', []))}")
            
        return success, response

    def test_submit_created_draft(self):
        """Test submitting the created draft for review"""
        if not self.created_draft_id:
            print("⚠️  No draft ID available, skipping test")
            return False, {}
            
        headers = {'X-Wallet-Address': self.test_wallet}
        success, response = self.run_test(
            "Submit Draft for Review", 
            "POST", 
            f"markets/drafts/{self.created_draft_id}/submit", 
            201,
            headers=headers
        )
        
        if success and response.get('data'):
            draft = response['data']
            print(f"   ✅ Draft submitted with status: {draft.get('status')}")
            
        return success, response

    def print_summary(self):
        """Print test summary"""
        print(f"\n" + "="*60)
        print(f"📊 Create Prediction Modal API Test Summary")
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
    print("🚀 Starting Create Prediction Modal API Tests...")
    print("="*60)
    print("Testing the fixes for:")
    print("1. closeTime must be a valid ISO 8601 date string")
    print("2. Category dropdown functionality")
    print("3. Description field in payload")
    print("4. Default closeTime (7 days from now)")
    print("5. Form validation requires closeTime")
    print("="*60)
    
    # Setup
    tester = CreatePredictionModalAPITester()

    # Run specific tests for the Create Prediction Modal fixes
    print(f"\n🎯 Testing Create Prediction Modal Fixes...")
    
    # Test main fix - closeTime field
    tester.test_create_prediction_with_close_time()
    
    # Test all categories work
    tester.test_create_prediction_all_categories()
    
    # Test validation - missing closeTime should fail
    tester.test_create_prediction_without_close_time()
    
    # Test validation - invalid closeTime should fail
    tester.test_create_prediction_invalid_close_time()
    
    # Test multi-level prediction
    tester.test_create_multi_level_prediction()
    
    # Test submit functionality
    tester.test_submit_created_draft()

    # Print results
    tester.print_summary()
    
    # Save detailed results
    with open('/app/test_reports/create_prediction_modal_results.json', 'w') as f:
        json.dump({
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            "results": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/test_reports/create_prediction_modal_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())